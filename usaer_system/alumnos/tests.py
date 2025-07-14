from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import Alumno
from escuelas.models import Escuela

User = get_user_model()


class AlumnoViewsTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin_alumnos@example.com", numero_empleado="admin_al", password="pass"
        )
        self.maestro = User.objects.create_user(
            email="maestro_alumnos@example.com", numero_empleado="maestro_al", password="pass", role=User.Role.MAESTRO_APOYO
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="ESC1", cct="CCTESC1", nombre="Escuela Alumnos", nivel="Primaria", domicilio="x", colonia="y", zona="z"
        )
        self.alumno = Alumno.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            apellido_paterno="Perez",
            apellido_materno="Gomez",
            nombres="Juan",
            curp="PERGJU123456HOMBXX",
            sexo="H",
            edad=8,
            grado="3",
            clasificacion="NINGUNO",
        )

    def test_maestro_ve_sus_alumnos(self):
        self.client.login(email="maestro_alumnos@example.com", password="pass")
        response = self.client.get(reverse("alumnos:listar_alumnos"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.alumno.nombres)

    def test_maestro_no_ve_alumnos_de_otros(self):
        otro_maestro = User.objects.create_user(
            email="otro@example.com", numero_empleado="otro", password="pass"
        )
        otro_alumno = Alumno.objects.create(
            profesor=otro_maestro,
            escuela=self.escuela,
            apellido_paterno="Lopez",
            nombres="Maria",
            curp="LOPMAR123456MUJEYY",
            sexo="M",
            edad=9,
            grado="4",
            clasificacion="NINGUNO",
        )
        self.client.login(email="maestro_alumnos@example.com", password="pass")
        response = self.client.get(reverse("alumnos:listar_alumnos"))
        self.assertNotContains(response, otro_alumno.nombres)

    def test_admin_ve_todos_los_alumnos(self):
        self.client.login(email="admin_alumnos@example.com", password="pass")
        response = self.client.get(reverse("alumnos:listar_alumnos"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.alumno.nombres)

    def test_crear_alumno(self):
        self.client.login(email="admin_alumnos@example.com", password="pass")
        form_data = {
            "profesor": self.maestro.pk,
            "escuela": self.escuela.pk,
            "apellido_paterno": "Garcia",
            "apellido_materno": "Luna",
            "nombres": "Pedro",
            "curp": "GARLPE123456HOMBZZ",
            "sexo": "H",
            "edad": 7,
            "grado": "2",
            "grupo": "A",
            "clasificacion": "NINGUNO",
        }
        response = self.client.post(reverse("alumnos:crear_alumno"), data=form_data)
        # La vista de creación es compleja, aquí solo verificamos que no falle
        # y que el alumno se cree.
        self.assertTrue(Alumno.objects.filter(curp="GARLPE123456HOMBZZ").exists())

    def test_eliminar_alumno(self):
        self.client.login(email="admin_alumnos@example.com", password="pass")
        url = reverse("alumnos:eliminar_alumno", args=[self.alumno.pk])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Alumno.objects.filter(pk=self.alumno.pk).exists())