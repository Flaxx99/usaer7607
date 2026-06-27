"""
test_ciclo_promocion_flow.py — Promoción real de alumnos entre ciclos.

Flujo (2 endpoints):
1. CicloEscolar::PromocionAlumnosView (GET preview + POST commit con nivel educativo).
2. AlumnoViewSet::promover (GET preview + POST commit simple con last_promotion_cycle).
"""

from unittest.mock import patch

from alumnos.models import Alumno
from ciclos_escolares.models import CicloEscolar
from django.urls import reverse
from rest_framework import status

from .base import BaseIntegrationTest


class CicloPromocionFlowTest(BaseIntegrationTest):
    """Tests para PromocionAlumnosView (ciclos_escolares)."""

    url = reverse("ciclos:promover_alumnos")

    def test_admin_ejecuta_promocion_completa(self):
        """Admin ejecuta promoción: preview → commit → verifica cambios."""
        self._auth(self.admin)

        # 1. Obtener preview
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("a_promover_count", data)
        self.assertIn("a_graduar_count", data)

        # 2. Guardar grados actuales
        grado_original_alumno1 = Alumno.objects.get(pk=self.alumno.pk).grado
        grado_original_alumno2 = Alumno.objects.get(pk=self.alumno_2.pk).grado

        # 3. Ejecutar promoción (commit)
        commit_response = self.client.post(self.url, {"confirmed": True}, format="json")
        self.assertEqual(commit_response.status_code, status.HTTP_200_OK)
        self.assertEqual(commit_response.json()["status"], "success")

        # 4. Verificar que los alumnos activos avanzaron de grado
        alumno1 = Alumno.objects.get(pk=self.alumno.pk)
        alumno2 = Alumno.objects.get(pk=self.alumno_2.pk)

        grado_int_1 = int(grado_original_alumno1)
        grado_int_2 = int(grado_original_alumno2)

        if alumno1.activo:
            self.assertEqual(int(alumno1.grado), grado_int_1 + 1)
        if alumno2.activo:
            self.assertEqual(int(alumno2.grado), grado_int_2 + 1)

        # 5. Verificar que el ciclo activo ya no está activo
        self.assertFalse(CicloEscolar.objects.filter(activo=True).exists())

    def test_admin_no_puede_promocionar_sin_confirmacion(self):
        """POST a promoción sin confirmed=True devuelve 400."""
        self._auth(self.admin)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_maestro_no_puede_promocionar(self):
        """Solo ADMIN puede ejecutar la promoción."""
        self._auth(self.maestro)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AlumnoPromoverFlowTest(BaseIntegrationTest):
    """Tests para AlumnoViewSet::promover (alumnos)."""

    def setUp(self):
        super().setUp()
        # Parcheamos el rate de bulk_write para que no throttle en tests
        self._throttle_patcher = patch(
            "rest_framework.throttling.ScopedRateThrottle.get_rate",
            return_value="100/min",
        )
        self._throttle_patcher.start()
        # También parcheamos WriteRateThrottle
        self._write_patcher = patch(
            "usaer_system.throttling.WriteRateThrottle.get_rate",
            return_value="100/min",
        )
        self._write_patcher.start()

    def tearDown(self):
        self._throttle_patcher.stop()
        self._write_patcher.stop()
        super().tearDown()

    url = reverse("alumnos:alumnos-promover")

    def test_promover_get_muestra_simulacion(self):
        """GET devuelve simulación con counts correctos."""
        self._auth(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["simulation"])
        self.assertEqual(data["ciclo_actual"], self.ciclo.nombre)
        # alumno(3) + alumno_2(2) = 2 pendientes, ninguno grado 6
        self.assertEqual(data["total_pendientes"], 2)
        self.assertEqual(data["a_promover"], 2)
        self.assertEqual(data["a_graduar"], 0)

    def test_promover_post_ejecuta_y_marca_last_promotion_cycle(self):
        """POST ejecuta promoción y marca last_promotion_cycle."""
        self._auth(self.admin)

        response = self.client.post(self.url, {"confirmed": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertFalse(data["simulation"])
        self.assertEqual(data["promovidos_count"], 2)

        # Verificar que last_promotion_cycle se marcó
        alumno = Alumno.objects.get(pk=self.alumno.pk)
        self.assertEqual(alumno.last_promotion_cycle, self.ciclo)

    def test_promover_idempotencia_excluye_ya_promovidos(self):
        """Alumnos con last_promotion_cycle = ciclo actual no se repromueven."""
        self._auth(self.admin)

        # Primera ejecución
        self.client.post(self.url, {"confirmed": True}, format="json")

        # Segunda ejecución — ya no hay pendientes
        response2 = self.client.get(self.url)
        data2 = response2.json()
        self.assertEqual(data2["total_pendientes"], 0)
        self.assertEqual(data2["a_promover"], 0)

    def test_promover_sin_confirmacion_devuelve_400(self):
        """POST sin confirmed=True → 400."""
        self._auth(self.admin)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_promover_maestro_no_puede(self):
        """Maestro (no ADMIN/SECRETARIO) → 403."""
        self._auth(self.maestro)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_promover_secretario_puede(self):
        """Secretario puede promover."""
        self._auth(self.secretario)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["simulation"])
