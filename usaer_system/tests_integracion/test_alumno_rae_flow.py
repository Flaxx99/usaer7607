"""
test_alumno_rae_flow.py — Flujo core RAE: Captura → Guardado bulk → Exportar.

Roles involucrados:
- MAESTRO_APOYO: inicia captura de sus alumnos, guarda datos bulk.
- ADMIN: exporta RAE completo.
"""

from django.urls import reverse
from rest_framework import status

from .base import BaseIntegrationTest


class AlumnoRAEFlowTest(BaseIntegrationTest):

    def test_maestro_inicia_captura_rae(self):
        """Maestro inicia captura RAE y obtiene su lista de alumnos."""
        self._auth(self.maestro)
        url = reverse("rae:captura_rae")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("alumnos", data)
        self.assertGreaterEqual(len(data["alumnos"]), 1)

    def test_maestro_guarda_bulk_rae(self):
        """Maestro guarda datos bulk de RAE para sus alumnos."""
        self._auth(self.maestro)
        init_url = reverse("rae:captura_rae")
        init_resp = self.client.get(init_url)
        registro_id = init_resp.json()["registro_id"]
        alumnos_data = init_resp.json()["alumnos"]

        bulk_url = reverse("rae:guardar_rae_bulk")
        payload = {
            "registro_id": registro_id,
            "alumnos": [
                {"id": a["id"], "di": True, "psicologia": True}
                for a in alumnos_data
            ],
        }
        response = self.client.post(bulk_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["status"], "success")

    def test_admin_exporta_rae_individual(self):
        """Admin exporta un RAE individual por PK."""
        self._auth(self.maestro)
        init_url = reverse("rae:captura_rae")
        init_resp = self.client.get(init_url)
        registro_id = init_resp.json()["registro_id"]

        self._auth(self.admin)
        export_url = reverse("rae:exportar_rae_excel", args=[registro_id])
        response = self.client.get(export_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
