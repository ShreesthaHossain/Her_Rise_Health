from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./herrise.db"
    secret_key: str = "dev-only-change-me"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    access_token_minutes: int = 60 * 24 * 7
    app_env: str = "local"
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    supabase_url: str = ""
    supabase_jwks_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwt_issuer: str = ""
    supabase_jwt_audience: str = "authenticated"
    supabase_service_role_key: str = ""
    account_database_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
