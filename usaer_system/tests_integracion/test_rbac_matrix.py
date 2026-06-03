"""
test_rbac_matrix.py — Matriz de seguridad parametrizada cross-app.

Prueba combinaciones clave de (rol, endpoint, verbo) contra el código
esperado. Usa subTest para que cada combinación se reporte individualmente.
"""

from django.urls import reverse

from .base import BaseIntegrationTest


class RBACMatrixTest(BaseIntegrationTest):
    """Valida la matriz de permisos contra endpoints críticos."""

    _counter = 0

    def _url(self, viewname, *args):
        try:
            return reverse(viewname, args=args)
        except Exception:
            return None

    def _role_user(self, role):
        mapping = {
            "ADMIN": self.admin,
            "DIRECTOR": self.director,
            "SECRETARIO": self.secretario,
            "MAESTRO_APOYO": self.maestro,
            "PSICOLOGO": self.psicologo,
            "TRAB_SOCIAL": self.trab_social,
            "ANON": None,
        }
        return mapping.get(role)

    def _post_data(self, endpoint):
        RBACMatrixTest._counter += 1
        c = RBACMatrixTest._counter
        payloads = {
            "escuelas": {
                "clave_estatal": f"NEW{c:03d}",
                "cct": f"CCTNEW{c:03d}",
                "nombre": f"Escuela {c}",
                "nivel": "PRIMARIA",
                "domicilio": "Dir",
                "colonia": "Col",
                "zona": "Z01",
            },
            "alumnos": {
                "profesor": self.maestro.pk,
                "escuela": self.escuela.pk,
                "apellido_paterno": f"N{c}",
                "apellido_materno": "A",
                "nombres": "Test",
                "curp": f"NEU{c:03d}XXX123456HOMBXX",
                "sexo": "H",
                "edad": 7,
                "grado": "1",
                "clasificacion": "DISCAPACIDAD",
            },
            "incidencias": {
                "titulo": f"Test {c}",
                "escuela": self.escuela.pk,
                "profesor": self.maestro.pk,
                "descripcion": "Test",
                "reportado_por": self.admin.pk,
            },
            "permisos": {
                "motivo": f"Test {c}",
                "fecha_inicio": "2026-06-03",
                "fecha_fin": "2026-06-03",
                "horas_solicitadas": 2,
            },
            "documentos": {
                "alumno": self.alumno.pk,
                "observaciones": "Test",
            },
            "avisos": {
                "titulo": f"Test Aviso {c}",
                "contenido": "Contenido test",
                "fecha_publicacion": "2026-06-03",
            },
        }
        return payloads.get(endpoint, {})

    def test_rbac_get_matrix(self):
        """Matriz GET: qué roles pueden leer qué endpoints."""
        cases = [
            ("ANON", "escuelas:escuelas-list", [], 401, "escuelas-GET"),
            ("MAESTRO_APOYO", "escuelas:escuelas-list", [], 200, "escuelas-GET-maestro"),
            ("ADMIN", "escuelas:escuelas-list", [], 200, "escuelas-GET-admin"),
            ("ADMIN", "alumnos:alumnos-list", [], 200, "alumnos-GET-admin"),
            ("MAESTRO_APOYO", "alumnos:alumnos-list", [], 200, "alumnos-GET-maestro"),
            ("ADMIN", "incidencias:incidencias-list", [], 200, "incidencias-GET-admin"),
            ("MAESTRO_APOYO", "incidencias:incidencias-list", [], 200, "incidencias-GET-maestro"),
            ("MAESTRO_APOYO", "oficios:oficios-list", [], 200, "oficios-GET-maestro"),
            ("PSICOLOGO", "oficios:oficios-list", [], 200, "oficios-GET-psicologo"),
            ("ADMIN", "permisos:permisos-list", [], 200, "permisos-GET-admin"),
            ("MAESTRO_APOYO", "permisos:permisos-list", [], 200, "permisos-GET-maestro"),
            ("ADMIN", "avisos:anuncios-list", [], 200, "avisos-GET-admin"),
            ("MAESTRO_APOYO", "avisos:anuncios-list", [], 200, "avisos-GET-maestro"),
            ("SECRETARIO", "usuarios:usuario-list", [], 200, "usuarios-GET-secretario"),
            ("MAESTRO_APOYO", "usuarios:usuario-list", [], 403, "usuarios-GET-maestro-deny"),
            ("ANON", "usuarios:usuario-list", [], 401, "usuarios-GET-anon-deny"),
        ]
        for role, viewname, args, expected, label in cases:
            with self.subTest(label=label, role=role, method="GET"):
                url = self._url(viewname, *args)
                if url is None:
                    self.skipTest(f"No se pudo resolver {viewname}")
                user = self._role_user(role)
                if user is None:
                    self._clear_auth()
                else:
                    self._auth(user)
                response = self.client.get(url)
                self.assertEqual(
                    response.status_code,
                    expected,
                    f"{label}: esperado {expected}, obtenido {response.status_code}",
                )

    def test_rbac_post_matrix(self):
        """Matriz POST: qué roles pueden crear en qué endpoints."""
        cases = [
            ("ANON", "escuelas:escuelas-list", "escuelas", 401, "escuelas-POST-anon"),
            (
                "MAESTRO_APOYO",
                "escuelas:escuelas-list",
                "escuelas",
                403,
                "escuelas-POST-maestro-deny",
            ),
            ("ADMIN", "escuelas:escuelas-list", "escuelas", (201, 200), "escuelas-POST-admin"),
            (
                "SECRETARIO",
                "escuelas:escuelas-list",
                "escuelas",
                (201, 200),
                "escuelas-POST-secretario",
            ),
            (
                "ADMIN",
                "incidencias:incidencias-list",
                "incidencias",
                (201, 200),
                "incidencias-POST-admin",
            ),
            (
                "DIRECTOR",
                "incidencias:incidencias-list",
                "incidencias",
                (201, 200),
                "incidencias-POST-director",
            ),
            (
                "SECRETARIO",
                "incidencias:incidencias-list",
                "incidencias",
                403,
                "incidencias-POST-secretario-deny",
            ),
            (
                "MAESTRO_APOYO",
                "incidencias:incidencias-list",
                "incidencias",
                403,
                "incidencias-POST-maestro-deny",
            ),
            (
                "MAESTRO_APOYO",
                "permisos:permisos-list",
                "permisos",
                (201, 200),
                "permisos-POST-maestro",
            ),
            ("ADMIN", "avisos:anuncios-list", "avisos", (201, 200), "avisos-POST-admin"),
            ("MAESTRO_APOYO", "avisos:anuncios-list", "avisos", 403, "avisos-POST-maestro-deny"),
            (
                "MAESTRO_APOYO",
                "documentos:documentos-list",
                "documentos",
                (201, 200),
                "docs-POST-maestro",
            ),
            (
                "PSICOLOGO",
                "documentos:documentos-list",
                "documentos",
                (201, 200),
                "docs-POST-psicologo",
            ),
        ]
        for role, viewname, endpoint_key, expected, label in cases:
            with self.subTest(label=label, role=role, method="POST"):
                url = self._url(viewname)
                if url is None:
                    self.skipTest(f"No se pudo resolver {viewname}")
                user = self._role_user(role)
                if user is None:
                    self._clear_auth()
                else:
                    self._auth(user)
                data = self._post_data(endpoint_key)
                fmt = "multipart" if endpoint_key == "documentos" else "json"
                response = self.client.post(url, data, format=fmt)
                if isinstance(expected, tuple):
                    self.assertIn(
                        response.status_code,
                        expected,
                        f"{label}: esperado {expected}, obtenido {response.status_code}",
                    )
                else:
                    self.assertEqual(
                        response.status_code,
                        expected,
                        f"{label}: esperado {expected}, obtenido {response.status_code}",
                    )
