"""Bounded admission for synchronous OCR/evaluation routes.

FastAPI runs these routes in its thread pool. The process-wide limit prevents
multiple uploads from loading PDF images and ML inference into RAM at once.
This is deliberately not a persistent job queue.
"""

import os
from functools import wraps
from threading import BoundedSemaphore

from fastapi import HTTPException


class ProcessingError(RuntimeError):
    """A safe, actionable processing failure suitable for an API response."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


_slots = BoundedSemaphore(max(1, int(os.getenv("PROCESSING_MAX_JOBS", "1"))))


def limited_processing(func):
    """Reject excess work immediately; always release the slot on failure."""
    @wraps(func)
    def wrapped(*args, **kwargs):
        if not _slots.acquire(blocking=False):
            raise HTTPException(
                status_code=503,
                detail="The server is processing another OCR/evaluation job. Please try again shortly.",
                headers={"Retry-After": "10"},
            )
        try:
            return func(*args, **kwargs)
        except ProcessingError as exc:
            headers = {"Retry-After": "30"} if exc.status_code == 429 else None
            raise HTTPException(
                status_code=exc.status_code, detail=str(exc), headers=headers,
            ) from exc
        finally:
            _slots.release()

    return wrapped