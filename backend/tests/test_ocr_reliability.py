"""Mocked regression coverage for bounded OCR, retries, and model reuse."""

import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from unittest.mock import MagicMock, patch

from app import evaluation_engine as engine
from app.processing import ProcessingError


def response(status, text="answer", headers=None):
    result = MagicMock()
    result.__enter__.return_value = result
    result.status_code = status
    result.headers = headers or {}
    result.json.return_value = {"choices": [{"message": {"content": text}}]}
    return result


class OCRTests(unittest.TestCase):
    def setUp(self):
        self.processor = engine.PDFProcessor("test-key")
        self.processor._image_to_b64 = MagicMock(return_value="image")

    def test_model_is_loaded_once_even_across_threads(self):
        with patch.object(engine, "_semantic_model", None), patch.object(
            engine, "SentenceTransformer", create=True,
        ) as factory:
            with ThreadPoolExecutor(4) as pool:
                models = list(pool.map(lambda _: engine._get_semantic_model(), range(8)))
            factory.assert_called_once_with("all-MiniLM-L6-v2")
            self.assertTrue(all(model is models[0] for model in models))

    def test_language_uses_configured_model_and_prompt(self):
        with patch.dict(engine.os.environ, {"NVIDIA_OCR_MODEL": "configured/model"}):
            processor = engine.PDFProcessor("test-key", "hi")
        self.assertEqual(processor.NVIDIA_MODEL, "configured/model")
        self.assertIn("Hindi", processor._get_ocr_prompt())

    def test_rate_limit_respects_retry_after(self):
        with patch.object(engine.requests, "post", side_effect=[
            response(429, headers={"Retry-After": "7"}), response(200),
        ]) as post, patch.object(engine.time, "sleep") as sleep:
            self.assertEqual(self.processor._ocr_page(None, 1, lambda _: None), "answer")
            self.assertEqual(post.call_count, 2)
            sleep.assert_called_once_with(7)

    def test_auth_and_model_errors_are_not_retried(self):
        for status, expected in ((401, 503), (403, 503), (400, 502), (404, 502)):
            with self.subTest(status=status), patch.object(
                engine.requests, "post", return_value=response(status),
            ) as post, patch.object(engine.time, "sleep") as sleep:
                with self.assertRaises(ProcessingError) as error:
                    self.processor._ocr_page(None, 1, lambda _: None)
                self.assertEqual(error.exception.status_code, expected)
                post.assert_called_once()
                sleep.assert_not_called()

    def test_timeout_has_only_three_attempts_and_no_final_sleep(self):
        with patch.object(engine.requests, "post", side_effect=engine.requests.exceptions.Timeout), patch.object(
            engine.time, "sleep",
        ) as sleep:
            with self.assertRaises(ProcessingError) as error:
                self.processor._ocr_page(None, 1, lambda _: None)
            self.assertEqual(error.exception.status_code, 504)
            self.assertEqual(sleep.call_count, 2)

    def test_exhausted_rate_limit_is_not_empty_text(self):
        with patch.object(engine.requests, "post", return_value=response(429)), patch.object(engine.time, "sleep"):
            with self.assertRaises(ProcessingError) as error:
                self.processor._ocr_page(None, 1, lambda _: None)
            self.assertEqual(error.exception.status_code, 429)

    def test_empty_or_malformed_response_does_not_become_partial_text(self):
        for data in ([], {"choices": None}, {"choices": [None]}, {"choices": [{"message": None}]}):
            result = response(200)
            result.json.return_value = data
            with self.subTest(data=data), patch.object(
                engine.requests, "post", return_value=result,
            ), patch.object(engine.time, "sleep"):
                with self.assertRaises(ProcessingError) as error:
                    self.processor._ocr_page(None, 1, lambda _: None)
                self.assertEqual(error.exception.status_code, 502)

    def test_retry_after_accepts_dates_and_caps_long_waits(self):
        self.assertEqual(engine._retry_after_seconds("1000", 3), 120)
        self.assertEqual(engine._retry_after_seconds("invalid", 3), 3)
        self.assertEqual(engine._retry_after_seconds(None, 3), 3)
        date = format_datetime(datetime.now(timezone.utc) + timedelta(seconds=60), usegmt=True)
        self.assertGreater(engine._retry_after_seconds(date, 3), 55)
        self.assertLessEqual(engine._retry_after_seconds(date, 3), 60)

    def test_render_is_bounded_ordered_and_images_are_closed(self):
        images = [MagicMock(), MagicMock(), MagicMock()]

        def render(path, log, first, last):
            self.assertEqual(first, last)
            for previous in images[:first - 1]:
                previous.close.assert_called_once()
            return [images[first - 1]]

        with patch.object(engine, "PDF2IMAGE_AVAILABLE", True), patch.object(
            engine, "PIL_AVAILABLE", True,
        ), patch.object(engine, "OCR_MAX_WORKERS", 1), patch.object(
            engine, "pdfinfo_from_path", create=True, return_value={"Pages": 3},
        ), patch.object(self.processor, "_pdf_to_images", side_effect=render), patch.object(
            self.processor, "_ocr_page", side_effect=lambda img, number, log: f"text {number}",
        ):
            text = self.processor.extract_text_with_ocr("test.pdf")
        self.assertLess(text.index("Page 1"), text.index("Page 2"))
        self.assertLess(text.index("Page 2"), text.index("Page 3"))
        for image in images:
            image.close.assert_called_once()

    def test_failed_page_closes_images_and_aborts_partial_grading(self):
        image = MagicMock()
        with patch.object(engine, "PDF2IMAGE_AVAILABLE", True), patch.object(
            engine, "PIL_AVAILABLE", True,
        ), patch.object(engine, "OCR_MAX_WORKERS", 1), patch.object(
            engine, "pdfinfo_from_path", create=True, return_value={"Pages": 2},
        ), patch.object(self.processor, "_pdf_to_images", return_value=[image]) as render, patch.object(
            self.processor, "_ocr_page", side_effect=ProcessingError("upstream failure"),
        ):
            with self.assertRaises(ProcessingError):
                self.processor.extract_text_with_ocr("test.pdf")
        image.close.assert_called_once()
        render.assert_called_once()


if __name__ == "__main__":
    unittest.main()