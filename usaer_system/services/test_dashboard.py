"""
test_dashboard.py — Tests para services/dashboard_service.py

IMPORTANTE: el service hace imports lazy dentro de cada función
(from x.models import Y), así que parcheamos la ruta REAL del modelo,
no el módulo del service.
"""

from unittest.mock import MagicMock, patch

from django.test import TestCase

from services.dto import (
    RAEDashboardProgress,
)

from .dashboard_service import (
    DashboardData,
    build_dashboard_data,
    get_asistencia_trend,
    get_ciclo_actual,
    get_escuelas_filtro,
    get_graficas,
    get_incidencias_pendientes,
    get_permisos_pendientes,
    get_rae_progress,
    get_stats,
    get_ultimos_avisos,
)


class GetCicloActualTest(TestCase):
    @patch("ciclos_escolares.models.CicloEscolar")
    def test_retorna_nombre_cuando_hay_activo(self, mock_ciclo):
        """Cuando existe un ciclo activo, retorna su nombre."""
        mock_ciclo.objects.filter.return_value.first.return_value = MagicMock(nombre="2025-2026")
        result = get_ciclo_actual()
        self.assertEqual(result, "2025-2026")

    @patch("ciclos_escolares.models.CicloEscolar")
    def test_retorna_default_cuando_no_hay_activo(self, mock_ciclo):
        """Sin ciclo activo, retorna el mensaje por defecto."""
        mock_ciclo.objects.filter.return_value.first.return_value = None
        result = get_ciclo_actual()
        self.assertEqual(result, "Sin Ciclo Activo")

    @patch("ciclos_escolares.models.CicloEscolar")
    def test_no_explota_cuando_hay_error(self, mock_ciclo):
        """Si la consulta lanza excepción, retorna el default sin crash."""
        mock_ciclo.objects.filter.side_effect = Exception("DB down")
        result = get_ciclo_actual()
        self.assertEqual(result, "Sin Ciclo Activo")


class GetPermisosPendientesTest(TestCase):
    def _user(self, **kwargs):
        """Crea un MagicMock de usuario con is_superuser=False por defecto."""
        defaults = {"is_superuser": False}
        defaults.update(kwargs)
        return MagicMock(**defaults)

    def _mock_qs_with_filter_chain(self, count_value):
        """Crea un mock de queryset donde filter() retorna el mismo mock."""
        mock_qs = MagicMock()
        mock_qs.count.return_value = count_value
        # filter() debe retornar el mismo mock para que el count se preserve
        mock_qs.filter.return_value = mock_qs
        return mock_qs

    def test_admin_ve_todos(self):
        """Admin/ADMINISTRADOR ve todos los permisos pendientes sin filtrar."""
        user = self._user(role="ADMINISTRADOR")
        mock_qs = self._mock_qs_with_filter_chain(5)
        with patch("permisos.models.Permiso") as mock_perm:
            mock_perm.objects.pendientes.return_value = mock_qs
            result = get_permisos_pendientes(user)
        self.assertEqual(result, 5)
        # Admin no debe haber llamado filter
        mock_qs.filter.assert_not_called()

    def test_director_ve_de_su_escuela(self):
        """DIRECTOR ve permisos filtrados por su escuela."""
        escuela_mock = MagicMock(nombre="Esc Test")
        user = self._user(role="DIRECTOR", escuela_id=1, escuela=escuela_mock)
        mock_qs = self._mock_qs_with_filter_chain(3)
        with patch("permisos.models.Permiso") as mock_perm:
            mock_perm.objects.pendientes.return_value = mock_qs
            result = get_permisos_pendientes(user)
        self.assertEqual(result, 3)
        mock_qs.filter.assert_called_once_with(escuela=escuela_mock)

    def test_maestro_ve_sus_propios(self):
        """MAESTRO ve solo sus permisos."""
        user = self._user(role="MAESTRO_APOYO", escuela_id=1)
        mock_qs = self._mock_qs_with_filter_chain(1)
        with patch("permisos.models.Permiso") as mock_perm:
            mock_perm.objects.pendientes.return_value = mock_qs
            result = get_permisos_pendientes(user)
        self.assertEqual(result, 1)
        mock_qs.filter.assert_called_once_with(profesor=user)

    def test_retorna_0_cuando_error(self):
        """Si hay excepción, retorna 0 sin crash."""
        user = self._user(role="ADMIN")
        with patch("permisos.models.Permiso") as mock_perm:
            mock_perm.objects.pendientes.side_effect = Exception("boom")
            result = get_permisos_pendientes(user)
        self.assertEqual(result, 0)


