"""Tests for Documentos app — expanded coverage for RBAC and File handling."""

from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from alumnos.models import Alumno
from escuelas.models import Escuela
from .models import Expediente, OtroArchivo

User = get_user_model()


class DocumentosAPITests(APITestCase):
    def setUp(self):
        # Setup Base Data
        self.escuela = Escuela.objects.create(
            clave_estatal="ESC2", cct="CCTESC2", nombre="Escuela Documentos", 
            nivel="Primaria", domicilio="x", colonia="y", zona="z"
        )
        
        self.admin = User.objects.create_superuser(
            email="admin_doc@example.com", numero_empleado="admin_doc", password="pass"
        )
        self.maestro = User.objects.create_user(
            email="maestro_doc@example.com", numero_empleado="maestro_doc", 
            password="pass", role=User.Role.MAESTRO_APOYO, escuela=self.escuela
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
            plan_intervencion=SimpleUploadedFile("plan.pdf", b"file_content")
        )
        self.client = APIClient()

    def tearDown(self):
        # Cleanup files from filesystem to avoid cluttering during tests
        for expediente in Expediente.objects.all():
            for field in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion']:
                file = getattr(expediente, field)
                if file:
                    file.delete(save=False)
        for otro_archivo in OtroArchivo.objects.all():
            if otro_archivo.archivo:
                otro_archivo.archivo.delete(save=False)

    def test_subir_expediente_maestro(self):
        self.client.force_authenticate(user=self.maestro)
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
            clasificacion="NINGUNO"
        )
        url = reverse('documentos:documentos-list')
        data = {
            'alumno': alumno_sin_expediente.pk,
            'informe_deteccion': SimpleUploadedFile('new_deteccion.pdf', b'new_content'),
            'informe_psicopedagogico': SimpleUploadedFile('new_psico.pdf', b'new_content'),
            'plan_intervencion': SimpleUploadedFile('new_plan.pdf', b'new_content'),
            'observaciones': 'Observaciones de prueba',
        }
        response = self.client.post(url, data, format='multipart')
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertTrue(Expediente.objects.filter(alumno=alumno_sin_expediente).exists())

    def test_editar_expediente_maestro_propio(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('documentos:documentos-detail', args=[self.expediente.pk])
        data = {
            'informe_deteccion': SimpleUploadedFile('updated_deteccion.pdf', b'updated_content'),
            'observaciones': 'Observaciones actualizadas'
        }
        response = self.client.patch(url, data, format='multipart')
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.expediente.refresh_from_db()
        # The system normalizes observations to uppercase when saving
        self.assertEqual(self.expediente.observaciones, 'Observaciones actualizadas'.upper())

    def test_eliminar_expediente_maestro_propio(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('documentos:documentos-detail', args=[self.expediente.pk])
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK])
        self.assertFalse(Expediente.objects.filter(pk=self.expediente.pk).exists())

    def test_lista_expedientes_maestro(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse('documentos:documentos-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get('results', [])
        self.assertTrue(any(self.alumno.get_full_name() in (item.get('alumno_nombre') or '') for item in results))

    def test_lista_expedientes_admin(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse('documentos:documentos-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_acceso_denegado_a_expediente_ajeno(self):
        # Create another teacher and another expediente
        otro_maestro = User.objects.create_user(
            email="otro_doc@example.com", numero_empleado="otro_doc", password="pass", role=User.Role.MAESTRO_APOYO
        )
        otro_alumno = Alumno.objects.create(
            profesor=otro_maestro, escuela=self.escuela, 
            apellido_paterno="L", apellido_materno="M", nombres="X", 
            curp="CURP_OTRO_123456HOMBXX", sexo="H", edad=8, grado="3", clasificacion="NINGUNO"
        )
        otro_expediente = Expediente.objects.create(
            alumno=otro_alumno, profesor=otro_maestro, 
            informe_deteccion=SimpleUploadedFile("d.pdf", b"c"), 
            informe_psicopedagogico=SimpleUploadedFile("p.pdf", b"c"), 
            plan_intervencion=SimpleUploadedFile("pl.pdf", b"c")
        )
        
        self.client.force_authenticate(user=self.maestro)
        url = reverse('documentos:documentos-detail', args=[otro_expediente.pk])
        response = self.client.get(url)
        # Expect 403 or 404 depending on ViewSet implementation (usually 403 if permission check fails)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
