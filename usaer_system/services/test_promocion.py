"""
test_promocion.py — Unit tests para promocion_service.py

Prueba las primitivas de parseo, clasificación, simulación y ejecución
de promoción de alumnos, sin depender de la DB (usa objetos mock).
"""

from __future__ import annotations

from unittest.mock import MagicMock

from django.test import SimpleTestCase

from .promocion_service import (
    clasificar_promocion,
    clasificar_promocion_con_nivel,
    detect_nivel,
    ejecutar_promocion_por_nivel,
    ejecutar_promocion_simple,
    max_grado_por_nivel,
    parse_grado,
    simular_promocion_por_nivel,
    simular_promocion_simple,
)


def _alumno_mock(id: int, grado: str, nombre: str = "Juan Perez", escuela_nivel: str | None = None):
    """Crea un MagicMock que simula un objeto Alumno."""
    m = MagicMock()
    m.id = id
    m.grado = grado
    m.get_full_name.return_value = nombre

    if escuela_nivel is not None:
        escuela = MagicMock()
        escuela.nivel = escuela_nivel
        m.escuela = escuela
    else:
        m.escuela = None  # sin escuela asignada

    return m


# ─── parse_grado ────────────────────────────────────────────────────────


class ParseGradoTest(SimpleTestCase):
    def test_numero_simple(self):
        self.assertEqual(parse_grado("3"), 3)

    def test_con_simbolo_grado(self):
        self.assertEqual(parse_grado("1°"), 1)

    def test_con_espacios(self):
        self.assertEqual(parse_grado("  2  "), 2)

    def test_con_leading_zeros(self):
        self.assertEqual(parse_grado("01"), 1)

    def test_vacio_devuelve_none(self):
        self.assertIsNone(parse_grado(""))

    def test_none_devuelve_none(self):
        self.assertIsNone(parse_grado(""))

    def test_sin_digitos_devuelve_none(self):
        self.assertIsNone(parse_grado("abc"))


# ─── detect_nivel ────────────────────────────────────────────────────────


class DetectNivelTest(SimpleTestCase):
    def test_sin_escuela_devuelve_primaria(self):
        alumno = _alumno_mock(1, "1")
        self.assertEqual(detect_nivel(alumno), "PRIMARIA")

    def test_preescolar(self):
        alumno = _alumno_mock(1, "1", escuela_nivel="PREESCOLAR")
        self.assertEqual(detect_nivel(alumno), "PREESCOLAR")

    def test_secundaria(self):
        alumno = _alumno_mock(1, "1", escuela_nivel="SECUNDARIA")
        self.assertEqual(detect_nivel(alumno), "SECUNDARIA")

    def test_telesecundaria(self):
        alumno = _alumno_mock(1, "1", escuela_nivel="TELESECUNDARIA")
        self.assertEqual(detect_nivel(alumno), "TELESECUNDARIA")


# ─── max_grado_por_nivel ─────────────────────────────────────────────────


class MaxGradoPorNivelTest(SimpleTestCase):
    def test_primaria(self):
        self.assertEqual(max_grado_por_nivel("PRIMARIA"), 6)

    def test_preescolar(self):
        self.assertEqual(max_grado_por_nivel("PREESCOLAR"), 3)

    def test_secundaria(self):
        self.assertEqual(max_grado_por_nivel("SECUNDARIA"), 3)

    def test_telesecundaria(self):
        self.assertEqual(max_grado_por_nivel("TELESECUNDARIA"), 3)

    def test_default(self):
        self.assertEqual(max_grado_por_nivel("DESCONOCIDO"), 6)

    def test_case_insensitive(self):
        self.assertEqual(max_grado_por_nivel("preescolar"), 3)
        self.assertEqual(max_grado_por_nivel("Secundaria"), 3)


# ─── clasificar_promocion ───────────────────────────────────────────────


class ClasificarPromocionTest(SimpleTestCase):
    def test_promueve_grado_1_a_5(self):
        for g in ["1", "2", "3", "4", "5"]:
            alumno = _alumno_mock(1, g)
            result = clasificar_promocion(alumno, max_grado=6)
            self.assertIsNotNone(result)
            assert result is not None
            self.assertEqual(result["tipo"], "promover")
            self.assertEqual(result["grado_siguiente"], str(int(g) + 1))

    def test_gradua_grado_6(self):
        alumno = _alumno_mock(1, "6")
        result = clasificar_promocion(alumno, max_grado=6)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["tipo"], "graduar")
        self.assertIsNone(result["grado_siguiente"])

    def test_grado_invalido_devuelve_razon(self):
        alumno = _alumno_mock(1, "abc")
        result = clasificar_promocion(alumno, max_grado=6)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertIn("razon", result)

    def test_max_grado_3_gradua_en_3(self):
        alumno = _alumno_mock(1, "3")
        result = clasificar_promocion(alumno, max_grado=3)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["tipo"], "graduar")

    def test_max_grado_3_promueve_en_2(self):
        alumno = _alumno_mock(1, "2")
        result = clasificar_promocion(alumno, max_grado=3)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["tipo"], "promover")
        self.assertEqual(result["grado_siguiente"], "3")


