from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Zenith API"
    API_V1_STR: str = "/api/v1"

    # Supabase / Postgres Database
    # Using the connection pooling URL (usually port 6543 for Supabase connection pooler)
    DATABASE_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str

    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )


settings = Settings()
