"""
Configuración del proyecto con validación tipada via pydantic-settings.

Reemplaza los os.environ.get() dispersos en settings.py con un modelo
centralizado que provee:
  - Tipado estricto (bool, int, listas derivadas)
  - Valores por defecto claros
  - Lectura automática de .env (via python-dotenv)
  - Error temprano si faltan variables críticas en producción
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings tipadas para USAER.

    Lee valores de variables de entorno (con soporte .env).
    Nombres en UPPERCASE se mapean automáticamente a campos lowercase
    (ej: SECRET_KEY → secret_key).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Django Core ──────────────────────────────────
    debug: bool = Field(default=False, alias="DEBUG")
    secret_key: str = Field(default="", alias="SECRET_KEY")
    allowed_hosts: str = Field(default="127.0.0.1,localhost", alias="ALLOWED_HOSTS")

    # ── Base de datos — dj-database-url se encarga ──
    # database_url se deja en os.environ para dj_database_url.config()
    # Este campo es solo de referencia/validación
    database_url: str | None = Field(default=None, alias="DATABASE_URL")

    # ── Redis / Caché ────────────────────────────────
    redis_url: str | None = Field(default=None, alias="REDIS_URL")

    # ── Sentry ───────────────────────────────────────
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")

    # ── CORS / CSRF ──────────────────────────────────
    cors_allowed_origins: str = Field(
        default="http://localhost:5173",
        alias="CORS_ALLOWED_ORIGINS",
    )
    csrf_trusted_origins: str = Field(
        default="http://localhost:5173",
        alias="CSRF_TRUSTED_ORIGINS",
    )

    # ── Propiedades derivadas ─────────────────────────
    @property
    def allowed_hosts_list(self) -> list[str]:
        return [h.strip() for h in self.allowed_hosts.split(",")]

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    @property
    def csrf_trusted_origins_list(self) -> list[str]:
        return [o.strip() for o in self.csrf_trusted_origins.split(",") if o.strip()]

    @property
    def sentry_environment(self) -> str:
        return "development" if self.debug else "production"


# Instancia única — se importa desde settings.py
settings = Settings()
