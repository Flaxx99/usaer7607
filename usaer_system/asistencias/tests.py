from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from django.utils import timezone
from datetime import time, timedelta
from rest_framework import status

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

    # -------------------------------------------------------------------------
    # 1. TESTS DEL CHECADOR (PÚBLICO)
    # -------------------------------------------------------------------------

    def test_checar_entrada_exitosa(self):
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': self.profesor.numero_empleado}
        response = self.client.post(url, data=payload, format='json')
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(Asistencia.objects.filter(profesor=self.profesor, fecha=timezone.localdate()).exists())
        asistencia = Asistencia.objects.get(profesor=self.profesor, fecha=timezone.localdate())
        self.assertIsNotNone(asistencia.hora_entrada)
        self.assertIsNone(asistencia.hora_salida)

    def test_checar_salida_exitosa(self):
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
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        asistencia = Asistencia.objects.get(profesor=self.profesor, fecha=timezone.localdate())
        self.assertIsNotNone(asistencia.hora_salida)
        self.assertGreater(asistencia.hora_salida, asistencia.hora_entrada)

    def test_checar_doble_salida_error(self):
        # Registrar entrada y salida
        Asistencia.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=time(8, 0, 0),
            hora_salida=time(14, 0, 0)
        )
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': self.profesor.numero_empleado}
        response = self.client.post(url, data=payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['tipo'], "ERROR")

    def test_checar_profesor_no_existe(self):
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': 'NOEXISTE'}
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_checar_usuario_inactivo(self):
        self.profesor.is_active = False
        self.profesor.save()
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': self.profesor.numero_empleado}
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_checar_sin_escuela_asignada(self):
        self.profesor.escuela = None
        self.profesor.save()
        url = reverse('asistencias:checar')
        payload = {'numero_empleado': self.profesor.numero_empleado}
        response = self.client.post(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------------------
    # 2. TESTS DEL HISTORIAL (PRIVADO)
    # -------------------------------------------------------------------------

    def test_listar_asistencias_acceso_denegado(self):
        # Unauthenticated
        url = reverse('asistencias:asistencias-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_listar_asistencias_maestro_solo_lo_suyo(self):
        # Crear asistencias para dos profesores
        otro_profesor = User.objects.create_user(
            email="otro@test.com", numero_empleado="EMP003", password="pass", 
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        Asistencia.objects.create(profesor=self.profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True)
        Asistencia.objects.create(profesor=otro_profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True)
        
        self.client.force_authenticate(user=self.profesor)
        url = reverse('asistencias:asistencias-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', [])
        
        # Debe ver el suyo
        self.assertTrue(any(item.get('profesor') == self.profesor.pk for item in items))
        # NO debe ver el del otro
        self.assertFalse(any(item.get('profesor') == otro_profesor.pk for item in items))

    def test_listar_asistencias_admin_ve_todo(self):
        otro_profesor = User.objects.create_user(
            email="otro_admin@test.com", numero_empleado="EMP004", password="pass", 
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        Asistencia.objects.create(profesor=self.profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True)
        Asistencia.objects.create(profesor=otro_profesor, escuela=self.escuela, fecha=timezone.localdate(), presente=True)
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('asistencias:asistencias-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', [])
        
        self.assertTrue(any(item.get('profesor') == self.profesor.pk for item in items))
        self.assertTrue(any(item.get('profesor') == otro_profesor.pk for item in items))

    def test_filtrar_asistencias_por_fecha(self):
        hoy = timezone.localdate()
        ayer = hoy - timedelta(days=1)
        
        Asistencia.objects.create(profesor=self.profesor, escuela=self.escuela, fecha=hoy, presente=True)
        Asistencia.objects.create(profesor=self.profesor, escuela=self.escuela, fecha=ayer, presente=True)
        
        self.client.force_authenticate(user=self.profesor)
        url = reverse('asistencias:asistencias-list')
        
        # Filtrar por ayer
        response = self.client.get(url, {'fecha': ayer.isoformat()})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', [])
        
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]['fecha'], ayer.isoformat())

    def test_buscar_asistencias_por_nombre(self):
        # Crear profesor con nombre específico
        profesor_especifico = User.objects.create_user(
            email="especifico@test.com", numero_empleado="EMP_SPEC", password="pass",
            nombre="Zebulon", apellido_paterno="Zarathustra", escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        Asistencia.objects.create(profesor=profesor_especifico, escuela=self.escuela, fecha=timezone.localdate(), presente=True)
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('asistencias:asistencias-list')
        
        # Buscar por "Zebulon"
        response = self.client.get(url, {'search': 'Zebulon'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        items = data if isinstance(data, list) else data.get('results', [])
        
        self.assertTrue(any("Zebulon" in item.get('profesor_nombre', '') for item in items))
