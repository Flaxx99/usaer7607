"""Tests for Escuelas app — migrated to DRF APITestCase."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from escuelas.models import Escuela

User = get_user_model()


class EscuelaModelTest(APITestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="12345",
            cct="CCT123",
            nombre="Escuela de Prueba",
            nivel="Primaria",
            domicilio="Calle Falsa 123",
            colonia="Centro",
            zona="01",
        )

    def test_model_str(self):
        self.assertEqual(str(self.escuela), "CCT123 – Escuela de Prueba")

    def test_nivel_se_guarda_en_mayusculas(self):
        escuela = Escuela.objects.create(
            clave_estatal="67890",
            cct="CCT456",
            nombre="Otra Escuela",
            nivel="secundaria",  # En minúsculas
            domicilio="Otra Calle 456",
            colonia="Norte",
            zona="02",
        )
        self.assertEqual(escuela.nivel, "SECUNDARIA")


class EscuelaViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email="admin@test.com", numero_empleado="admin", password="password"
        )
        self.maestro = User.objects.create_user(
            email="user@test.com", numero_empleado="user1", password="password"
        )

        self.escuela = Escuela.objects.create(
            clave_estatal="12345",
            cct="CCT123",
            nombre="Escuela de Prueba",
            nivel="Primaria",
            domicilio="Calle Falsa 123",
            colonia="Centro",
            zona="01",
        )

    def test_acceso_denegado_a_no_staff(self):
        # Maestro cannot modify schools, but CAN list them (Read-Only)
        self.client.force_authenticate(user=self.maestro)

        # List should be allowed (GET is SAFE_METHOD)
        url_list = reverse("escuelas:escuelas-list")
        response = self.client.get(url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Creation should be denied (POST)
        url_create = reverse("escuelas:escuelas-list")
        response = self.client.post(url_create, data={})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("message", response.data)
        self.assertIn("permiso", response.data["message"])

        # Edition should be denied (PATCH/PUT)
        url_edit = reverse("escuelas:escuelas-detail", args=[self.escuela.pk])
        response = self.client.patch(url_edit, data={})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("message", response.data)

        # Deletion should be denied (DELETE)
        url_delete = reverse("escuelas:escuelas-detail", args=[self.escuela.pk])
        response = self.client.delete(url_delete)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("message", response.data)

    def test_acceso_permitido_a_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("escuelas:escuelas-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_listar_escuelas_muestra_escuelas(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("escuelas:escuelas-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.escuela.nombre)

    def test_crear_escuela(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("escuelas:escuelas-list")
        form_data = {
            "clave_estatal": "67890",
            "cct": "CCT456",
            "nombre": "Nueva Escuela",
            "nivel": "SECUNDARIA",
            "domicilio": "Av. Siempre Viva 742",
            "colonia": "Springfield",
            "zona": "03",
        }
        response = self.client.post(url, data=form_data, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(Escuela.objects.filter(cct="CCT456").exists())
        # Body debe incluir los datos creados (serializer output)
        self.assertEqual(response.data["nombre"], "NUEVA ESCUELA")
        self.assertEqual(response.data["cct"], "CCT456")

    def test_editar_escuela(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("escuelas:escuelas-detail", args=[self.escuela.pk])
        form_data = {
            "clave_estatal": self.escuela.clave_estatal,
            "cct": self.escuela.cct,
            "nombre": "Escuela Editada",
            "nivel": self.escuela.nivel,
            "domicilio": self.escuela.domicilio,
            "colonia": self.escuela.colonia,
            "zona": self.escuela.zona,
        }
        response = self.client.patch(url, data=form_data, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.escuela.refresh_from_db()
        self.assertEqual(self.escuela.nombre, "ESCUELA EDITADA")

    def test_eliminar_escuela(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("escuelas:escuelas-detail", args=[self.escuela.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertFalse(Escuela.objects.filter(pk=self.escuela.pk).exists())
