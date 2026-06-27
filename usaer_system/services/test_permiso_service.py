"""
test_permiso_service.py — Unit tests para permiso_service.py

Prueba responder_permiso con mocks, sin depender de la DB.
"""

from __future__ import annotations

from unittest.mock import MagicMock

from django.test import SimpleTestCase

from services.dto import ResponderPermisoPayload
from services.permiso_service import responder_permiso


def _permiso_mock(estado: str = "PENDIENTE"):
    """Crea un MagicMock que simula un Permiso."""
    m = MagicMock()
    m.estado = estado
    m.get_estado_display.return_value = estado.capitalize()
    m.Estado.PENDIENTE = "PENDIENTE"
    m.respuesta_admin = ""
    m.administrador = None
    m.fecha_respuesta = None
    return m


def _user_mock(role: str = "ADMIN", is_superuser: bool = False):
    """Crea un MagicMock que simula un User."""
    m = MagicMock()
    m.role = role
    m.is_superuser = is_superuser
    return m


class ResponderPermisoTest(SimpleTestCase):
    def test_aprueba_permiso_pendiente(self):
        permiso = _permiso_mock("PENDIENTE")
        payload = ResponderPermisoPayload(estado="APROBADO")
        user = _user_mock("ADMIN")

        responder_permiso(permiso, payload, user)

        self.assertEqual(permiso.estado, "APROBADO")
        self.assertEqual(permiso.administrador, user)
        self.assertIsNotNone(permiso.fecha_respuesta)
        permiso.save.assert_called_once()

    def test_rechaza_permiso_pendiente(self):
        permiso = _permiso_mock("PENDIENTE")
        payload = ResponderPermisoPayload(estado="RECHAZADO", respuesta_admin="No procede")
        user = _user_mock("DIRECTOR")

        responder_permiso(permiso, payload, user)

        self.assertEqual(permiso.estado, "RECHAZADO")
        self.assertEqual(permiso.respuesta_admin, "NO PROCEDE")
        permiso.save.assert_called_once()

    def test_ya_gestionado_levanta_error(self):
        permiso = _permiso_mock("APROBADO")
        payload = ResponderPermisoPayload(estado="APROBADO")
        user = _user_mock("ADMIN")

        with self.assertRaises(ValueError) as ctx:
            responder_permiso(permiso, payload, user)

        self.assertIn("ya ha sido gestionado", str(ctx.exception))

    def test_sin_autoridad_levanta_error(self):
        permiso = _permiso_mock("PENDIENTE")
        payload = ResponderPermisoPayload(estado="APROBADO")
        user = _user_mock("MAESTRO")

        with self.assertRaises(PermissionError) as ctx:
            responder_permiso(permiso, payload, user)

        self.assertIn("No tienes permiso", str(ctx.exception))

    def test_superuser_puede_responder(self):
        permiso = _permiso_mock("PENDIENTE")
        payload = ResponderPermisoPayload(estado="APROBADO")
        user = _user_mock("MAESTRO", is_superuser=True)

        responder_permiso(permiso, payload, user)

        self.assertEqual(permiso.estado, "APROBADO")

    def test_rol_sin_escuela_no_levanta(self):
        """Director sin user.role explícito (None) no pasa autorizacion."""
        permiso = _permiso_mock("PENDIENTE")
        payload = ResponderPermisoPayload(estado="APROBADO")
        user = _user_mock(None)

        with self.assertRaises(PermissionError):
            responder_permiso(permiso, payload, user)
