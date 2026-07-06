#!/usr/bin/env python
"""
Genera tipos TypeScript desde los modelos pydantic.

Usage:
    python scripts/generate_types.py

Output:
    frontend/src/interfaces/api.ts  (tipos generados automáticamente)
    frontend/src/interfaces/api.schemas.json  (JSON Schema fuente)

Requiere: Django con settings accesibles (usa las variables de
entorno del proyecto o un .env).
"""

from __future__ import annotations

import json
import os
import sys

# ─── Setup Django ────────────────────────────────────────────────────────

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "usaer_system.settings")
os.environ.setdefault("SECRET_KEY", "typegen-secret-key")
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("ALLOWED_HOSTS", "localhost")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "usaer_system"))

import django  # noqa: E402

django.setup()

# ─── Imports ─────────────────────────────────────────────────────────────

from datetime import datetime  # noqa: E402
from typing import Any, Union, get_args, get_origin  # noqa: E402

from pydantic import BaseModel  # noqa: E402
from services.dto import (  # noqa: E402
    ActividadRecienteDTO,
    AlumnoPromoverCommitResponse,
    AlumnoPromoverResponse,
    AlumnoResponse,
    AnuncioResponse,
    AsistenciaResponse,
    AsistenciaTrendEntry,
    AvisoDTO,
    CerrarRegistroResponse,
    ChartEntry,
    ChecadorResponse,
    CicloEscolarResponse,
    DashboardData,
    EscuelaFilterOption,
    EscuelaResponse,
    EscuelaSimpleResponse,
    EventoCalendarioResponse,
    ExpedienteResponse,
    GraficaEscuelaEntry,
    IncidenciaResponse,
    LoginResponse,
    MetricasPermisoResponse,
    NotificacionResponse,
    OficioResponse,
    OtroArchivoResponse,
    PermisoResponse,
    PromocionExecResponse,
    PromocionPreviewResponse,
    RACPendientesResponse,
    RAEAlumnoResponse,
    RAEDashboardProgress,
    RAEInitResponse,
    RAEProgressItem,
    RegistroRACResponse,
    RegistroRAEResponse,
    StatsDTO,
    StatusDetailResponse,
    ToggleActiveResponse,
    UnreadCountResponse,
    UsuarioResponse,
)
from services.error_handling import (  # noqa: E402
    ErrorResponse,
    ValidationErrorDetail,
    ValidationErrorResponse,
)

# ─── Type Mapper ──────────────────────────────────────────────────────────

TYPE_MAP: dict[type, str] = {
    str: "string",
    int: "number",
    float: "number",
    bool: "boolean",
    datetime: "string /* ISO datetime */",
    type(None): "null",
    Any: "any",
}


def field_type_to_ts(field_type: type, model_registry: dict[str, str]) -> str:
    """Convierte un tipo Python (de Field.annotation) a TypeScript."""
    origin = get_origin(field_type)
    args = get_args(field_type)

    # Optional[X] = Union[X, None]
    if origin is Union:
        non_none = [a for a in args if a is not type(None)]
        if len(non_none) == 1:
            inner = field_type_to_ts(non_none[0], model_registry)
            return inner  # optional field, caller adds ?
        parts = [field_type_to_ts(a, model_registry) for a in args if a is not type(None)]
        return " | ".join(parts)

    # Literal values
    if origin is not None and getattr(origin, "__qualname__", None) == "Literal":
        ts_values = []
        for a in args:
            if a is True:
                ts_values.append("true")
            elif a is False:
                ts_values.append("false")
            elif a is None:
                ts_values.append("null")
            elif isinstance(a, str):
                ts_values.append(repr(a))
            else:
                ts_values.append(str(a))
        return " | ".join(ts_values)

    # list[X]
    if origin is list:
        inner = field_type_to_ts(args[0], model_registry) if args else "unknown"
        return f"{inner}[]"

    # dict[str, X]
    if origin is dict:
        inner = field_type_to_ts(args[1], model_registry) if args else "unknown"
        return f"Record<string, {inner}>"

    # bare `dict` (not dict[str, X]) — get_origin returns None
    if field_type is dict:
        return "Record<string, unknown>"

    # Any (singleton, get_origin returns None in Python 3.14)
    if field_type is Any:
        return "any"

    # Direct mapping
    ts_type = TYPE_MAP.get(field_type)
    if ts_type:
        return ts_type

    # Pydantic model referenced by annotation itself
    type_name = getattr(field_type, "__name__", str(field_type))
    if type_name in model_registry:
        return type_name

    # Fallback: use the type name
    return type_name


