from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Workforce Management System API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # These must come from the .env file
    MONGODB_URL: str
    DATABASE_NAME: str

    # Gemini API key comes from .env
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()