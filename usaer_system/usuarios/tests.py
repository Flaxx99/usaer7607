from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.urls import reverse
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse

from .models import User
from .forms import UsuarioCreationForm, UsuarioChangeForm
from .decoradores import roles_permitidos
from escuelas.models import Escuela


class UserManagerTests(TestCase):
    def test_create_user_exitoso(self):
        user = User.objects.create_user(
            email="normal@user.com",
            numero_empleado="12345",
            password="foo",
            nombre="Test",
            apellido_paterno="User"
        )
        self.assertEqual(user.email, "normal@user.com")
        self.assertEqual(user.numero_empleado, "12345")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, User.Role.MAESTRO_APOYO)  # Rol por defecto

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(
            email="super@user.com",
            numero_empleado="admin123",
            password="foo"
        )
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertEqual(admin_user.role, User.Role.ADMINISTRADOR)

    def test_create_user_sin_numero_empleado_falla(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="test@test.com", numero_empleado="", password="foo")


class UserViewsTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@example.com", numero_empleado="admin", password="pass"
        )
        self.maestro = User.objects.create_user(
            email="maestro@example.com", numero_empleado="maestro", password="pass", role=User.Role.MAESTRO_APOYO
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="111", cct="CCT111", nombre="Escuela Base", nivel="Primaria", domicilio="x", colonia="y", zona="z"
        )

    def test_acceso_denegado_a_no_admin(self):
        self.client.login(email="maestro@example.com", password="pass")
        urls_restringidas = [
            reverse("usuarios:list"),
            reverse("usuarios:create"),
            reverse("usuarios:update", args=[self.maestro.pk]),
            reverse("usuarios:delete", args=[self.maestro.pk]),
        ]
        for url in urls_restringidas:
            response = self.client.get(url)
            # El decorador redirige o da PermissionDenied, así que 302 o 403 son fallos de acceso esperados
            self.assertIn(response.status_code, [302, 403])

    def test_lista_usuarios_para_admin(self):
        self.client.login(email="admin@example.com", password="pass")
        response = self.client.get(reverse("usuarios:list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.maestro.email)
        self.assertContains(response, self.admin.email)

    def test_crear_usuario_exitoso(self):
        self.client.login(email="admin@example.com", password="pass")
        form_data = {
            "numero_empleado": "newuser",
            "nombre": "Nuevo",
            "apellido_paterno": "Usuario",
            "email": "new@example.com",
            "role": User.Role.SECRETARIO,
            "escuela": self.escuela.pk,
            "password": "newpass123",
        }
        response = self.client.post(reverse("usuarios:create"), data=form_data)
        self.assertEqual(response.status_code, 302)  # Redirección a la lista
        self.assertTrue(User.objects.filter(numero_empleado="newuser").exists())

    def test_editar_usuario(self):
        self.client.login(email="admin@example.com", password="pass")
        form_data = {
            "numero_empleado": self.maestro.numero_empleado,
            "nombre": "Nombre Editado",
            "apellido_paterno": self.maestro.apellido_paterno,
            "email": self.maestro.email,
            "role": User.Role.DIRECTOR,
            "escuela": self.escuela.pk,
        }
        url = reverse("usuarios:update", args=[self.maestro.pk])
        response = self.client.post(url, data=form_data)
        self.assertEqual(response.status_code, 302)
        self.maestro.refresh_from_db()
        self.assertEqual(self.maestro.nombre, "Nombre Editado")
        self.assertEqual(self.maestro.role, User.Role.DIRECTOR)

    def test_eliminar_usuario(self):
        self.client.login(email="admin@example.com", password="pass")
        user_a_eliminar = User.objects.create_user(
            email="delete@me.com", numero_empleado="del123", password="pass"
        )
        url = reverse("usuarios:delete", args=[user_a_eliminar.pk])
        response = self.client.post(url) # La vista de borrado es por POST
        self.assertEqual(response.status_code, 302)
        self.assertFalse(User.objects.filter(pk=user_a_eliminar.pk).exists())

    def test_vista_perfil_propio(self):
        self.client.login(email="maestro@example.com", password="pass")
        response = self.client.get(reverse("usuarios:profile"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.maestro.email)

    def test_cambiar_contrasena(self):
        self.client.login(email="maestro@example.com", password="pass")
        form_data = {
            "old_password": "pass",
            "new_password1": "newpass",
            "new_password2": "newpass",
        }
        response = self.client.post(reverse("usuarios:change_password"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.maestro.refresh_from_db()
        self.assertTrue(self.maestro.check_password("newpass"))


class DashboardViewTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="dash_admin@example.com", numero_empleado="dash_admin", password="pass"
        )
        self.maestro = User.objects.create_user(
            email="dash_maestro@example.com", numero_empleado="dash_maestro", password="pass", role=User.Role.MAESTRO_APOYO
        )

    def test_dashboard_requiere_login(self):
        response = self.client.get(reverse("usuarios:dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_dashboard_modulos_para_admin(self):
        self.client.login(email="dash_admin@example.com", password="pass")
        response = self.client.get(reverse("usuarios:dashboard"))
        self.assertEqual(response.status_code, 200)
        # Un admin debería ver el módulo de gestión de usuarios
        self.assertContains(response, "Gestión de Usuarios")
        self.assertContains(response, reverse("usuarios:list"))

    def test_dashboard_modulos_para_maestro(self):
        self.client.login(email="dash_maestro@example.com", password="pass")
        response = self.client.get(reverse("usuarios:dashboard"))
        self.assertEqual(response.status_code, 200)
        # Un maestro NO debería ver el módulo de gestión de usuarios
        self.assertNotContains(response, "Gestión de Usuarios")
        # Pero sí debería ver el de alumnos
        self.assertContains(response, "Gestión de Alumnos")
        self.assertContains(response, reverse("alumnos:listar_alumnos"))