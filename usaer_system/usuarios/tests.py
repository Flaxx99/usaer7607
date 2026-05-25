import uuid
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient

from escuelas.models import Escuela
from .models import User


User = get_user_model()


class UserAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin@example.com", numero_empleado="admin", password="TestPass1!"
        )
        self.maestro = User.objects.create_user(
            email="maestro@example.com", numero_empleado="maestro", password="TestPass1!", role=User.Role.MAESTRO_APOYO
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="111", cct="CCT111", nombre="Escuela Base", nivel="Primaria", domicilio="x", colonia="y", zona="z"
        )
        self.client = APIClient()

    def test_create_user_via_api(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('usuarios:usuario-list')
        payload = {
            "numero_empleado": "newuser1",
            "nombre": "Nuevo",
            "apellido_paterno": "Usuario",
            "email": "new@example.com",
            "role": User.Role.SECRETARIO,
            "escuela": self.escuela.pk,
            "password": "NewUserPass123!",
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertIn(response.status_code, [201, 200])
        self.assertTrue(User.objects.filter(email=payload['email']).exists())

    def test_non_admin_cannot_access_user_list(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('usuarios:usuario-list')
        response = self.client.get(url)
        self.assertIn(response.status_code, [403, 401])

    def test_admin_can_list_users(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('usuarios:usuario-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Expect paginated or list response containing at least the admin
        assert any(item.get('email') == self.admin.email for item in (data if isinstance(data, list) else data.get('results', [])))

    def test_edit_user_via_api(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('usuarios:usuario-detail', args=[self.maestro.pk])
        payload = {"nombre": "Nombre Editado", "role": User.Role.DIRECTOR}
        response = self.client.patch(url, data=payload, format='json')
        self.assertIn(response.status_code, [200, 204])
        self.maestro.refresh_from_db()
        self.assertEqual(self.maestro.role, User.Role.DIRECTOR)

    def test_delete_user_via_api(self):
        self.client.force_authenticate(user=self.admin)
        user_to_delete = User.objects.create_user(email='del@me.com', numero_empleado='del1', password='pass')
        url = reverse('usuarios:usuario-detail', args=[user_to_delete.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [204, 200])
        self.assertFalse(User.objects.filter(pk=user_to_delete.pk).exists())
