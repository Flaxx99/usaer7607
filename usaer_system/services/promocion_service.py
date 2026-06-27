"""
Service de promoción — primitivas compartidas entre alumnos::promover y PromocionAlumnosView.

No orquesta el flujo completo (cada view tiene diferencias reales:
idempotencia por last_promotion_cycle, desactivación de ciclo, etc.).
Expone funciones puras reutilizables para parseo, clasificación y ejecución.
"""

from __future__ import annotations

from typing import Any


def parse_grado(grado_value: str) -> int | None:
    """Extrae el valor numérico del grado como string.

    Maneja formatos mixtos: '1°', '3', ' 2do ', '01', etc.
    Returns None si no hay dígitos en el valor.
    """
    if not grado_value:
        return None
    numeros = "".join(filter(str.isdigit, str(grado_value).strip()))
    if not numeros:
        return None
    return int(numeros)


def detect_nivel(alumno: Any) -> str:
    """Detecta el nivel educativo desde la escuela del alumno.

    Busca alumno.escuela.nivel, fallbacks a 'PRIMARIA'.
    """
    try:
        if hasattr(alumno, "escuela") and alumno.escuela is not None:
            nivel = getattr(alumno.escuela, "nivel", None)
            if nivel is not None:
                return str(nivel).upper()
    except Exception:
        pass
    return "PRIMARIA"


def max_grado_por_nivel(nivel: str) -> int:
    """Devuelve el grado máximo para el nivel educativo detectado.

    - PREESCOLAR, SECUNDARIA, TELESECUNDARIA -> 3
    - PRIMARIA y todos los demás -> 6
    """
    n = str(nivel).upper().strip()
    if "PREESCOLAR" in n or "SECUNDARIA" in n or "TELESECUNDARIA" in n:
        return 3
    return 6


# ─── Clasificación individual ──────────────────────────────────────────────


def clasificar_promocion(
    alumno: Any,
    max_grado: int = 6,
) -> dict | None:
    """Clasifica un alumno individual para promoción.

    Returns dict con {id, nombre, grado_actual, grado_siguiente, nivel...}
    dependiendo del resultado, o None si hay error que deba omitirse.

    Para errores recuperables (grado no parseable), el dict incluye 'razon'.
    """
    nombre = alumno.get_full_name() if hasattr(alumno, "get_full_name") else str(alumno)
    grado_str = str(getattr(alumno, "grado", "") or "")
    grado_num = parse_grado(grado_str)

    if grado_num is None:
        return {
            "id": getattr(alumno, "id", 0),
            "nombre": nombre,
            "grado_actual": grado_str,
            "razon": f"Grado '{grado_str}' no es un número válido.",
        }

    entry = {
        "id": getattr(alumno, "id", 0),
        "nombre": nombre,
        "grado_actual": grado_str,
    }

    if grado_num >= max_grado:
        entry["grado_siguiente"] = None
        entry["tipo"] = "graduar"
    else:
        entry["grado_siguiente"] = str(grado_num + 1)
        entry["tipo"] = "promover"

    return entry


def clasificar_promocion_con_nivel(alumno: Any) -> dict | None:
    """Clasifica un alumno detectando el nivel educativo de su escuela.

    Para escuelas PREESCOLAR/SECUNDARIA, max_grado=3.
    Para PRIMARIA, max_grado=6.
    """
    nivel = detect_nivel(alumno)
    max_grado = max_grado_por_nivel(nivel)
    entry = clasificar_promocion(alumno, max_grado=max_grado)
    if entry is not None:
        entry["nivel"] = nivel
    return entry


# ─── Simulación (GET — pura, sin efectos secundarios) ──────────────────────


def simular_promocion_simple(alumnos) -> tuple[list[dict], list[dict], list[dict]]:
    """Simulación básica: max_grado hardcodeado en 6.

    Returns (promovidos, graduados, omitidos).
    Cada entry: {id, nombre, grado_actual, grado_siguiente (opcional)}.
    Omitidos incluyen 'razon'.
    """
    promovidos: list[dict] = []
    graduados: list[dict] = []
    omitidos: list[dict] = []

    for alumno in alumnos:
        entry = clasificar_promocion(alumno, max_grado=6)
        if entry is None:
            continue
        if "razon" in entry:
            omitidos.append(entry)
        elif entry.get("tipo") == "graduar":
            graduados.append(entry)
        else:
            promovidos.append(entry)

    return promovidos, graduados, omitidos


def simular_promocion_por_nivel(alumnos) -> dict:
    """Simulación con detección de nivel educativo.

    Returns dict con claves 'promover', 'graduar', 'errores'.
    Cada entry incluye 'nivel' y usa descripciones textuales como
    en PromocionAlumnosView original.
    """
    resultado: dict[str, list[str]] = {"promover": [], "graduar": [], "errores": []}

    for alumno in alumnos:
        nombre = alumno.get_full_name() if hasattr(alumno, "get_full_name") else str(alumno)
        try:
            if not getattr(alumno, "grado", None):
                continue

            grado_num = parse_grado(alumno.grado)
            if grado_num is None:
                raise ValueError(f"Grado inválido: {alumno.grado}")

            nivel = detect_nivel(alumno)
            tope = max_grado_por_nivel(nivel)

            if grado_num >= tope:
                resultado["graduar"].append(f"{nombre} ({nivel} {grado_num}° -> Egresado)")
            else:
                resultado["promover"].append(f"{nombre} ({nivel} {grado_num}° -> {grado_num + 1}°)")
        except Exception as e:
            resultado["errores"].append(f"{nombre}: {str(e)}")

    return resultado


# ─── Ejecución (POST — escribe en DB) ──────────────────────────────────────


def ejecutar_promocion_simple(
    alumnos,
    ciclo,
) -> tuple[int, int, list[str]]:
    """Ejecuta promoción básica: max_grado=6, marca last_promotion_cycle.

    Returns (promovidos_count, graduados_count, errores).
    """
    promovidos = 0
    graduados = 0
    errores: list[str] = []

    for alumno in alumnos:
        nombre = alumno.get_full_name() if hasattr(alumno, "get_full_name") else str(alumno)
        grado_num = parse_grado(alumno.grado)

        if grado_num is None:
            errores.append(f"Alumno '{nombre}' omitido: grado '{alumno.grado}' no válido.")
            continue

        # Idempotencia: marcar ciclo de promoción
        alumno.last_promotion_cycle = ciclo

        if grado_num >= 6:
            alumno.activo = False
            alumno.grupo = ""
            alumno.save()
            graduados += 1
        else:
            alumno.grado = str(grado_num + 1)
            alumno.grupo = ""
            alumno.save()
            promovidos += 1

    return promovidos, graduados, errores


def ejecutar_promocion_por_nivel(alumnos) -> tuple[int, int]:
    """Ejecuta promoción con detección de nivel educativo.

    Returns (promovidos, graduados).
    Los errores se silencian (coincide con comportamiento original de PromocionAlumnosView).
    """
    promovidos = 0
    graduados = 0

    for alumno in alumnos:
        try:
            if not getattr(alumno, "grado", None):
                continue

            grado_num = parse_grado(alumno.grado)
            if grado_num is None:
                continue

            nivel = detect_nivel(alumno)
            tope = max_grado_por_nivel(nivel)

            if grado_num >= tope:
                alumno.activo = False
                graduados += 1
            else:
                alumno.grado = str(grado_num + 1)
                alumno.grupo = ""
                promovidos += 1

            alumno.save()
        except Exception:
            continue

    return promovidos, graduados