class GetIncidenciasPendientesTest(TestCase):
    def _user(self, **kwargs):
        """Crea un MagicMock de usuario con is_superuser=False por defecto."""
        defaults = {"is_superuser": False}
        defaults.update(kwargs)
        return MagicMock(**defaults)

    def _mock_qs_with_filter_chain(self, count_value):
        """Crea un mock de queryset donde filter() retorna el mismo mock."""
        mock_qs = MagicMock()
        mock_qs.count.return_value = count_value
        mock_qs.filter.return_value = mock_qs
        return mock_qs

    def test_admin_ve_todas(self):
        """Admin ve todas las incidencias pendientes sin filtrar."""
        user = self._user(role="ADMINISTRADOR")
        mock_qs = self._mock_qs_with_filter_chain(3)
        with patch("incidencias.models.Incidencia") as mock_inc:
            mock_inc.objects.pendientes.return_value = mock_qs
            result = get_incidencias_pendientes(user)
        self.assertEqual(result, 3)
        mock_qs.filter.assert_not_called()

    def test_director_ve_de_su_escuela(self):
        """DIRECTOR ve incidencias pendientes filtradas por su escuela."""
        escuela_mock = MagicMock(nombre="Esc Test")
        user = self._user(role="DIRECTOR", escuela_id=1, escuela=escuela_mock)
        mock_qs = self._mock_qs_with_filter_chain(2)
        with patch("incidencias.models.Incidencia") as mock_inc:
            mock_inc.objects.pendientes.return_value = mock_qs
            result = get_incidencias_pendientes(user)
        self.assertEqual(result, 2)
        mock_qs.filter.assert_called_once_with(escuela=escuela_mock)

    def test_secretario_ve_de_su_escuela(self):
        """SECRETARIO ve incidencias pendientes filtradas por su escuela."""
        escuela_mock = MagicMock(nombre="Esc Test")
        user = self._user(role="SECRETARIO", escuela_id=1, escuela=escuela_mock)
        mock_qs = self._mock_qs_with_filter_chain(1)
        with patch("incidencias.models.Incidencia") as mock_inc:
            mock_inc.objects.pendientes.return_value = mock_qs
            result = get_incidencias_pendientes(user)
        self.assertEqual(result, 1)
        mock_qs.filter.assert_called_once_with(escuela=escuela_mock)

    def test_maestro_ve_sus_incidencias(self):
        """MAESTRO ve incidencias donde es reportado_por o profesor."""
        user = self._user(role="MAESTRO_APOYO", escuela_id=1)
        from django.db import models

        mock_qs = self._mock_qs_with_filter_chain(1)
        with patch("incidencias.models.Incidencia") as mock_inc:
            mock_inc.objects.pendientes.return_value = mock_qs
            result = get_incidencias_pendientes(user)
        self.assertEqual(result, 1)
        mock_qs.filter.assert_called_once_with(
            models.Q(reportado_por=user) | models.Q(profesor=user)
        )

    def test_director_sin_escuela_ve_cero(self):
        """DIRECTOR sin escuela asignada ve 0 incidencias."""
        user = self._user(role="DIRECTOR", escuela_id=None, escuela=None)
        mock_qs = MagicMock()
        mock_qs.count.return_value = 5
        mock_qs.filter.return_value = mock_qs
        mock_qs.none.return_value.count.return_value = 0
        with patch("incidencias.models.Incidencia") as mock_inc:
            mock_inc.objects.pendientes.return_value = mock_qs
            result = get_incidencias_pendientes(user)
        self.assertEqual(result, 0)

    def test_retorna_0_cuando_error(self):
        """Si hay excepción, retorna 0 sin crash."""
        user = self._user(role="ADMIN")
        with patch("incidencias.models.Incidencia") as mock_inc:
            mock_inc.objects.pendientes.side_effect = Exception("boom")
            result = get_incidencias_pendientes(user)
        self.assertEqual(result, 0)


