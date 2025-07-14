from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, time

from escuelas.models import Escuela
from .models import Asistencia
from .forms import AsistenciaCheckForm

User = get_user_model()


class AsistenciaModelTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E1", cct="CCT1", nombre="Escuela Test", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z1"
        )
        self.profesor = User.objects.create_user(
            email="profesor@test.com", numero_empleado="EMP001", password="pass",
            escuela=self.escuela
        )

    def test_asistencia_creation(self):
        asistencia = Asistencia.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=timezone.localtime().time()
        )
        self.assertIsInstance(asistencia, Asistencia)
        self.assertEqual(asistencia.profesor, self.profesor)

    def test_asistencia_str(self):
        asistencia = Asistencia.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=timezone.localtime().time()
        )
        expected_str = f"Asistencia de {self.profesor.get_full_name()} el {timezone.localdate()}"
        self.assertEqual(str(asistencia), expected_str)


class AsistenciaFormTest(TestCase):
    def test_form_valido(self):
        form_data = {'numero_empleado': 'EMP001'}
        form = AsistenciaCheckForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_form_invalido_sin_numero_empleado(self):
        form_data = {'numero_empleado': ''}
        form = AsistenciaCheckForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('numero_empleado', form.errors)


class AsistenciaViewsTest(TestCase):
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

    def test_mostrar_checador_get(self):
        response = self.client.get(reverse("asistencias:mostrar_checador"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Checador")

    def test_checar_asistencia_entrada_exitosa(self):
        form_data = {'numero_empleado': self.profesor.numero_empleado}
        response = self.client.post(reverse("asistencias:checar_asistencia"), data=form_data)
        self.assertEqual(response.status_code, 302) # Redirige al login
        self.assertTrue(Asistencia.objects.filter(profesor=self.profesor, fecha=timezone.localdate()).exists())
        asistencia = Asistencia.objects.get(profesor=self.profesor, fecha=timezone.localdate())
        self.assertIsNotNone(asistencia.hora_entrada)
        self.assertIsNone(asistencia.hora_salida)

    def test_checar_asistencia_salida_exitosa(self):
        # Primero, registrar entrada
        Asistencia.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=time(8, 0, 0) # Hora de entrada fija para calcular duración
        )
        form_data = {'numero_empleado': self.profesor.numero_empleado}
        response = self.client.post(reverse("asistencias:checar_asistencia"), data=form_data)
        self.assertEqual(response.status_code, 302)
        asistencia = Asistencia.objects.get(profesor=self.profesor, fecha=timezone.localdate())
        self.assertIsNotNone(asistencia.hora_salida)
        # Verificar que la hora de salida sea posterior a la de entrada
        self.assertGreater(asistencia.hora_salida, asistencia.hora_entrada)

    def test_checar_asistencia_profesor_no_existe(self):
        form_data = {'numero_empleado': 'NOEXISTE'}
        response = self.client.post(reverse("asistencias:checar_asistencia"), data=form_data)
        self.assertEqual(response.status_code, 302)
        messages = list(response.wsgi_request._messages)
        self.assertIn("Código o CURP no encontrado.", [str(m) for m in messages])

    def test_listar_asistencias_maestro(self):
        # Crear una asistencia para el maestro
        Asistencia.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=timezone.localtime().time()
        )
        # Crear una asistencia para otro profesor que el maestro no debería ver
        otro_profesor = User.objects.create_user(
            email="otro_profesor@test.com", numero_empleado="EMP003", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        Asistencia.objects.create(
            profesor=otro_profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=timezone.localtime().time()
        )

        self.client.login(email="profesor_views@test.com", password="pass")
        response = self.client.get(reverse("asistencias:listar_asistencias"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.profesor.get_full_name())
        self.assertNotContains(response, otro_profesor.get_full_name())

    def test_listar_asistencias_admin(self):
        # Crear asistencias para ambos profesores
        Asistencia.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=timezone.localtime().time()
        )
        otro_profesor = User.objects.create_user(
            email="otro_profesor_admin@test.com", numero_empleado="EMP004", password="pass",
            escuela=self.escuela, role=User.Role.MAESTRO_APOYO
        )
        Asistencia.objects.create(
            profesor=otro_profesor,
            escuela=self.escuela,
            fecha=timezone.localdate(),
            presente=True,
            hora_entrada=timezone.localtime().time()
        )

        self.client.login(email="admin_views@test.com", password="pass")
        response = self.client.get(reverse("asistencias:listar_asistencias"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.profesor.get_full_name())
        self.assertContains(response, otro_profesor.get_full_name())