"""Tests for Avisos app — migrated to DRF APITestCase."""

from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Anuncio

User = get_user_model()


class AnuncioModelTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test_aviso@example.com", numero_empleado="EMP_AV", password="pass"
        )
        self.anuncio_activo = Anuncio.objects.create(
            titulo="Aviso Activo",
            contenido="Contenido activo",
            fecha_publicacion=timezone.now() - timedelta(days=1),
            fecha_expiracion=timezone.now() + timedelta(days=1),
            autor=self.user
        )
        self.anuncio_expirado = Anuncio.objects.create(
            titulo="Aviso Expirado",
            contenido="Contenido expirado",
            fecha_publicacion=timezone.now() - timedelta(days=10),
            fecha_expiracion=timezone.now() - timedelta(days=1),
            autor=self.user
        )

    def test_anuncio_str(self):
        self.assertEqual(str(self.anuncio_activo), "Aviso Activo")

    def test_is_active_true(self):
        self.assertTrue(self.anuncio_activo.is_active())

    def test_is_active_false_expired(self):
        self.assertFalse(self.anuncio_expirado.is_active())

    def test_is_active_false_future(self):
        anuncio_futuro = Anuncio.objects.create(
            titulo="Aviso Futuro",
            contenido="Contenido futuro",
            fecha_publicacion=timezone.now() + timedelta(days=1),
            autor=self.user
        )
        self.assertFalse(anuncio_futuro.is_active())


class AnuncioViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email="admin_aviso@example.com", numero_empleado="admin_av", password="pass"
        )
        self.maestro = User.objects.create_user(
            email="maestro_aviso@example.com", numero_empleado="maestro_av", password="pass", role=User.Role.MAESTRO_APOYO
        )
        self.anuncio = Anuncio.objects.create(
            titulo="Aviso Base",
            contenido="Contenido Base",
            autor=self.admin
        )

    def test_lista_anuncios(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("avisos:anuncios-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.anuncio.titulo)

    def test_crear_anuncio_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("avisos:anuncios-list")
        payload = {
            "titulo": "Nuevo Aviso",
            "contenido": "Contenido del nuevo aviso",
            "fecha_expiracion": (timezone.now() + timedelta(days=7)).isoformat(),
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(Anuncio.objects.filter(titulo="Nuevo Aviso").exists())

    def test_crear_anuncio_denegado_maestro(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("avisos:anuncios-list")
        payload = {
            "titulo": "Aviso Maestro",
            "contenido": "No debería poder crear esto",
        }
        response = self.client.post(url, data=payload, format='json')
        # Now it should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editar_anuncio_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("avisos:anuncios-detail", args=[self.anuncio.pk])
        payload = {
            "titulo": "Aviso Editado",
            "contenido": "Contenido editado",
        }
        response = self.client.patch(url, data=payload, format='json')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.anuncio.refresh_from_db()
        self.assertEqual(self.anuncio.titulo, "Aviso Editado")

    def test_eliminar_anuncio_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("avisos:anuncios-detail", args=[self.anuncio.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertFalse(Anuncio.objects.filter(pk=self.anuncio.pk).exists())
