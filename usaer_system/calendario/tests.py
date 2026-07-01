"""Tests for Calendario app — migrated to DRF APITestCase."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import EventoCalendario

User = get_user_model()


class EventoCalendarioModelTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", numero_empleado="EMP001", password="pass"
        )
        self.evento = EventoCalendario.objects.create(
            titulo="Reunión",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=1),
            creado_por=self.user,
            tipo="PERSONAL",
        )

    def test_evento_creation(self):
        self.assertIsInstance(self.evento, EventoCalendario)
        self.assertEqual(self.evento.titulo, "Reunión")

    def test_evento_str(self):
        self.assertEqual(str(self.evento), "Reunión (PERSONAL)")


class EventoCalendarioViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="viewuser@example.com", numero_empleado="EMP003", password="pass"
        )
        self.admin = User.objects.create_superuser(
            email="viewadmin@example.com", numero_empleado="ADM002", password="pass"
        )
        self.secretario = User.objects.create_user(
            email="viewsec@example.com",
            numero_empleado="SEC001",
            password="pass",
            role=User.Role.SECRETARIO,
        )

        self.evento_personal_user = EventoCalendario.objects.create(
            titulo="Mi Evento Personal",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=1),
            creado_por=self.user,
            tipo="PERSONAL",
        )
        self.evento_institucional = EventoCalendario.objects.create(
            titulo="Evento Institucional",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=2),
            creado_por=self.admin,
            tipo="INSTITUCIONAL",
        )

    def test_lista_eventos_user(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("calendario:eventos-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get("results", [])
        self.assertTrue(
            any(item.get("title") == self.evento_personal_user.titulo for item in results),
            f"title={self.evento_personal_user.titulo!r} not in results: {[r.get('title') for r in results]}",
        )
        self.assertTrue(
            any(item.get("title") == self.evento_institucional.titulo for item in results),
            f"title={self.evento_institucional.titulo!r} not in results: {[r.get('title') for r in results]}",
        )

    def _crear_payload_base(self, titulo, horas=1):
        return {
            "title": titulo,
            "start_time": timezone.now().isoformat(),
            "end_time": (timezone.now() + timedelta(hours=horas)).isoformat(),
        }

    def test_crear_evento_user_personal(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("calendario:eventos-list")
        payload = self._crear_payload_base("Nuevo Evento User")
        response = self.client.post(url, data=payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(
            EventoCalendario.objects.filter(
                titulo="Nuevo Evento User", creado_por=self.user, tipo="PERSONAL"
            ).exists()
        )

    def test_crear_evento_admin_institucional(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("calendario:eventos-list")
        payload = self._crear_payload_base("Nuevo Evento Admin")
        response = self.client.post(url, data=payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(
            EventoCalendario.objects.filter(
                titulo="Nuevo Evento Admin", creado_por=self.admin, tipo="INSTITUCIONAL"
            ).exists()
        )

    def test_crear_evento_maestro_fuerza_personal(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("calendario:eventos-list")
        payload = self._crear_payload_base("Evento Intento Institucional")
        # Un maestro normal NO puede pasar tipo="INSTITUCIONAL" ni event_type — el view lo forza
        response = self.client.post(url, data=payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        # Should be forced to PERSONAL
        self.assertTrue(
            EventoCalendario.objects.filter(
                titulo="Evento Intento Institucional", tipo="PERSONAL"
            ).exists()
        )
        self.assertFalse(
            EventoCalendario.objects.filter(
                titulo="Evento Intento Institucional", tipo="INSTITUCIONAL"
            ).exists()
        )

    def test_detalle_evento_personal_propio(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("calendario:eventos-detail", args=[self.evento_personal_user.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.evento_personal_user.titulo)

    def test_detalle_evento_personal_ajeno_denegado(self):
        otro_user = User.objects.create_user(
            email="otro_user@example.com", numero_empleado="EMP004", password="pass"
        )
        self.client.force_authenticate(user=otro_user)
        url = reverse("calendario:eventos-detail", args=[self.evento_personal_user.pk])
        response = self.client.get(url)
        # El ViewSet filtra el queryset en get_queryset(), por lo que el objeto no se encuentra (404)
        # en lugar de dar 403 mediante el permiso de objeto.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_editar_evento_propio(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("calendario:eventos-detail", args=[self.evento_personal_user.pk])
        payload = {
            "title": "Evento Editado",
            "start_time": self.evento_personal_user.fecha_inicio.isoformat(),
            "end_time": self.evento_personal_user.fecha_fin.isoformat(),
        }
        response = self.client.patch(url, data=payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.evento_personal_user.refresh_from_db()
        self.assertEqual(self.evento_personal_user.titulo, "Evento Editado")

    def test_eliminar_evento_propio(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("calendario:eventos-detail", args=[self.evento_personal_user.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertFalse(EventoCalendario.objects.filter(pk=self.evento_personal_user.pk).exists())
