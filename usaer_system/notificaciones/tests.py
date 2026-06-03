"""Tests for Notificaciones app — basic and action coverage."""

from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Notificacion

User = get_user_model()


class NotificacionAPITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            email="user1@test.com", numero_empleado="EMP001", password="pass"
        )
        self.user2 = User.objects.create_user(
            email="user2@test.com", numero_empleado="EMP002", password="pass"
        )
        
        # Notificaciones para user1
        self.notif1 = Notificacion.objects.create(
            usuario=self.user1, mensaje="Aviso 1", leida=False, url="/test1/"
        )
        self.notif2 = Notificacion.objects.create(
            usuario=self.user1, mensaje="Aviso 2", leida=False, url="/test2/"
        )
        self.notif3 = Notificacion.objects.create(
            usuario=self.user1, mensaje="Aviso 3", leida=True, url="/test3/"
        )
        
        # Notificación para user2
        self.notif_other = Notificacion.objects.create(
            usuario=self.user2, mensaje="Aviso Other", leida=False, url="/test_other/"
        )

    def test_listar_notificaciones_solo_propias(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/notificaciones/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get('results', [])
        
        self.assertEqual(len(results), 3)
        self.assertFalse(any(item.get('mensaje') == "Aviso Other" for item in results))

    def test_conteo_no_leidas(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/notificaciones/conteo/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 2)

    def test_no_leidas_list(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/notificaciones/no_leidas/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        results = data if isinstance(data, list) else data.get('results', [])
        
        self.assertEqual(len(results), 2)
        for item in results:
            self.assertEqual(item['leida'], False)

    def test_marcar_leida_especifica(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/notificaciones/{self.notif1.pk}/marcar_leida/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.leida)

    def test_marcar_todas_leidas(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/notificaciones/marcar_todas_leidas/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.notif1.refresh_from_db()
        self.notif2.refresh_from_db()
        self.assertTrue(self.notif1.leida)
        self.assertTrue(self.notif2.leida)

    def test_acceso_denegado_no_autenticado(self):
        url = "/api/notificaciones/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
