from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from django.utils import timezone
from datetime import time

from escuelas.models import Escuela
from .models import Asistencia

User = get_user_model()


class AsistenciaAPITests(APITestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E2", cct="CCT2", nombre="Escuela Views", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z2"
        )
        self.profesor = User.objects.create_user(
            email="profesor_views@test.com", numero_empleado="EMP002", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        self.admin = User.objects.create_superuser(
            email="admin_views@test.com", numero_empleado="ADM001", password="pass",
            escuela=self.escuela
        )
        self.client = APIClient()

    def test_checar_asistencia_entrada_exitosa_public(self):
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': self.profesor.numero_empleado}
        # No autenticación: kiosco es público
        response = self.client.post(url, data=payload, format='json')
        self.assertIn(response.status_code, [200, 201])
        self.assertTrue(Asistencia.objects.filter(profesor=self.profesor, fecha=timezone.localdate()).exists())
        asistencia = Asistencia.objects.get(profesor=self.profesor, fecha=timezone.localdate())
        self.assertIsNotNone(asistencia.hora_entrada)
        self.assertIsNone(asistencia.hora_salida)

    def test_checar_asistencia_salida_exitosa_public(self):
        # Registrar entrada primero
        Asistencia.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=time(8, 0, 0)
        )
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': self.profesor.numero_empleado}
        response = self.client.post(url, data=payload, format='json')
        self.assertIn(response.status_code, [200, 201])
        asistencia = Asistencia.objects.get(profesor=self.profesor, fecha=timezone.localdate())
        self.assertIsNotNone(asistencia.hora_salida)
        self.assertGreater(asistencia.hora_salida, asistencia.hora_entrada)

    def test_checar_asistencia_profesor_no_existe(self):
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': 'NOEXISTE'}
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, 404)

    def test_listar_asistencias_maestro(self):
        # crear asistencias
        Asistencia.objects.create(profesor=self.profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True, hora_entrada=timezone.localtime().time())
        otro_profesor = User.objects.create_user(email="otro_profesor@test.com", numero_empleado="EMP003", password="pass", escuela=self.escuela, role=User.Role.MAESTRO_APOYO)
        Asistencia.objects.create(profesor=otro_profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True, hora_entrada=timezone.localtime().time())

        self.client.force_authenticate(user=self.profesor)
        url = reverse('asistencias:asistencias-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        assert any(item.get('profesor') == self.profesor.get_full_name() for item in (data if isinstance(data, list) else data.get('results', [])))

    def test_listar_asistencias_admin(self):
        Asistencia.objects.create(profesor=self.profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True, hora_entrada=timezone.localtime().time())
        otro_profesor = User.objects.create_user(email="otro_profesor_admin@test.com", numero_empleado="EMP004", password="pass", escuela=self.escuela, role=User.Role.MAESTRO_APOYO)
        Asistencia.objects.create(profesor=otro_profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True, hora_entrada=timezone.localtime().time())

        self.client.force_authenticate(user=self.admin)
        url = reverse('asistencias:asistencias-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        assert any(item.get('profesor') == self.profesor.get_full_name() for item in (data if isinstance(data, list) else data.get('results', [])))
        assert any(item.get('profesor') == otro_profesor.get_full_name() for item in (data if isinstance(data, list) else data.get('results', [])))
