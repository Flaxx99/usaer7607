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
            "usuarios": {
                "email": f"newuser{c}@test.com",
                "numero_empleado": f"NU{c:04d}",
                "password": "pass123",
                "role": "MAESTRO_APOYO",
                "nombres": "Nuevo",
                "apellido_paterno": f"Usuario{c}",
            },
            "ciclos": {
                "nombre": f"2026-2027-{c:03d}",
                "fecha_inicio": "2026-08-01",
                "fecha_fin": "2027-07-31",
                "activo": False,
            },
        }
        return payloads.get(endpoint, {})

    def test_rbac_get_matrix(self):
        """Matriz GET: qué roles pueden leer qué endpoints."""
        cases = [
            # === Escuelas ===
            ("ANON", "escuelas:escuelas-list", [], 401, "escuelas-GET"),
            ("MAESTRO_APOYO", "escuelas:escuelas-list", [], 200, "escuelas-GET-maestro"),
            ("ADMIN", "escuelas:escuelas-list", [], 200, "escuelas-GET-admin"),
            # === Alumnos ===
            ("ADMIN", "alumnos:alumnos-list", [], 200, "alumnos-GET-admin"),
            ("MAESTRO_APOYO", "alumnos:alumnos-list", [], 200, "alumnos-GET-maestro"),
            ("PSICOLOGO", "alumnos:alumnos-list", [], 403, "alumnos-GET-psicologo-deny"),
            # === Incidencias ===
            ("ADMIN", "incidencias:incidencias-list", [], 200, "incidencias-GET-admin"),
            ("MAESTRO_APOYO", "incidencias:incidencias-list", [], 200, "incidencias-GET-maestro"),
            # === Oficios ===
            ("MAESTRO_APOYO", "oficios:oficios-list", [], 200, "oficios-GET-maestro"),
            ("PSICOLOGO", "oficios:oficios-list", [], 200, "oficios-GET-psicologo"),
            ("ADMIN", "oficios:oficios-list", [], 200, "oficios-GET-admin"),
            # === Permisos ===
            ("ADMIN", "permisos:permisos-list", [], 200, "permisos-GET-admin"),
            ("MAESTRO_APOYO", "permisos:permisos-list", [], 200, "permisos-GET-maestro"),
            # === Avisos ===
            ("ADMIN", "avisos:anuncios-list", [], 200, "avisos-GET-admin"),
            ("MAESTRO_APOYO", "avisos:anuncios-list", [], 200, "avisos-GET-maestro"),
            # === Usuarios (REVISADO: SECRETARIO ya no tiene acceso) ===
            ("ADMIN", "usuarios:usuario-list", [], 200, "usuarios-GET-admin"),
            ("SECRETARIO", "usuarios:usuario-list", [], 403, "usuarios-GET-secretario-deny"),
            ("MAESTRO_APOYO", "usuarios:usuario-list", [], 403, "usuarios-GET-maestro-deny"),
            ("ANON", "usuarios:usuario-list", [], 401, "usuarios-GET-anon-deny"),
            # === Ciclos Escolares (NUEVO) ===
            ("ADMIN", "ciclos:ciclos-list", [], 200, "ciclos-GET-admin"),
            ("SECRETARIO", "ciclos:ciclos-list", [], 200, "ciclos-GET-secretario"),
            ("MAESTRO_APOYO", "ciclos:ciclos-list", [], 403, "ciclos-GET-maestro-deny"),
            ("PSICOLOGO", "ciclos:ciclos-list", [], 403, "ciclos-GET-psicologo-deny"),
            ("ANON", "ciclos:ciclos-list", [], 401, "ciclos-GET-anon-deny"),
            # === R.A.E. (NUEVO) ===
            ("ADMIN", "rae:registros-list", [], 200, "rae-GET-admin"),
            ("MAESTRO_APOYO", "rae:registros-list", [], 200, "rae-GET-maestro"),
            ("ANON", "rae:registros-list", [], 401, "rae-GET-anon-deny"),
            # === R.A.C. (NUEVO) ===
            ("ADMIN", "rac:registros-list", [], 200, "rac-GET-admin"),
            ("MAESTRO_APOYO", "rac:registros-list", [], 200, "rac-GET-maestro"),
            ("ANON", "rac:registros-list", [], 401, "rac-GET-anon-deny"),
            # === Notificaciones (NUEVO) ===
            ("ADMIN", "notificaciones:notificaciones-list", [], 200, "notif-GET-admin"),
            ("MAESTRO_APOYO", "notificaciones:notificaciones-list", [], 200, "notif-GET-maestro"),
            # === Asistencias (NUEVO) ===
            ("ADMIN", "asistencias:asistencias-list", [], 200, "asis-GET-admin"),
            ("MAESTRO_APOYO", "asistencias:asistencias-list", [], 200, "asis-GET-maestro"),
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
            # === Usuarios (NUEVO): solo ADMIN puede crear ===
            ("ADMIN", "usuarios:usuario-list", "usuarios", (201, 200), "usuarios-POST-admin"),
            (
                "SECRETARIO",
                "usuarios:usuario-list",
                "usuarios",
                403,
                "usuarios-POST-secretario-deny",
            ),
            (
                "MAESTRO_APOYO",
                "usuarios:usuario-list",
                "usuarios",
                403,
                "usuarios-POST-maestro-deny",
            ),
            # === Ciclos (NUEVO): Admin y Secretario ===
            ("ADMIN", "ciclos:ciclos-list", "ciclos", (201, 200), "ciclos-POST-admin"),
            ("SECRETARIO", "ciclos:ciclos-list", "ciclos", (201, 200), "ciclos-POST-secretario"),
            ("MAESTRO_APOYO", "ciclos:ciclos-list", "ciclos", 403, "ciclos-POST-maestro-deny"),
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
