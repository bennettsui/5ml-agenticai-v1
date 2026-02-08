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

    # Gmail integration (Google OAuth2)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/gmail/callback"

    # AI orchestration engine
    AI_DAILY_TOKEN_LIMIT: int = 1_000_000
    AI_DAILY_COST_LIMIT_USD: float = 50.0
    AI_MAX_TOKENS_PER_CALL: int = 16384
    AI_LOOP_DETECTION_THRESHOLD: int = 5
    AI_LOOP_DETECTION_WINDOW_SECONDS: int = 60
    AI_BUDGET_WARNING_THRESHOLD: float = 0.8  # 80% of budget triggers warning
    AI_MODEL_DEFAULT: str = "claude-sonnet-4-20250514"
    AI_MODEL_FALLBACK: str = "claude-haiku-4-5-20251001"

    class Config:
        env_file = ".env"


settings = Settings()