class GetUltimosAvisosTest(TestCase):
    @patch("avisos.models.Anuncio")
    def test_retorna_lista_con_avisos(self, mock_anuncio):
        """Retorna los avisos formateados como dicts."""
        mock_autor = MagicMock()
        mock_autor.get_full_name.return_value = "Juan Pérez"
        mock_entry = MagicMock(
            id=1,
            titulo="Aviso 1",
            contenido="Contenido",
            autor=mock_autor,
            fecha_publicacion="2026-01-01",
        )
        # Chain: vigentes().select_related().order_by()[:5]
        mock_final_qs = MagicMock()
        mock_final_qs.__getitem__.return_value = [mock_entry]

        mock_sr_qs = MagicMock()
        mock_sr_qs.order_by.return_value = mock_final_qs

        mock_vig_qs = MagicMock()
        mock_vig_qs.select_related.return_value = mock_sr_qs

        mock_anuncio.objects.vigentes.return_value = mock_vig_qs

        result = get_ultimos_avisos()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].titulo, "Aviso 1")
        self.assertEqual(result[0].autor, "Juan Pérez")

    @patch("avisos.models.Anuncio")
    def test_retorna_lista_vacia_sin_avisos(self, mock_anuncio):
        """Sin avisos, retorna lista vacía."""
        mock_final_qs = MagicMock()
        mock_final_qs.__getitem__.return_value = []
        mock_anuncio.objects.vigentes.return_value.select_related.return_value.order_by.return_value = mock_final_qs

        result = get_ultimos_avisos()
        self.assertEqual(result, [])

    @patch("avisos.models.Anuncio")
    def test_no_explota_en_error(self, mock_anuncio):
        mock_anuncio.objects.vigentes.side_effect = Exception("boom")
        result = get_ultimos_avisos()
        self.assertEqual(result, [])


class GetStatsTest(TestCase):
    @patch("alumnos.models.Alumno")
    @patch("escuelas.models.Escuela")
    @patch("django.contrib.auth.get_user_model")
    def test_retorna_estructura_correcta(self, mock_user_model, mock_escuela, mock_alumno):
        """Stats retorna dict con las llaves correctas."""
        mock_alumno.objects.activos.return_value.aggregate.return_value = {"total_alumnos": 42}
        mock_escuela.objects.count.return_value = 5
        mock_user = MagicMock()
        mock_user.objects.filter.return_value.aggregate.return_value = {
            "total_usuarios": 10,
            "total_maestros": 3,
        }
        mock_user_model.return_value = mock_user

        result = get_stats()
        self.assertEqual(result.total_alumnos, 42)
        self.assertEqual(result.total_escuelas, 5)
        self.assertEqual(result.total_usuarios, 10)
        self.assertEqual(result.total_maestros, 3)


class GetGraficasTest(TestCase):
    @patch("alumnos.models.Alumno")
    def test_retorna_tupla_de_dos_listas(self, mock_alumno):
        """Retorna (clasificacion, escuelas) correctamente."""
        clasificacion_data = [
            {"clasificacion": "A", "total": 10},
        ]
        escuelas_data = [
            {"escuela__nombre": "Esc 1", "total": 5},
        ]

        # Mock for order_by() without [:5] (clasificacion chain)
        mock_class_qs = MagicMock()
        mock_class_qs.__iter__.return_value = iter(clasificacion_data)

        # Mock for order_by()[:5] (escuelas chain) — __getitem__ is called by [:]
        mock_escuelas_qs = MagicMock()
        mock_escuelas_qs.__getitem__.return_value = escuelas_data

        # .annotate().order_by uses side_effect: first call no [:5], second with [:5]
        mock_annotate = MagicMock()
        mock_annotate.order_by.side_effect = [mock_class_qs, mock_escuelas_qs]

        # .values().annotate() returns the annotate mock
        mock_values = MagicMock()
        mock_values.annotate.return_value = mock_annotate

        # .activos().values() returns the values mock
        mock_activos = MagicMock()
        mock_activos.values.return_value = mock_values

        mock_alumno.objects.activos.return_value = mock_activos

        clasif, escuelas = get_graficas()
        self.assertEqual(clasif, clasificacion_data)
        self.assertEqual(escuelas, escuelas_data)

    @patch("alumnos.models.Alumno")
    def test_retorna_vacio_en_error(self, mock_alumno):
        """Si hay error, retorna ([], [])."""
        mock_alumno.objects.activos.side_effect = Exception("boom")
        result = get_graficas()
        self.assertEqual(result, ([], []))


class BuildDashboardDataTest(TestCase):
    def test_retorna_dashboarddata(self):
        """build_dashboard_data retorna una instancia de DashboardData."""
        user = MagicMock(role="ADMINISTRADOR", is_superuser=False)
        result = build_dashboard_data(user)
        self.assertIsInstance(result, DashboardData)

    def test_dashboarddata_model_dump_tiene_todas_las_llaves(self):
        """DashboardData.model_dump() incluye todas las secciones."""
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


