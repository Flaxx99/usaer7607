from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
import os

from alumnos.models import Alumno
from escuelas.models import Escuela
from .models import Expediente, OtroArchivo

User = get_user_model()


class DocumentosViewsTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email="admin_doc@example.com", numero_empleado="admin_doc", password="pass"
        )
        self.maestro = User.objects.create_user(
            email="maestro_doc@example.com", numero_empleado="maestro_doc", password="pass", role=User.Role.MAESTRO_APOYO
        )
        self.escuela = Escuela.objects.create(
            clave_estatal="ESC2", cct="CCTESC2", nombre="Escuela Documentos", nivel="Primaria", domicilio="x", colonia="y", zona="z"
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
            clasificacion="NINGUNO",
        )
        self.expediente = Expediente.objects.create(
            alumno=self.alumno,
            profesor=self.maestro,
            informe_deteccion=SimpleUploadedFile("deteccion.pdf", b"file_content"),
            informe_psicopedagogico=SimpleUploadedFile("psico.pdf", b"file_content"),
            plan_intervencion=SimpleUploadedFile("plan.pdf", b"file_content"),
        )

    def tearDown(self):
        # Limpiar archivos creados durante las pruebas
        for expediente in Expediente.objects.all():
            for field in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion']:
                file = getattr(expediente, field)
                if file:
                    file.delete(save=False)
        for otro_archivo in OtroArchivo.objects.all():
            if otro_archivo.archivo:
                otro_archivo.archivo.delete(save=False)

    def test_subir_expediente_maestro(self):
        self.client.login(email="maestro_doc@example.com", password="pass")
        alumno_sin_expediente = Alumno.objects.create(
            profesor=self.maestro,
            escuela=self.escuela,
            apellido_paterno="Nuevo",
            apellido_materno="Alumno",
            nombres="Test",
            curp="NUEVAL123456HOMBXX",
            sexo="H",
            edad=7,
            grado="1",
            clasificacion="NINGUNO",
        )
        form_data = {
            "alumno": alumno_sin_expediente.pk,
            "informe_deteccion": SimpleUploadedFile("new_deteccion.pdf", b"new_content"),
            "informe_psicopedagogico": SimpleUploadedFile("new_psico.pdf", b"new_content"),
            "plan_intervencion": SimpleUploadedFile("new_plan.pdf", b"new_content"),
            "observaciones": "Observaciones de prueba",
            # Formset para OtroArchivo
            "otros_archivos-TOTAL_FORMS": 1,
            "otros_archivos-INITIAL_FORMS": 0,
            "otros_archivos-MIN_NUM_FORMS": 0,
            "otros_archivos-MAX_NUM_FORMS": 1000,
            "otros_archivos-0-archivo": SimpleUploadedFile("otro.txt", b"otro_content"),
            "otros_archivos-0-descripcion": "Archivo adicional",
        }
        response = self.client.post(reverse("documentos:subir_expediente"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Expediente.objects.filter(alumno=alumno_sin_expediente).exists())
        self.assertTrue(OtroArchivo.objects.filter(descripcion="Archivo adicional").exists())

    def test_editar_expediente_maestro_propio(self):
        self.client.login(email="maestro_doc@example.com", password="pass")
        form_data = {
            "alumno": self.alumno.pk,
            "informe_deteccion": SimpleUploadedFile("updated_deteccion.pdf", b"updated_content"),
            "informe_psicopedagogico": self.expediente.informe_psicopedagogico,
            "plan_intervencion": self.expediente.plan_intervencion,
            "observaciones": "Observaciones actualizadas",
            "otros_archivos-TOTAL_FORMS": 0,
            "otros_archivos-INITIAL_FORMS": 0,
            "otros_archivos-MIN_NUM_FORMS": 0,
            "otros_archivos-MAX_NUM_FORMS": 1000,
        }
        response = self.client.post(reverse("documentos:editar_expediente", args=[self.expediente.pk]), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.expediente.refresh_from_db()
        self.assertEqual(self.expediente.observaciones, "Observaciones actualizadas")
        self.assertIn("updated_deteccion.pdf", self.expediente.informe_deteccion.name)

    def test_eliminar_expediente_maestro_propio(self):
        self.client.login(email="maestro_doc@example.com", password="pass")
        response = self.client.post(reverse("documentos:eliminar_expediente", args=[self.expediente.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Expediente.objects.filter(pk=self.expediente.pk).exists())

    def test_lista_expedientes_maestro(self):
        self.client.login(email="maestro_doc@example.com", password="pass")
        response = self.client.get(reverse("documentos:lista_expedientes"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.alumno.get_full_name())

    def test_lista_expedientes_admin(self):
        self.client.login(email="admin_doc@example.com", password="pass")
        response = self.client.get(reverse("documentos:lista_expedientes"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.alumno.get_full_name())