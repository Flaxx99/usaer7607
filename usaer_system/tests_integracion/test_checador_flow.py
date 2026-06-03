"""
test_checador_flow.py — Flujo completo del checador de asistencias.

Flujo:
1. POST al checador (público, sin token) con código de empleado → Entrada.
2. POST al checador otra vez → Salida.
3. POST al checador una tercera vez → Error (ya registró ambos).
4. GET al historial (autenticado) → Ver los registros.
"""

from django.urls import reverse
from rest_framework import status

from .base import BaseIntegrationTest
from asistencias.models import Asistencia


class ChecadorFlowTest(BaseIntegrationTest):

    def test_checador_entrada_salida_completo(self):
        """Flujo completo: entrada → salida → error."""
        codigo = self.maestro.numero_empleado
        checar_url = reverse("asistencias:checar")

        # 1. Entrada (sin autenticación)
        response = self.client.post(checar_url,
                                     {"numero_empleado": codigo},
                                     format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["tipo"], "ENTRADA")

        # 2. Salida (mismo endpoint, mismo día)
        response = self.client.post(checar_url,
                                     {"numero_empleado": codigo},
                                     format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["tipo"], "SALIDA")

        # 3. Tercer intento → error (ya registró ambos)
        response = self.client.post(checar_url,
                                     {"numero_empleado": codigo},
                                     format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Ya registraste", response.json().get("detail", ""))

    def test_checador_codigo_invalido(self):
        """Código inválido devuelve 404."""
        checar_url = reverse("asistencias:checar")
        response = self.client.post(checar_url,
                                     {"numero_empleado": "CODIGO_INEXISTENTE"},
                                     format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_historial_asistencias_admin_ve_todo(self):
        """Admin ve todas las asistencias en el historial."""
        # Primero registrar una asistencia
        codigo = self.maestro.numero_empleado
        checar_url = reverse("asistencias:checar")
        self.client.post(checar_url,
                          {"numero_empleado": codigo},
                          format="json")

        # Admin consulta historial
        self._auth(self.admin)
        historial_url = reverse("asistencias:asistencias-list")
        response = self.client.get(historial_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        self.assertGreaterEqual(len(results), 1)

    def test_historial_asistencias_maestro_ve_solo_lo_suyo(self):
        """Maestro ve solo sus propias asistencias."""
        codigo = self.maestro.numero_empleado
        checar_url = reverse("asistencias:checar")
        self.client.post(checar_url,
                          {"numero_empleado": codigo},
                          format="json")

        self._auth(self.maestro)
        historial_url = reverse("asistencias:asistencias-list")
        response = self.client.get(historial_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        self.assertGreaterEqual(len(results), 1)
        for r in results:
            self.assertEqual(r["profesor"], self.maestro.pk)
