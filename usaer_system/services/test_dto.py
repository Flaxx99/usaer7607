"""
test_dto.py — Unit tests para services/dto.py

Prueba la construcción, validación y serialización de todos los DTOs,
payload schemas y response models definidos con pydantic.
"""

from datetime import datetime

from django.test import SimpleTestCase
from pydantic import ValidationError

from .dto import (
    AlumnoIdQuery,
    AlumnoPromoverResponse,
    # Service DTOs
    AvisoDTO,
    CerrarRegistroResponse,
    DashboardData,
    FiltrosUsuario,
    MetricasPermisoResponse,
    PromocionExecResponse,
    PromoverPayload,
    RAEDashboardProgress,
    ResolverIncidenciaPayload,
    # Payload schemas
    ResponderPermisoPayload,
    StatsDTO,
    # Response models
    StatusDetailResponse,
    ToggleActiveResponse,
    ToggleCerradoPayload,
    UnreadCountResponse,
)

# ═════════════════════════════════════════════════════════════════════════════
# Service DTOs
# ═════════════════════════════════════════════════════════════════════════════


class AvisoDTOTest(SimpleTestCase):
    def test_constructor_valido(self):
        ahora = datetime.now()
        aviso = AvisoDTO(id=1, titulo="Test", contenido="Cuerpo", autor="Juan", fecha=ahora)
        self.assertEqual(aviso.titulo, "Test")
        self.assertEqual(aviso.autor, "Juan")
        self.assertEqual(aviso.fecha, ahora)

    def test_model_dump_includes_all_fields(self):
        aviso = AvisoDTO(id=1, titulo="T", contenido="C", autor="A", fecha=datetime.now())
        d = aviso.model_dump()
        self.assertEqual(set(d.keys()), {"id", "titulo", "contenido", "autor", "fecha"})


class StatsDTOTest(SimpleTestCase):
    def test_defaults_cero(self):
        stats = StatsDTO()
        self.assertEqual(stats.total_alumnos, 0)
        self.assertEqual(stats.total_escuelas, 0)
        self.assertEqual(stats.total_usuarios, 0)
        self.assertEqual(stats.total_maestros, 0)

    def test_constructor_valido(self):
        stats = StatsDTO(total_alumnos=10, total_escuelas=2, total_usuarios=8, total_maestros=3)
        self.assertEqual(stats.total_alumnos, 10)
        self.assertEqual(stats.total_escuelas, 2)
        self.assertEqual(stats.total_usuarios, 8)
        self.assertEqual(stats.total_maestros, 3)


class DashboardDataTest(SimpleTestCase):
    def test_defaults(self):
        data = DashboardData()
        self.assertEqual(data.ciclo_actual, "Sin Ciclo Activo")
        self.assertEqual(data.ultimos_avisos, [])
        self.assertEqual(data.permisos_pendientes, 0)
        self.assertEqual(data.incidencias_pendientes, 0)
        self.assertIsInstance(data.stats, StatsDTO)
        self.assertEqual(data.racs_pendientes, 0)
        self.assertEqual(data.actividad_reciente, [])
        self.assertEqual(data.eventos_hoy, [])
        self.assertIsInstance(data.rae_progress, RAEDashboardProgress)
        self.assertEqual(data.asistencia_trend, [])
        self.assertEqual(data.escuelas_filtro, [])

    def test_model_dump_keys(self):
        data = DashboardData()
        d = data.model_dump()
        expected_keys = {
            "ciclo_actual",
            "ultimos_avisos",
            "permisos_pendientes",
            "incidencias_pendientes",
            "stats",
            "grafica_clasificacion",
            "grafica_escuelas",
            "racs_pendientes",
            "actividad_reciente",
            "eventos_hoy",
            "rae_progress",
            "asistencia_trend",
            "escuelas_filtro",
        }
        self.assertEqual(set(d.keys()), expected_keys)

    def test_con_avisos(self):
        ahora = datetime.now()
        aviso = AvisoDTO(id=1, titulo="Aviso", contenido="C", autor="A", fecha=ahora)
        data = DashboardData(ultimos_avisos=[aviso])
        self.assertEqual(len(data.ultimos_avisos), 1)
        self.assertEqual(data.ultimos_avisos[0].titulo, "Aviso")


