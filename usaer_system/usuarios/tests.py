"""Tests for Usuarios app — expanded coverage for RBAC, Auth, and Dashboard."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from escuelas.models import Escuela
from rest_framework.test import APIClient, APITestCase

from .models import CalendarEvent
from .serializers import UserListSerializer, UserSerializer

User = get_user_model()


@override_settings(SECURE_SSL_REDIRECT=False)
class UserAPITests(APITestCase):
    def setUp(self):
        # Setup Base Data
        self.escuela = Escuela.objects.create(
            clave_estatal="111",
            cct="CCT111",
            nombre="Escuela Base",
            nivel="Primaria",
            domicilio="x",
            colonia="y",
            zona="z",
        )

        self.admin = User.objects.create_superuser(
            email="admin@example.com", numero_empleado="admin", password="TestPass1!"
        )
        self.maestro = User.objects.create_user(
            email="maestro@example.com",
            numero_empleado="maestro",
            password="TestPass1!",
            role=User.Role.MAESTRO_APOYO,
            escuela=self.escuela,
        )
        self.secretario = User.objects.create_user(
            email="sec@example.com",
            numero_empleado="sec1",
            password="TestPass1!",
            role=User.Role.SECRETARIO,
            escuela=self.escuela,
        )

        self.client = APIClient()

    def test_create_user_via_api(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-list")
        payload = {
            "numero_empleado": "newuser1",
            "nombre": "Nuevo",
            "apellido_paterno": "Usuario",
            "email": "new@example.com",
            "role": User.Role.SECRETARIO,
            "escuela": self.escuela.pk,
            "password": "NewUserPass123!",
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertIn(response.status_code, [201, 200])
        self.assertTrue(User.objects.filter(email=payload["email"]).exists())

    def test_non_admin_cannot_access_user_list(self):
        # Maestro cannot access user list
        self.client.force_authenticate(user=self.maestro)
        url = reverse("usuarios:usuario-list")
        response = self.client.get(url)
        self.assertIn(response.status_code, [403, 401])

    def test_admin_can_list_users(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        results = data if isinstance(data, list) else data.get("results", [])
        self.assertTrue(any(item.get("email") == self.admin.email for item in results))

    def test_edit_user_via_api(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-detail", args=[self.maestro.pk])
        payload = {"nombre": "Nombre Editado", "role": User.Role.DIRECTOR}
        response = self.client.patch(url, data=payload, format="json")
        self.assertIn(response.status_code, [200, 204])
        self.maestro.refresh_from_db()
        self.assertEqual(self.maestro.role, User.Role.DIRECTOR)

    def test_delete_user_via_api(self):
        self.client.force_authenticate(user=self.admin)
        user_to_delete = User.objects.create_user(
            email="del@me.com", numero_empleado="del1", password="pass"
        )
        url = reverse("usuarios:usuario-detail", args=[user_to_delete.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [204, 200])
        self.assertFalse(User.objects.filter(pk=user_to_delete.pk).exists())

    def test_dashboard_data_access(self):
        """Verify that authenticated users can access dashboard data."""
        self.client.force_authenticate(user=self.maestro)
        url = reverse("usuarios:dashboard_data")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), dict)

    def test_login_logout_flow(self):
        """Verify authentication endpoints."""
        # Login
        url_login = reverse("usuarios:login")
        # The LoginSerializer expects 'username' as the key for the email
        payload = {"username": self.maestro.email, "password": "TestPass1!"}
        response = self.client.post(url_login, data=payload, format="json")
        self.assertEqual(response.status_code, 200)

        # Logout
        url_logout = reverse("usuarios:logout")
        self.client.force_authenticate(user=self.maestro)
        response = self.client.post(url_logout)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "success", "detail": "Sesión cerrada correctamente."},
        )

    def test_login_with_none_username(self):
        """Verify that login doesn't crash when username is missing."""
        url_login = reverse("usuarios:login")
        # Missing username entirely
        payload = {"password": "somepassword"}
        response = self.client.post(url_login, data=payload, format="json")
        self.assertIn(response.status_code, [400, 401])


