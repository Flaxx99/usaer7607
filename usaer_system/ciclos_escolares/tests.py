"""Tests for CiclosEscolares app — expanded coverage for RBAC and Cycle logic."""

from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from ciclos_escolares.models import CicloEscolar

User = get_user_model()


class CicloEscolarModelTest(APITestCase):
    def test_solo_un_ciclo_activo(self):
        # Crear primer ciclo activo
        CicloEscolar.objects.create(
            nombre="2023-2024",
            fecha_inicio=date(2023, 8, 1),
            fecha_fin=date(2024, 7, 1),
            activo=True,
        )
        # Crear segundo ciclo activo
        CicloEscolar.objects.create(
            nombre="2024-2025",
            fecha_inicio=date(2024, 8, 1),
            fecha_fin=date(2025, 7, 1),
            activo=True,
        )

        # Solo el último debería haber quedado activo
        self.assertEqual(CicloEscolar.objects.filter(activo=True).count(), 1)
        self.assertEqual(CicloEscolar.objects.get(activo=True).nombre, "2024-2025")

    def test_get_current_or_next_cycle_success(self):
        today = date.today()
        CicloEscolar.objects.create(
            nombre="Ciclo Actual",
            fecha_inicio=today - timedelta(days=10),
            fecha_fin=today + timedelta(days=10),
            activo=True,
        )
        cycle = CicloEscolar.get_current_or_next_cycle(today)
        self.assertEqual(cycle.nombre, "Ciclo Actual")

    def test_get_current_or_next_cycle_future_only(self):
        today = date.today()
        CicloEscolar.objects.create(
            nombre="Ciclo Futuro",
            fecha_inicio=today + timedelta(days=10),
            fecha_fin=today + timedelta(days=365),
            activo=False,
        )
        with self.assertRaises(CicloEscolar.DoesNotExist) as cm:
            CicloEscolar.get_current_or_next_cycle(today)
        self.assertIn("El próximo ciclo encontrado es: 'Ciclo Futuro'", str(cm.exception))

    def test_get_current_or_next_cycle_none(self):
        today = date.today()
        with self.assertRaises(CicloEscolar.DoesNotExist) as cm:
            CicloEscolar.get_current_or_next_cycle(today)
        self.assertIn("No se encontró ningún Ciclo Escolar activo", str(cm.exception))


class CicloEscolarViewsTest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email="admin@test.com",
            numero_empleado="admin",
            password="pass",
            role=User.Role.ADMINISTRADOR,
        )
        self.maestro = User.objects.create_user(
            email="user@test.com",
            numero_empleado="user1",
            password="pass",
            role=User.Role.MAESTRO_APOYO,
        )
        self.ciclo = CicloEscolar.objects.create(
            nombre="2024-2025",
            fecha_inicio=date(2024, 8, 1),
            fecha_fin=date(2025, 7, 1),
            activo=True,
        )

    def test_admin_can_manage_ciclos(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("ciclos:ciclos-list")

        # Listar
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Crear nuevo
        payload = {
            "nombre": "2025-2026",
            "fecha_inicio": "2025-08-01",
            "fecha_fin": "2026-07-01",
            "activo": False,
        }
        response = self.client.post(url, data=payload, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

    def test_non_admin_cannot_manage_ciclos(self):
        self.client.force_authenticate(user=self.maestro)
        url = reverse("ciclos:ciclos-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_ciclo_activo_endpoint(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("ciclos:ciclos-activo")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["nombre"], "2024-2025")

    def test_promover_alumnos_preview(self):
        self.client.force_authenticate(user=self.admin)
        url = reverse("ciclos:promover_alumnos")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_activos", response.data)
