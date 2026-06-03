"""Tests for Permisos app — expanded coverage for RBAC, Responses, and Metrics."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from escuelas.models import Escuela
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Permiso

User = get_user_model()


class PermisoAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.escuela = Escuela.objects.create(
            clave_estatal="E_PERM",
            cct="CCT_PERM",
            nombre="Escuela Permisos",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z_PERM",
        )
        self.admin = User.objects.create_superuser(
            email="admin_perm@example.com", numero_empleado="ADM_PERM", password="pass"
        )
        self.director = User.objects.create_user(
            email="dir_perm@example.com",
            numero_empleado="DIR_PERM",
            password="pass",
            escuela=self.escuela,
            role=User.Role.DIRECTOR,
        )
        self.maestro = User.objects.create_user(
            email="maestro_perm@example.com",
            numero_empleado="MAEST_PERM",
            password="pass",
            escuela=self.escuela,
            role=User.Role.MAESTRO_APOYO,
        )
        self.maestro_otro = User.objects.create_user(
            email="maestro_otro@example.com",
            numero_empleado="MAEST_OTRO",
            password="pass",
            escuela=self.escuela,
            role=User.Role.MAESTRO_APOYO,
        )

        self.permiso = Permiso.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            motivo="CITA MEDICA",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timezone.timedelta(days=1),
            estado=Permiso.Estado.PENDIENTE,
        )

    def test_solicitar_permiso_maestro(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("permisos:permisos-list")
        payload = {
            "motivo": "Curso de capacitación",
            "fecha_inicio": "2026-07-01",
            "fecha_fin": "2026-07-02",
            "estado": Permiso.Estado.PENDIENTE,
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        # The serializer converts the motivo to uppercase
        self.assertTrue(Permiso.objects.filter(motivo="CURSO DE CAPACITACIÓN").exists())

    def test_listar_permisos_maestro_solo_lo_suyo(self):
        # Create a permission for another teacher
        Permiso.objects.create(
            profesor=self.maestro_otro,
            escuela=self.escuela,
            motivo="Permiso Ajeno",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timezone.timedelta(days=1),
            estado=Permiso.Estado.PENDIENTE,
        )

        self.client.force_authenticate(user=self.maestro)
        url = reverse("permisos:permisos-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get("results", [])

        self.assertTrue(any(item.get("motivo") == "CITA MEDICA".upper() for item in results))
        self.assertFalse(any(item.get("motivo") == "PERMISO AJENO".upper() for item in results))

    def test_listar_permisos_director_ve_escuela(self):
        self.client.force_authenticate(user=self.director)
        url = reverse("permisos:permisos-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get("results", [])
        self.assertTrue(any(item.get("motivo") == "CITA MEDICA".upper() for item in results))

    def test_responder_permiso_aprobar_director(self):
        self.client.force_authenticate(user=self.director)
        url = reverse("permisos:permisos-responder", args=[self.permiso.pk])
        payload = {
            "estado": Permiso.Estado.APROBADO,
            "respuesta_admin": "Aprobado por la dirección",
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.permiso.refresh_from_db()
        self.assertEqual(self.permiso.estado, Permiso.Estado.APROBADO)
        self.assertEqual(self.permiso.respuesta_admin, "APROBADO POR LA DIRECCIÓN")

    def test_responder_permiso_rechazar_requiere_justificacion(self):
        self.client.force_authenticate(user=self.director)
        url = reverse("permisos:permisos-responder", args=[self.permiso.pk])
        payload = {
            "estado": Permiso.Estado.RECHAZADO,
            "respuesta_admin": "",  # Empty justification
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_responder_permiso_idempotencia(self):
        # Set to APROBADO first
        self.permiso.estado = Permiso.Estado.APROBADO
        self.permiso.save()

        self.client.force_authenticate(user=self.director)
        url = reverse("permisos:permisos-responder", args=[self.permiso.pk])
        payload = {"estado": Permiso.Estado.RECHAZADO, "respuesta_admin": "Cambio de opinión"}
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ya ha sido gestionado", response.data["detail"])

    def test_responder_permiso_denied_for_maestro(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("permisos:permisos-responder", args=[self.permiso.pk])
        payload = {"estado": Permiso.Estado.APROBADO, "respuesta_admin": "Yo mismo me apruebo"}
        response = self.client.post(url, data=payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_metricas_endpoint(self):
        # Create some permissions with required dates
        now = timezone.now()
        Permiso.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            motivo="T1",
            estado=Permiso.Estado.PENDIENTE,
            fecha_inicio=now,
            fecha_fin=now + timezone.timedelta(days=1),
        )
        Permiso.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            motivo="T2",
            estado=Permiso.Estado.APROBADO,
            fecha_inicio=now,
            fecha_fin=now + timezone.timedelta(days=1),
        )

        self.client.force_authenticate(user=self.admin)
        url = reverse("permisos:permisos-metricas")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("pendientes", response.data)
        self.assertIn("aprobados", response.data)
        self.assertIn("rechazados", response.data)

    def test_delete_permiso_owner_can_delete_pending(self):
        # The permission is created as PENDIENTE in setUp
        self.client.force_authenticate(user=self.maestro)
        url = reverse("permisos:permisos-detail", args=[self.permiso.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertFalse(Permiso.objects.filter(pk=self.permiso.pk).exists())

    def test_delete_permiso_owner_cannot_delete_approved(self):
        # Set to APROBADO
        self.permiso.estado = Permiso.Estado.APROBADO
        self.permiso.save()

        self.client.force_authenticate(user=self.maestro)
        url = reverse("permisos:permisos-detail", args=[self.permiso.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
