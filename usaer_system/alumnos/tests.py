from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse

from .models import Alumno
from escuelas.models import Escuela

User = get_user_model()


class AlumnoAPITests(APITestCase):
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
        self.client = APIClient()

    def test_maestro_ve_sus_alumnos(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('alumnos:alumnos-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        assert any(item.get('nombres') == self.alumno.nombres for item in (data if isinstance(data, list) else data.get('results', [])))

    def test_maestro_no_ve_alumnos_de_otros(self):
        otro_maestro = User.objects.create_user(
            email="otro@example.com", numero_empleado="otro", password="pass"
        )
        Alumno.objects.create(
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
        self.client.force_authenticate(user=self.maestro)
        url = reverse('alumnos:alumnos-list')
        response = self.client.get(url)
        data = response.json()
        assert all(item.get('nombres') != 'Maria' for item in (data if isinstance(data, list) else data.get('results', [])))

    def test_admin_ve_todos_los_alumnos(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        assert any(item.get('nombres') == self.alumno.nombres for item in (data if isinstance(data, list) else data.get('results', [])))

    def test_crear_alumno_via_api(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-list')
        payload = {
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
        response = self.client.post(url, data=payload, format='json')
        self.assertIn(response.status_code, [201, 200])
        self.assertTrue(Alumno.objects.filter(curp="GARLPE123456HOMBZZ").exists())

    def test_eliminar_alumno_via_api(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-detail', args=[self.alumno.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [204, 200])
        self.assertFalse(Alumno.objects.filter(pk=self.alumno.pk).exists())
