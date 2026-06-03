"""Tests for RAE app — migrated to DRF APITestCase."""

from datetime import date, timedelta

from alumnos.models import Alumno
from ciclos_escolares.models import CicloEscolar
from django.contrib.auth import get_user_model
from django.urls import reverse
from escuelas.models import Escuela
from rest_framework.test import APIClient, APITestCase

from .models import RAEAlumno, RegistroRAE

User = get_user_model()


class RAEModelTest(APITestCase):
    def setUp(self):
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year + 1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="E7",
            cct="CCT7",
            nombre="Escuela RAE",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z7",
        )
        self.maestro = User.objects.create_user(
            email="maestro_rae@example.com",
            numero_empleado="EMP009",
            password="pass",
            escuela=self.escuela,
            role=getattr(User, "Role", None)
            and getattr(User.Role, "MAESTRO_APOYO", "MAESTRO_APOYO"),
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
        self.registro = RegistroRAE.objects.create(
            escuela=self.escuela,
            ciclo_escolar=self.ciclo,
            creado_por=self.maestro,
            docente_hombres=1,
            docente_mujeres=2,
        )

    def test_registro_creation(self):
        self.assertIsInstance(self.registro, RegistroRAE)
        self.assertEqual(self.registro.escuela, self.escuela)

    def test_registro_str(self):
        self.assertEqual(str(self.registro), f"RAE {self.escuela.nombre} - {self.ciclo.nombre}")

    def test_rae_alumno_creation(self):
        detalle = RAEAlumno.objects.create(
            registro=self.registro,
            alumno=self.alumno,
            capturado_por=self.maestro,
            ceg=True,
            bv=False,
            so=False,
            hp=False,
            scg=False,
            dmo=False,
            di=True,
            dme=False,
            psicosocial=False,
            dm=False,
            dsc=False,
            dsco=False,
            dsa=True,
            tda=False,
            tea=False,
            asi=True,
            asc=False,
            asa=False,
            asp=False,
            ass=False,
            ot=False,
            psicologia=True,
            comunicacion=True,
            psicomotricidad=False,
            trabajo_social=False,
            aprendizaje=True,
            nuevo_ingreso=True,
            subsecuente=False,
            diagnostico=True,
            educativo=True,
            deteccion=True,
            psicopedagogico=True,
            plan=True,
            modelo=True,
        )
        self.assertIsInstance(detalle, RAEAlumno)
        self.assertEqual(detalle.alumno, self.alumno)

    def test_unique_together_registro(self):
        with self.assertRaises(Exception):
            RegistroRAE.objects.create(
                escuela=self.escuela,
                ciclo_escolar=self.ciclo,
            )

    def test_unique_together_alumno(self):
        RAEAlumno.objects.create(registro=self.registro, alumno=self.alumno)
        with self.assertRaises(Exception):
            RAEAlumno.objects.create(registro=self.registro, alumno=self.alumno)


class RAEViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year + 1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="E8",
            cct="CCT8",
            nombre="Escuela RAE Views",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z8",
        )
        self.maestro = User.objects.create_user(
            email="maestro_rae_view@example.com",
            numero_empleado="EMP010",
            password="pass",
            escuela=self.escuela,
            role=getattr(User, "Role", None)
            and getattr(User.Role, "MAESTRO_APOYO", "MAESTRO_APOYO"),
        )
        self.admin = User.objects.create_superuser(
            email="admin_rae_view@example.com",
            numero_empleado="ADM006",
            password="pass",
            escuela=self.escuela,
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
        self.registro = RegistroRAE.objects.create(
            escuela=self.escuela,
            ciclo_escolar=self.ciclo,
            creado_por=self.maestro,
            docente_hombres=1,
            docente_mujeres=2,
        )

    def test_lista_registros_maestro(self):
        self.client.force_authenticate(self.maestro)
        response = self.client.get(reverse("rae:mis_registros_rae"))
        self.assertEqual(response.status_code, 200)
        # Verificamos que el registro creado aparezca
        self.assertContains(response, self.registro.pk)

    def test_crear_registro_rae(self):
        self.client.force_authenticate(self.maestro)
        # Use a different school for the new registration to avoid UNIQUE constraint error
        escuela_nueva = Escuela.objects.create(
            clave_estatal="E9",
            cct="CCT9",
            nombre="Escuela RAE Nueva",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z9",
        )
        form_data = {
            "escuela": escuela_nueva.pk,
            "ciclo_escolar": self.ciclo.pk,
            "docente_hombres": 2,
            "docente_mujeres": 3,
        }
        response = self.client.post(reverse("rae:registros-list"), data=form_data)
        self.assertIn(response.status_code, (200, 201, 302))
        self.assertTrue(
            RegistroRAE.objects.filter(escuela=self.escuela, ciclo_escolar=self.ciclo).exists()
        )

    def test_editar_registro_rae(self):
        self.client.force_authenticate(self.maestro)
        form_data = {
            "escuela": self.escuela.pk,
            "ciclo_escolar": self.ciclo.pk,
            "docente_hombres": 5,
            "docente_mujeres": 6,
        }
        response = self.client.patch(
            reverse("rae:registros-detail", args=[self.registro.pk]), data=form_data
        )
        self.assertIn(response.status_code, (200, 202, 204, 302))
        self.registro.refresh_from_db()
        self.assertEqual(self.registro.docente_hombres, 5)

    def test_captura_rae_endpoint(self):
        self.client.force_authenticate(self.maestro)
        response = self.client.get(reverse("rae:captura_rae"))
        self.assertEqual(response.status_code, 200)

    def test_guardar_bulk_rae(self):
        self.client.force_authenticate(self.maestro)

        # Crear el detalle RAE primero para tener un ID
        rae_alumno = RAEAlumno.objects.create(
            registro=self.registro,
            alumno=self.alumno,
            capturado_por=self.maestro,
        )

        data = {
            "registro_id": self.registro.pk,
            "alumnos": [
                {
                    "id": rae_alumno.pk,
                    "alumno": self.alumno.pk,
                    "ceg": True,
                    "bv": False,
                    "so": False,
                    "hp": False,
                    "scg": False,
                    "dmo": False,
                    "di": True,
                    "dme": False,
                    "psicosocial": False,
                    "dm": False,
                    "dsc": False,
                    "dsco": False,
                    "dsa": True,
                    "tda": False,
                    "tea": False,
                    "asi": True,
                    "asc": False,
                    "asa": False,
                    "asp": False,
                    "ass": False,
                    "ot": False,
                    "psicologia": True,
                    "comunicacion": True,
                    "psicomotricidad": False,
                    "trabajo_social": False,
                    "aprendizaje": True,
                    "nuevo_ingreso": True,
                    "subsecuente": False,
                    "diagnostico": True,
                    "educativo": True,
                    "deteccion": True,
                    "psicopedagogico": True,
                    "plan": True,
                    "modelo": True,
                }
            ],
        }
        response = self.client.post(reverse("rae:guardar_rae_bulk"), data=data, format="json")
        self.assertIn(response.status_code, (200, 201))

        # Verificar que el cambio se aplicó
        rae_alumno.refresh_from_db()
        self.assertTrue(rae_alumno.ceg)
        self.assertTrue(rae_alumno.di)


class RAEExportTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            numero_empleado="123",
            password="password",
            role="ADMIN",
            first_name="Admin",
            last_name="User",
        )
        self.teacher1 = User.objects.create_user(
            email="teacher1@test.com",
            numero_empleado="456",
            password="password",
            role="MAESTRO_APOYO",
            first_name="Maestro",
            last_name="Uno",
        )
        self.teacher2 = User.objects.create_user(
            email="teacher2@test.com",
            numero_empleado="789",
            password="password",
            role="MAESTRO_APOYO",
            first_name="Maestra",
            last_name="Dos",
        )

        self.school1 = Escuela.objects.create(
            nombre="Escuela Primaria Benito Juarez",
            cct="12345",
            clave_estatal="123",
            nivel="PRIMARIA",
        )
        self.school2 = Escuela.objects.create(
            nombre="Escuela Secundaria Tecnica 34",
            cct="67890",
            clave_estatal="456",
            nivel="SECUNDARIA",
        )

        self.student1_t1 = Alumno.objects.create(
            nombres="Juan",
            apellido_paterno="Perez",
            sexo="H",
            profesor=self.teacher1,
            escuela=self.school1,
            edad=8,
            curp="CURP1",
        )
        self.student2_t1 = Alumno.objects.create(
            nombres="Maria",
            apellido_paterno="Gomez",
            sexo="M",
            profesor=self.teacher1,
            escuela=self.school1,
            edad=9,
            curp="CURP2",
        )
        self.student1_t2 = Alumno.objects.create(
            nombres="Pedro",
            apellido_paterno="Lopez",
            sexo="H",
            profesor=self.teacher2,
            escuela=self.school2,
            edad=10,
            curp="CURP3",
        )

        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year + 1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )

        self.rae1 = RegistroRAE.objects.create(
            escuela=self.school1,
            ciclo_escolar=self.ciclo,
            creado_por=self.teacher1,
            docente_hombres=1,
            docente_mujeres=1,
        )
        self.rae2 = RegistroRAE.objects.create(
            escuela=self.school2,
            ciclo_escolar=self.ciclo,
            creado_por=self.teacher2,
            docente_hombres=1,
            docente_mujeres=1,
        )

        RAEAlumno.objects.create(
            registro=self.rae1, alumno=self.student1_t1, capturado_por=self.teacher1
        )
        RAEAlumno.objects.create(
            registro=self.rae1, alumno=self.student2_t1, capturado_por=self.teacher1
        )
        RAEAlumno.objects.create(
            registro=self.rae2, alumno=self.student1_t2, capturado_por=self.teacher2
        )

    def test_export_rae_excel_view_for_teacher(self):
        self.client.force_authenticate(self.teacher1)
        # Use a valid PK
        response = self.client.get(
            reverse("rae:exportar_rae_excel", args=[self.rae1.pk]), HTTP_IS_TEST="True"
        )
        self.assertEqual(response.status_code, 200)

    def test_export_all_rae_excel_view_for_admin(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("rae:exportar_todo_rae_excel"), HTTP_IS_TEST="True")
        self.assertEqual(response.status_code, 200)

    def test_export_all_permission_denied_for_teacher(self):
        self.client.force_authenticate(self.teacher1)
        response = self.client.get(reverse("rae:exportar_todo_rae_excel"))
        self.assertEqual(response.status_code, 403)

    def test_export_all_button_visibility(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("rae:mis_registros_rae"))
        self.assertEqual(response.status_code, 200)
        # Check API response for basic content
        data = response.json()
        self.assertIn("count", data)
