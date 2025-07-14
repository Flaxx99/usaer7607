from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone

from escuelas.models import Escuela
from .models import Incidencia

User = get_user_model()


class IncidenciaModelTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E3", cct="CCT3", nombre="Escuela Incidencia", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z3"
        )
        self.profesor = User.objects.create_user(
            email="profesor_inc@example.com", numero_empleado="EMP003", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        self.incidencia = Incidencia.objects.create(
            escuela=self.escuela,
            profesor=self.profesor,
            titulo="Problema con material",
            descripcion="El material didáctico está dañado."
        )

    def test_incidencia_creation(self):
        self.assertIsInstance(self.incidencia, Incidencia)
        self.assertEqual(self.incidencia.titulo, "Problema con material")
        self.assertEqual(self.incidencia.estado, "PENDIENTE")

    def test_incidencia_str(self):
        self.assertEqual(str(self.incidencia), f"Incidencia #{self.incidencia.id}: Problema con material (Pendiente)")

    def test_save_sets_fecha_resolucion(self):
        self.incidencia.estado = "RESUELTA"
        self.incidencia.save()
        self.assertIsNotNone(self.incidencia.fecha_resolucion)


class IncidenciaViewsTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E4", cct="CCT4", nombre="Escuela Incidencia Views", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z4"
        )
        self.admin = User.objects.create_superuser(
            email="admin_inc@example.com", numero_empleado="ADM003", password="pass",
            escuela=self.escuela
        )
        self.director = User.objects.create_user(
            email="director_inc@example.com", numero_empleado="DIR001", password="pass",
            escuela=self.escuela, role=User.Role.DIRECTOR
        )
        self.secretario = User.objects.create_user(
            email="secretario_inc@example.com", numero_empleado="SEC002", password="pass",
            escuela=self.escuela, role=User.Role.SECRETARIO
        )
        self.maestro = User.objects.create_user(
            email="maestro_inc@example.com", numero_empleado="EMP004", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        self.incidencia_maestro = Incidencia.objects.create(
            escuela=self.escuela,
            profesor=self.maestro,
            titulo="Incidencia del Maestro",
            descripcion="Descripción del maestro"
        )
        self.incidencia_pendiente = Incidencia.objects.create(
            escuela=self.escuela,
            profesor=self.maestro,
            titulo="Incidencia Pendiente",
            descripcion="Descripción pendiente"
        )

    def test_crear_incidencia_admin(self):
        self.client.login(email="admin_inc@example.com", password="pass")
        form_data = {
            "titulo": "Nueva Incidencia Admin",
            "escuela": self.escuela.pk,
            "profesor": self.maestro.pk,
            "descripcion": "Descripción de la nueva incidencia",
        }
        response = self.client.post(reverse("incidencias:crear_incidencia"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Incidencia.objects.filter(titulo="Nueva Incidencia Admin").exists())

    def test_listar_incidencias_maestro(self):
        self.client.login(email="maestro_inc@example.com", password="pass")
        response = self.client.get(reverse("incidencias:listar_incidencias"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.incidencia_maestro.titulo)
        self.assertNotContains(response, "Incidencia Pendiente") # Solo ve las suyas

    def test_revisar_incidencias_admin(self):
        self.client.login(email="admin_inc@example.com", password="pass")
        response = self.client.get(reverse("incidencias:revisar_incidencias"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.incidencia_maestro.titulo)
        self.assertContains(response, self.incidencia_pendiente.titulo)

    def test_detalle_incidencia(self):
        self.client.login(email="maestro_inc@example.com", password="pass")
        response = self.client.get(reverse("incidencias:detalle_incidencia", args=[self.incidencia_maestro.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.incidencia_maestro.titulo)

    def test_editar_incidencia_director(self):
        self.client.login(email="director_inc@example.com", password="pass")
        form_data = {
            "titulo": self.incidencia_pendiente.titulo,
            "escuela": self.incidencia_pendiente.escuela.pk,
            "profesor": self.incidencia_pendiente.profesor.pk,
            "descripcion": self.incidencia_pendiente.descripcion,
            "estado": "RESUELTA",
            "respuesta_admin": "Incidencia resuelta por director",
        }
        response = self.client.post(reverse("incidencias:editar_incidencia", args=[self.incidencia_pendiente.pk]), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.incidencia_pendiente.refresh_from_db()
        self.assertEqual(self.incidencia_pendiente.estado, "RESUELTA")
        self.assertEqual(self.incidencia_pendiente.respuesta_admin, "INCIDENCIA RESUELTA POR DIRECTOR")

    def test_resolver_incidencia_admin(self):
        self.client.login(email="admin_inc@example.com", password="pass")
        response = self.client.post(reverse("incidencias:resolver_incidencia", args=[self.incidencia_pendiente.pk]), data={'respuesta_admin': 'Resuelta por admin'})
        self.assertEqual(response.status_code, 302)
        self.incidencia_pendiente.refresh_from_db()
        self.assertEqual(self.incidencia_pendiente.estado, "RESUELTA")
        self.assertEqual(self.incidencia_pendiente.respuesta_admin, "RESUELTA POR ADMIN")

    def test_eliminar_incidencia_director(self):
        self.client.login(email="director_inc@example.com", password="pass")
        response = self.client.post(reverse("incidencias:eliminar_incidencia", args=[self.incidencia_maestro.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Incidencia.objects.filter(pk=self.incidencia_maestro.pk).exists())