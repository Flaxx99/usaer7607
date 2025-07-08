from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from django.urls import reverse

from .decoradores import roles_permitidos

User = get_user_model()


class UserManagerTests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            email="user@example.com",
            numero_empleado="1",
            password="pass1234",
        )
        self.assertEqual(user.email, "user@example.com")
        self.assertTrue(user.check_password("pass1234"))
        self.assertFalse(user.is_superuser)

    def test_create_superuser_sets_admin_role(self):
        admin = User.objects.create_superuser(
            email="admin@example.com",
            numero_empleado="2",
            password="adminpass",
        )
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.role, User.Role.ADMINISTRADOR)


class RolesPermitidosTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.admin = User.objects.create_superuser(
            email="admin2@example.com",
            numero_empleado="3",
            password="adminpass",
        )
        self.user = User.objects.create_user(
            email="user2@example.com",
            numero_empleado="4",
            password="userpass",
        )

        @roles_permitidos([User.Role.ADMINISTRADOR])
        def dummy_view(request):
            return HttpResponse("ok")

        self.view = dummy_view

    def test_view_allows_authorized_user(self):
        request = self.factory.get("/")
        request.user = self.admin
        response = self.view(request)
        self.assertEqual(response.status_code, 200)

    def test_view_denies_unauthorized_user(self):
        request = self.factory.get("/")
        request.user = self.user
        with self.assertRaises(PermissionDenied):
            self.view(request)

    def test_view_redirects_anonymous(self):
        request = self.factory.get("/")
        request.user = AnonymousUser()
        response = self.view(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)


class DashboardViewTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="dash@example.com",
            numero_empleado="5",
            password="adminpass",
        )

    def test_dashboard_requires_login(self):
        response = self.client.get(reverse("usuarios:dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_dashboard_loads_for_admin(self):
        self.client.login(email="dash@example.com", password="adminpass")
        response = self.client.get(reverse("usuarios:dashboard"))
        self.assertEqual(response.status_code, 200)
        modules = response.context["modules"]
        self.assertTrue(any(m["key"] == "create_user" for m in modules))


