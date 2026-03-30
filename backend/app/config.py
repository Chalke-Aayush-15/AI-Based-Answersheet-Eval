import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── MongoDB ─────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "answersheet_eval"

    # ── JWT ─────────────────────────────────────────────────
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # ── Razorpay ────────────────────────────────────────────
    RAZORPAY_KEY_ID: str = "rzp_test_1a4JvinKUs2blA"
    RAZORPAY_KEY_SECRET: str = "Xfnuzq63VzhCibfFXFfycWhV"

    # ── NVIDIA OCR ──────────────────────────────────────────
    NVIDIA_API_KEY: str = ""

    # ── Email ───────────────────────────────────────────────
    SENDER_EMAIL: str = ""
    APP_PASSWORD: str = ""

    # ── File handling ───────────────────────────────────────
    OUTPUT_DIR: str = "extracted_pdfs"
    POPPLER_PATH: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure output folder exists
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)