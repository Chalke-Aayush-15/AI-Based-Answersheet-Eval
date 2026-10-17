"""Regression tests: no database, NVIDIA requests, or model downloads."""

import ast
import inspect
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from threading import BoundedSemaphore, Event
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app import processing


class ProcessingTests(unittest.TestCase):
    def setUp(self):
        self.slots = patch.object(processing, "_slots", BoundedSemaphore(1))
        self.slots.start()
        self.addCleanup(self.slots.stop)

    def test_exception_releases_slot(self):
        @processing.limited_processing
        def job(fail=False):
            if fail:
                raise RuntimeError("test failure")
            return "ok"

        with self.assertRaises(RuntimeError):
            job(True)
        self.assertEqual(job(), "ok")
        self.assertEqual(str(inspect.signature(job)), "(fail=False)")

    def test_upstream_error_keeps_status_and_releases_slot(self):
        @processing.limited_processing
        def job(fail=False):
            if fail:
                raise processing.ProcessingError("Rate limited", 429)
            return "ok"

        with self.assertRaises(HTTPException) as error:
            job(True)
        self.assertEqual(error.exception.status_code, 429)
        self.assertIn("Retry-After", error.exception.headers)
        self.assertEqual(job(), "ok")

    def test_health_stays_responsive_and_other_job_is_rejected(self):
        app = FastAPI()
        started, release = Event(), Event()

        @app.post("/job")
        @processing.limited_processing
        def job():
            started.set()
            if not release.wait(5):
                raise RuntimeError("test worker not released")
            return {"done": True}

        @app.post("/ocr")
        @processing.limited_processing
        def ocr():
            return {"done": True}

        @app.get("/health")
        async def health():
            return {"status": "healthy"}

        with TestClient(app) as client, ThreadPoolExecutor(1) as pool:
            future = pool.submit(client.post, "/job")
            try:
                self.assertTrue(started.wait(3))
                self.assertEqual(client.get("/health").status_code, 200)
                response = client.post("/ocr")
                self.assertEqual(response.status_code, 503)
                self.assertEqual(response.headers["retry-after"], "10")
            finally:
                release.set()
            self.assertEqual(future.result(timeout=3).status_code, 200)
            self.assertEqual(client.post("/ocr").status_code, 200)

    def test_real_heavy_routes_remain_sync_and_limited(self):
        routes = Path(__file__).resolve().parents[1] / "app" / "routes"
        for filename, names in (
            ("evaluation.py", {"evaluate_subject", "evaluate_batch"}),
            ("ocr.py", {"extract_text", "extract_text_batch"}),
        ):
            tree = ast.parse((routes / filename).read_text(encoding="utf-8"))
            functions = {node.name: node for node in tree.body
                         if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
            for name in names:
                node = functions[name]
                self.assertIsInstance(node, ast.FunctionDef)
                self.assertTrue(any(isinstance(d, ast.Name) and d.id == "limited_processing"
                                    for d in node.decorator_list))


if __name__ == "__main__":
    unittest.main()