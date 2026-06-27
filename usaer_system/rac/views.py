# rac/views.py
import os
from datetime import date
from io import BytesIO

from ciclos_escolares.utils import get_current_ciclo_escolar_instance
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from openpyxl import load_workbook
from pydantic import ValidationError
from rest_framework import filters, permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from services.dto import AlumnoIdQuery
from services.error_handling import error_400

from .models import RegistroRAC
from .permissions import RACPermission
from .serializers import RegistroRACSerializer

# --- FUNCIONES HELPER (Iguales que antes) ---


def fill_rac_data(ws, registros):
    start_row = 3
    for i, reg in enumerate(registros, start=start_row):
        maestro_nombre_completo = ""
        if reg.maestro_apoyo:
            maestro_nombre_completo = " ".join(
                filter(
                    None,
                    [
                        reg.maestro_apoyo.nombre,
                        reg.maestro_apoyo.apellido_paterno,
                        reg.maestro_apoyo.apellido_materno,
                    ],
                )
            )

        grado_formateado = reg.grado
        if reg.alumno and reg.alumno.escuela:
            grado_formateado = f"{reg.grado} {reg.alumno.escuela.get_nivel_display().upper()}"

        ws[f"A{i}"] = reg.escuela_regular.nombre if reg.escuela_regular else ""
        ws[f"B{i}"] = reg.get_service_type_display()
        ws[f"C{i}"] = reg.sup_especial_cct
        ws[f"D{i}"] = reg.sup_especial_zona
        ws[f"E{i}"] = reg.centro_cct
        ws[f"F{i}"] = reg.centro_nombre
        ws[f"G{i}"] = maestro_nombre_completo
        ws[f"H{i}"] = reg.escuela_basica.cct if reg.escuela_basica else ""
        ws[f"I{i}"] = reg.escuela_basica.zona if reg.escuela_basica else ""
        ws[f"J{i}"] = reg.escuela_basica.nombre if reg.escuela_basica else ""
        ws[f"K{i}"] = reg.alumno.apellido_paterno if reg.alumno else ""
        ws[f"L{i}"] = reg.alumno.apellido_materno if reg.alumno else ""
        ws[f"M{i}"] = reg.alumno.nombres if reg.alumno else ""
        ws[f"N{i}"] = reg.alumno.curp if reg.alumno else ""
        ws[f"O{i}"] = reg.alumno.sexo if reg.alumno else ""
        ws[f"P{i}"] = reg.edad
        ws[f"Q{i}"] = grado_formateado

        ws[f"R{i}"] = (
            reg.subclasificacion if reg.clasificacion == "DISCAPACIDAD" else "NA (NO APLICA)"
        )
        ws[f"S{i}"] = (
            reg.subclasificacion
            if reg.clasificacion == "DIFICULTADES_SEVERAS"
            else "NA (NO APLICA)"
        )
        ws[f"T{i}"] = (
            reg.subclasificacion if reg.clasificacion == "TRASTORNOS" else "NA (NO APLICA)"
        )
        ws[f"U{i}"] = (
            reg.subclasificacion
            if reg.clasificacion == "APTITUDES_SOBRESALIENTES"
            else "NA (NO APLICA)"
        )
        ws[f"V{i}"] = reg.subclasificacion if reg.clasificacion == "OTRO" else "NA (NO APLICA)"
        ws[f"W{i}"] = reg.observaciones or ""


