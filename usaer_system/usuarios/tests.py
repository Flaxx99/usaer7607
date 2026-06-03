"""Tests for Usuarios app — expanded coverage for RBAC, Auth, and Dashboard."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from escuelas.models import Escuela
from rest_framework.test import APIClient, APITestCase

from .models import CalendarEvent

User = get_user_model()


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

    def test_login_with_none_username(self):
        """Verify that login doesn't crash when username is missing."""
        url_login = reverse("usuarios:login")
        # Missing username entirely
        payload = {"password": "somepassword"}
        response = self.client.post(url_login, data=payload, format="json")
        self.assertIn(response.status_code, [400, 401])


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
