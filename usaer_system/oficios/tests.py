"""Tests for Oficios app — expanded coverage for RBAC, File handling, and Search."""

import os
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Oficio

User = get_user_model()


class OficioModelTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test_oficio@example.com", numero_empleado="EMP005", password="pass"
        )
        self.oficio = Oficio.objects.create(
            titulo="Oficio de Prueba",
            descripcion="Descripción del oficio",
            archivo=SimpleUploadedFile("test_oficio.pdf", b"file_content"),
            subido_por=self.user
        )

    def tearDown(self):
        if self.oficio and self.oficio.archivo:
            self.oficio.archivo.delete(save=False)

    def test_oficio_creation(self):
        self.assertIsInstance(self.oficio, Oficio)
        self.assertEqual(self.oficio.titulo, "Oficio de Prueba")
        self.assertTrue(os.path.exists(self.oficio.archivo.path))

    def test_oficio_str(self):
        self.assertEqual(str(self.oficio), "Oficio de Prueba")

    def test_oficio_delete_removes_file(self):
        file_path = self.oficio.archivo.path
        self.oficio.delete()
        self.assertFalse(os.path.exists(file_path))

    def test_update_oficio_removes_old_file(self):
        old_file_path = self.oficio.archivo.path
        new_file = SimpleUploadedFile("new_oficio.pdf", b"new_content")
        self.oficio.archivo = new_file
        self.oficio.save()
        self.assertFalse(os.path.exists(old_file_path))
        self.assertTrue(os.path.exists(self.oficio.archivo.path))

class OficioViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # Admin to perform write operations
        self.admin = User.objects.create_superuser(
            email="admin_oficio@example.com", numero_empleado="admin_of", password="pass"
        )
        # Secretario to perform write operations
        self.secretario = User.objects.create_user(
            email="sec_oficio@example.com", numero_empleado="sec_of", password="pass", role=User.Role.SECRETARIO
        )
        # Regular user for read-only checks
        self.user = User.objects.create_user(
            email="view_oficio@example.com", numero_empleado="EMP006", password="pass", role=User.Role.MAESTRO_APOYO
        )
        self.oficio = Oficio.objects.create(
            titulo="Oficio Existente",
            descripcion="Descripción existente",
            archivo=SimpleUploadedFile("existing_oficio.pdf", b"existing_content"),
            subido_por=self.user
        )

    def tearDown(self):
        for oficio in Oficio.objects.all():
            if oficio.archivo:
                oficio.archivo.delete(save=False)

    def test_lista_oficios(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("oficios:oficios-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.oficio.titulo)

    def test_subir_oficio_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("oficios:oficios-list")
        form_data = {
            "titulo": "Nuevo Oficio Admin",
            "descripcion": "Descripción del nuevo oficio",
            "archivo": SimpleUploadedFile("new_oficio_admin.pdf", b"new_content"),
        }
        response = self.client.post(url, data=form_data, format='multipart')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(Oficio.objects.filter(titulo="Nuevo Oficio Admin").exists())

    def test_subir_oficio_secretario(self):
        self.client.force_authenticate(user=self.secretario)
        url = reverse("oficios:oficios-list")
        form_data = {
            "titulo": "Nuevo Oficio Sec",
            "descripcion": "Descripción del nuevo oficio",
            "archivo": SimpleUploadedFile("new_oficio_sec.pdf", b"new_content"),
        }
        response = self.client.post(url, data=form_data, format='multipart')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(Oficio.objects.filter(titulo="Nuevo Oficio Sec").exists())

    def test_subir_oficio_denied_for_maestro(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("oficios:oficios-list")
        form_data = {
            "titulo": "Oficio Prohibido",
            "descripcion": "No debería poder subirlo",
            "archivo": SimpleUploadedFile("prohibido.pdf", b"content"),
        }
        response = self.client.post(url, data=form_data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editar_oficio_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("oficios:oficios-detail", args=[self.oficio.pk])
        form_data = {
            "titulo": "Oficio Editado Admin",
            "descripcion": "Descripción editada",
            "archivo": SimpleUploadedFile("edited_oficio_admin.pdf", b"edited_content"),
        }
        response = self.client.patch(url, data=form_data, format='multipart')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.oficio.refresh_from_db()
        self.assertEqual(self.oficio.titulo, "Oficio Editado Admin")

    def test_eliminar_oficio_secretario(self):
        self.client.force_authenticate(user=self.secretario)
        url = reverse("oficios:oficios-detail", args=[self.oficio.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertFalse(Oficio.objects.filter(pk=self.oficio.pk).exists())

    def test_eliminar_oficio_denied_for_maestro(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("oficios:oficios-detail", args=[self.oficio.pk])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_search_oficios(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("oficios:oficios-list")
        
        # Search by title
        response = self.client.get(url, {'search': 'Existente'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, self.oficio.titulo)
        
        # Search for non-existent
        response = self.client.get(url, {'search': 'Inexistente'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotContains(response, self.oficio.titulo)
