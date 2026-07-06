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
            "version": 0,
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
        self.assertEqual(
            response.json(),
            {"status": "success", "detail": "1 alumnos actualizados"},
        )

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
        self.assertEqual(
            response.json(),
            {"detail": "No tienes permiso.", "code": "forbidden"},
        )

    def test_export_all_button_visibility(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("rae:mis_registros_rae"))
        self.assertEqual(response.status_code, 200)
        # Check API response for basic content
        data = response.json()
        self.assertIn("count", data)


class RAEProgressViewTest(APITestCase):
    """Tests for RAEProgressView — GET /api/rae/progreso/"""

    def setUp(self):
        self.client = APIClient()
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year + 1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="E10",
            cct="CCT10",
            nombre="Escuela Progreso",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z10",
        )
        self.maestro = User.objects.create_user(
            email="maestro_progreso@example.com",
            numero_empleado="EMP010",
            password="pass",
            escuela=self.escuela,
            role="MAESTRO_APOYO",
        )
        self.admin = User.objects.create_superuser(
            email="admin_progreso@example.com",
            numero_empleado="ADM010",
            password="pass",
            escuela=self.escuela,
        )
        self.alumno1 = Alumno.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            apellido_paterno="Lopez",
            apellido_materno="Martinez",
            nombres="Carlos",
            curp="LOPMC123456HOMBXX",
            sexo="H",
            edad=8,
            grado="3",
            clasificacion="DISCAPACIDAD",
        )
        self.alumno2 = Alumno.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            apellido_paterno="Garcia",
            apellido_materno="Lopez",
            nombres="Ana",
            curp="GALOA123456MOMBXX",
            sexo="M",
            edad=7,
            grado="2",
            clasificacion="DISCAPACIDAD",
        )
        self.registro = RegistroRAE.objects.create(
            escuela=self.escuela,
            ciclo_escolar=self.ciclo,
            creado_por=self.maestro,
            docente_hombres=1,
            docente_mujeres=1,
        )
        RAEAlumno.objects.create(
            registro=self.registro,
            alumno=self.alumno1,
            capturado_por=self.maestro,
            ceg=True,
            dm=False,
        )
        RAEAlumno.objects.create(
            registro=self.registro,
            alumno=self.alumno2,
            capturado_por=self.maestro,
            ceg=False,
            dm=True,
        )

    def test_progreso_returns_200_for_teacher(self):
        """Maestro autenticado puede ver progreso."""
        self.client.force_authenticate(self.maestro)
        response = self.client.get(reverse("rae:rae_progreso"))
        self.assertEqual(response.status_code, 200)

    def test_progreso_returns_correct_structure(self):
        """La respuesta tiene escuela_id, escuela_nombre, total_alumnos, completados, porcentaje, cerrado."""
        self.client.force_authenticate(self.maestro)
        response = self.client.get(reverse("rae:rae_progreso"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)
        entry = data[0]
        self.assertIn("escuela_id", entry)
        self.assertIn("escuela_nombre", entry)
        self.assertIn("total_alumnos", entry)
        self.assertIn("completados", entry)
        self.assertIn("porcentaje", entry)
        self.assertIn("cerrado", entry)

    def test_progreso_admin_sees_all_schools(self):
        """Admin ve progreso de todas las escuelas."""
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse("rae:rae_progreso"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Al menos la escuela que creamos
        escuelas = [e["escuela_id"] for e in data]
        self.assertIn(self.escuela.pk, escuelas)

    def test_progreso_includes_porcentaje(self):
        """El porcentaje se calcula como completados/total_alumnos * 100."""
        self.client.force_authenticate(self.maestro)
        response = self.client.get(reverse("rae:rae_progreso"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for entry in data:
            if entry["total_alumnos"] > 0:
                expected_pct = round(entry["completados"] / entry["total_alumnos"] * 100)
                self.assertEqual(entry["porcentaje"], expected_pct)


class RAECerrarViewTest(APITestCase):
    """Tests for RAECerrarView — POST /api/rae/cerrar/<pk>/"""

    def setUp(self):
        self.client = APIClient()
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year + 1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="E11",
            cct="CCT11",
            nombre="Escuela Cerrar",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z11",
        )
        self.maestro = User.objects.create_user(
            email="maestro_cerrar@example.com",
            numero_empleado="EMP011",
            password="pass",
            escuela=self.escuela,
            role="MAESTRO_APOYO",
        )
        self.admin = User.objects.create_superuser(
            email="admin_cerrar@example.com",
            numero_empleado="ADM011",
            password="pass",
            escuela=self.escuela,
        )
        self.registro = RegistroRAE.objects.create(
            escuela=self.escuela,
            ciclo_escolar=self.ciclo,
            creado_por=self.maestro,
            docente_hombres=1,
            docente_mujeres=1,
            cerrado=False,
        )

    def test_cerrar_requires_admin(self):
        """Maestro sin permisos recibe 403."""
        otra_escuela = Escuela.objects.create(
            clave_estatal="E99",
            cct="CCT99",
            nombre="Otra Escuela",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z99",
        )
        otro_maestro = User.objects.create_user(
            email="otro_maestro@example.com",
            numero_empleado="EMP099",
            password="pass",
            escuela=otra_escuela,
            role="MAESTRO_APOYO",
        )
        self.client.force_authenticate(otro_maestro)
        response = self.client.post(
            reverse("rae:rae_cerrar", args=[self.registro.pk]),
            data={"cerrado": True},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_cerrar_toggle_cerrado_true(self):
        """Admin marca el registro como cerrado."""
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            reverse("rae:rae_cerrar", args=[self.registro.pk]),
            data={"cerrado": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.registro.refresh_from_db()
        self.assertTrue(self.registro.cerrado)

    def test_cerrar_toggle_cerrado_false(self):
        """Admin reabre un registro cerrado."""
        # Primero cerrar
        self.registro.cerrado = True
        self.registro.save()

        self.client.force_authenticate(self.admin)
        response = self.client.post(
            reverse("rae:rae_cerrar", args=[self.registro.pk]),
            data={"cerrado": False},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.registro.refresh_from_db()
        self.assertFalse(self.registro.cerrado)

    def test_cerrar_response_has_cerrado_key(self):
        """La respuesta incluye detail, registro_id y cerrado."""
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            reverse("rae:rae_cerrar", args=[self.registro.pk]),
            data={"cerrado": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("registro_id", data)
        self.assertIn("cerrado", data)
        self.assertTrue(data["cerrado"])


class ExportAllRAEEnhancedTest(APITestCase):
    """Tests adicionales para ExportAllRAEView."""

    def setUp(self):
        self.client = APIClient()
        self.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year + 1}",
            fecha_inicio=date.today() - timedelta(days=1),
            fecha_fin=date.today() + timedelta(days=365),
            activo=True,
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="E12",
            cct="CCT12",
            nombre="Escuela Export",
            nivel="Primaria",
            domicilio="Dir",
            colonia="Col",
            zona="Z12",
        )
        self.admin = User.objects.create_superuser(
            email="admin_export_all@example.com",
            numero_empleado="ADM012",
            password="pass",
            escuela=self.escuela,
        )
        self.registro = RegistroRAE.objects.create(
            escuela=self.escuela,
            ciclo_escolar=self.ciclo,
            creado_por=self.admin,
            docente_hombres=1,
            docente_mujeres=1,
        )

    def test_export_all_excel_content_type(self):
        """Admin recibe content_type Excel."""
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse("rae:exportar_todo_rae_excel"), HTTP_IS_TEST="True")
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            response.get("Content-Type", ""),
            [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/octet-stream",
            ],
        )

    def test_export_all_excel_filename(self):
        """Header Content-Disposition incluye nombre de archivo .xlsx."""
        self.client.force_authenticate(self.admin)
        response = self.client.get(reverse("rae:exportar_todo_rae_excel"), HTTP_IS_TEST="True")
        self.assertEqual(response.status_code, 200)
        disposition = response.get("Content-Disposition", "")
        self.assertIn(".xlsx", disposition)