def generate_interface(
    model: type[BaseModel],
    model_registry: dict[str, str],
) -> str:
    """Genera una interfaz TypeScript para un modelo pydantic."""
    model_name = model.__name__
    lines: list[str] = []
    lines.append(f"export interface {model_name} {{")

    for field_name, field_info in model.model_fields.items():
        ts_type = field_type_to_ts(field_info.annotation, model_registry)

        # pydantic v2: is_required() = True when no default / default_factory
        if field_info.is_required():
            ts_type_full = ts_type
        else:
            ts_type_full = f"{ts_type} | undefined"

        # Docstring from field description
        doc = ""
        if field_info.description:
            doc = f"  // {field_info.description}"

        lines.append(f"    {field_name}: {ts_type_full};{doc}")

    lines.append("}")
    lines.append("")
    return "\n".join(lines)


# ─── Main ─────────────────────────────────────────────────────────────────


def main() -> None:
    models = [
        # Service DTOs
        AvisoDTO,
        StatsDTO,
        DashboardData,
        ActividadRecienteDTO,
        AsistenciaTrendEntry,
        EscuelaFilterOption,
        RAEDashboardProgress,
        GraficaEscuelaEntry,
        ChartEntry,
        # Response models
        StatusDetailResponse,
        UnreadCountResponse,
        ToggleActiveResponse,
        MetricasPermisoResponse,
        PermisoResponse,
        IncidenciaResponse,
        AnuncioResponse,
        LoginResponse,
        CicloEscolarResponse,
        EscuelaResponse,
        EscuelaSimpleResponse,
        NotificacionResponse,
        OficioResponse,
        AsistenciaResponse,
        AlumnoResponse,
        UsuarioResponse,
        PromocionExecResponse,
        AlumnoPromoverResponse,
        AlumnoPromoverCommitResponse,
        PromocionPreviewResponse,
        CerrarRegistroResponse,
        ChecadorResponse,
        EventoCalendarioResponse,
        ExpedienteResponse,
        OtroArchivoResponse,
        RACPendientesResponse,
        RAEAlumnoResponse,
        RAEInitResponse,
        RAEProgressItem,
        RegistroRACResponse,
        RegistroRAEResponse,
        # Error handling
        ErrorResponse,
        ValidationErrorDetail,
        ValidationErrorResponse,
    ]

    # Build registry for cross-references
    model_registry: dict[str, str] = {}
    for m in models:
        model_registry[m.__name__] = m.__name__

    # ── JSON Schema export (for reference / tooling) ──
    schemas: dict[str, Any] = {}
    for m in models:
        schemas[m.__name__] = m.model_json_schema()

    output_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "interfaces")
    os.makedirs(output_dir, exist_ok=True)

    with open(os.path.join(output_dir, "api.schemas.json"), "w") as f:
        json.dump(schemas, f, indent=2, default=str)
    print(f"[OK] JSON Schema escrito: {os.path.join(output_dir, 'api.schemas.json')}")

    # ── TypeScript interfaces ──
    ts_lines = [
        "// ============================================================",
        "// api.ts - Tipos generados automaticamente desde pydantic",
        "// NO EDITES A MANO. Ejecuta: python scripts/generate_types.py",
        "// ============================================================",
        "",
        "// --- Helpers -------------------------------------------------",
        "",
        "export interface PaginatedResponse<T> {",
        "    count: number;",
        "    next: string | null;",
        "    previous: string | null;",
        "    results: T[];",
        "}",
        "",
    ]

    for model in models:
        ts_lines.append(generate_interface(model, model_registry))

    output_path = os.path.join(output_dir, "api.ts")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(ts_lines))
    print(f"[OK] TypeScript escrito: {output_path}")

    # Summary
    model_count = len(models)
    field_count = sum(len(m.model_fields) for m in models)
    print(f"\n[OK] {model_count} interfaces generadas ({field_count} campos totales)")


if __name__ == "__main__":
    main()
