from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import Escuela
from .forms import EscuelaForm

User = get_user_model()


class EscuelaModelTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="12345",
            cct="CCT123",
            nombre="Escuela de Prueba",
            nivel="Primaria",
            domicilio="Calle Falsa 123",
            colonia="Centro",
            zona="01",
        )

    def test_model_str(self):
        self.assertEqual(str(self.escuela), "CCT123 – Escuela de Prueba")

    def test_nivel_se_guarda_en_mayusculas(self):
        escuela = Escuela.objects.create(
            clave_estatal="67890",
            cct="CCT456",
            nombre="Otra Escuela",
            nivel="secundaria",  # En minúsculas
            domicilio="Otra Calle 456",
            colonia="Norte",
            zona="02",
        )
        self.assertEqual(escuela.nivel, "SECUNDARIA")


class EscuelaFormTest(TestCase):
    def test_form_valido(self):
        form_data = {
            "clave_estatal": "12345",
            "cct": "CCT123",
            "nombre": "Escuela de Prueba",
            "nivel": "Primaria",
            "domicilio": "Calle Falsa 123",
            "colonia": "Centro",
            "zona": "01",
        }
        form = EscuelaForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_form_invalido_sin_datos_requeridos(self):
        form = EscuelaForm(data={})
        self.assertFalse(form.is_valid())
        self.assertIn("cct", form.errors)
        self.assertIn("nombre", form.errors)

    def test_clean_convierte_a_mayusculas(self):
        form_data = {
            "clave_estatal": "abcde",
            "cct": "cctminusculas",
            "nombre": "nombre en minúsculas",
            "nivel": "Primaria",
            "domicilio": "domicilio",
            "colonia": "colonia",
            "zona": "zona",
            "correo_inspector": "correo@minusculas.com",
        }
        form = EscuelaForm(data=form_data)
        self.assertTrue(form.is_valid())
        cleaned_data = form.cleaned_data
        self.assertEqual(cleaned_data["clave_estatal"], "ABCDE")
        self.assertEqual(cleaned_data["cct"], "CCTMINUSCULAS")
        self.assertEqual(cleaned_data["nombre"], "NOMBRE EN MINÚSCULAS")
        # El correo no debe cambiar
        self.assertEqual(cleaned_data["correo_inspector"], "correo@minusculas.com")


class EscuelaViewsTest(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            numero_empleado="staff1",
            email="staff@test.com",
            password="password",
            is_staff=True,
        )
        self.normal_user = User.objects.create_user(
            numero_empleado="user1",
            email="user@test.com",
            password="password",
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="12345",
            cct="CCT123",
            nombre="Escuela de Prueba",
            nivel="Primaria",
            domicilio="Calle Falsa 123",
            colonia="Centro",
            zona="01",
        )
        self.listar_url = reverse("escuelas:listar_escuelas")
        self.crear_url = reverse("escuelas:crear_escuela")
        self.editar_url = reverse("escuelas:editar_escuela", args=[self.escuela.pk])
        self.eliminar_url = reverse("escuelas:eliminar_escuela", args=[self.escuela.pk])

    def test_acceso_denegado_a_no_staff(self):
        self.client.login(email="user@test.com", password="password")
        response = self.client.get(self.listar_url)
        self.assertNotEqual(response.status_code, 200)
        response = self.client.get(self.crear_url)
        self.assertNotEqual(response.status_code, 200)
        response = self.client.get(self.editar_url)
        self.assertNotEqual(response.status_code, 200)
        response = self.client.post(self.eliminar_url)
        self.assertNotEqual(response.status_code, 302) # No debe redirigir

    def test_acceso_permitido_a_staff(self):
        self.client.login(email="staff@test.com", password="password")
        response = self.client.get(self.listar_url)
        self.assertEqual(response.status_code, 200)
        response = self.client.get(self.crear_url)
        self.assertEqual(response.status_code, 200)
        response = self.client.get(self.editar_url)
        self.assertEqual(response.status_code, 200)

    def test_listar_escuelas_muestra_escuelas(self):
        self.client.login(email="staff@test.com", password="password")
        response = self.client.get(self.listar_url)
        self.assertContains(response, self.escuela.nombre)

    def test_crear_escuela(self):
        self.client.login(email="staff@test.com", password="password")
        form_data = {
            "clave_estatal": "67890",
            "cct": "CCT456",
            "nombre": "Nueva Escuela",
            "nivel": "Secundaria",
            "domicilio": "Av. Siempre Viva 742",
            "colonia": "Springfield",
            "zona": "03",
        }
        response = self.client.post(self.crear_url, data=form_data)
        self.assertEqual(response.status_code, 302) # Redirección tras éxito
        self.assertTrue(Escuela.objects.filter(cct="CCT456").exists())

    def test_editar_escuela(self):
        self.client.login(email="staff@test.com", password="password")
        form_data = {
            "clave_estatal": self.escuela.clave_estatal,
            "cct": self.escuela.cct,
            "nombre": "Escuela Editada",
            "nivel": self.escuela.nivel,
            "domicilio": self.escuela.domicilio,
            "colonia": self.escuela.colonia,
            "zona": self.escuela.zona,
        }
        response = self.client.post(self.editar_url, data=form_data)
        self.assertEqual(response.status_code, 302)
        self.escuela.refresh_from_db()
        self.assertEqual(self.escuela.nombre, "ESCUELA EDITADA")

    def test_eliminar_escuela(self):
        self.client.login(email="staff@test.com", password="password")
        response = self.client.post(self.eliminar_url)
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Escuela.objects.filter(pk=self.escuela.pk).exists())