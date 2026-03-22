from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "answersheet_eval"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Razorpay
    RAZORPAY_KEY_ID: str = "rzp_test_1a4JvinKUs2blA"
    RAZORPAY_KEY_SECRET: str = "Xfnuzq63VzhCibfFXFfycWhV"

    class Config:
        env_file = ".env"

settings = Settings()