@override_settings(SECURE_SSL_REDIRECT=False)
class UserModelTests(APITestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="111", cct="CCT111", nombre="Escuela Base", nivel="Primaria"
        )

    def test_user_full_name(self):
        user = User.objects.create_user(
            email="test@test.com",
            numero_empleado="EMP_TEST",
            password="pass",
            nombre="Juan",
            apellido_paterno="Perez",
            apellido_materno="Gomez",
        )
        self.assertEqual(user.get_full_name(), "Perez, Gomez, Juan")

    def test_unique_constraints(self):
        # Create first user
        User.objects.create_user(email="u1@test.com", numero_empleado="EMP1", password="pass")
        # Try to create another user with same numero_empleado
        with self.assertRaises(Exception):
            User.objects.create_user(email="u2@test.com", numero_empleado="EMP1", password="pass")

    def test_calendar_event_creation(self):
        user = User.objects.create_user(
            email="cal@test.com", numero_empleado="EMP_CAL", password="pass"
        )
        event = CalendarEvent.objects.create(
            title="Reunión Técnica",
            description="Revisión de sistema",
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=1),
            event_type=CalendarEvent.EventType.REUNION,
            created_by=user,
            assigned_to=user,
        )
        self.assertEqual(event.title, "Reunión Técnica")
        self.assertEqual(event.event_type, CalendarEvent.EventType.REUNION)


@override_settings(SECURE_SSL_REDIRECT=False)
class UserViewSetActionsTest(APITestCase):
    """Tests para toggle_active y change_password de UserViewSet."""

    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="ACT01",
            cct="CCTACT01",
            nombre="Escuela Actions Test",
            nivel="Primaria",
            domicilio="x",
            colonia="y",
            zona="z",
        )
        self.admin = User.objects.create_superuser(
            email="admin_act@test.com",
            numero_empleado="ADMACT",
            password="TestPass1!",
        )
        self.maestro = User.objects.create_user(
            email="maestro_act@test.com",
            numero_empleado="MAEACT",
            password="TestPass1!",
            role=User.Role.MAESTRO_APOYO,
            escuela=self.escuela,
        )
        self.client = APIClient()

    def test_toggle_active_desactiva_usuario(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-toggle-active", args=[self.maestro.pk])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.maestro.refresh_from_db()
        self.assertFalse(self.maestro.activo)
        self.assertIn("desactivado", response.json()["status"])

    def test_toggle_active_reactiva_usuario(self):
        self.maestro.activo = False
        self.maestro.save()
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-toggle-active", args=[self.maestro.pk])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.maestro.refresh_from_db()
        self.assertTrue(self.maestro.activo)
        self.assertIn("activado", response.json()["status"])

    def test_toggle_active_no_permite_auto_desactivacion(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-toggle-active", args=[self.admin.pk])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 400)
        self.assertIn("No puedes desactivar tu propia cuenta", response.json()["detail"])

    def test_non_admin_cannot_toggle_active(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("usuarios:usuario-toggle-active", args=[self.admin.pk])
        response = self.client.post(url)
        self.assertIn(response.status_code, [403, 401])

    def test_change_password_actualiza_correctamente(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-change-password", args=[self.maestro.pk])
        response = self.client.post(
            url,
            {
                "old_password": "TestPass1!",
                "new_password": "NuevaPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "success", "detail": "Contraseña actualizada"},
        )
        self.maestro.refresh_from_db()
        self.assertTrue(self.maestro.check_password("NuevaPass123!"))

    def test_change_password_rechaza_old_password_incorrecta(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("usuarios:usuario-change-password", args=[self.maestro.pk])
        response = self.client.post(
            url,
            {
                "old_password": "WrongPass1!",
                "new_password": "NuevaPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Contraseña incorrecta", response.json()["detail"])

    def test_me_endpoint_returns_current_user(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("usuarios:usuario-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], self.maestro.email)


@override_settings(SECURE_SSL_REDIRECT=False)
class UserSerializerTest(APITestCase):
    """Verifica que UserListSerializer excluya datos sensibles (PII)."""

    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="SER01",
            cct="CCTSER01",
            nombre="Escuela Serializer Test",
            nivel="Primaria",
        )
        self.user = User.objects.create_user(
            email="pii@test.com",
            numero_empleado="PII001",
            password="pass",
            role=User.Role.MAESTRO_APOYO,
            escuela=self.escuela,
            nombre="Juan",
            apellido_paterno="Perez",
            apellido_materno="Gomez",
            curp="PEGJ123456HOMBXX",
            celular="555-1234",
        )

    def test_list_serializer_excludes_sensitive_fields(self):
        serializer = UserListSerializer(instance=self.user)
        data = serializer.data
        # Campos permitidos
        self.assertIn("email", data)
        self.assertIn("role", data)
        self.assertIn("nombre_completo", data)
        self.assertIn("activo", data)
        # Campos sensibles NO deben estar
        self.assertNotIn("curp", data)
        self.assertNotIn("celular", data)
        self.assertNotIn("password", data)

    def test_full_serializer_includes_sensitive_fields(self):
        serializer = UserSerializer(instance=self.user)
        data = serializer.data
        self.assertIn("curp", data)
        self.assertIn("celular", data)
