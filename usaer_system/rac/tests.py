from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date

from escuelas.models import Escuela
from alumnos.models import Alumno
from .models import RegistroRAC

User = get_user_model()


class RegistroRACModelTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E7", cct="CCT7", nombre="Escuela RAC", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z7"
        )
        self.maestro = User.objects.create_user(
            email="maestro_rac@example.com", numero_empleado="EMP009", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
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


class RegistroRACViewsTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E8", cct="CCT8", nombre="Escuela RAC Views", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z8"
        )
        self.maestro = User.objects.create_user(
            email="maestro_rac_view@example.com", numero_empleado="EMP010", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
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
        self.client.login(email="maestro_rac_view@example.com", password="pass")
        response = self.client.get(reverse("rac:registro_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.alumno.nombres)

    def test_crear_registro_rac(self):
        self.client.login(email="maestro_rac_view@example.com", password="pass")
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
        response = self.client.post(reverse("rac:registro_create"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(RegistroRAC.objects.filter(alumno=alumno_nuevo).exists())

    def test_editar_registro_rac(self):
        self.client.login(email="maestro_rac_view@example.com", password="pass")
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
        response = self.client.post(reverse("rac:registro_edit", args=[self.registro.pk]), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.registro.refresh_from_db()
        self.assertEqual(self.registro.subclasificacion, "DMO")
        self.assertEqual(self.registro.observaciones, "Observaciones editadas")

    def test_exportar_rac_excel(self):
        self.client.login(email="admin_rac_view@example.com", password="pass")
        response = self.client.get(reverse("rac:registro_export"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertEqual(response['Content-Disposition'], 'attachment; filename="ESTADISTICA_RAC.xlsx"')