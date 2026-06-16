"""
test_throttling.py — Tests de Rate Limiting (Throttling).

Verifica que:
1. WriteRateThrottle bloquea writes (POST) pero no reads (GET)
2. Las respuestas 429 incluyen header Retry-After
3. El throttle NO se activa falsamente con rates altos

NOTA: DRF's APISettings.__getattr__ llama a setattr() para cachear cada valor
como atributo de instancia. @override_settings no los refresca automáticamente
porque Python encuentra el attr en self.__dict__ y saltea __getattr__.
Usamos api_settings.reload() que hace delattr() de cada attr cacheado.
"""

from unittest.mock import MagicMock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from escuelas.models import Escuela
from escuelas.views import EscuelaViewSet
from rest_framework import status
from rest_framework.settings import api_settings as drf_api_settings
from rest_framework.test import APIRequestFactory, force_authenticate

User = get_user_model()

NIVEL = "PRIMARIA"

# REST_FRAMEWORK con rates bajos para forzar throttling
THROTTLE_1_HOUR = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "usaer_system.pagination.FlexiblePageNumberPagination",
    "PAGE_SIZE": 10,
    "DATETIME_FORMAT": "%Y-%m-%d %H:%M:%S",
    "EXCEPTION_HANDLER": "usaer_system.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
        "usaer_system.throttling.WriteRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "1/hour",
        "user": "1000/hour",
        "user_write": "1/hour",
        "sensitive_action": "1/hour",
        "bulk_write": "1/hour",
    },
}

# REST_FRAMEWORK con rates altos
THROTTLE_HIGH = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "usaer_system.pagination.FlexiblePageNumberPagination",
    "PAGE_SIZE": 10,
    "DATETIME_FORMAT": "%Y-%m-%d %H:%M:%S",
    "EXCEPTION_HANDLER": "usaer_system.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
        "usaer_system.throttling.WriteRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/minute",
        "user": "1000/minute",
        "user_write": "1000/minute",
        "sensitive_action": "100/minute",
        "bulk_write": "100/minute",
    },
}


def escola_payload(i: int) -> dict:
    return {
        "nombre": f"Escuela {i}",
        "cct": f"CCT{i:04d}",
        "clave_estatal": f"CL{i:04d}",
        "zona": "Z01",
        "nivel": NIVEL,
        "domicilio": "Dirección",
        "colonia": "Colonia",
    }


def _invalidate_drf_settings():
    """Fuerza a DRF a re-leer REST_FRAMEWORK de django.conf.settings.

    NOTA: DRF's APISettings.__getattr__ llama a setattr(self, attr, val)
    para cachear. `reload()` es el método oficial que hace delattr() de cada
    attr cacheado ANTES de limpiar _cached_attrs. Si solo limpiamos
    _cached_attrs sin delattr, los attrs siguen en self.__dict__ y Python
    nunca llama a __getattr__ — el valor queda obsoleto incluso después de
    @override_settings + _invalidate_drf_settings.
    """
    drf_api_settings.reload()


class TestOverrideSettingsWorks(TestCase):
    """Verifica que @override_settings realmente cambie DRF's api_settings."""

    def test_override_changes_user_write_rate(self):
        from rest_framework.settings import api_settings as s

        original = s.DEFAULT_THROTTLE_RATES.get("user_write")
        self.assertIsNotNone(original, "user_write debería existir en settings reales")

    @override_settings(REST_FRAMEWORK=THROTTLE_1_HOUR)
    def test_override_applies_inside_context(self):
        _invalidate_drf_settings()
        from rest_framework.settings import api_settings as s

        rate = s.DEFAULT_THROTTLE_RATES.get("user_write")
        self.assertEqual(rate, "1/hour", f"Esperado 1/hour, obtenido {rate}")

    @override_settings(REST_FRAMEWORK=THROTTLE_HIGH)
    def test_override_applies_high_inside_context(self):
        _invalidate_drf_settings()
        from rest_framework.settings import api_settings as s

        rate = s.DEFAULT_THROTTLE_RATES.get("user_write")
        self.assertEqual(rate, "1000/minute", f"Esperado 1000/minute, obtenido {rate}")


