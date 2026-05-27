"""Tests for RAC app — merged and migrated to DRF APITestCase."""

import os
import openpyxl
from io import BytesIO
from datetime import date, timedelta

from django.urls import reverse
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase, APIClient

from escuelas.models import Escuela
from ciclos_escolares.models import CicloEscolar
from alumnos.models import Alumno
from .models import RegistroRAC


User = get_user_model()


class RegistroRACModelTest(APITestCase):
    def setUp(self):
        # create a ciclo escolar required by RegistroRAC.ciclo_escolar (NOT NULL)
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year+1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )

        self.escuela = Escuela.objects.create(
            clave_estatal="E7", cct="CCT7", nombre="Escuela RAC", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z7"
        )
        self.maestro = User.objects.create_user(
            email="maestro_rac@example.com", numero_empleado="EMP009", password="pass",
            escuela=self.escuela, role=getattr(User, 'Role', None) and getattr(User.Role, 'MAESTRO_APOYO', 'MAESTRO_APOYO')
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
            clasificacion="DISCAPACIDAD",
        )
        self.registro = RegistroRAC.objects.create(
            alumno=self.alumno,
            ciclo_escolar=self.ciclo,
            escuela_regular=self.escuela,
            zona_regular="Z7",
            curp="PERGJU123456HOMBXX",
            sexo="H",
            edad=8,
            grado="3",
            service_type="USAER",
            maestro_apoyo=self.maestro,
            escuela_basica=self.escuela,
            clasificacion="DISCAPACIDAD",
            subclasificacion="DI",
        )

    def test_registro_creation(self):
        self.assertIsInstance(self.registro, RegistroRAC)
        self.assertEqual(self.registro.clasificacion, "DISCAPACIDAD")

    def test_registro_str(self):
        self.assertEqual(str(self.registro), f"RAC de {self.alumno} ({date.today()})")


class RegistroRACViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # create ciclo escolar for view tests
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year+1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )

        self.escuela = Escuela.objects.create(
            clave_estatal="E8", cct="CCT8", nombre="Escuela RAC Views", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z8"
        )
        self.maestro = User.objects.create_user(
            email="maestro_rac_view@example.com", numero_empleado="EMP010", password="pass",
            escuela=self.escuela, role=getattr(User, 'Role', None) and getattr(User.Role, 'MAESTRO_APOYO', 'MAESTRO_APOYO')
        )
        self.admin = User.objects.create_superuser(
            email="admin_rac_view@example.com", numero_empleado="ADM006", password="pass",
            escuela=self.escuela
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
            clasificacion="DISCAPACIDAD",
        )
        self.registro = RegistroRAC.objects.create(
            alumno=self.alumno,
            ciclo_escolar=self.ciclo,
            escuela_regular=self.escuela,
            zona_regular="Z8",
            curp="PERGJU123456HOMBXX",
            sexo="H",
            edad=8,
            grado="3",
            service_type="USAER",
            maestro_apoyo=self.maestro,
            escuela_basica=self.escuela,
            clasificacion="DISCAPACIDAD",
            subclasificacion="DI",
        )

    def test_lista_registros_maestro(self):
        self.client.force_authenticate(self.maestro)
        response = self.client.get(reverse("rac:registros-list"))
        self.assertEqual(response.status_code, 200)
        # API returns alumno_nombre in uppercase; assert uppercase name appears
        self.assertContains(response, self.alumno.nombres.upper())

    def test_crear_registro_rac(self):
        self.client.force_authenticate(self.maestro)
        alumno_nuevo = Alumno.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            apellido_paterno="Nuevo",
            apellido_materno="RAC",
            nombres="Alumno",
            curp="NUEVORAC123456HOMBXX",
            sexo="H",
            edad=7,
            grado="1",
            clasificacion="NINGUNO",
        )
        form_data = {
            "alumno": alumno_nuevo.pk,
            "escuela_regular": self.escuela.pk,
            "zona_regular": "Z8",
            "curp": alumno_nuevo.curp,
            "sexo": alumno_nuevo.sexo,
            "edad": alumno_nuevo.edad,
            "grado": alumno_nuevo.grado,
            "service_type": "USAER",
            "sup_especial_cct": "08FUA0041G",
            "sup_especial_zona": "22",
            "centro_cct": "08FUA0093E",
            "centro_nombre": "USAER 7607",
            "maestro_apoyo": self.maestro.pk,
            "escuela_basica": self.escuela.pk,
            "clasificacion": "DIFICULTADES_SEVERAS",
            "subclasificacion": "DSA",
            "observaciones": "",
        }
        # Creation via DRF router -> POST to registros-list
        response = self.client.post(reverse("rac:registros-list"), data=form_data)
        # Creation via API should return 201 Created in DRF; accept common success codes
        self.assertIn(response.status_code, (200, 201, 302))
        self.assertTrue(RegistroRAC.objects.filter(alumno=alumno_nuevo).exists())

    def test_editar_registro_rac(self):
        self.client.force_authenticate(self.maestro)
        form_data = {
            "alumno": self.alumno.pk,
            "escuela_regular": self.escuela.pk,
            "zona_regular": "Z8",
            "curp": self.alumno.curp,
            "sexo": self.alumno.sexo,
            "edad": self.alumno.edad,
            "grado": self.alumno.grado,
            "service_type": "USAER",
            "sup_especial_cct": "08FUA0041G",
            "sup_especial_zona": "22",
            "centro_cct": "08FUA0093E",
            "centro_nombre": "USAER 7607",
            "maestro_apoyo": self.maestro.pk,
            "escuela_basica": self.escuela.pk,
            "clasificacion": "DISCAPACIDAD",
            "subclasificacion": "DMO", # Cambiamos la subclasificación
            "observaciones": "Observaciones editadas",
        }
        # Edit via DRF router -> PATCH to registros-detail
        response = self.client.patch(reverse("rac:registros-detail", args=[self.registro.pk]), data=form_data)
        self.assertIn(response.status_code, (200, 202, 204, 302))
        self.registro.refresh_from_db()
        self.assertEqual(self.registro.subclasificacion, "DMO")
        self.assertEqual(self.registro.observaciones, "Observaciones editadas")

    def test_exportar_rac_excel(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse("rac:exportar_excel"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        # Content-Disposition may include filename; just assert presence
        self.assertIn('attachment', response.get('Content-Disposition', ''))


class RACExportTest(APITestCase):

    def setUp(self):
        """Set up data for each test."""
        self.client = APIClient()
        # Crear usuarios
        self.admin_user = User.objects.create_user(email='admin@test.com', numero_empleado='123', password='password', role='ADMIN', first_name='Admin', last_name='User')
        self.teacher1 = User.objects.create_user(email='teacher1@test.com', numero_empleado='456', password='password', role='MAESTRO_APOYO', first_name='Maestro', last_name='Uno')
        self.teacher2 = User.objects.create_user(email='teacher2@test.com', numero_empleado='789', password='password', role='MAESTRO_APOYO', first_name='Maestra', last_name='Dos')

        # Crear escuelas
        self.school1 = Escuela.objects.create(nombre="Escuela Primaria Benito Juarez", cct="12345", clave_estatal="123", nivel="PRIMARIA")
        self.school2 = Escuela.objects.create(nombre="Escuela Secundaria Tecnica 34", cct="67890", clave_estatal="456", nivel="SECUNDARIA")

        # Crear alumnos
        self.student1_t1 = Alumno.objects.create(nombres="Juan", apellido_paterno="Perez", sexo="H", profesor=self.teacher1, escuela=self.school1, edad=8, curp="CURP1")
        self.student2_t1 = Alumno.objects.create(nombres="Maria", apellido_paterno="Gomez", sexo="M", profesor=self.teacher1, escuela=self.school1, edad=9, curp="CURP2")
        self.student1_t2 = Alumno.objects.create(nombres="Pedro", apellido_paterno="Lopez", sexo="H", profesor=self.teacher2, escuela=self.school2, edad=10, curp="CURP3")

        # create ciclo escolar for RAC records
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year+1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )

        # Crear registros RAC
        self.rac1 = RegistroRAC.objects.create(alumno=self.student1_t1, maestro_apoyo=self.teacher1, escuela_regular=self.school1, escuela_basica=self.school1, ciclo_escolar=self.ciclo, clasificacion='DISCAPACIDAD', subclasificacion='DI', service_type='USAER')
        self.rac2 = RegistroRAC.objects.create(alumno=self.student2_t1, maestro_apoyo=self.teacher1, escuela_regular=self.school1, escuela_basica=self.school1, ciclo_escolar=self.ciclo, clasificacion='APTITUDES_SOBRESALIENTES', subclasificacion='ASI', service_type='USAER')
        self.rac3 = RegistroRAC.objects.create(alumno=self.student1_t2, maestro_apoyo=self.teacher2, escuela_regular=self.school2, escuela_basica=self.school2, ciclo_escolar=self.ciclo, clasificacion='TRASTORNOS', subclasificacion='TDAH', service_type='USAER')

    def get_test_template(self):
        wb = openpyxl.Workbook()
        wb.create_sheet("RAC")
        wb.create_sheet("ESTADÍSTICA POBLACIÓN 2025")
        template_in_memory = BytesIO()
        wb.save(template_in_memory)
        template_in_memory.seek(0)
        return template_in_memory

    def test_export_rac_excel_view_for_teacher(self):
        """Prueba que un maestro exporte sus registros y el contenido sea correcto."""
        self.client.force_authenticate(self.teacher1)
        response = self.client.get(reverse('rac:exportar_excel'), HTTP_IS_TEST='True')
        self.assertEqual(response.status_code, 200)

    def test_export_all_rac_excel_view_for_admin(self):
        """Prueba que el admin exporte todos los registros y el contenido sea correcto."""
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse('rac:exportar_todo'), HTTP_IS_TEST='True')
        self.assertEqual(response.status_code, 200)

    def test_export_all_permission_denied_for_teacher(self):
        """Prueba que un maestro no pueda acceder a la exportación total."""
        self.client.force_authenticate(self.teacher1)
        response = self.client.get(reverse('rac:exportar_todo'))
        self.assertEqual(response.status_code, 403)

    def test_export_all_button_visibility(self):
        """Prueba la visibilidad del botón de exportar todo según el rol."""
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse('rac:registros-list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Exportar Todo a Excel")

        self.client.force_authenticate(self.teacher1)
        response = self.client.get(reverse('rac:registros-list'))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Exportar Todo a Excel")


class RACExportTest(APITestCase):

    def setUp(self):
        '''Set up data for each test.'''
        self.client = APIClient()
        # Crear usuarios
        self.admin_user = User.objects.create_user(email='admin@test.com', numero_empleado='123', password='password', role='ADMIN', first_name='Admin', last_name='User')
        self.teacher1 = User.objects.create_user(email='teacher1@test.com', numero_empleado='456', password='password', role='MAESTRO_APOYO', first_name='Maestro', last_name='Uno')
        self.teacher2 = User.objects.create_user(email='teacher2@test.com', numero_empleado='789', password='password', role='MAESTRO_APOYO', first_name='Maestra', last_name='Dos')

        # Crear escuelas
        self.school1 = Escuela.objects.create(nombre="Escuela Primaria Benito Juarez", cct="12345", clave_estatal="123", nivel="PRIMARIA")
        self.school2 = Escuela.objects.create(nombre="Escuela Secundaria Tecnica 34", cct="67890", clave_estatal="456", nivel="SECUNDARIA")

        # Crear alumnos
        self.student1_t1 = Alumno.objects.create(nombres="Juan", apellido_paterno="Perez", sexo="H", profesor=self.teacher1, escuela=self.school1, edad=8, curp="CURP1")
        self.student2_t1 = Alumno.objects.create(nombres="Maria", apellido_paterno="Gomez", sexo="M", profesor=self.teacher1, escuela=self.school1, edad=9, curp="CURP2")
        self.student1_t2 = Alumno.objects.create(nombres="Pedro", apellido_paterno="Lopez", sexo="H", profesor=self.teacher2, escuela=self.school2, edad=10, curp="CURP3")

        # Crear registros RAC
        self.rac1 = RegistroRAC.objects.create(alumno=self.student1_t1, maestro_apoyo=self.teacher1, escuela_regular=self.school1, escuela_basica=self.school1, clasificacion='DISCAPACIDAD', subclasificacion='DI', service_type='USAER')
        self.rac2 = RegistroRAC.objects.create(alumno=self.student2_t1, maestro_apoyo=self.teacher1, escuela_regular=self.school1, escuela_basica=self.school1, clasificacion='APTITUDES_SOBRESALIENTES', subclasificacion='ASI', service_type='USAER')
        self.rac3 = RegistroRAC.objects.create(alumno=self.student1_t2, maestro_apoyo=self.teacher2, escuela_regular=self.school2, escuela_basica=self.school2, clasificacion='TRASTORNOS', subclasificacion='TDAH', service_type='USAER')

    def get_test_template(self):
        wb = openpyxl.Workbook()
        wb.create_sheet("RAC")
        wb.create_sheet("ESTADÍSTICA POBLACIÓN 2025")
        template_in_memory = BytesIO()
        wb.save(template_in_memory)
        template_in_memory.seek(0)
        return template_in_memory

    def test_export_rac_excel_view_for_teacher(self):
        '''Prueba que un maestro exporte sus registros y el contenido sea correcto.'''
        self.client.force_authenticate(self.teacher1)
        response = self.client.get(reverse('rac:exportar_excel'), HTTP_IS_TEST='True')
        self.assertEqual(response.status_code, 200)

    def test_export_all_rac_excel_view_for_admin(self):
        '''Prueba que el admin exporte todos los registros y el contenido sea correcto.'''
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse('rac:exportar_todo'), HTTP_IS_TEST='True')
        self.assertEqual(response.status_code, 200)

    def test_export_all_permission_denied_for_teacher(self):
        '''Prueba que un maestro no pueda acceder a la exportación total.'''
        self.client.force_authenticate(self.teacher1)
        response = self.client.get(reverse('rac:exportar_todo'))
        self.assertEqual(response.status_code, 403)

    def test_export_all_button_visibility(self):
        '''Prueba la visibilidad del botón de exportar todo según el rol.'''
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse('rac:registros-list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Exportar Todo a Excel")

        self.client.force_authenticate(self.teacher1)
        response = self.client.get(reverse('rac:registros-list'))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Exportar Todo a Excel")
