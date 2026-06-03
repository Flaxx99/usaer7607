"""Tests for Incidencias app — migrated to DRF APITestCase."""

from django.contrib.auth import get_user_model
from django.urls import reverse
from escuelas.models import Escuela
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Incidencia

User = get_user_model()


class IncidenciaModelTest(APITestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E3",
            cct="CCT3",
            nombre="Escuela Incidencia",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z3",
        )
        self.profesor = User.objects.create_user(
            email="profesor_inc@example.com",
            numero_empleado="EMP003",
            password="pass",
            escuela=self.escuela,
            role=User.Role.MAESTRO_APOYO,
        )
        self.incidencia = Incidencia.objects.create(
            escuela=self.escuela,
            profesor=self.profesor,
            titulo="Problema con material",
            descripcion="El material didáctico está dañado.",
        )

    def test_incidencia_creation(self):
        self.assertIsInstance(self.incidencia, Incidencia)
        self.assertEqual(self.incidencia.titulo, "Problema con material")
        self.assertEqual(self.incidencia.estado, "PENDIENTE")

    def test_incidencia_str(self):
        self.assertEqual(
            str(self.incidencia),
            f"Incidencia #{self.incidencia.id}: Problema con material (Pendiente)",
        )

    def test_save_sets_fecha_resolucion(self):
        self.incidencia.estado = "RESUELTA"
        self.incidencia.save()
        self.assertIsNotNone(self.incidencia.fecha_resolucion)


class IncidenciaViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.escuela = Escuela.objects.create(
            clave_estatal="E4",
            cct="CCT4",
            nombre="Escuela Incidencia Views",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z4",
        )
        self.admin = User.objects.create_superuser(
            email="admin_inc@example.com",
            numero_empleado="ADM003",
            password="pass",
            escuela=self.escuela,
        )
        self.director = User.objects.create_user(
            email="director_inc@example.com",
            numero_empleado="DIR001",
            password="pass",
            escuela=self.escuela,
            role=User.Role.DIRECTOR,
        )
        self.secretario = User.objects.create_user(
            email="secretario_inc@example.com",
            numero_empleado="SEC002",
            password="pass",
            escuela=self.escuela,
            role=User.Role.SECRETARIO,
        )
        self.maestro = User.objects.create_user(
            email="maestro_inc@example.com",
            numero_empleado="EMP004",
            password="pass",
            escuela=self.escuela,
            role=User.Role.MAESTRO_APOYO,
        )
        self.maestro_otro = User.objects.create_user(
            email="maestro_otro@example.com",
            numero_empleado="EMP005",
            password="pass",
            escuela=self.escuela,
            role=User.Role.MAESTRO_APOYO,
        )
        self.incidencia_maestro = Incidencia.objects.create(
            escuela=self.escuela,
            profesor=self.maestro,
            titulo="Incidencia del Maestro",
            descripcion="Descripción del maestro",
        )
        # This one belongs to another maestro, so the first maestro should NOT see it.
        self.incidencia_pendiente = Incidencia.objects.create(
            escuela=self.escuela,
            profesor=self.maestro_otro,
            titulo="Incidencia Pendiente",
            descripcion="Descripción pendiente",
        )

    def test_crear_incidencia_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("incidencias:incidencias-list")
        form_data = {
            "titulo": "Nueva Incidencia Admin",
            "escuela": self.escuela.pk,
            "profesor": self.maestro.pk,
            "descripcion": "Descripción de la nueva incidencia",
        }
        response = self.client.post(url, data=form_data, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        # The serializer converts the title to uppercase
        self.assertTrue(Incidencia.objects.filter(titulo="NUEVA INCIDENCIA ADMIN").exists())

    def test_listar_incidencias_maestro(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("incidencias:incidencias-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.incidencia_maestro.titulo)
        # Since it belongs to another maestro, the first maestro shouldn't see it
        self.assertNotContains(response, self.incidencia_pendiente.titulo)

    def test_revisar_incidencias_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("incidencias:incidencias-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.incidencia_maestro.titulo)
        self.assertContains(response, self.incidencia_pendiente.titulo)

    def test_detalle_incidencia(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("incidencias:incidencias-detail", args=[self.incidencia_maestro.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.incidencia_maestro.titulo)

    def test_editar_incidencia_director(self):
        self.client.force_authenticate(user=self.director)
        url = reverse("incidencias:incidencias-detail", args=[self.incidencia_pendiente.pk])
        form_data = {
            "titulo": self.incidencia_pendiente.titulo,
            "escuela": self.incidencia_pendiente.escuela.pk,
            "profesor": self.incidencia_pendiente.profesor.pk,
            "descripcion": self.incidencia_pendiente.descripcion,
            "estado": "RESUELTA",
            "respuesta_admin": "Incidencia resuelta por director",
        }
        response = self.client.patch(url, data=form_data, format="json")
        if response.status_code not in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]:
            print(f"DEBUG: Response status: {response.status_code}")
            print(f"DEBUG: Response content: {response.content}")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.incidencia_pendiente.refresh_from_db()
        self.assertEqual(self.incidencia_pendiente.estado, "RESUELTA")
        self.assertEqual(
            self.incidencia_pendiente.respuesta_admin, "INCIDENCIA RESUELTA POR DIRECTOR"
        )

    def test_resolver_incidencia_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("incidencias:incidencias-detail", args=[self.incidencia_pendiente.pk])
        form_data = {"estado": "RESUELTA", "respuesta_admin": "Resuelta por admin"}
        response = self.client.patch(url, data=form_data, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.incidencia_pendiente.refresh_from_db()
        self.assertEqual(self.incidencia_pendiente.estado, "RESUELTA")
        self.assertEqual(self.incidencia_pendiente.respuesta_admin, "RESUELTA POR ADMIN")

    def test_eliminar_incidencia_director(self):
        self.client.force_authenticate(user=self.director)
        url = reverse("incidencias:incidencias-detail", args=[self.incidencia_maestro.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertFalse(Incidencia.objects.filter(pk=self.incidencia_maestro.pk).exists())

    def test_crear_incidencia_secretario_denegado(self):
        """SECRETARIO ya no puede crear incidencias — solo ADMIN y DIRECTOR."""
        self.client.force_authenticate(user=self.secretario)
        url = reverse("incidencias:incidencias-list")
        form_data = {
            "titulo": "Intento secre",
            "escuela": self.escuela.pk,
            "profesor": self.maestro.pk,
            "descripcion": "No debería poder",
        }
        response = self.client.post(url, data=form_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
