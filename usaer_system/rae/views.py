# usaer_system/rae/views.py
import logging
import os
from datetime import date
from io import BytesIO

from alumnos.models import Alumno
from ciclos_escolares.utils import get_current_ciclo_escolar_instance
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from openpyxl import load_workbook
from pydantic import ValidationError
from rest_framework import filters, permissions, views, viewsets
from rest_framework.response import Response
from services.dto import CerrarRegistroResponse, StatusDetailResponse, ToggleCerradoPayload
from services.error_handling import error_400, error_403, error_404, error_500
from usuarios.models import SystemConfiguration

# ... (rest of imports)
from .models import RAEAlumno, RegistroRAE
from .permissions import RAEPermission
from .serializers import BulkRAESaveSerializer, RAEAlumnoSerializer, RegistroRAESerializer

logger = logging.getLogger(__name__)

# --- 1. VIEWSET CRUD (Para 'mis_registros') ---


class RegistroRAEViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroRAESerializer
    permission_classes = [permissions.IsAuthenticated, RAEPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["escuela__nombre"]
    ordering_fields = ["fecha_creacion"]

    def get_queryset(self):
        user = self.request.user
        qs = RegistroRAE.objects.select_related("escuela", "ciclo_escolar", "creado_por")

        # Filtro por Ciclo
        try:
            ciclo_actual = get_current_ciclo_escolar_instance()
            qs = qs.filter(ciclo_escolar=ciclo_actual)
        except Exception:
            return RegistroRAE.objects.none()

        # Filtro por Rol/Escuela
        roles_totales = ["ADMIN", "SECRETARIO"]
        if not (user.is_superuser or getattr(user, "role", "") in roles_totales):
            if hasattr(user, "escuela") and user.escuela:
                qs = qs.filter(escuela=user.escuela)
            else:
                return RegistroRAE.objects.none()

        return qs.order_by("escuela__nombre", "fecha_creacion")


# --- 2. CAPTURA Y GUARDADO MASIVO ---


class RAEInitCaptureView(views.APIView):
    """
    Inicializa la captura: Busca/Crea el registro y devuelve los alumnos.
    URL: /rae/captura/
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Inicializa la captura de RAE para la escuela del usuario",
        responses={
            200: openapi.Response(
                description="Datos de inicialización",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "registro_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                        "ciclo": openapi.Schema(type=openapi.TYPE_STRING),
                        "escuela": openapi.Schema(type=openapi.TYPE_STRING),
                        "alumnos": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    "id": openapi.Schema(type=openapi.TYPE_INTEGER),
                                    "curp": openapi.Schema(type=openapi.TYPE_STRING),
                                    "genero": openapi.Schema(type=openapi.TYPE_STRING),
                                    "edad": openapi.Schema(type=openapi.TYPE_INTEGER),
                                    "grado": openapi.Schema(type=openapi.TYPE_STRING),
                                },
                            ),
                        ),
                    },
                ),
            ),
            400: openapi.Response("Error de datos o configuración (ej. sin escuela asignada)"),
        },
    )
    def get(self, request):
        user = request.user
        escuela = user.escuela
        if not escuela:
            return error_400("No tienes escuela asignada.")

        try:
            ciclo = get_current_ciclo_escolar_instance()
        except Exception as e:
            return error_400(str(e))

        # Get or Create Registro
        registro, _ = RegistroRAE.objects.get_or_create(
            escuela=escuela, ciclo_escolar=ciclo, defaults={"creado_por": user}
        )

        # Asegurar fichas de alumnos
        alumnos_maestra = Alumno.objects.activos_de_profesor(user)
        rae_alumnos = []
        for alumno in alumnos_maestra:
            obj, _ = RAEAlumno.objects.get_or_create(
                registro=registro,
                alumno=alumno,
                defaults={
                    "capturado_por": user,
                    "curp": alumno.curp,
                    "genero": alumno.sexo,
                    "edad": alumno.edad,
                    "grado": f"{alumno.grado}°{alumno.grupo}",
                },
            )
            rae_alumnos.append(obj)

        serializer = RAEAlumnoSerializer(rae_alumnos, many=True)
        return Response(
            {
                "registro_id": registro.id,
                "ciclo": ciclo.nombre,
                "escuela": escuela.nombre,
                "cerrado": registro.cerrado,
                "alumnos": serializer.data,
            }
        )


class RAEBulkSaveView(views.APIView):
    """
    Guarda cambios masivos en los alumnos.
    URL: /rae/guardar_bulk/
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Guardado masivo de datos RAE",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "registro_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                "alumnos": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "id": openapi.Schema(type=openapi.TYPE_INTEGER),
                            "ceg": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "bv": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "so": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "hp": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "scg": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "dmo": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "di": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "dme": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "psicosocial": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "dm": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "dsc": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "dsco": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "dsa": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "tea": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "tda": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "asi": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "asc": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "ass": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "asa": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "asp": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "ot": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "psicologia": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "comunicacion": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "psicomotricidad": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "trabajo_social": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "aprendizaje": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "nuevo_ingreso": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "subsecuente": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "diagnostico": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "educativo": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "deteccion": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "psicopedagogico": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "plan": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "modelo": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        },
                    ),
                ),
            },
            required=["registro_id", "alumnos"],
        ),
        responses={
            200: openapi.Response("Datos guardados exitosamente"),
            400: openapi.Response("Error de validación en los datos"),
            404: openapi.Response("Registro RAE no encontrado"),
        },
    )
    def post(self, request):
        serializer = BulkRAESaveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        registro_id = data["registro_id"]

        # Validar propiedad del registro
        qs_reg = RegistroRAE.objects.filter(pk=registro_id)
        if not (request.user.is_superuser or request.user.role in ["ADMIN", "SECRETARIO"]):
            qs_reg = qs_reg.filter(escuela=request.user.escuela)

        registro = get_object_or_404(qs_reg)

        # Verificar si el registro está cerrado
        if registro.cerrado:
            return error_403(
                "Este registro RAE está cerrado. No se pueden modificar los datos. Solicita a un administrador que lo reabra."
            )

        # Campos permitidos
        campos = [
            "ceg",
            "bv",
            "so",
            "hp",
            "scg",
            "dmo",
            "di",
            "dme",
            "dm",
            "psicosocial",
            "dsc",
            "dsco",
            "dsa",
            "tda",
            "tea",
            "asi",
            "asc",
            "ass",
            "asa",
            "asp",
            "ot",
            "psicologia",
            "comunicacion",
            "psicomotricidad",
            "trabajo_social",
            "aprendizaje",
            "nuevo_ingreso",
            "subsecuente",
            "diagnostico",
            "educativo",
            "deteccion",
            "psicopedagogico",
            "plan",
            "modelo",
        ]

        updated_count = 0
        instances = []

        for alum_data in data["alumnos"]:
            pk = alum_data.get("id")
            try:
                inst = RAEAlumno.objects.get(pk=pk, registro=registro)
            except RAEAlumno.DoesNotExist:
                continue

            changed = False
            for f in campos:
                if f in alum_data:
                    val = bool(alum_data[f])
                    if getattr(inst, f) != val:
                        setattr(inst, f, val)
                        changed = True

            if changed:
                instances.append(inst)
                updated_count += 1

        if instances:
            RAEAlumno.objects.bulk_update(instances, fields=campos)

        return Response(
            StatusDetailResponse(detail=f"{updated_count} alumnos actualizados").model_dump()
        )


