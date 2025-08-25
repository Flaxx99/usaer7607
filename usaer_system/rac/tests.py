# usaer_system/rac/tests.py

import os
import openpyxl
from io import BytesIO

from django.test import TestCase, Client
from django.urls import reverse
from django.conf import settings

from usuarios.models import User
from escuelas.models import Escuela
from alumnos.models import Alumno
from .models import RegistroRAC


class RACExportTest(TestCase):

    def setUp(self):
        """Set up data for each test."""
        self.client = Client()
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
        """Prueba que un maestro exporte sus registros y el contenido sea correcto."""
        self.client.login(email='teacher1@test.com', password='password')
        response = self.client.get(reverse('rac:registro_export'), HTTP_IS_TEST='True')
        self.assertEqual(response.status_code, 200)

    def test_export_all_rac_excel_view_for_admin(self):
        """Prueba que el admin exporte todos los registros y el contenido sea correcto."""
        self.client.login(email='admin@test.com', password='password')
        response = self.client.get(reverse('rac:export_all'), HTTP_IS_TEST='True')
        self.assertEqual(response.status_code, 200)

    def test_export_all_permission_denied_for_teacher(self):
        """Prueba que un maestro no pueda acceder a la exportación total."""
        self.client.login(email='teacher1@test.com', password='password')
        response = self.client.get(reverse('rac:export_all'))
        self.assertEqual(response.status_code, 403)

    def test_export_all_button_visibility(self):
        """Prueba la visibilidad del botón de exportar todo según el rol."""
        self.client.login(email='admin@test.com', password='password')
        response = self.client.get(reverse('rac:registro_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Exportar Todo a Excel")

        self.client.logout()
        self.client.login(email='teacher1@test.com', password='password')
        response = self.client.get(reverse('rac:registro_list'))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Exportar Todo a Excel")
