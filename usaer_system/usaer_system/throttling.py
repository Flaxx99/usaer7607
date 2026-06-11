"""
Custom DRF throttle classes for USAER 7607.
Provides verb-based throttling to protect write operations.
"""

from rest_framework.throttling import UserRateThrottle


class WriteRateThrottle(UserRateThrottle):
    """
    Throttle diferenciado por verbo HTTP.
    Solo aplica a operaciones de escritura (POST, PUT, PATCH, DELETE).
    Las lecturas (GET, HEAD, OPTIONS) no son limitadas por esta clase.
    """

    scope = "user_write"

    def get_cache_key(self, request, view):
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            # Delega a UserRateThrottle.get_cache_key: usa user.pk para
            # autenticados, o IP para anónimos. Así cada usuario tiene su
            # propio contador de writes.
            return super().get_cache_key(request, view)
        return None