# --- 3. EXPORTACIÓN EXCEL (Lógica Original Integrada) ---


class ExportRAEView(views.APIView):
    """
    Exporta UN registro específico.
    URL: /rae/exportar_excel/<pk>/
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Exporta el reporte RAE de una escuela en formato Excel",
        responses={
            200: openapi.Response(
                description="Archivo Excel generado",
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ),
            404: openapi.Response("Registro no encontrado"),
            500: openapi.Response("Error interno al generar el archivo"),
        },
    )
    def get(self, request, pk):
        registro_id = pk
        try:
            registro = get_object_or_404(
                RegistroRAE.objects.select_related("escuela", "ciclo_escolar"), pk=registro_id
            )
            config = SystemConfiguration.objects.first()
        except Exception as e:
            return error_404(str(e))

        template_path = os.path.join(
            settings.BASE_DIR, "rae", "static", "excel_templates", "rae_template.xlsx"
        )
        if not os.path.exists(template_path):
            return error_500("Plantilla no encontrada.")

        try:
            wb = load_workbook(template_path)
            ws = wb["Sheet1"]
        except Exception as e:
            return error_500(f"Error cargando plantilla: {e}")

        # --- LLENADO DE DATOS DINÁMICOS ---
        ws["D6"] = registro.escuela.nombre
        ws["AC6"] = (
            registro.escuela.get_nivel_display()
            if hasattr(registro.escuela, "get_nivel_display")
            else registro.escuela.nivel
        )
        ws["D8"] = registro.escuela.zona if hasattr(registro.escuela, "zona") else ""
        ws["H8"] = (
            registro.escuela.clave_estatal if hasattr(registro.escuela, "clave_estatal") else ""
        )
        ws["R8"] = registro.escuela.cct
        ws["AC8"] = registro.ciclo_escolar.nombre
        ws["D10"] = registro.escuela.domicilio if hasattr(registro.escuela, "domicilio") else ""

        ws["D12"] = config.centro_nombre if config else "USAER 7607"
        ws["R12"] = config.centro_cct if config else "08FUA0093E"
        ws["D14"] = config.director_responsable if config else "S/N"
        ws["AG14"] = registro.docente_hombres
        ws["AO14"] = registro.docente_mujeres
        ws["C80"] = ws["D14"].value

        roles_totales = ["ADMIN", "SECRETARIO"]
        qs = RAEAlumno.objects.filter(registro=registro)

        if not (request.user.is_superuser or getattr(request.user, "role", "") in roles_totales):
            qs = qs.filter(alumno__profesor=request.user)

        qs = qs.order_by(
            "alumno__grado", "alumno__grupo", "alumno__apellido_paterno", "alumno__nombres"
        ).select_related("alumno__profesor")

        # Totales
        aptitudes_q = Q()
        for f in ["asi", "asc", "ass", "asa", "asp"]:
            aptitudes_q |= Q(**{f: True})

        ws["AE11"] = qs.filter(aptitudes_q, genero="H").count()
        ws["AF11"] = qs.filter(aptitudes_q, genero="M").count()
        ws["AG11"] = ws["AE11"].value + ws["AF11"].value

        disc_q = Q()
        for f in ["ceg", "bv", "so", "hp", "scg", "dmo", "di", "dme", "psicosocial", "dm"]:
            disc_q |= Q(**{f: True})

        ws["AJ11"] = qs.filter(disc_q, genero="H").count()
        ws["AK11"] = qs.filter(disc_q, genero="M").count()
        ws["AL11"] = ws["AJ11"].value + ws["AK11"].value

        otras_q = Q()
        for f in ["ot", "dsc", "dsco", "dsa", "tea", "tda"]:
            otras_q |= Q(**{f: True})

        ws["AP11"] = qs.filter(otras_q, genero="H").count()
        ws["AQ11"] = qs.filter(otras_q, genero="M").count()
        ws["AR11"] = ws["AP11"].value + ws["AQ11"].value

        # Filas de alumnos
        current_row = 19
        # Limpiar filas
        for r in range(19, 69):
            for c in range(1, 45):
                if c != 2:
                    ws.cell(row=r, column=c).value = None

        col_map = {
            "ceg": "H",
            "bv": "I",
            "so": "J",
            "hp": "K",
            "scg": "L",
            "dmo": "M",
            "di": "N",
            "dme": "O",
            "psicosocial": "P",
            "dm": "Q",
            "dsc": "R",
            "dsco": "S",
            "dsa": "T",
            "tea": "U",
            "tda": "V",
            "asi": "W",
            "asc": "X",
            "ass": "Y",
            "asa": "Z",
            "asp": "AA",
            "ot": "AB",
            "psicologia": "AC",
            "comunicacion": "AD",
            "psicomotricidad": "AE",
            "trabajo_social": "AF",
            "aprendizaje": "AG",
            "nuevo_ingreso": "AI",
            "subsecuente": "AJ",
            "diagnostico": "AL",
            "educativo": "AM",
            "deteccion": "AN",
            "psicopedagogico": "AO",
            "plan": "AP",
            "modelo": "AQ",
        }

        alumno_num = 1
        for rae_alumno in qs:
            ws[f"B{current_row}"] = alumno_num
            ws[f"C{current_row}"] = rae_alumno.alumno.get_full_name()
            ws[f"D{current_row}"] = rae_alumno.genero or ""
            ws[f"E{current_row}"] = rae_alumno.alumno.edad or ""
            ws[f"F{current_row}"] = rae_alumno.grado or ""
            ws[f"G{current_row}"] = rae_alumno.curp or ""

            for field, col in col_map.items():
                if getattr(rae_alumno, field):
                    ws[f"{col}{current_row}"] = "X"

            if rae_alumno.alumno.profesor:
                ws[f"AR{current_row}"] = rae_alumno.alumno.profesor.get_full_name()

            current_row += 1
            alumno_num += 1

        ws["C76"] = "Juan Aldama, Chihuahua"
        ws["N76"] = date.today().strftime("%d/%m/%Y")

        escuela = registro.escuela
        ws["K80"] = escuela.director if escuela.director else "Nombre no disponible"

        # Output
        output = BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"Reporte_RAE_{registro.escuela.nombre}_{registro.ciclo_escolar.nombre}.xlsx"
        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class ExportAllRAEView(views.APIView):
    """
    Exporta TODOS los registros RAE (multi-hoja).
    Cada escuela obtiene su propia hoja con datos completos:
    encabezado, totales por categoría, filas de alumnos y pie.
    URL: /rae/exportar_todo_excel/
    """

    permission_classes = [permissions.IsAuthenticated]

    # Mapa de columnas para las condiciones de cada alumno (reutilizado por fila)
    COL_MAP_CONDITIONS = {
        "ceg": "H",
        "bv": "I",
        "so": "J",
        "hp": "K",
        "scg": "L",
        "dmo": "M",
        "di": "N",
        "dme": "O",
        "psicosocial": "P",
        "dm": "Q",
        "dsc": "R",
        "dsco": "S",
        "dsa": "T",
        "tea": "U",
        "tda": "V",
        "asi": "W",
        "asc": "X",
        "ass": "Y",
        "asa": "Z",
        "asp": "AA",
        "ot": "AB",
        "psicologia": "AC",
        "comunicacion": "AD",
        "psicomotricidad": "AE",
        "trabajo_social": "AF",
        "aprendizaje": "AG",
        "nuevo_ingreso": "AI",
        "subsecuente": "AJ",
        "diagnostico": "AL",
        "educativo": "AM",
        "deteccion": "AN",
        "psicopedagogico": "AO",
        "plan": "AP",
        "modelo": "AQ",
    }

    def _llenar_encabezado(self, ws, escuela, registro, config):
        """Llena el encabezado de una hoja RAE con datos de escuela y registro."""
        ws["D6"] = escuela.nombre
        ws["AC6"] = (
            escuela.get_nivel_display() if hasattr(escuela, "get_nivel_display") else escuela.nivel
        )
        ws["D8"] = escuela.zona if hasattr(escuela, "zona") else ""
        ws["H8"] = escuela.clave_estatal if hasattr(escuela, "clave_estatal") else ""
        ws["R8"] = escuela.cct
        ws["AC8"] = registro.ciclo_escolar.nombre
        ws["D10"] = escuela.domicilio if hasattr(escuela, "domicilio") else ""

        ws["D12"] = config.centro_nombre if config else "USAER 7607"
        ws["R12"] = config.centro_cct if config else "08FUA0093E"
        ws["D14"] = config.director_responsable if config else "S/N"
        ws["AG14"] = registro.docente_hombres
        ws["AO14"] = registro.docente_mujeres
        ws["C80"] = ws["D14"].value

        ws["K80"] = escuela.director if escuela.director else "Nombre no disponible"

    def _calcular_totales(self, ws, qs):
        """Calcula y escribe los totales de aptitudes, discapacidad y otras condiciones."""
        # --- Aptitudes Sobresalientes ---
        aptitudes_q = Q()
        for f in ["asi", "asc", "ass", "asa", "asp"]:
            aptitudes_q |= Q(**{f: True})

        total_as_h = qs.filter(aptitudes_q, genero="H").count()
        total_as_m = qs.filter(aptitudes_q, genero="M").count()
        ws["AE11"] = total_as_h
        ws["AF11"] = total_as_m
        ws["AG11"] = total_as_h + total_as_m

        # --- Discapacidad ---
        disc_q = Q()
        for f in ["ceg", "bv", "so", "hp", "scg", "dmo", "di", "dme", "psicosocial", "dm"]:
            disc_q |= Q(**{f: True})

        total_disc_h = qs.filter(disc_q, genero="H").count()
        total_disc_m = qs.filter(disc_q, genero="M").count()
        ws["AJ11"] = total_disc_h
        ws["AK11"] = total_disc_m
        ws["AL11"] = total_disc_h + total_disc_m

        # --- Otras condiciones ---
        otras_q = Q()
        for f in ["ot", "dsc", "dsco", "dsa", "tea", "tda"]:
            otras_q |= Q(**{f: True})

        total_otras_h = qs.filter(otras_q, genero="H").count()
        total_otras_m = qs.filter(otras_q, genero="M").count()
        ws["AP11"] = total_otras_h
        ws["AQ11"] = total_otras_m
        ws["AR11"] = total_otras_h + total_otras_m

    def _llenar_filas_alumnos(self, ws, qs):
        """Llena las filas de datos de alumnos (desde fila 19)."""
        start_row = 19
        current_row = start_row
        alumno_num = 1

        # Limpiar filas previas (rango de 50 filas)
        for r_clear in range(start_row, start_row + 50):
            for c_clear in range(1, 45):
                if c_clear != 2:  # Columna B se mantiene para numeración
                    ws.cell(row=r_clear, column=c_clear).value = None

        for rae_alumno in qs:
            ws[f"B{current_row}"] = alumno_num
            ws[f"C{current_row}"] = rae_alumno.alumno.get_full_name() if rae_alumno.alumno else ""
            ws[f"D{current_row}"] = rae_alumno.genero or ""
            ws[f"E{current_row}"] = rae_alumno.alumno.edad if rae_alumno.alumno else ""
            ws[f"F{current_row}"] = rae_alumno.grado or ""
            ws[f"G{current_row}"] = rae_alumno.curp or ""

            # Marcar condiciones con 'X'
            for field, col in self.COL_MAP_CONDITIONS.items():
                if getattr(rae_alumno, field, False):
                    ws[f"{col}{current_row}"] = "X"

            # Docente responsable
            if rae_alumno.alumno and rae_alumno.alumno.profesor:
                ws[f"AR{current_row}"] = rae_alumno.alumno.profesor.get_full_name()

            current_row += 1
            alumno_num += 1

    def _llenar_pie(self, ws, config):
        """Llena el pie de la hoja (fecha y lugar)."""
        ws["C76"] = config.ubicacion_centro if config else "Juan Aldama, Chihuahua"
        ws["N76"] = date.today().strftime("%d/%m/%Y")

    @swagger_auto_schema(
        operation_description="Exporta TODOS los registros RAE del ciclo actual en un solo archivo Excel multi-hoja",
        responses={
            200: openapi.Response(
                description="Archivo Excel multi-hoja generado",
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ),
            403: openapi.Response("No tienes permisos para exportar todos los registros"),
            404: openapi.Response("No hay registros para exportar"),
            500: openapi.Response("Error interno al generar el archivo"),
        },
    )
    def get(self, request):
        roles_totales = ["ADMIN", "SECRETARIO"]
        if not (request.user.is_superuser or getattr(request.user, "role", "") in roles_totales):
            return error_403("No tienes permiso.")

        config = SystemConfiguration.objects.first()

        try:
            ciclo = get_current_ciclo_escolar_instance()
        except Exception as e:
            return error_400(str(e))

        template_path = os.path.join(
            settings.BASE_DIR, "rae", "static", "excel_templates", "rae_template.xlsx"
        )
        if not os.path.exists(template_path):
            return error_500("Plantilla no encontrada.")

        try:
            master_workbook = load_workbook(template_path)
            template_sheet = master_workbook["Sheet1"]
        except Exception as e:
            return error_500(f"Error cargando plantilla: {e}")

        registros = (
            RegistroRAE.objects.filter(ciclo_escolar=ciclo)
            .select_related("escuela", "ciclo_escolar")
            .prefetch_related("detalles_alumnos__alumno__profesor")
            .order_by("escuela__nombre")
        )

        if not registros.exists():
            return error_404("No hay registros para exportar.")

        for registro in registros:
            new_sheet = master_workbook.copy_worksheet(template_sheet)
            sheet_name_base = registro.escuela.clave_estatal or f"RAE_{registro.id}"
            clean_name = "".join(
                c for c in sheet_name_base if c.isalnum() or c in [" ", "_"]
            ).replace(" ", "_")
            new_sheet.title = clean_name[:31]

            escuela = registro.escuela

            # 1. Encabezado
            self._llenar_encabezado(new_sheet, escuela, registro, config)

            # 2. Queryset de alumnos para esta hoja
            qs = (
                registro.detalles_alumnos.all()
                .order_by(
                    "alumno__grado", "alumno__grupo", "alumno__apellido_paterno", "alumno__nombres"
                )
                .select_related("alumno__profesor")
            )

            # 3. Totales
            self._calcular_totales(new_sheet, qs)

            # 4. Filas de alumnos
            self._llenar_filas_alumnos(new_sheet, qs)

            # 5. Pie
            self._llenar_pie(new_sheet, config)

        # Eliminar la hoja plantilla original
        if "Sheet1" in master_workbook.sheetnames:
            master_workbook.remove(master_workbook["Sheet1"])

        output = BytesIO()
        master_workbook.save(output)
        output.seek(0)

        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = "attachment; filename=Todos_los_Registros_RAE.xlsx"
        return response


# --- 6. PROGRESO RAE (Dashboard) ---


class RAEProgressView(views.APIView):
    """
    Devuelve el progreso de captura RAE.
    GET /rae/progreso/ -> lista de escuelas con total/completados/porcentaje
    """

    permission_classes = [permissions.IsAuthenticated]

    # Todos los campos booleanos que definen "completitud"
    CAMPOS_COMPLETITUD = [
        "ceg",
        "bv",
        "so",
        "hp",
        "scg",
        "dmo",
        "di",
        "dme",
        "psicosocial",
        "dm",
        "dsc",
        "dsco",
        "dsa",
        "tda",
        "tea",
        "asi",
        "asc",
        "asa",
        "asp",
        "ass",
        "ot",
        "psicologia",
        "comunicacion",
        "psicomotricidad",
        "trabajo_social",
        "aprendizaje",
        "nuevo_ingreso",
        "subsecuente",
        "diagnostico",
        "educativo",
        "deteccion",
        "psicopedagogico",
        "plan",
        "modelo",
    ]

    @swagger_auto_schema(
        operation_description="Devuelve el progreso de captura RAE por escuela",
        responses={200: "Lista de progreso por escuela"},
    )
    def get(self, request):
        try:
            ciclo = get_current_ciclo_escolar_instance()
        except Exception as e:
            return error_400(str(e))

        qs = RegistroRAE.objects.filter(ciclo_escolar=ciclo).select_related("escuela")

        # Filtrar por rol
        roles_totales = ["ADMIN", "SECRETARIO"]
        if not (request.user.is_superuser or getattr(request.user, "role", "") in roles_totales):
            if hasattr(request.user, "escuela") and request.user.escuela:
                qs = qs.filter(escuela=request.user.escuela)
            else:
                return Response([])

        resultados = []
        for registro in qs:
            total = registro.detalles_alumnos.count()
            if total == 0:
                continue

            # Construir Q OR para cualquier campo en True
            q_completitud = Q()
            for campo in self.CAMPOS_COMPLETITUD:
                q_completitud |= Q(**{campo: True})

            completados = registro.detalles_alumnos.filter(q_completitud).count()
            porcentaje = round((completados / total) * 100, 1)

            resultados.append(
                {
                    "escuela_id": registro.escuela.id,
                    "escuela_nombre": registro.escuela.nombre,
                    "escuela_cct": registro.escuela.cct,
                    "registro_id": registro.id,
                    "total_alumnos": total,
                    "completados": completados,
                    "porcentaje": porcentaje,
                    "cerrado": registro.cerrado,
                }
            )

        resultados.sort(key=lambda r: r["escuela_nombre"])
        return Response(resultados)


# --- 7. CERRAR / REABRIR REGISTRO RAE ---


class RAECerrarView(views.APIView):
    """
    Cierra o reabre un registro RAE.
    POST /rae/cerrar/<pk>/  con {"cerrado": true/false}
    """

    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Cierra o reabre un registro RAE",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "cerrado": openapi.Schema(
                    type=openapi.TYPE_BOOLEAN,
                    description="true para cerrar, false para reabrir",
                ),
            },
            required=["cerrado"],
        ),
        responses={
            200: "Estado actualizado",
            403: "No tienes permiso",
            404: "Registro no encontrado",
        },
    )
    def post(self, request, pk):
        roles_totales = ["ADMIN", "SECRETARIO"]
        if not (request.user.is_superuser or getattr(request.user, "role", "") in roles_totales):
            return error_403("Solo administradores y secretarios pueden cerrar/reabrir registros.")

        # Validar payload con pydantic
        try:
            payload = ToggleCerradoPayload(**request.data)
        except ValidationError as e:
            return error_400("; ".join(err["msg"] for err in e.errors()))

        registro = get_object_or_404(RegistroRAE, pk=pk)
        registro.cerrado = payload.cerrado
        registro.save(update_fields=["cerrado"])

        accion = "cerrado" if payload.cerrado else "reabierto"
        return Response(
            CerrarRegistroResponse(
                detail=f"Registro {accion} exitosamente.",
                registro_id=registro.id,
                cerrado=registro.cerrado,
            ).model_dump()
        )
