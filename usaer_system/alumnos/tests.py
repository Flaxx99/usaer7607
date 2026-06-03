"""Tests for Alumnos app — expanded coverage for RBAC, Promotions, and Filtering."""

from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta

from escuelas.models import Escuela
from ciclos_escolares.models import CicloEscolar
from .models import Alumno

User = get_user_model()


class AlumnoAPITests(APITestCase):
    def setUp(self):
        # Setup Base Data
        self.escuela = Escuela.objects.create(
            clave_estatal="ESC1", cct="CCTESC1", nombre="Escuela Alumnos", 
            nivel="Primaria", domicilio="x", colonia="y", zona="z"
        )
        self.ciclo = CicloEscolar.objects.create(
            nombre="Ciclo 2025-2026", fecha_inicio=date(2025, 8, 1), fecha_fin=date(2026, 7, 1)
        )
        
        self.admin = User.objects.create_superuser(
            email="admin_alumnos@example.com", numero_empleado="admin_al", password="pass"
        )
        self.secretario = User.objects.create_user(
            email="sec_alumnos@example.com", numero_empleado="sec_al", 
            password="pass", role=User.Role.SECRETARIO, escuela=self.escuela
        )
        self.maestro = User.objects.create_user(
            email="maestro_alumnos@example.com", numero_empleado="maestro_al", 
            password="pass", role=User.Role.MAESTRO_APOYO, escuela=self.escuela
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

    # -------------------------------------------------------------------------
    # 1. RBAC & BASIC CRUD
    # -------------------------------------------------------------------------

    def test_maestro_ve_sus_alumnos(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('alumnos:alumnos-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get('results', [])
        self.assertTrue(any(item.get('nombres') == self.alumno.nombres for item in results))

    def test_maestro_no_ve_alumnos_de_otros(self):
        otro_maestro = User.objects.create_user(
            email="otro@example.com", numero_empleado="otro", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
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
        results = data if isinstance(data, list) else data.get('results', [])
        self.assertFalse(any(item.get('nombres') == 'Maria' for item in results))

    def test_maestro_can_create_own_student(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('alumnos:alumnos-list')
        payload = {
            "apellido_paterno": "Garcia",
            "nombres": "Pedro",
            "curp": "GARLPE123456HOMBZZ",
            "sexo": "H",
            "edad": 7,
            "grado": "2",
            "clasificacion": "NINGUNO",
            "escuela": self.escuela.pk,
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        
        # Verify it was auto-assigned to the maestro
        alumno = Alumno.objects.get(curp="GARLPE123456HOMBZZ")
        self.assertEqual(alumno.profesor, self.maestro)

    def test_maestro_cannot_delete_others_student(self):
        otro_maestro = User.objects.create_user(
            email="otro@example.com", numero_empleado="otro", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        alumno_otro = Alumno.objects.create(
            profesor=otro_maestro,
            escuela=self.escuela,
            apellido_paterno="Lopez",
            nombres="Maria",
            curp="LOPMAR123456MUJEYY",
            sexo="M",
            grado="4",
            clasificacion="NINGUNO",
        )
        
        self.client.force_authenticate(user=self.maestro)
        url_detail = reverse('alumnos:alumnos-detail', args=[alumno_otro.pk])
        response = self.client.delete(url_detail)
        
        # Since get_queryset filters by professor, get_object() will return 404 Not Found
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_manage_alumnos(self):
        self.client.force_authenticate(user=self.admin)
        url_list = reverse('alumnos:alumnos-list')
        
        # Create
        payload = {
            "profesor": self.maestro.pk,
            "escuela": self.escuela.pk,
            "apellido_paterno": "Garcia",
            "nombres": "Pedro",
            "curp": "GARLPE123456HOMBZZ",
            "sexo": "H",
            "edad": 7,
            "grado": "2",
            "clasificacion": "NINGUNO",
        }
        response = self.client.post(url_list, data=payload, format='json')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        
        # Delete
        url_detail = reverse('alumnos:alumnos-detail', args=[self.alumno.pk])
        response = self.client.delete(url_detail)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])

    # -------------------------------------------------------------------------
    # 2. SEARCH & FILTERING
    # -------------------------------------------------------------------------

    def test_search_by_curp(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-list')
        response = self.client.get(url, {'search': self.alumno.curp})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get('results', [])
        self.assertTrue(any(item.get('curp') == self.alumno.curp for item in results))

    def test_filter_by_escuela(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-list')
        response = self.client.get(url, {'escuela': self.escuela.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get('results', [])
        self.assertTrue(any(item.get('escuela') == self.escuela.pk for item in results))

    # -------------------------------------------------------------------------
    # 3. PROMOTION ACTION (promover)
    # -------------------------------------------------------------------------

    def test_promover_simulation(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-promover')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['simulation'])
        self.assertIn('a_promover', response.data)

    def test_promover_execution_success(self):
        # Create a student in grade 3
        alumno = Alumno.objects.create(
            escuela=self.escuela, profesor=self.maestro,
            apellido_paterno="Perez", nombres="Juan", curp="PROM123",
            sexo="H", grado="3", clasificacion="NINGUNO", activo=True
        )
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-promover')
        response = self.client.post(url, data={'confirmed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        alumno.refresh_from_db()
        self.assertEqual(alumno.grado, "4")
        self.assertEqual(alumno.last_promotion_cycle, self.ciclo)

    def test_promover_graduation(self):
        # Create a student in grade 6
        alumno = Alumno.objects.create(
            escuela=self.escuela, profesor=self.maestro,
            apellido_paterno="Perez", nombres="Juan", curp="GRAD123",
            sexo="H", grado="6", clasificacion="NINGUNO", activo=True
        )
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-promover')
        response = self.client.post(url, data={'confirmed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        alumno.refresh_from_db()
        self.assertFalse(alumno.activo)
        self.assertEqual(alumno.grupo, '')

    def test_promover_idempotency(self):
        # Promote once
        alumno = Alumno.objects.create(
            escuela=self.escuela, profesor=self.maestro,
            apellido_paterno="Perez", nombres="Juan", curp="IDEM123",
            sexo="H", grado="3", clasificacion="NINGUNO", activo=True,
            last_promotion_cycle=self.ciclo
        )
        
        self.client.force_authenticate(user=self.admin)
        url = reverse('alumnos:alumnos-promover')
        response = self.client.post(url, data={'confirmed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        alumno.refresh_from_db()
        # Should still be grade 3 because they were already promoted in this cycle
        self.assertEqual(alumno.grado, "3")

    def test_promover_denied_for_maestro(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('alumnos:alumnos-promover')
        response = self.client.post(url, data={'confirmed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

# -------------------------------------------------------------------------
# 4. MODEL LOGIC
# -------------------------------------------------------------------------

class AlumnoModelTests(APITestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="ESC1", cct="CCTESC1", nombre="Escuela Alumnos", nivel="Primaria"
        )

    def test_alumno_full_name(self):
        alumno = Alumno.objects.create(
            escuela=self.escuela,
            apellido_paterno="Perez",
            apellido_materno="Gomez",
            nombres="Juan",
            curp="PERGJU123456HOMBXX",
            sexo="H",
            grado="3",
            clasificacion="NINGUNO",
        )
        self.assertEqual(alumno.get_full_name(), "JUAN PEREZ GOMEZ")

    def test_automatic_age_calculation(self):
        birth_date = date.today() - timedelta(days=8*365)
        alumno = Alumno.objects.create(
            escuela=self.escuela,
            apellido_paterno="Perez",
            nombres="Juan",
            curp="PERGJU123456HOMBXX",
            sexo="H",
            grado="3",
            clasificacion="NINGUNO",
            fecha_nacimiento=birth_date
        )
        self.assertTrue(7 <= alumno.edad <= 9)

    def test_unique_curp(self):
        Alumno.objects.create(
            escuela=self.escuela,
            apellido_paterno="Perez",
            nombres="Juan",
            curp="UNIQUE123",
            sexo="H",
            grado="3",
            clasificacion="NINGUNO",
        )
        with self.assertRaises(Exception):
            Alumno.objects.create(
                escuela=self.escuela,
                apellido_paterno="Lopez",
                nombres="Maria",
                curp="UNIQUE123",
                sexo="M",
                grado="3",
                clasificacion="NINGUNO",
            )
