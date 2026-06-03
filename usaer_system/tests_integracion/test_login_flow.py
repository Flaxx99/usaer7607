"""
test_login_flow.py — Autenticación real con Token.

Flujo:
1. Login con credenciales válidas → obtiene Token.
2. Login con credenciales inválidas → 400.
3. Acceso a endpoint protegido con Token en header → 200.
4. Acceso a endpoint protegido sin Token → 401.
"""

from django.urls import reverse
from rest_framework import status

from .base import BaseIntegrationTest


class LoginFlowTest(BaseIntegrationTest):
    def test_login_exitoso_obtiene_token(self):
        """Login con username (email) y password correctos devuelve un Token."""
        url = reverse("usuarios:login")
        response = self.client.post(
            url,
            {
                "username": "maestro@test.com",
                "password": "pass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)

    def test_login_fallido_credenciales_incorrectas(self):
        """Login con password incorrecto devuelve 400."""
        url = reverse("usuarios:login")
        response = self.client.post(
            url,
            {
                "username": "maestro@test.com",
                "password": "wrongpass",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_acceso_endpoint_con_token_header(self):
        """Acceder a /api/escuelas/ con Token en header funciona."""
        url = reverse("escuelas:escuelas-list")

        # Primero login para obtener token real
        login_url = reverse("usuarios:login")
        login_resp = self.client.post(
            login_url,
            {
                "username": "admin@test.com",
                "password": "pass123",
            },
            format="json",
        )
        token = login_resp.data["token"]

        # Usar el token en el header
        self._auth_token(token)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_acceso_endpoint_sin_token_devuelve_401(self):
        """Acceder a /api/escuelas/ sin autenticación devuelve 401."""
        url = reverse("escuelas:escuelas-list")
        self._clear_auth()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