class TestWriteRateThrottleIntegration(TestCase):
    """Tests de integración para WriteRateThrottle via APIRequestFactory."""

    def setUp(self):
        _invalidate_drf_settings()
        cache.clear()
        self.factory = APIRequestFactory()
        self.escuela = Escuela.objects.create(
            nombre="Base Escuela",
            cct="CCTBASE01",
            clave_estatal="CLBASE01",
            zona="Z01",
            nivel=NIVEL,
            domicilio="Base 123",
            colonia="Centro",
        )
        self.user = User.objects.create_user(
            email="admin@test.com",
            numero_empleado="ADMTST",
            password="pass123",
            role=User.Role.ADMINISTRADOR,
            is_superuser=True,
            escuela=self.escuela,
        )
        self.view = EscuelaViewSet.as_view({"post": "create", "get": "list"})

    def _post(self, data):
        request = self.factory.post("/api/escuelas/", data, format="json")
        force_authenticate(request, user=self.user)
        return self.view(request)

    def _get(self):
        request = self.factory.get("/api/escuelas/")
        force_authenticate(request, user=self.user)
        return self.view(request)

    @override_settings(REST_FRAMEWORK=THROTTLE_1_HOUR)
    def test_write_throttle_blocks_excess_posts(self):
        """POST en exceso retorna 429 con WriteRateThrottle (1/hour)."""
        _invalidate_drf_settings()
        cache.clear()
        r1 = self._post(escola_payload(0))
        self.assertNotEqual(
            r1.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            msg="Primer POST no debe ser throttleado",
        )

        r2 = self._post(escola_payload(1))
        self.assertEqual(r2.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @override_settings(REST_FRAMEWORK=THROTTLE_1_HOUR)
    def test_read_throttle_does_not_block_gets(self):
        """GET (lectura) NO debe ser throttleado por WriteRateThrottle."""
        _invalidate_drf_settings()
        for _ in range(5):
            response = self._get()
        self.assertNotEqual(
            response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            msg="5 GETs no activan WriteRateThrottle",
        )

    @override_settings(REST_FRAMEWORK=THROTTLE_HIGH)
    def test_write_throttle_allows_normal_posts(self):
        """POST con rates altos no debe ser throttleado."""
        _invalidate_drf_settings()
        for i in range(3):
            response = self._post(escola_payload(i + 100))
        self.assertNotEqual(
            response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
            msg=f"3 POSTs con rates altos no deben throttle. Got {response.status_code}",
        )


class TestThrottleHeaders(TestCase):
    """Verifica headers en respuestas 429."""

    def setUp(self):
        _invalidate_drf_settings()
        cache.clear()
        self.factory = APIRequestFactory()
        self.escuela = Escuela.objects.create(
            nombre="Base Escuela HDR",
            cct="CCTHDR01",
            clave_estatal="CLHDR01",
            zona="Z01",
            nivel=NIVEL,
            domicilio="Base",
            colonia="Centro",
        )
        self.user = User.objects.create_user(
            email="hdr@test.com",
            numero_empleado="HDRTST",
            password="pass123",
            role=User.Role.ADMINISTRADOR,
            is_superuser=True,
            escuela=self.escuela,
        )
        self.view = EscuelaViewSet.as_view({"post": "create"})

    @override_settings(REST_FRAMEWORK=THROTTLE_1_HOUR)
    def test_429_includes_retry_after_header(self):
        """Respuesta 429 debe incluir header Retry-After."""
        _invalidate_drf_settings()
        req1 = self.factory.post("/api/escuelas/", escola_payload(200), format="json")
        force_authenticate(req1, user=self.user)
        self.view(req1)

        req2 = self.factory.post("/api/escuelas/", escola_payload(201), format="json")
        force_authenticate(req2, user=self.user)
        response = self.view(req2)

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn("Retry-After", response.headers)
        retry_after = int(response.headers["Retry-After"])
        self.assertGreater(retry_after, 0)
        self.assertLessEqual(retry_after, 3600)


class TestWriteRateThrottleUnit(TestCase):
    """Tests unitarios para WriteRateThrottle."""

    def test_scope_is_user_write(self):
        from usaer_system.throttling import WriteRateThrottle

        self.assertEqual(WriteRateThrottle().scope, "user_write")

    def test_get_cache_key_returns_none_for_get(self):
        from django.http import HttpRequest

        from usaer_system.throttling import WriteRateThrottle

        request = HttpRequest()
        request.method = "GET"
        self.assertIsNone(WriteRateThrottle().get_cache_key(request, None))

    def test_get_cache_key_returns_key_for_post(self):
        from usaer_system.throttling import WriteRateThrottle

        request = MagicMock()
        request.method = "POST"
        request.META = {"REMOTE_ADDR": "127.0.0.1"}
        request.user.is_authenticated = False
        request.user.pk = None

        throttle = WriteRateThrottle()
        key = throttle.get_cache_key(request, None)
        self.assertIsNotNone(key)
        self.assertIn("user_write", key)
        self.assertIn("127.0.0.1", key)

    def test_get_cache_key_uses_user_pk_when_authenticated(self):
        """Para usuarios autenticados, el cache key debe incluir user.pk."""
        from usaer_system.throttling import WriteRateThrottle

        request = MagicMock()
        request.method = "POST"
        request.META = {"REMOTE_ADDR": "127.0.0.1"}
        request.user.is_authenticated = True
        request.user.pk = 42

        throttle = WriteRateThrottle()
        key = throttle.get_cache_key(request, None)
        self.assertIsNotNone(key)
        self.assertIn("user_write", key)
        self.assertIn("42", key)

    def test_allow_request_denies_after_rate_exceeded(self):
        """
        Directo: llama a allow_request() dos veces con la misma request.
        La primera debe permitir, la segunda debe denegar (rate=1/hour).
        """
        from django.core.cache import cache as throttle_cache

        from usaer_system.throttling import WriteRateThrottle

        throttle_cache.clear()

        # Configurar throttle con rate ultra bajo
        throttle = WriteRateThrottle()
        throttle.rate = "1/hour"
        throttle.num_requests, throttle.duration = throttle.parse_rate(throttle.rate)
        # Forzar scope explícito
        throttle.scope = "user_write"

        request = MagicMock()
        request.method = "POST"
        request.META = {"REMOTE_ADDR": "127.0.0.1"}
        request.user.is_authenticated = True
        request.user.pk = 999

        # Primer intento — debe permitir
        allowed1 = throttle.allow_request(request, None)
        self.assertTrue(allowed1, "Primer request en 1/hour rate debe allow")

        # Segundo intento — debe denegar
        allowed2 = throttle.allow_request(request, None)
        self.assertFalse(allowed2, "Segundo request en 1/hour rate debe deny")

    def test_allow_request_allows_gets_with_high_rate(self):
        """GET nunca debe ser denegado por WriteRateThrottle."""
        from django.core.cache import cache as throttle_cache

        from usaer_system.throttling import WriteRateThrottle

        throttle_cache.clear()
        throttle = WriteRateThrottle()
        throttle.rate = "1/hour"
        throttle.num_requests, throttle.duration = throttle.parse_rate(throttle.rate)

        request = MagicMock()
        request.method = "GET"
        request.META = {"REMOTE_ADDR": "127.0.0.1"}

        for _ in range(10):
            allowed = throttle.allow_request(request, None)
            self.assertTrue(allowed, "GET nunca debe ser denegado por WriteRateThrottle")

    def test_allow_request_has_retry_after(self):
        """Un request denegado debe calcular wait_time."""
        from django.core.cache import cache as throttle_cache

        from usaer_system.throttling import WriteRateThrottle

        throttle_cache.clear()
        throttle = WriteRateThrottle()
        throttle.rate = "1/hour"
        throttle.num_requests, throttle.duration = throttle.parse_rate(throttle.rate)

        request = MagicMock()
        request.method = "POST"
        request.META = {"REMOTE_ADDR": "127.0.0.1"}
        request.user.is_authenticated = True
        request.user.pk = 888

        # Consumir el rate
        throttle.allow_request(request, None)
        # Segundo intento — debe denegar
        allowed = throttle.allow_request(request, None)
        self.assertFalse(allowed)

        # wait_time() debe devolver un valor > 0
        wait = throttle.wait()
        self.assertIsNotNone(wait)
        self.assertGreater(wait, 0)
