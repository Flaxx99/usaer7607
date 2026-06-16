"""
Custom DRF throttle classes for USAER 7607.
Provides verb-based throttling to protect write operations.
"""

from rest_framework.settings import api_settings
from rest_framework.throttling import UserRateThrottle


class WriteRateThrottle(UserRateThrottle):
    """
    Throttle diferenciado por verbo HTTP.
    Solo aplica a operaciones de escritura (POST, PUT, PATCH, DELETE).
    Las lecturas (GET, HEAD, OPTIONS) no son limitadas por esta clase.
    """

    scope = "user_write"

    def get_rate(self):
        """
        Lee el rate directamente de api_settings en lugar de la referencia
        de clase THROTTLE_RATES (que se congela en tiempo de importación).
        Esto permite que @override_settings + _invalidate_drf_settings()
        funcionen correctamente en tests.
        """
        return api_settings.DEFAULT_THROTTLE_RATES[self.scope]

    def get_cache_key(self, request, view):
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            # Delega a UserRateThrottle.get_cache_key: usa user.pk para
            # autenticados, o IP para anónimos. Así cada usuario tiene su
            # propio contador de writes.
            return super().get_cache_key(request, view)
        return None
