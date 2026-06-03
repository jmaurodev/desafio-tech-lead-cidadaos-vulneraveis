from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    duckdb_path: str = str(
        Path(__file__).parent.parent.parent / "data" / "cidadaos_vulneraveis.duckdb"
    )
    jwt_secret: str = "dev-secret-change-in-production!!"  # 33 bytes ≥ SHA-256 minimum
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7

    model_config = SettingsConfigDict(env_prefix="API_", env_file=".env", extra="ignore")


settings = Settings()
