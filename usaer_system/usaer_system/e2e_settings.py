import os

# Forzamos variables de entorno ANTES de importar settings
os.environ["DEBUG"] = "True"
os.environ["SECRET_KEY"] = "django-insecure-e2e-key-12345"

from .settings import *  # noqa: F403 — wildcard intended to extend main settings

# Sobrescribimos la DB para usar SQLite en E2E
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": "e2e_test_db.sqlite3",
    }
}

# Desactivamos Sentry y seguridad de producción
SENTRY_DSN = None
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