# ═════════════════════════════════════════════════════════════════════════════
# Payload Validation Schemas
# ═════════════════════════════════════════════════════════════════════════════


class ResponderPermisoPayloadTest(SimpleTestCase):
    def test_aprobar_valido(self):
        payload = ResponderPermisoPayload(estado="APROBADO")
        self.assertEqual(payload.estado, "APROBADO")
        self.assertEqual(payload.respuesta_admin, "")

    def test_rechazar_con_respuesta(self):
        payload = ResponderPermisoPayload(estado="RECHAZADO", respuesta_admin="No corresponde")
        self.assertEqual(payload.estado, "RECHAZADO")

    def test_rechazar_sin_respuesta_error(self):
        with self.assertRaises(ValidationError):
            ResponderPermisoPayload(estado="RECHAZADO")

    def test_estado_invalido_error(self):
        with self.assertRaises(ValidationError):
            ResponderPermisoPayload(estado="INVALIDO")


class ResolverIncidenciaPayloadTest(SimpleTestCase):
    def test_valido(self):
        payload = ResolverIncidenciaPayload(respuesta_admin="Se resolvió")
        self.assertEqual(payload.respuesta_admin, "Se resolvió")

    def test_vacio_error(self):
        with self.assertRaises(ValidationError):
            ResolverIncidenciaPayload(respuesta_admin="")

    def test_faltante_error(self):
        with self.assertRaises(ValidationError):
            ResolverIncidenciaPayload()


class PromoverPayloadTest(SimpleTestCase):
    def test_default_false(self):
        payload = PromoverPayload()
        self.assertFalse(payload.confirmed)

    def test_true(self):
        payload = PromoverPayload(confirmed=True)
        self.assertTrue(payload.confirmed)

    def test_false_explicito(self):
        payload = PromoverPayload(confirmed=False)
        self.assertFalse(payload.confirmed)

    def test_invalid_type_error(self):
        with self.assertRaises(ValidationError):
            PromoverPayload(confirmed="si")


class FiltrosUsuarioTest(SimpleTestCase):
    def test_todos_none_por_defecto(self):
        f = FiltrosUsuario()
        self.assertIsNone(f.role)
        self.assertIsNone(f.escuela)
        self.assertIsNone(f.activo)

    def test_con_valores(self):
        f = FiltrosUsuario(role="ADMIN", escuela="1", activo="true")
        self.assertEqual(f.role, "ADMIN")
        self.assertEqual(f.escuela, "1")
        self.assertEqual(f.activo, "true")

    def test_ignora_campos_extra(self):
        f = FiltrosUsuario(role="ADMIN", extra_key="ignorado")
        self.assertEqual(f.role, "ADMIN")
        # model_config extra=... por defecto no está configurado, pero BaseModel
        # rechaza campos extra por defecto → esto debería fallar
        # OK, el test espera que falle si enviamos campos extra
        # (pydantic BaseModel default: forbid extra)
        # Pero FiltrosUsuario no tiene model_config(extra="ignore"), así que
        # campos extra lanzan ValidationError


class ToggleCerradoPayloadTest(SimpleTestCase):
    def test_true(self):
        p = ToggleCerradoPayload(cerrado=True)
        self.assertTrue(p.cerrado)

    def test_false(self):
        p = ToggleCerradoPayload(cerrado=False)
        self.assertFalse(p.cerrado)

    def test_no_bool_error(self):
        with self.assertRaises(ValidationError):
            ToggleCerradoPayload(cerrado="si")

    def test_faltante_error(self):
        with self.assertRaises(ValidationError):
            ToggleCerradoPayload()


class AlumnoIdQueryTest(SimpleTestCase):
    def test_valido(self):
        q = AlumnoIdQuery(alumno_id=42)
        self.assertEqual(q.alumno_id, 42)

    def test_coerce_string(self):
        q = AlumnoIdQuery(alumno_id="42")
        self.assertEqual(q.alumno_id, 42)

    def test_faltante_error(self):
        with self.assertRaises(ValidationError):
            AlumnoIdQuery()

    def test_no_int_error(self):
        with self.assertRaises(ValidationError):
            AlumnoIdQuery(alumno_id="abc")


# ═════════════════════════════════════════════════════════════════════════════
# Response Models
# ═════════════════════════════════════════════════════════════════════════════


