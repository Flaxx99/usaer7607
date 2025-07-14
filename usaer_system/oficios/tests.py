from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
import os

from .models import Oficio

User = get_user_model()


class OficioModelTest(TestCase):
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
        if self.oficio.archivo:
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


class OficioViewsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="view_oficio@example.com", numero_empleado="EMP006", password="pass"
        )
        self.oficio = Oficio.objects.create(
            titulo="Oficio Existente",
            descripcion="Descripción existente",
            archivo=SimpleUploadedFile("existing_oficio.pdf", b"existing_content"),
            subido_por=self.user
        )

    def tearDown(self):
        # Limpiar archivos creados durante las pruebas
        for oficio in Oficio.objects.all():
            if oficio.archivo:
                oficio.archivo.delete(save=False)

    def test_lista_oficios(self):
        self.client.login(email="view_oficio@example.com", password="pass")
        response = self.client.get(reverse("oficios:lista_oficios"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.oficio.titulo)

    def test_subir_oficio(self):
        self.client.login(email="view_oficio@example.com", password="pass")
        form_data = {
            "titulo": "Nuevo Oficio",
            "descripcion": "Descripción del nuevo oficio",
            "archivo": SimpleUploadedFile("new_oficio.pdf", b"new_content"),
        }
        response = self.client.post(reverse("oficios:subir_oficio"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Oficio.objects.filter(titulo="Nuevo Oficio").exists())

    def test_editar_oficio(self):
        self.client.login(email="view_oficio@example.com", password="pass")
        form_data = {
            "titulo": "Oficio Editado",
            "descripcion": "Descripción editada",
            "archivo": SimpleUploadedFile("edited_oficio.pdf", b"edited_content"),
        }
        response = self.client.post(reverse("oficios:editar_oficio", args=[self.oficio.pk]), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.oficio.refresh_from_db()
        self.assertEqual(self.oficio.titulo, "Oficio Editado")
        self.assertIn("edited_oficio.pdf", self.oficio.archivo.name)

    def test_eliminar_oficio(self):
        self.client.login(email="view_oficio@example.com", password="pass")
        response = self.client.post(reverse("oficios:eliminar_oficio", args=[self.oficio.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Oficio.objects.filter(pk=self.oficio.pk).exists())