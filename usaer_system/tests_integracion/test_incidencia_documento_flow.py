"""
test_incidencia_documento_flow.py — Incidencia + Documentos + Resolución.

Flujo:
1. Admin crea una incidencia para un alumno.
2. Admin crea un expediente (documento) para el mismo alumno.
3. Admin resuelve la incidencia.
4. Verifica que la incidencia queda RESUELTA.
"""

from django.urls import reverse
from documentos.models import Expediente
from incidencias.models import Incidencia
from rest_framework import status

from .base import BaseIntegrationTest


class IncidenciaDocumentoFlowTest(BaseIntegrationTest):
    def test_admin_crea_incidencia_y_expediente(self):
        """Admin crea una incidencia y un expediente para el mismo alumno."""
        self._auth(self.admin)

        # 1. Crear incidencia
        inc_url = reverse("incidencias:incidencias-list")
        inc_data = {
            "titulo": "Problema de conducta en aula",
            "escuela": self.escuela.pk,
            "profesor": self.maestro.pk,
            "descripcion": "El alumno presenta conductas disruptivas.",
            "reportado_por": self.admin.pk,
        }
        inc_response = self.client.post(inc_url, inc_data, format="json")
        self.assertIn(inc_response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

        # 2. Crear expediente para el alumno (usa MultiPartParser)
        exp_url = reverse("documentos:documentos-list")
        exp_data = {
            "alumno": self.alumno.pk,
            "observaciones": "Expediente de seguimiento de conducta.",
        }
        exp_response = self.client.post(exp_url, exp_data, format="multipart")
        self.assertIn(exp_response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

        self.assertTrue(Incidencia.objects.filter(titulo="PROBLEMA DE CONDUCTA EN AULA").exists())
        self.assertTrue(Expediente.objects.filter(alumno=self.alumno).exists())

    def test_admin_resuelve_incidencia(self):
        """Admin resuelve una incidencia existente."""
        incidencia = Incidencia.objects.create(
            escuela=self.escuela,
            profesor=self.maestro,
            reportado_por=self.admin,
            titulo="Incidencia de prueba",
            descripcion="Para resolver",
        )

        self._auth(self.admin)
        url = reverse("incidencias:incidencias-detail", args=[incidencia.pk])
        data = {
            "estado": "RESUELTA",
            "respuesta_admin": "Se tomó acción correctiva.",
        }
        response = self.client.patch(url, data, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])

        incidencia.refresh_from_db()
        self.assertEqual(incidencia.estado, "RESUELTA")

    def test_maestro_no_puede_crear_incidencia(self):
        """Maestro NO puede crear incidencias."""
        self._auth(self.maestro)
        url = reverse("incidencias:incidencias-list")
        data = {
            "titulo": "Intento de incidencia",
            "escuela": self.escuela.pk,
            "profesor": self.maestro.pk,
            "descripcion": "No debería poder.",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_secretario_ya_no_puede_crear_incidencia(self):
        """SECRETARIO ya no puede crear incidencias."""
        self._auth(self.secretario)
        url = reverse("incidencias:incidencias-list")
        data = {
            "titulo": "Intento secre",
            "escuela": self.escuela.pk,
            "profesor": self.maestro.pk,
            "descripcion": "No debería poder.",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
