from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta

from .models import EventoCalendario
from .forms import EventoForm

User = get_user_model()


class EventoCalendarioModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="test@example.com", numero_empleado="EMP001", password="pass"
        )
        self.evento = EventoCalendario.objects.create(
            titulo="Reunión",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=1),
            creado_por=self.user,
            tipo="PERSONAL"
        )

    def test_evento_creation(self):
        self.assertIsInstance(self.evento, EventoCalendario)
        self.assertEqual(self.evento.titulo, "Reunión")

    def test_evento_str(self):
        self.assertEqual(str(self.evento), "Reunión (PERSONAL)")


class EventoFormTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="formuser@example.com", numero_empleado="EMP002", password="pass"
        )
        self.admin = User.objects.create_superuser(
            email="formadmin@example.com", numero_empleado="ADM001", password="pass"
        )

    def test_form_valido_personal(self):
        form_data = {
            "titulo": "Evento Personal",
            "fecha_inicio": timezone.now().strftime('%Y-%m-%dT%H:%M'),
            "fecha_fin": (timezone.now() + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M'),
            "tipo": "PERSONAL",
        }
        form = EventoForm(data=form_data, user=self.user)
        self.assertTrue(form.is_valid())

    def test_form_valido_institucional_admin(self):
        form_data = {
            "titulo": "Evento Institucional",
            "fecha_inicio": timezone.now().strftime('%Y-%m-%dT%H:%M'),
            "fecha_fin": (timezone.now() + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M'),
            "tipo": "INSTITUCIONAL",
        }
        form = EventoForm(data=form_data, user=self.admin)
        self.assertTrue(form.is_valid())

    def test_form_invalido_fecha_fin_anterior_a_inicio(self):
        form_data = {
            "titulo": "Evento Malo",
            "fecha_inicio": (timezone.now() + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M'),
            "fecha_fin": timezone.now().strftime('%Y-%m-%dT%H:%M'),
            "tipo": "PERSONAL",
        }
        form = EventoForm(data=form_data, user=self.user)
        self.assertFalse(form.is_valid())
        self.assertIn("fecha_inicio", form.errors)


class CalendarioViewsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="viewuser@example.com", numero_empleado="EMP003", password="pass"
        )
        self.admin = User.objects.create_superuser(
            email="viewadmin@example.com", numero_empleado="ADM002", password="pass"
        )
        self.secretario = User.objects.create_user(
            email="viewsec@example.com", numero_empleado="SEC001", password="pass", role=User.Role.SECRETARIO
        )

        self.evento_personal_user = EventoCalendario.objects.create(
            titulo="Mi Evento Personal",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=1),
            creado_por=self.user,
            tipo="PERSONAL"
        )
        self.evento_institucional = EventoCalendario.objects.create(
            titulo="Evento Institucional",
            fecha_inicio=timezone.now(),
            fecha_fin=timezone.now() + timedelta(hours=2),
            creado_por=self.admin,
            tipo="INSTITUCIONAL"
        )

    def test_lista_eventos_user(self):
        self.client.login(email="viewuser@example.com", password="pass")
        response = self.client.get(reverse("calendario:lista_eventos"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.evento_personal_user.titulo)
        self.assertContains(response, self.evento_institucional.titulo)

    def test_crear_evento_user_personal(self):
        self.client.login(email="viewuser@example.com", password="pass")
        form_data = {
            "titulo": "Nuevo Evento User",
            "fecha_inicio": timezone.now().strftime('%Y-%m-%dT%H:%M'),
            "fecha_fin": (timezone.now() + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M'),
            "tipo": "PERSONAL",
        }
        response = self.client.post(reverse("calendario:crear_evento"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(EventoCalendario.objects.filter(titulo="Nuevo Evento User", creado_por=self.user, tipo="PERSONAL").exists())

    def test_crear_evento_admin_institucional(self):
        self.client.login(email="viewadmin@example.com", password="pass")
        form_data = {
            "titulo": "Nuevo Evento Admin",
            "fecha_inicio": timezone.now().strftime('%Y-%m-%dT%H:%M'),
            "fecha_fin": (timezone.now() + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M'),
            "tipo": "INSTITUCIONAL",
        }
        response = self.client.post(reverse("calendario:crear_evento"), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(EventoCalendario.objects.filter(titulo="Nuevo Evento Admin", creado_por=self.admin, tipo="INSTITUCIONAL").exists())

    def test_detalle_evento_personal_propio(self):
        self.client.login(email="viewuser@example.com", password="pass")
        response = self.client.get(reverse("calendario:detalle_evento", args=[self.evento_personal_user.pk]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.evento_personal_user.titulo)

    def test_detalle_evento_personal_ajeno_denegado(self):
        otro_user = User.objects.create_user(
            email="otro_user@example.com", numero_empleado="EMP004", password="pass"
        )
        self.client.login(email="otro_user@example.com", password="pass")
        response = self.client.get(reverse("calendario:detalle_evento", args=[self.evento_personal_user.pk]))
        self.assertEqual(response.status_code, 403) # Forbidden

    def test_editar_evento_propio(self):
        self.client.login(email="viewuser@example.com", password="pass")
        form_data = {
            "titulo": "Evento Editado",
            "fecha_inicio": self.evento_personal_user.fecha_inicio.strftime('%Y-%m-%dT%H:%M'),
            "fecha_fin": self.evento_personal_user.fecha_fin.strftime('%Y-%m-%dT%H:%M'),
            "tipo": "PERSONAL",
        }
        response = self.client.post(reverse("calendario:editar_evento", args=[self.evento_personal_user.pk]), data=form_data)
        self.assertEqual(response.status_code, 302)
        self.evento_personal_user.refresh_from_db()
        self.assertEqual(self.evento_personal_user.titulo, "Evento Editado")

    def test_eliminar_evento_propio(self):
        self.client.login(email="viewuser@example.com", password="pass")
        response = self.client.post(reverse("calendario:eliminar_evento", args=[self.evento_personal_user.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(EventoCalendario.objects.filter(pk=self.evento_personal_user.pk).exists())