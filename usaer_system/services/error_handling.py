"""
Error handling — helpers consistentes para errores HTTP con pydantic.

Reemplaza el patrón `return Response({"detail": "..."}, status=N)` con
llamadas explícitas y tipadas. Centraliza códigos de error y formato.
"""

from __future__ import annotations

from pydantic import BaseModel, Field
from rest_framework import status
from rest_framework.response import Response


class ErrorResponse(BaseModel):
    """Cuerpo de respuesta estándar para errores.

    Reemplaza los dicts sueltos `{"detail": "..."}` por un modelo
    trazable. code permite clasificar el error en el frontend.
    """

    detail: str
    code: str = "error"


class ValidationErrorDetail(BaseModel):
    """Un field-error individual (campo + mensaje)."""

    field: str = ""
    message: str


class ValidationErrorResponse(BaseModel):
    """Cuerpo de respuesta para errores de validación (400)."""

    detail: str = "Error de validación"
    code: str = "validation_error"
    errors: list[ValidationErrorDetail] = Field(default_factory=list)


# ─── Helpers ───────────────────────────────────────────────────────────────


def error_response(detail: str, status_code: int = 400, code: str = "error") -> Response:
    """Crea una Response con ErrorResponse tipado.

    Uso directo para casos genéricos:
        return error_response("No encontrado", 404)
    """
    return Response(
        ErrorResponse(detail=detail, code=code).model_dump(),
        status=status_code,
    )


def error_400(detail: str, code: str = "validation_error") -> Response:
    """Error 400 — solicitud inválida."""
    return error_response(detail, status_code=400, code=code)


def error_403(detail: str = "No tienes permiso para realizar esta acción.") -> Response:
    """Error 403 — permisos insuficientes."""
    return error_response(detail, status_code=403, code="forbidden")


def error_404(detail: str = "Recurso no encontrado.") -> Response:
    """Error 404 — recurso inexistente."""
    return error_response(detail, status_code=404, code="not_found")


def error_409(detail: str, code: str = "conflict") -> Response:
    """Error 409 — conflicto de estado."""
    return error_response(detail, status_code=409, code=code)


def error_500(detail: str = "Error interno del servidor.") -> Response:
    """Error 500 — fallo interno."""
    return error_response(detail, status_code=500, code="internal_error")


def pydantic_error_response(
    exc: BaseException,
    *,
    default_detail: str = "Error de validación",
) -> Response:
    """Convierte un pydantic ValidationError en Response 400.

    Uso:
        except ValidationError as e:
            return pydantic_error_response(e)

    NOTA: importar pydantic.ValidationError como alias cuando
    DRF ValidationError también esté importado:
        from pydantic import ValidationError as PydanticValidationError
    """
    from pydantic import ValidationError  # noqa: PLC0415

    if isinstance(exc, ValidationError):
        return Response(
            ValidationErrorResponse(
                detail=default_detail,
                errors=[
                    ValidationErrorDetail(
                        field=".".join(str(p) for p in err.get("loc", [])),
                        message=err.get("msg", ""),
                    )
                    for err in exc.errors()
                ],
            ).model_dump(),
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Fallback: no es un ValidationError pydantic
    return error_500(str(exc))