class GetRAEProgressTest(TestCase):
    """Tests para get_rae_progress() en dashboard_service."""

    @patch("rae.models.RegistroRAE")
    def test_returns_raedashboardprogress_instance(self, mock_registro):
        """get_rae_progress() retorna RAEDashboardProgress."""
        mock_qs = MagicMock()
        # Chain: filter().select_related().annotate() must return the same mock
        mock_registro.objects.filter.return_value = mock_qs
        mock_qs.select_related.return_value = mock_qs
        mock_qs.annotate.return_value = mock_qs
        mock_entry = MagicMock()
        mock_entry.escuela_id = 1
        mock_entry.escuela.nombre = "Escuela Test"
        mock_entry.escuela.cct = "CCT123"
        mock_entry.id = 99
        mock_entry.total_alumnos = 10
        mock_entry.completados = 5
        mock_entry.cerrado = False
        mock_qs.__iter__.return_value = [mock_entry]

        from services.dto import RAEDashboardProgress

        result = get_rae_progress()
        self.assertIsInstance(result, RAEDashboardProgress)
        self.assertGreater(result.total_escuelas, 0)
        self.assertEqual(len(result.detalle_escuelas), 1)
        item = result.detalle_escuelas[0]
        item_dict = item if isinstance(item, dict) else item.model_dump()
        self.assertIn("escuela_id", item_dict)
        self.assertIn("escuela_nombre", item_dict)
        self.assertIn("total_alumnos", item_dict)
        self.assertIn("completados", item_dict)
        self.assertIn("porcentaje", item_dict)
        self.assertIn("cerrado", item_dict)

    @patch("rae.models.RegistroRAE")
    def test_returns_empty_progress_on_exception(self, mock_registro):
        """Si hay error, retorna RAEDashboardProgress() vacío."""
        mock_registro.objects.filter.side_effect = Exception("boom")
        result = get_rae_progress()
        self.assertIsInstance(result, RAEDashboardProgress)
        self.assertEqual(result.total_escuelas, 0)


class GetAsistenciaTrendTest(TestCase):
    """Tests para get_asistencia_trend() en dashboard_service."""

    @patch("asistencias.models.Asistencia")
    def test_returns_list_of_entries(self, mock_asistencia):
        """get_asistencia_trend() retorna lista de AsistenciaTrendEntry con 7 días."""
        # mock objects.filter().count() and .filter().filter().count()
        mock_qs = MagicMock()
        mock_qs.count.return_value = 3  # total
        mock_qs2 = MagicMock()
        mock_qs2.count.return_value = 2  # presentes
        mock_asistencia.objects.filter.side_effect = lambda **kw: (
            mock_qs if "presente" not in kw else mock_qs2
        )

        result = get_asistencia_trend()
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 7)
        entry = result[0]
        # AsistenciaTrendEntry is a BaseModel — convert to dict or check attrs
        entry_dict = entry if isinstance(entry, dict) else entry.model_dump()
        self.assertIn("fecha", entry_dict)
        self.assertIn("total", entry_dict)
        self.assertIn("presentes", entry_dict)
        self.assertIn("porcentaje", entry_dict)

    @patch("asistencias.models.Asistencia")
    def test_returns_empty_on_exception(self, mock_asistencia):
        """Si hay error, retorna lista vacía."""
        mock_asistencia.objects.filter.side_effect = Exception("boom")
        result = get_asistencia_trend()
        self.assertEqual(result, [])


class GetEscuelasFiltroTest(TestCase):
    """Tests para get_escuelas_filtro() en dashboard_service."""

    @patch("escuelas.models.Escuela")
    def test_returns_list_of_options(self, mock_escuela):
        """get_escuelas_filtro() retorna lista de EscuelaFilterOption."""
        mock_qs = MagicMock()
        mock_escuela.objects.all.return_value = mock_qs
        mock_entry = MagicMock()
        mock_entry.id = 1
        mock_entry.nombre = "Escuela Test"
        mock_qs.__iter__.return_value = [mock_entry]

        result = get_escuelas_filtro()
        self.assertIsInstance(result, list)
        if len(result) > 0:
            item = result[0]
            item_dict = item if isinstance(item, dict) else item.model_dump()
            self.assertIn("id", item_dict)
            self.assertIn("nombre", item_dict)

    @patch("escuelas.models.Escuela")
    def test_returns_empty_on_exception(self, mock_escuela):
        """Si hay error, retorna lista vacía."""
        mock_escuela.objects.all.side_effect = Exception("boom")
        result = get_escuelas_filtro()
        self.assertEqual(result, [])
