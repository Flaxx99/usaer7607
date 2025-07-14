from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from escuelas.models import Escuela
from .models import Permiso

User = get_user_model()


class PermisoModelTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E5", cct="CCT5", nombre="Escuela Permisos", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z5"
        )
        self.profesor = User.objects.create_user(
            email="profesor_permiso@example.com", numero_empleado="EMP007", password="pass",
            escuela=self.escuela
        )
        self.admin = User.objects.create_superuser(
            email="admin_permiso@example.com", numero_empleado="ADM004", password="pass",
            escuela=self.escuela
        )
        self.permiso = Permiso.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            tipo="PERSONAL",
            motivo="Vacaciones",
            fecha_inicio=timezone.localdate(),
            fecha_fin=timezone.localdate() + timedelta(days=5),
        )

    def test_permiso_creation(self):
        self.assertIsInstance(self.permiso, Permiso)
        self.assertEqual(self.permiso.estado, "PENDIENTE")

    def test_permiso_str(self):
        self.assertIn("Permiso #", str(self.permiso))
        self.assertIn("Pendiente de revisión", str(self.permiso))

    def test_duracion_dias(self):
        self.assertEqual(self.permiso.duracion_dias, 6)

    def test_save_sets_fecha_respuesta(self):
        self.permiso.estado = "APROBADO"
        self.permiso.save()
        self.assertIsNotNone(self.permiso.fecha_respuesta)
        self.assertEqual(self.permiso.administrador, None) # No se asigna si no se pasa _current_user


class PermisoViewsTest(TestCase):
    def setUp(self):
        self.escuela = Escuela.objects.create(
            clave_estatal="E6", cct="CCT6", nombre="Escuela Permisos Views", nivel="Primaria",
            domicilio="Dir", colonia="Col", zona="Z6"
        )
        self.profesor = User.objects.create_user(
            email="profesor_permiso_view@example.com", numero_empleado="EMP008", password="pass",
            escuela=self.escuela
        )
        self.admin = User.objects.create_superuser(
            email="admin_permiso_view@example.com", numero_empleado="ADM005", password="pass",
            escuela=self.escuela
        )
        self.permiso_profesor = Permiso.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            tipo="PERSONAL",
            motivo="Enfermedad",
            fecha_inicio=timezone.localdate(),
            fecha_fin=timezone.localdate() + timedelta(days=1),
        )
        self.permiso_admin = Permiso.objects.create(
            profesor=self.profesor,
            escuela=self.escuela,
            tipo="PERSONAL",
            motivo="Otro motivo",
            fecha_inicio=timezone.localdate(),
            fecha_fin=timezone.localdate() + timedelta(days=2),
        )

    def test_solicitar_permiso(self):
        self.client.login(email="profesor_permiso_view@example.com", password="pass")
        form_data = {
            "tipo": "PERSONAL",
            "fecha_inicio": timezone.localdate().isoformat(),
            "fecha_fin": (timezone.localdate() + timedelta(days=1)).isoformat(),
            "motivo": "Motivo de prueba",
        }
        response = self.client.post(reverse("permisos:solicitar"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Permiso.objects.filter(motivo="MOTIVO DE PRUEBA").exists())

    def test_mis_permisos(self):
        self.client.login(email="profesor_permiso_view@example.com", password="pass")
        response = self.client.get(reverse("permisos:mis_permisos"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.permiso_profesor.motivo)
        self.assertNotContains(response, self.permiso_admin.motivo) # No debería ver el de admin

    def test_gestionar_permisos_admin(self):
        self.client.login(email="admin_permiso_view@example.com", password="pass")
        response = self.client.get(reverse("permisos:gestionar"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.permiso_profesor.motivo)
        self.assertContains(response, self.permiso_admin.motivo)

    def test_responder_permiso_aprobar(self):
        self.client.login(email="admin_permiso_view@example.com", password="pass")
        form_data = {
            "estado": "APROBADO",
            "respuesta_admin": "Aprobado sin problemas",
        }
        response = self.client.post(reverse("permisos:responder", args=[self.permiso_profesor.pk]), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.permiso_profesor.refresh_from_db()
        self.assertEqual(self.permiso_profesor.estado, "APROBADO")
        self.assertEqual(self.permiso_profesor.respuesta_admin, "APROBADO SIN PROBLEMAS")
        self.assertIsNotNone(self.permiso_profesor.fecha_respuesta)
        self.assertEqual(self.permiso_profesor.administrador, self.admin)

    def test_responder_permiso_rechazar_sin_respuesta(self):
        self.client.login(email="admin_permiso_view@example.com", password="pass")
        form_data = {
            "estado": "RECHAZADO",
            "respuesta_admin": "",
        }
        response = self.client.post(reverse("permisos:responder", args=[self.permiso_profesor.pk]), data=form_data)
        self.assertEqual(response.status_code, 200) # Vuelve a mostrar el formulario con errores
        self.assertContains(response, "Debe proporcionar una razón para el rechazo.")

    def test_eliminar_permiso(self):
        self.client.login(email="admin_permiso_view@example.com", password="pass")
        response = self.client.post(reverse("permisos:eliminar", args=[self.permiso_profesor.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Permiso.objects.filter(pk=self.permiso_profesor.pk).exists())

    def test_detalle_permiso_propio(self):
        self.client.login(email="profesor_permiso_view@example.com", password="pass")
        response = self.client.get(reverse("permisos:detalle", args=[self.permiso_profesor.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.permiso_profesor.motivo)

    def test_detalle_permiso_ajeno_sin_permiso(self):
        otro_profesor = User.objects.create_user(
            email="otro_profesor_permiso@example.com", numero_empleado="EMP009", password="pass"
        )
        permiso_ajeno = Permiso.objects.create(
            profesor=otro_profesor,
            escuela=self.escuela,
            tipo="PERSONAL",
            motivo="Motivo ajeno",
            fecha_inicio=timezone.localdate(),
            fecha_fin=timezone.localdate() + timedelta(days=1),
        )
        self.client.login(email="profesor_permiso_view@example.com", password="pass")
        response = self.client.get(reverse("permisos:detalle", args=[permiso_ajeno.pk]))
        self.assertEqual(response.status_code, 302) # Redirige a inicio