class ClasificarPromocionConNivelTest(SimpleTestCase):
    def test_preescolar_3_gradua(self):
        alumno = _alumno_mock(1, "3", escuela_nivel="PREESCOLAR")
        result = clasificar_promocion_con_nivel(alumno)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["tipo"], "graduar")
        self.assertEqual(result["nivel"], "PREESCOLAR")

    def test_preescolar_2_promueve(self):
        alumno = _alumno_mock(1, "2", escuela_nivel="PREESCOLAR")
        result = clasificar_promocion_con_nivel(alumno)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["tipo"], "promover")
        self.assertEqual(result["grado_siguiente"], "3")

    def test_primaria_6_gradua(self):
        alumno = _alumno_mock(1, "6", escuela_nivel="PRIMARIA")
        result = clasificar_promocion_con_nivel(alumno)
        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result["tipo"], "graduar")


# ─── simular_promocion_simple ──────────────────────────────────────────


class SimularPromocionSimpleTest(SimpleTestCase):
    def test_vacio(self):
        prom, grad, om = simular_promocion_simple([])
        self.assertEqual(prom, [])
        self.assertEqual(grad, [])
        self.assertEqual(om, [])

    def test_promueve_y_gradua(self):
        alumnos = [
            _alumno_mock(1, "1"),
            _alumno_mock(2, "6"),
            _alumno_mock(3, "3"),
        ]
        prom, grad, om = simular_promocion_simple(alumnos)
        self.assertEqual(len(prom), 2)  # ids 1, 3
        self.assertEqual(len(grad), 1)  # id 2
        self.assertEqual(om, [])

    def test_omitidos(self):
        alumnos = [
            _alumno_mock(1, "abc"),
            _alumno_mock(2, "xyz"),
        ]
        prom, grad, om = simular_promocion_simple(alumnos)
        self.assertEqual(prom, [])
        self.assertEqual(grad, [])
        self.assertEqual(len(om), 2)


# ─── simular_promocion_por_nivel ───────────────────────────────────────


class SimularPromocionPorNivelTest(SimpleTestCase):
    def test_vacio(self):
        result = simular_promocion_por_nivel([])
        self.assertEqual(result, {"promover": [], "graduar": [], "errores": []})

    def test_promueve_y_gradua(self):
        alumnos = [
            _alumno_mock(1, "1", escuela_nivel="PRIMARIA"),
            _alumno_mock(2, "6", escuela_nivel="PRIMARIA"),
        ]
        result = simular_promocion_por_nivel(alumnos)
        self.assertEqual(len(result["promover"]), 1)
        self.assertEqual(len(result["graduar"]), 1)
        self.assertEqual(result["errores"], [])

    def test_descripcion_textual(self):
        alumnos = [
            _alumno_mock(1, "1", nombre="Juan Perez", escuela_nivel="PRIMARIA"),
        ]
        result = simular_promocion_por_nivel(alumnos)
        self.assertIn("Juan Perez", result["promover"][0])
        self.assertIn("PRIMARIA", result["promover"][0])
        self.assertIn("2°", result["promover"][0])


# ─── ejecutar_promocion_simple ──────────────────────────────────────────


class EjecutarPromocionSimpleTest(SimpleTestCase):
    def test_vacio_no_levanta(self):
        ciclo_mock = MagicMock()
        cycle = MagicMock()
        ciclo_mock.nombre = "2024-2025"
        prom, grad, err = ejecutar_promocion_simple([], cycle)
        self.assertEqual(prom, 0)
        self.assertEqual(grad, 0)
        self.assertEqual(err, [])

    def test_promueve(self):
        ciclo_mock = MagicMock()
        alumno = _alumno_mock(1, "2")
        prom, grad, err = ejecutar_promocion_simple([alumno], ciclo_mock)
        self.assertEqual(prom, 1)
        self.assertEqual(grad, 0)
        self.assertEqual(err, [])

    def test_gradua(self):
        ciclo_mock = MagicMock()
        alumno = _alumno_mock(1, "6")
        prom, grad, err = ejecutar_promocion_simple([alumno], ciclo_mock)
        self.assertEqual(prom, 0)
        self.assertEqual(grad, 1)
        self.assertEqual(err, [])

    def test_grado_invalido_se_omite(self):
        ciclo_mock = MagicMock()
        alumno = _alumno_mock(1, "abc")
        prom, grad, err = ejecutar_promocion_simple([alumno], ciclo_mock)
        self.assertEqual(prom, 0)
        self.assertEqual(grad, 0)
        self.assertEqual(len(err), 1)


# ─── ejecutar_promocion_por_nivel ──────────────────────────────────────


class EjecutarPromocionPorNivelTest(SimpleTestCase):
    def test_vacio_no_levanta(self):
        prom, grad = ejecutar_promocion_por_nivel([])
        self.assertEqual(prom, 0)
        self.assertEqual(grad, 0)

    def test_promueve(self):
        alumno = _alumno_mock(1, "2", escuela_nivel="PRIMARIA")
        prom, grad = ejecutar_promocion_por_nivel([alumno])
        self.assertEqual(prom, 1)
        self.assertEqual(grad, 0)

    def test_gradua(self):
        alumno = _alumno_mock(1, "6", escuela_nivel="PRIMARIA")
        prom, grad = ejecutar_promocion_por_nivel([alumno])
        self.assertEqual(prom, 0)
        self.assertEqual(grad, 1)

    def test_preescolar_3_gradua(self):
        alumno = _alumno_mock(1, "3", escuela_nivel="PREESCOLAR")
        prom, grad = ejecutar_promocion_por_nivel([alumno])
        self.assertEqual(prom, 0)
        self.assertEqual(grad, 1)

    def test_grado_invalido_se_ignora(self):
        alumno = _alumno_mock(1, "abc", escuela_nivel="PRIMARIA")
        prom, grad = ejecutar_promocion_por_nivel([alumno])
        self.assertEqual(prom, 0)
        self.assertEqual(grad, 0)