def fill_statistics_data(ws, registros):
    cat_labels = [
        ("Intelectual", "DI"),
        ("Motriz", "DMO"),
        ("Sordera", "SO"),
        ("Hipoacusia", "HP"),
        ("Ceguera", "CEG"),
        ("Baja visión", "BV"),
        ("Múltiple", "DM"),
        ("Sordoceguera", "SCG"),
        ("Psicosocial/mental", "DME"),
        ("DS Conducta", "DSC"),
        ("DS Comunicación", "DSCO"),
        ("DS Aprendizaje", "DSA"),
        ("TDA/TDAH", "TDAH"),
        ("TEA", "TEA"),
        ("AS Intelectual", "ASI"),
        ("AS Creativa", "ASC"),
        ("AS Artística", "ASA"),
        ("AS Psicomotriz", "ASP"),
        ("AS Socioafectiva", "ASS"),
        ("Otros", "OTRO"),
        ("Doble Excepcionalidad", "DE"),
    ]
    servicios = [("CAM Básico", "CAM_BASICO"), ("CAM laboral", "CAM_LABORAL"), ("USAER", "USAER")]

    start_row_main = 10
    for i, (label, code) in enumerate(cat_labels):
        row = start_row_main + i
        for j, (svc_label, svc_code) in enumerate(servicios):
            col = 3 + j * 3
            h = registros.filter(
                subclasificacion=code, service_type=svc_code, alumno__sexo="H"
            ).count()
            m = registros.filter(
                subclasificacion=code, service_type=svc_code, alumno__sexo="M"
            ).count()
            ws.cell(row=row, column=col, value=h)
            ws.cell(row=row, column=col + 1, value=m)

    blocks = [
        ("DISCAPACIDADES", cat_labels[0:14], 35),
        ("APTITUDES SOBRESALIENTES", cat_labels[14:20], 43),
        ("OTRAS CONDICIONES", [cat_labels[19]], 51),
    ]

    for title, items, start_row_block in blocks:
        num_cols_per_item = 2
        num_rows_data = 4
        max_col_to_clear = 3 + len(items) * num_cols_per_item - 1

        for r_clear in range(start_row_block, start_row_block + num_rows_data):
            for c_clear in range(3, max_col_to_clear + 1):
                ws.cell(row=r_clear, column=c_clear).value = None

        for i, nivel in enumerate(["PREESCOLAR", "PRIMARIA", "SECUNDARIA"]):
            row = start_row_block + i
            for j, (label, code) in enumerate(items):
                col = 3 + j * 2
                h = registros.filter(
                    subclasificacion=code, alumno__escuela__nivel=nivel, alumno__sexo="H"
                ).count()
                m = registros.filter(
                    subclasificacion=code, alumno__escuela__nivel=nivel, alumno__sexo="M"
                ).count()
                ws.cell(row=row, column=col, value=h)
                ws.cell(row=row, column=col + 1, value=m)

        total_row_block = start_row_block + 3
        for j, (label, code) in enumerate(items):
            col = 3 + j * 2
            total_h = registros.filter(subclasificacion=code, alumno__sexo="H").count()
            total_m = registros.filter(subclasificacion=code, alumno__sexo="M").count()
            ws.cell(row=total_row_block, column=col, value=total_h)
            ws.cell(row=total_row_block, column=col + 1, value=total_m)


# --- VISTAS DRF ---


class RegistroRACViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroRACSerializer
    permission_classes = [permissions.IsAuthenticated, RACPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["alumno__nombres", "alumno__curp", "escuela_regular__nombre"]
    ordering_fields = ["fecha_registro", "alumno__grado"]

    def get_queryset(self):
        qs = RegistroRAC.objects.select_related("alumno", "escuela_regular", "maestro_apoyo")
        user = self.request.user
        try:
            ciclo_actual = get_current_ciclo_escolar_instance()
            qs = qs.filter(ciclo_escolar=ciclo_actual)
        except Exception:
            return RegistroRAC.objects.none()

        if getattr(user, "role", "") == "MAESTRO_APOYO":
            qs = qs.filter(maestro_apoyo=user)
        return qs

    @action(detail=False, methods=["get"])
    def por_alumno(self, request):
        """
        Devuelve todos los registros RAC de un alumno específico (todos los ciclos).
        GET /rac/por_alumno/?alumno_id=<id>
        """
        from alumnos.models import Alumno

        # Validar query params con pydantic
        try:
            query = AlumnoIdQuery.model_validate(request.query_params.dict())
        except ValidationError as e:
            return Response(
                {"detail": "; ".join(err["msg"] for err in e.errors())},
                status=400,
            )

        get_object_or_404(Alumno, pk=query.alumno_id)

        qs = (
            RegistroRAC.objects.filter(alumno_id=query.alumno_id)
            .select_related("alumno", "escuela_regular", "maestro_apoyo", "ciclo_escolar")
            .order_by("-ciclo_escolar__fecha_inicio")
        )

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pendientes(self, request):
        """
        Devuelve el conteo de alumnos activos SIN registro RAC en el ciclo actual.
        GET /rac/pendientes/
        """
        from alumnos.models import Alumno

        try:
            ciclo_actual = get_current_ciclo_escolar_instance()
        except Exception:
            return error_400("No hay ciclo escolar activo.")

        user = self.request.user
        qs_alumnos = Alumno.objects.activos()

        # Filtro por escuela según rol
        if getattr(user, "role", "") == "MAESTRO_APOYO":
            qs_alumnos = qs_alumnos.filter(profesor=user)
        elif not (user.is_superuser or getattr(user, "role", "") in ["ADMIN", "SECRETARIO"]):
            if hasattr(user, "escuela") and user.escuela:
                qs_alumnos = qs_alumnos.filter(escuela=user.escuela)
            else:
                qs_alumnos = Alumno.objects.none()

        # IDs de alumnos que YA tienen RAC en el ciclo actual
        ids_con_rac = RegistroRAC.objects.filter(
            ciclo_escolar=ciclo_actual,
            alumno__in=qs_alumnos,
        ).values_list("alumno_id", flat=True)

        pendientes = qs_alumnos.exclude(id__in=ids_con_rac)
        total = pendientes.count()

        return Response(
            {
                "total_pendientes": total,
                "ciclo": ciclo_actual.nombre,
            }
        )


# --- CLASE BASE PARA EXPORTACIÓN (DRY) ---


class BaseExportRACView(views.APIView):
    """
    Clase base abstracta que maneja la carga del template y la generación del Excel.
    Las clases hijas solo deben implementar 'get_queryset' y 'get_filename'.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        raise NotImplementedError("Debes implementar get_queryset")

    def get_filename(self):
        raise NotImplementedError("Debes implementar get_filename")

    def get(self, request):
        # 1. Obtener datos
        registros = self.get_queryset()

        # Si get_queryset devolvió una Response (error de permiso), retornarla directamente
        if isinstance(registros, Response):
            return registros

        # 2. Cargar Plantilla
        template_path = settings.BASE_DIR / "rac/static/excel_templates/rac_template_v2.xlsx"
        if not os.path.exists(template_path):
            return Response(
                {"detail": "Plantilla no encontrada."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            wb = load_workbook(template_path)
            if "RAC" in wb.sheetnames:
                fill_rac_data(wb["RAC"], registros)
            if "ESTADÍSTICA POBLACIÓN 2025" in wb.sheetnames:
                fill_statistics_data(wb["ESTADÍSTICA POBLACIÓN 2025"], registros)
        except Exception as e:
            return Response(
                {"detail": f"Error procesando Excel: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # 3. Generar Respuesta
        output = BytesIO()
        wb.save(output)
        output.seek(0)

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{self.get_filename()}"'
        return response


# --- VISTAS ESPECÍFICAS DE EXPORTACIÓN ---


class ExportRACView(BaseExportRACView):
    """
    Exporta solo los registros del usuario actual (Maestros) o todo si es Admin.
    URL: /api/rac/exportar/
    """

    def get_queryset(self):
        user = self.request.user
        qs = RegistroRAC.objects.select_related(
            "alumno__escuela", "escuela_regular", "escuela_basica", "maestro_apoyo"
        ).order_by("alumno__apellido_paterno")

        # Filtrar por ciclo actual (opcional, recomendado)
        try:
            ciclo = get_current_ciclo_escolar_instance()
            qs = qs.filter(ciclo_escolar=ciclo)
        except ObjectDoesNotExist:
            # Sin ciclo activo, mostrar todos los registros
            pass

        if getattr(user, "role", "") == "MAESTRO_APOYO":
            qs = qs.filter(maestro_apoyo=user)

        return qs

    def get_filename(self):
        user = self.request.user
        nombre = getattr(user, "nombre", "") or user.first_name
        apellido = getattr(user, "apellido_paterno", "") or user.last_name
        return f"RAC_{nombre}_{apellido}.xlsx".replace(" ", "_")


class ExportAllRACView(BaseExportRACView):
    """
    Exporta TODO el concentrado RAC. Solo para Admin/Secretario.
    URL: /api/rac/exportar-todo/
    """

    def get_queryset(self):
        user = self.request.user
        roles_permitidos = ["ADMIN", "SECRETARIO"]

        # Verificación de permisos estricta
        if not (user.is_superuser or getattr(user, "role", "") in roles_permitidos):
            return Response(
                {"detail": "No tienes permiso para exportar el reporte global."},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = RegistroRAC.objects.select_related(
            "alumno__escuela", "escuela_regular", "escuela_basica", "maestro_apoyo"
        ).order_by("escuela_regular__nombre", "alumno__grado")

        try:
            ciclo = get_current_ciclo_escolar_instance()
            qs = qs.filter(ciclo_escolar=ciclo)
        except ObjectDoesNotExist:
            # Sin ciclo activo, exportar todos los registros
            pass

        return qs

    def get_filename(self):
        return f"RAC_COMPLETO_{date.today().strftime('%Y-%m-%d')}.xlsx"
