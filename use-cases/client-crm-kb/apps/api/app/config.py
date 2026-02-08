from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://dev:dev@localhost:5432/client_crm_kb"
    REDIS_URL: str = "redis://localhost:6379"
    R2_ENDPOINT: str = ""
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET_DOCUMENTS: str = "client-documents"
    R2_BUCKET_TASTE: str = "taste-examples"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 8
    ANTHROPIC_API_KEY: str = ""
    API_BASE_URL: str = "http://localhost:8000"
    WEB_BASE_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
