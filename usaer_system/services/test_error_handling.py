"""
test_error_handling.py — Unit tests para services/error_handling.py

Prueba que los helpers retornen Response con el formato y status esperados.
"""

from __future__ import annotations

from django.test import SimpleTestCase

from .error_handling import (
    ErrorResponse,
    ValidationErrorDetail,
    ValidationErrorResponse,
    error_400,
    error_403,
    error_404,
    error_409,
    error_500,
    error_response,
    pydantic_error_response,
)


class ErrorResponseModelsTest(SimpleTestCase):
    def test_error_response_defaults(self):
        r = ErrorResponse(detail="Algo salio mal")
        self.assertEqual(r.detail, "Algo salio mal")
        self.assertEqual(r.code, "error")

    def test_validation_error_detail(self):
        d = ValidationErrorDetail(field="nombre", message="Este campo es obligatorio")
        self.assertEqual(d.field, "nombre")
        self.assertEqual(d.message, "Este campo es obligatorio")

    def test_validation_error_response_defaults(self):
        r = ValidationErrorResponse()
        self.assertEqual(r.detail, "Error de validaci\u00f3n")
        self.assertEqual(r.code, "validation_error")
        self.assertEqual(r.errors, [])


class ErrorResponseHelpersTest(SimpleTestCase):
    def test_error_response_ok(self):
        resp = error_response("test", 418)
        self.assertEqual(resp.status_code, 418)
        self.assertEqual(resp.data, {"detail": "test", "code": "error"})

    def test_error_400(self):
        resp = error_400("campo invalido")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data["code"], "validation_error")

    def test_error_403(self):
        resp = error_403()
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.data["code"], "forbidden")

    def test_error_403_custom_detail(self):
        resp = error_403("Solo administradores")
        self.assertEqual(resp.data["detail"], "Solo administradores")

    def test_error_404(self):
        resp = error_404("Usuario no encontrado")
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.data["code"], "not_found")

    def test_error_404_default(self):
        resp = error_404()
        self.assertEqual(resp.data["detail"], "Recurso no encontrado.")

    def test_error_409(self):
        resp = error_409("Conflicto de estado")
        self.assertEqual(resp.status_code, 409)
        self.assertEqual(resp.data["code"], "conflict")

    def test_error_500(self):
        resp = error_500()
        self.assertEqual(resp.status_code, 500)
        self.assertEqual(resp.data["code"], "internal_error")

    def test_error_500_custom(self):
        resp = error_500("Exploto todo")
        self.assertEqual(resp.data["detail"], "Exploto todo")


class PydanticErrorResponseTest(SimpleTestCase):
    def test_pydantic_validation_error(self):
        from pydantic import BaseModel, Field

        class TestModel(BaseModel):
            name: str = Field(min_length=1)

        try:
            TestModel(name="")
        except Exception as e:
            resp = pydantic_error_response(e)
            self.assertEqual(resp.status_code, 400)
            self.assertEqual(resp.data["code"], "validation_error")
            self.assertIn("errors", resp.data)

    def test_non_pydantic_exception_fallback(self):
        resp = pydantic_error_response(RuntimeError("boom"))
        self.assertEqual(resp.status_code, 500)
