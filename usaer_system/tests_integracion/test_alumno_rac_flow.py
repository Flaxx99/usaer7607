"""
test_alumno_rac_flow.py — Flujo core USAER: Crear alumno → RAC → Exportar.

Roles involucrados:
- MAESTRO_APOYO: da de alta a su alumno, crea su RAC.
- ADMIN: ve todos los RAC, exporta el concentrado.
- MAESTRO_APOYO (otra escuela): NO debe ver RAC ajeno.
"""

from django.urls import reverse
from rac.models import RegistroRAC
from rest_framework import status

from .base import BaseIntegrationTest


class AlumnoRACFlowTest(BaseIntegrationTest):
    def test_maestro_crea_alumno(self):
        """Maestro de Apoyo da de alta a su alumno."""
        self._auth(self.maestro)
        url = reverse("alumnos:alumnos-list")
        data = {
            "profesor": self.maestro.pk,
            "escuela": self.escuela.pk,
            "apellido_paterno": "Nuevo",
            "apellido_materno": "Alumno",
            "nombres": "Test",
            "curp": "NEUALT123456HOMBXX",
            "sexo": "H",
            "edad": 7,
            "grado": "1",
            "grupo": "A",
            "clasificacion": "DISCAPACIDAD",
        }
        response = self.client.post(url, data, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

    def test_maestro_crea_rac_de_su_alumno(self):
        """Maestro crea un registro RAC para el alumno que le pertenece."""
        self._auth(self.maestro)
        url = reverse("rac:registros-list")
        data = {
            "alumno": self.alumno.pk,
            "escuela_regular": self.escuela.pk,
            "escuela_basica": self.escuela.pk,
            "maestro_apoyo": self.maestro.pk,
            "clasificacion": "DISCAPACIDAD",
            "subclasificacion": "DI",
            "service_type": "USAER",
        }
        response = self.client.post(url, data, format="json")
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
        self.assertEqual(RegistroRAC.objects.count(), 1)

    def test_admin_ve_todos_los_rac(self):
        """Admin ve todos los registros RAC del ciclo."""
        self._auth(self.maestro)
        url = reverse("rac:registros-list")
        data = {
            "alumno": self.alumno.pk,
            "escuela_regular": self.escuela.pk,
            "escuela_basica": self.escuela.pk,
            "maestro_apoyo": self.maestro.pk,
            "clasificacion": "DISCAPACIDAD",
            "subclasificacion": "DI",
            "service_type": "USAER",
        }
        self.client.post(url, data, format="json")

        self._auth(self.admin)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data if isinstance(response.data, list) else response.data.get("results", [])
        )
        self.assertEqual(len(results), 1)

    def test_maestro_otra_escuela_no_ve_rac_ajeno(self):
        """Maestro de otra escuela NO ve RAC de otra escuela."""
        self._auth(self.maestro)
        url = reverse("rac:registros-list")
        data = {
            "alumno": self.alumno.pk,
            "escuela_regular": self.escuela.pk,
            "escuela_basica": self.escuela.pk,
            "maestro_apoyo": self.maestro.pk,
            "clasificacion": "DISCAPACIDAD",
            "subclasificacion": "DI",
            "service_type": "USAER",
        }
        self.client.post(url, data, format="json")

        self._auth(self.maestro_otra_esc)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = (
            response.data if isinstance(response.data, list) else response.data.get("results", [])
        )
        self.assertEqual(len(results), 0)

    def test_admin_exporta_rac_completo(self):
        """Admin puede exportar el concentrado RAC completo."""
        self._auth(self.admin)
        url = reverse("rac:exportar_todo")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response["Content-Type"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
