"""
test_permiso_workflow.py — Ciclo completo de permisos.

Flujo:
1. Maestro crea un permiso.
2. Admin responde (aprueba).
3. Maestro consulta el estado.
4. Maestro intenta borrar el permiso aprobado → denegado (solo PENDIENTE).
"""

from django.urls import reverse
from rest_framework import status
from django.utils import timezone

from .base import BaseIntegrationTest
from permisos.models import Permiso


class PermisoWorkflowTest(BaseIntegrationTest):

    def test_ciclo_completo_permiso(self):
        """Flujo completo: crear → responder → consultar → eliminar denegado."""
        self._auth(self.maestro)

        # 1. Maestro crea permiso
        crear_url = reverse("permisos:permisos-list")
        manana = (timezone.localdate() + timezone.timedelta(days=1)).isoformat()
        data = {
            "motivo": "Cita médica",
            "fecha_inicio": manana,
            "fecha_fin": manana,
            "horas_solicitadas": 4,
        }
        crear_resp = self.client.post(crear_url, data, format="json")
        self.assertIn(crear_resp.status_code,
                      [status.HTTP_201_CREATED, status.HTTP_200_OK])
        permiso_id = crear_resp.data.get("id") or crear_resp.json().get("id")

        # 2. Admin responde (aprueba)
        self._auth(self.admin)
        responder_url = reverse("permisos:permisos-responder", args=[permiso_id])
        resp_data = {
            "estado": "APROBADO",
            "respuesta_admin": "Autorizado.",
        }
        resp_resp = self.client.post(responder_url, resp_data, format="json")
        self.assertEqual(resp_resp.status_code, status.HTTP_200_OK)

        # 3. Maestro consulta estado
        self._auth(self.maestro)
        detalle_url = reverse("permisos:permisos-detail", args=[permiso_id])
        detalle_resp = self.client.get(detalle_url)
        self.assertEqual(detalle_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(detalle_resp.json()["estado"], "APROBADO")

        # 4. Maestro intenta borrar permiso aprobado → denegado
        delete_resp = self.client.delete(detalle_url)
        self.assertEqual(delete_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_rechaza_permiso(self):
        """Admin puede rechazar un permiso."""
        # Maestro crea
        self._auth(self.maestro)
        crear_url = reverse("permisos:permisos-list")
        manana = (timezone.localdate() + timezone.timedelta(days=1)).isoformat()
        data = {
            "motivo": "Asunto personal",
            "fecha_inicio": manana,
            "fecha_fin": manana,
            "horas_solicitadas": 2,
        }
        crear_resp = self.client.post(crear_url, data, format="json")
        permiso_id = crear_resp.data.get("id") or crear_resp.json().get("id")

        # Admin rechaza
        self._auth(self.admin)
        responder_url = reverse("permisos:permisos-responder", args=[permiso_id])
        resp_data = {
            "estado": "RECHAZADO",
            "respuesta_admin": "No autorizado.",
        }
        resp_resp = self.client.post(responder_url, resp_data, format="json")
        self.assertEqual(resp_resp.status_code, status.HTTP_200_OK)

        permiso = Permiso.objects.get(pk=permiso_id)
        self.assertEqual(permiso.estado, "RECHAZADO")

    def test_maestro_borra_permiso_pendiente(self):
        """Maestro puede borrar su permiso si está PENDIENTE."""
        self._auth(self.maestro)
        crear_url = reverse("permisos:permisos-list")
        manana = (timezone.localdate() + timezone.timedelta(days=1)).isoformat()
        data = {
            "motivo": "Eliminaré esto",
            "fecha_inicio": manana,
            "fecha_fin": manana,
            "horas_solicitadas": 1,
        }
        crear_resp = self.client.post(crear_url, data, format="json")
        permiso_id = crear_resp.data.get("id") or crear_resp.json().get("id")

        detalle_url = reverse("permisos:permisos-detail", args=[permiso_id])
        delete_resp = self.client.delete(detalle_url)
        self.assertIn(delete_resp.status_code,
                      [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
