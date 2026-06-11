"""
conftest.py — Configuración global para todos los tests del backend.

Desactiva settings de producción que interfieren con el entorno de tests:
- SECURE_SSL_REDIRECT: los tests usan HTTP, no HTTPS.
- Session/Cookie Secure: ídem.
"""

import pytest


@pytest.fixture(autouse=True)
def _disable_production_security_settings(settings):
    """Desactiva redirects SSL y cookies seguras para el entorno de tests."""
    settings.SECURE_SSL_REDIRECT = False
    settings.SESSION_COOKIE_SECURE = False
    settings.CSRF_COOKIE_SECURE = False
    settings.SECURE_HSTS_SECONDS = 0
