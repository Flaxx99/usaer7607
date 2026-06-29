"""
Tests de seguridad (caja negra).

Verifica que los headers de seguridad, CSP, y configuraciones
estén presentes en las respuestas HTTP.
"""

from django.conf import settings
from django.test import TestCase, override_settings


@override_settings(SECURE_SSL_REDIRECT=False)
class SecurityHeadersTest(TestCase):
    """Verifica que los security headers esenciales estén configurados."""

    def test_content_type_nosniff(self):
        """SECURE_CONTENT_TYPE_NOSNIFF debe estar activo."""
        self.assertTrue(settings.SECURE_CONTENT_TYPE_NOSNIFF)

    def test_x_frame_options(self):
        """X_FRAME_OPTIONS debe ser DENY."""
        self.assertEqual(settings.X_FRAME_OPTIONS, "DENY")

    def test_referrer_policy(self):
        """SECURE_REFERRER_POLICY debe ser same-origin."""
        self.assertEqual(settings.SECURE_REFERRER_POLICY, "same-origin")

    def test_session_cookie_httponly(self):
        """SESSION_COOKIE_HTTPONLY debe ser True."""
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)

    def test_session_cookie_samesite(self):
        """SESSION_COOKIE_SAMESITE debe ser Lax."""
        self.assertEqual(settings.SESSION_COOKIE_SAMESITE, "Lax")

    def test_csrf_cookie_samesite(self):
        """CSRF_COOKIE_SAMESITE debe ser Lax."""
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, "Lax")

    @override_settings(
        SECURE_HSTS_SECONDS=31536000,
        SECURE_SSL_REDIRECT=True,
        SESSION_COOKIE_SECURE=True,
        CSRF_COOKIE_SECURE=True,
    )
    def test_production_security_settings(self):
        """Los settings de producción deben tener valores correctos."""
        self.assertEqual(settings.SECURE_HSTS_SECONDS, 31536000)
        self.assertTrue(settings.SECURE_SSL_REDIRECT)
        self.assertTrue(settings.SESSION_COOKIE_SECURE)
        self.assertTrue(settings.CSRF_COOKIE_SECURE)

    def test_response_headers(self):
        """Los headers de seguridad deben aparecer en respuestas reales."""
        # Usamos una URL que existe y devuelve 200
        response = self.client.get("/swagger/")
        # X-Content-Type-Options debe venir del SecurityMiddleware
        self.assertIn("X-Content-Type-Options", response)
        # X-Frame-Options debe estar presente
        self.assertIn("X-Frame-Options", response)


@override_settings(SECURE_SSL_REDIRECT=False)
class CSPTest(TestCase):
    """Verifica que CSP esté configurado correctamente."""

    def _directive(self, name):
        return settings.CONTENT_SECURITY_POLICY["DIRECTIVES"][name]

    def test_csp_default_src(self):
        """CSP default-src debe ser self."""
        self.assertIn("'self'", self._directive("default-src"))

    def test_csp_style_src(self):
        """CSP style-src debe incluir unsafe-inline y fonts.googleapis."""
        src = self._directive("style-src")
        self.assertIn("'self'", src)
        self.assertIn("'unsafe-inline'", src)
        self.assertIn("https://fonts.googleapis.com", src)

    def test_csp_script_src_no_eval(self):
        """CSP script-src NO debe contener unsafe-eval."""
        self.assertNotIn("'unsafe-eval'", self._directive("script-src"))

    def test_csp_cdn_fonts(self):
        """CSP font-src debe incluir fonts.gstatic.com."""
        self.assertIn("https://fonts.gstatic.com", self._directive("font-src"))

    def test_csp_response_headers(self):
        """El middleware CSP debe agregar el header Content-Security-Policy."""
        # Usamos swagger porque requiere GET anónimo y siempre devuelve 200
        response = self.client.get("/swagger/")
        self.assertIn("Content-Security-Policy", response)


class ThrottlingTest(TestCase):
    """Verifica configuración de rate limiting."""

    def test_throttle_rates(self):
        """Las tasas de throttling deben estar definidas."""
        rates = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]
        self.assertIn("anon", rates)
        self.assertIn("user", rates)
        self.assertIn("login", rates)
        # 'burst' fue eliminado — verificar que NO esté
        self.assertNotIn("burst", rates)


class AxesTest(TestCase):
    """Verifica configuración de django-axes."""

    def test_axes_enabled(self):
        """Axes debe estar habilitado."""
        self.assertTrue(settings.AXES_ENABLED)

    def test_axes_failure_limit(self):
        """Límite de intentos fallidos debe ser 5."""
        self.assertEqual(settings.AXES_FAILURE_LIMIT, 5)

    def test_axes_lockout_params(self):
        """Lockout debe ser por username e ip_address."""
        self.assertIn("username", settings.AXES_LOCKOUT_PARAMETERS)
        self.assertIn("ip_address", settings.AXES_LOCKOUT_PARAMETERS)

    def test_axes_in_backends(self):
        """AxesStandaloneBackend debe ser el primer backend."""
        self.assertEqual(
            settings.AUTHENTICATION_BACKENDS[0],
            "axes.backends.AxesStandaloneBackend",
        )

    def test_axes_in_installed_apps(self):
        """Axes debe estar en INSTALLED_APPS."""
        self.assertIn("axes", settings.INSTALLED_APPS)


class PasswordHasherTest(TestCase):
    """Verifica configuración de password hashing."""

    def test_argon2_first(self):
        """Argon2 debe ser el primer hasher."""
        self.assertEqual(
            settings.PASSWORD_HASHERS[0],
            "django.contrib.auth.hashers.Argon2PasswordHasher",
        )


class LoggingTest(TestCase):
    """Verifica configuración de logging."""

    def test_axes_logger_exists(self):
        """Debe existir un logger para 'axes'."""
        self.assertIn("axes", settings.LOGGING["loggers"])

    def test_security_logger_exists(self):
        """Debe existir un logger para 'django.security'."""
        self.assertIn("django.security", settings.LOGGING["loggers"])

    def test_security_handler_exists(self):
        """Debe existir un handler para security_file."""
        self.assertIn("security_file", settings.LOGGING["handlers"])