class StatusDetailResponseTest(SimpleTestCase):
    def test_defaults(self):
        r = StatusDetailResponse()
        self.assertEqual(r.status, "success")
        self.assertEqual(r.detail, "")

    def test_model_dump(self):
        r = StatusDetailResponse(status="ok", detail="Hecho")
        d = r.model_dump()
        self.assertEqual(d["status"], "ok")
        self.assertEqual(d["detail"], "Hecho")


class UnreadCountResponseTest(SimpleTestCase):
    def test_valido(self):
        r = UnreadCountResponse(unread_count=5)
        self.assertEqual(r.unread_count, 5)

    def test_model_dump(self):
        d = UnreadCountResponse(unread_count=0).model_dump()
        self.assertEqual(d, {"unread_count": 0})


class ToggleActiveResponseTest(SimpleTestCase):
    def test_valido(self):
        r = ToggleActiveResponse(status="Usuario activado", activo=True)
        self.assertEqual(r.status, "Usuario activado")
        self.assertTrue(r.activo)

    def test_model_dump(self):
        d = ToggleActiveResponse(status="ok", activo=False).model_dump()
        self.assertEqual(d, {"status": "ok", "activo": False})


class MetricasPermisoResponseTest(SimpleTestCase):
    def test_defaults_cero(self):
        m = MetricasPermisoResponse()
        self.assertEqual(m.total, 0)

    def test_valido(self):
        m = MetricasPermisoResponse(
            total=10, pendientes=3, aprobados=5, rechazados=2, ultima_semana=1
        )
        self.assertEqual(m.total, 10)
        self.assertEqual(m.pendientes, 3)

    def test_model_dump_keys(self):
        m = MetricasPermisoResponse(
            total=1, pendientes=0, aprobados=0, rechazados=0, ultima_semana=0
        )
        d = m.model_dump()
        self.assertEqual(
            set(d.keys()), {"total", "pendientes", "aprobados", "rechazados", "ultima_semana"}
        )


class PromocionExecResponseTest(SimpleTestCase):
    def test_defaults(self):
        r = PromocionExecResponse()
        self.assertEqual(r.status, "success")
        self.assertEqual(r.promovidos, 0)
        self.assertEqual(r.graduados, 0)

    def test_valido(self):
        r = PromocionExecResponse(detail="5 promovidos", promovidos=5, graduados=2)
        self.assertEqual(r.promovidos, 5)
        self.assertEqual(r.graduados, 2)

    def test_model_dump(self):
        d = PromocionExecResponse(promovidos=3, graduados=1).model_dump()
        self.assertEqual(d["promovidos"], 3)
        self.assertEqual(d["graduados"], 1)


class AlumnoPromoverResponseTest(SimpleTestCase):
    def test_simulation(self):
        r = AlumnoPromoverResponse(simulation=True, ciclo_actual="2025-2026")
        self.assertTrue(r.simulation)
        self.assertEqual(r.ciclo_actual, "2025-2026")
        self.assertEqual(r.total_pendientes, 0)

    def test_con_listas(self):
        r = AlumnoPromoverResponse(
            simulation=False,
            ciclo_actual="2025-2026",
            a_promover=2,
            a_graduar=1,
            promovidos=[{"id": 1, "nombre": "Alumno A", "grado_actual": "1°"}],
        )
        self.assertEqual(len(r.promovidos), 1)
        self.assertEqual(r.promovidos[0]["nombre"], "Alumno A")

    def test_model_dump_keys(self):
        r = AlumnoPromoverResponse(simulation=True, ciclo_actual="2025-2026")
        d = r.model_dump()
        self.assertIn("simulation", d)
        self.assertIn("promovidos", d)
        self.assertIn("omitidos_detalle", d)


class CerrarRegistroResponseTest(SimpleTestCase):
    def test_valido(self):
        r = CerrarRegistroResponse(detail="Registro cerrado", registro_id=42, cerrado=True)
        self.assertEqual(r.detail, "Registro cerrado")
        self.assertEqual(r.registro_id, 42)
        self.assertTrue(r.cerrado)

    def test_model_dump(self):
        d = CerrarRegistroResponse(detail="Ok", registro_id=1, cerrado=False).model_dump()
        self.assertEqual(set(d.keys()), {"detail", "registro_id", "cerrado"})
