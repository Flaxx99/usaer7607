"""
test_ciclo_promocion_flow.py — Promoción real de alumnos entre ciclos.

Flujo:
1. Admin ejecuta promoción (GET preview + POST commit).
2. Verifica que los alumnos avanzan de grado.
3. Verifica que el ciclo se cierra.
"""

from alumnos.models import Alumno
from ciclos_escolares.models import CicloEscolar
from django.urls import reverse
from rest_framework import status

from .base import BaseIntegrationTest


class CicloPromocionFlowTest(BaseIntegrationTest):
    def test_admin_ejecuta_promocion_completa(self):
        """Admin ejecuta promoción: preview → commit → verifica cambios."""
        self._auth(self.admin)

        url = reverse("ciclos:promover_alumnos")

        # 1. Obtener preview
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("a_promover_count", data)
        self.assertIn("a_graduar_count", data)

        # 2. Guardar grados actuales
        grado_original_alumno1 = Alumno.objects.get(pk=self.alumno.pk).grado
        grado_original_alumno2 = Alumno.objects.get(pk=self.alumno_2.pk).grado

        # 3. Ejecutar promoción (commit)
        commit_response = self.client.post(url, {"confirmed": True}, format="json")
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
        url = reverse("ciclos:promover_alumnos")
        response = self.client.post(url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_maestro_no_puede_promocionar(self):
        """Solo ADMIN puede ejecutar la promoción."""
        self._auth(self.maestro)
        url = reverse("ciclos:promover_alumnos")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
