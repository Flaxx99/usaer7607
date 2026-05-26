# usaer_system/rae/views.py
import os
import json
import logging
from io import BytesIO
from datetime import date
from openpyxl import load_workbook

from rest_framework import viewsets, permissions, filters, views, status
from rest_framework.response import Response
from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Q
from usuarios.models import SystemConfiguration

# ... (rest of imports)

from .models import RegistroRAE, RAEAlumno
from .serializers import RegistroRAESerializer, RAEAlumnoSerializer, BulkRAESaveSerializer
from ciclos_escolares.utils import get_current_ciclo_escolar_instance
from alumnos.models import Alumno

logger = logging.getLogger(__name__)

# --- 1. VIEWSET CRUD (Para 'mis_registros') ---

class RegistroRAEViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroRAESerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['escuela__nombre']
    ordering_fields = ['fecha_creacion']

    def get_queryset(self):
        user = self.request.user
        qs = RegistroRAE.objects.select_related('escuela', 'ciclo_escolar', 'creado_por')

        # Filtro por Ciclo
        try:
            ciclo_actual = get_current_ciclo_escolar_instance()
            qs = qs.filter(ciclo_escolar=ciclo_actual)
        except Exception:
            return RegistroRAE.objects.none()

        # Filtro por Rol/Escuela
        roles_totales = ['ADMIN', 'SECRETARIO']
        if not (user.is_superuser or getattr(user, 'role', '') in roles_totales):
            if hasattr(user, 'escuela') and user.escuela:
                qs = qs.filter(escuela=user.escuela)
            else:
                return RegistroRAE.objects.none()
        
        return qs.order_by('escuela__nombre', 'fecha_creacion')


# --- 2. CAPTURA Y GUARDADO MASIVO ---

class RAEInitCaptureView(views.APIView):
    """
    Inicializa la captura: Busca/Crea el registro y devuelve los alumnos.
    URL: /rae/captura/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        escuela = user.escuela
        if not escuela:
            return Response({'detail': 'No tienes escuela asignada.'}, status=400)

        try:
            ciclo = get_current_ciclo_escolar_instance()
        except Exception as e:
            return Response({'detail': str(e)}, status=400)

        # Get or Create Registro
        registro, _ = RegistroRAE.objects.get_or_create(
            escuela=escuela,
            ciclo_escolar=ciclo,
            defaults={'creado_por': user}
        )

        # Asegurar fichas de alumnos
        alumnos_maestra = Alumno.objects.filter(profesor=user, activo=True)
        rae_alumnos = []
        for alumno in alumnos_maestra:
            obj, _ = RAEAlumno.objects.get_or_create(
                registro=registro,
                alumno=alumno,
                defaults={
                    'capturado_por': user,
                    'curp': alumno.curp,
                    'genero': alumno.sexo,
                    'edad': alumno.edad,
                    'grado': f"{alumno.grado}°{alumno.grupo}"
                }
            )
            rae_alumnos.append(obj)

        serializer = RAEAlumnoSerializer(rae_alumnos, many=True)
        return Response({
            'registro_id': registro.id,
            'ciclo': ciclo.nombre,
            'escuela': escuela.nombre,
            'alumnos': serializer.data
        })

class RAEBulkSaveView(views.APIView):
    """
    Guarda cambios masivos en los alumnos.
    URL: /rae/guardar_bulk/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BulkRAESaveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        registro_id = data['registro_id']
        
        # Validar propiedad del registro
        qs_reg = RegistroRAE.objects.filter(pk=registro_id)
        if not (request.user.is_superuser or request.user.role in ['ADMIN', 'SECRETARIO']):
            qs_reg = qs_reg.filter(escuela=request.user.escuela)
        
        registro = get_object_or_404(qs_reg)

        # Campos permitidos
        campos = [
            'ceg','bv','so','hp','scg','dmo','di','dme','dm','psicosocial',
            'dsc','dsco','dsa','tda','tea', 
            'asi','asc','ass','asa','asp','ot',
            'psicologia','comunicacion','psicomotricidad',
            "trabajo_social","aprendizaje","nuevo_ingreso","subsecuente",
            "diagnostico","educativo","deteccion",
            "psicopedagogico","plan","modelo"
        ]

        updated_count = 0
        instances = []
        
        for alum_data in data['alumnos']:
            pk = alum_data.get('id')
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

        return Response({'status': 'success', 'updated': updated_count})


# --- 3. EXPORTACIÓN EXCEL (Lógica Original Integrada) ---

class ExportRAEView(views.APIView):
    """
    Exporta UN registro específico.
    URL: /rae/exportar_excel/<pk>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        registro_id = pk
        try:
            registro = get_object_or_404(RegistroRAE.objects.select_related('escuela', 'ciclo_escolar'), pk=registro_id)
            config = SystemConfiguration.objects.first()
        except Exception as e:
            return Response({"detail": str(e)}, status=404)

        template_path = os.path.join(settings.BASE_DIR, 'rae', 'static', 'excel_templates', 'rae_template.xlsx')
        if not os.path.exists(template_path):
            return Response({"detail": "Plantilla no encontrada."}, status=500)

        try:
            wb = load_workbook(template_path)
            ws = wb["Sheet1"]
        except Exception as e:
            return Response({"detail": f"Error cargando plantilla: {e}", "status": 500})

        # --- LLENADO DE DATOS DINÁMICOS ---
        ws['D6'] = registro.escuela.nombre
        ws['AC6'] = registro.escuela.get_nivel_display() if hasattr(registro.escuela, 'get_nivel_display') else registro.escuela.nivel
        ws['D8'] = registro.escuela.zona if hasattr(registro.escuela, 'zona') else ''
        ws['H8'] = registro.escuela.clave_estatal if hasattr(registro.escuela, 'clave_estatal') else ''
        ws['R8'] = registro.escuela.cct
        ws['AC8'] = registro.ciclo_escolar.nombre
        ws['D10'] = registro.escuela.domicilio if hasattr(registro.escuela, 'domicilio') else ''
        
        ws['D12'] = config.centro_nombre if config else "USAER 7607"
        ws['R12'] = config.centro_cct if config else "08FUA0093E"
        ws['D14'] = config.director_responsable if config else "S/N"
        ws['AG14'] = registro.docente_hombres
        ws['AO14'] = registro.docente_mujeres
        ws['C80'] = ws['D14'].value


        roles_totales = ['ADMIN', 'SECRETARIO']
        qs = RAEAlumno.objects.filter(registro=registro)

        if not (request.user.is_superuser or getattr(request.user, 'role', '') in roles_totales):
            qs = qs.filter(alumno__profesor=request.user)

        qs = qs.order_by('alumno__grado', 'alumno__grupo', 'alumno__apellido_paterno', 'alumno__nombres').select_related('alumno__profesor')

        # Totales
        aptitudes_q = Q()
        for f in ['asi', 'asc', 'ass', 'asa', 'asp']: aptitudes_q |= Q(**{f: True})
        
        ws['AE11'] = qs.filter(aptitudes_q, genero='H').count()
        ws['AF11'] = qs.filter(aptitudes_q, genero='M').count()
        ws['AG11'] = ws['AE11'].value + ws['AF11'].value

        disc_q = Q()
        for f in ['ceg', 'bv', 'so', 'hp', 'scg', 'dmo', 'di', 'dme', 'psicosocial', 'dm']: disc_q |= Q(**{f: True})
        
        ws['AJ11'] = qs.filter(disc_q, genero='H').count()
        ws['AK11'] = qs.filter(disc_q, genero='M').count()
        ws['AL11'] = ws['AJ11'].value + ws['AK11'].value

        otras_q = Q()
        for f in ['ot', 'dsc', 'dsco', 'dsa', 'tea', 'tda']: otras_q |= Q(**{f: True})
        
        ws['AP11'] = qs.filter(otras_q, genero='H').count()
        ws['AQ11'] = qs.filter(otras_q, genero='M').count()
        ws['AR11'] = ws['AP11'].value + ws['AQ11'].value

        # Filas de alumnos
        current_row = 19
        # Limpiar filas
        for r in range(19, 69):
            for c in range(1, 45):
                if c != 2: ws.cell(row=r, column=c).value = None

        col_map = {
            'ceg': 'H', 'bv': 'I', 'so': 'J', 'hp': 'K', 'scg': 'L', 'dmo': 'M', 'di': 'N', 'dme': 'O', 'psicosocial': 'P','dm': 'Q',
            'dsc': 'R', 'dsco': 'S', 'dsa': 'T', 'tea': 'U', 'tda': 'V',
            'asi': 'W', 'asc': 'X', 'ass': 'Y', 'asa': 'Z', 'asp': 'AA', 'ot': 'AB',
            'psicologia': 'AC', 'comunicacion': 'AD', 'psicomotricidad': 'AE', 'trabajo_social': 'AF', 'aprendizaje': 'AG',
            'nuevo_ingreso': 'AI', 'subsecuente': 'AJ',
            'diagnostico': 'AL', 'educativo': 'AM', 'deteccion': 'AN', 'psicopedagogico': 'AO', 'plan': 'AP', 'modelo': 'AQ',
        }

        alumno_num = 1
        for rae_alumno in qs:
            ws[f'B{current_row}'] = alumno_num
            ws[f'C{current_row}'] = rae_alumno.alumno.get_full_name()
            ws[f'D{current_row}'] = rae_alumno.genero or ''
            ws[f'E{current_row}'] = rae_alumno.alumno.edad or ''
            ws[f'F{current_row}'] = rae_alumno.grado or ''
            ws[f'G{current_row}'] = rae_alumno.curp or ''

            for field, col in col_map.items():
                if getattr(rae_alumno, field):
                    ws[f'{col}{current_row}'] = 'X'

            if rae_alumno.alumno.profesor:
                ws[f'AR{current_row}'] = rae_alumno.alumno.profesor.get_full_name()

            current_row += 1
            alumno_num += 1

        ws['C76'] = "Juan Aldama, Chihuahua"
        ws['N76'] = date.today().strftime("%d/%m/%Y")
        
        escuela = registro.escuela
        ws['K80'] = escuela.director if escuela.director else "Nombre no disponible"

        # Output
        output = BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"Reporte_RAE_{registro.escuela.nombre}_{registro.ciclo_escolar.nombre}.xlsx"
        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
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
        'ceg': 'H', 'bv': 'I', 'so': 'J', 'hp': 'K', 'scg': 'L', 'dmo': 'M',
        'di': 'N', 'dme': 'O', 'psicosocial': 'P', 'dm': 'Q',
        'dsc': 'R', 'dsco': 'S', 'dsa': 'T',
        'tea': 'U', 'tda': 'V',
        'asi': 'W', 'asc': 'X', 'ass': 'Y', 'asa': 'Z', 'asp': 'AA',
        'ot': 'AB',
        'psicologia': 'AC', 'comunicacion': 'AD', 'psicomotricidad': 'AE',
        'trabajo_social': 'AF', 'aprendizaje': 'AG',
        'nuevo_ingreso': 'AI', 'subsecuente': 'AJ',
        'diagnostico': 'AL', 'educativo': 'AM', 'deteccion': 'AN',
        'psicopedagogico': 'AO', 'plan': 'AP', 'modelo': 'AQ',
    }

    def _llenar_encabezado(self, ws, escuela, registro, config):
        """Llena el encabezado de una hoja RAE con datos de escuela y registro."""
        ws['D6'] = escuela.nombre
        ws['AC6'] = escuela.get_nivel_display() if hasattr(escuela, 'get_nivel_display') else escuela.nivel
        ws['D8'] = escuela.zona if hasattr(escuela, 'zona') else ''
        ws['H8'] = escuela.clave_estatal if hasattr(escuela, 'clave_estatal') else ''
        ws['R8'] = escuela.cct
        ws['AC8'] = registro.ciclo_escolar.nombre
        ws['D10'] = escuela.domicilio if hasattr(escuela, 'domicilio') else ''
        
        ws['D12'] = config.centro_nombre if config else "USAER 7607"
        ws['R12'] = config.centro_cct if config else "08FUA0093E"
        ws['D14'] = config.director_responsable if config else "S/N"
        ws['AG14'] = registro.docente_hombres
        ws['AO14'] = registro.docente_mujeres
        ws['C80'] = ws['D14'].value

        ws['K80'] = escuela.director if escuela.director else "Nombre no disponible"

    def _calcular_totales(self, ws, qs):
        """Calcula y escribe los totales de aptitudes, discapacidad y otras condiciones."""
        # --- Aptitudes Sobresalientes ---
        aptitudes_q = Q()
        for f in ['asi', 'asc', 'ass', 'asa', 'asp']:
            aptitudes_q |= Q(**{f: True})

        total_as_h = qs.filter(aptitudes_q, genero='H').count()
        total_as_m = qs.filter(aptitudes_q, genero='M').count()
        ws['AE11'] = total_as_h
        ws['AF11'] = total_as_m
        ws['AG11'] = total_as_h + total_as_m

        # --- Discapacidad ---
        disc_q = Q()
        for f in ['ceg', 'bv', 'so', 'hp', 'scg', 'dmo', 'di', 'dme', 'psicosocial', 'dm']:
            disc_q |= Q(**{f: True})

        total_disc_h = qs.filter(disc_q, genero='H').count()
        total_disc_m = qs.filter(disc_q, genero='M').count()
        ws['AJ11'] = total_disc_h
        ws['AK11'] = total_disc_m
        ws['AL11'] = total_disc_h + total_disc_m

        # --- Otras condiciones ---
        otras_q = Q()
        for f in ['ot', 'dsc', 'dsco', 'dsa', 'tea', 'tda']:
            otras_q |= Q(**{f: True})

        total_otras_h = qs.filter(otras_q, genero='H').count()
        total_otras_m = qs.filter(otras_q, genero='M').count()
        ws['AP11'] = total_otras_h
        ws['AQ11'] = total_otras_m
        ws['AR11'] = total_otras_h + total_otras_m

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
            ws[f'B{current_row}'] = alumno_num
            ws[f'C{current_row}'] = rae_alumno.alumno.get_full_name() if rae_alumno.alumno else ''
            ws[f'D{current_row}'] = rae_alumno.genero or ''
            ws[f'E{current_row}'] = rae_alumno.alumno.edad if rae_alumno.alumno else ''
            ws[f'F{current_row}'] = rae_alumno.grado or ''
            ws[f'G{current_row}'] = rae_alumno.curp or ''

            # Marcar condiciones con 'X'
            for field, col in self.COL_MAP_CONDITIONS.items():
                if getattr(rae_alumno, field, False):
                    ws[f'{col}{current_row}'] = 'X'

            # Docente responsable
            if rae_alumno.alumno and rae_alumno.alumno.profesor:
                ws[f'AR{current_row}'] = rae_alumno.alumno.profesor.get_full_name()

            current_row += 1
            alumno_num += 1

    def _llenar_pie(self, ws, config):
        """Llena el pie de la hoja (fecha y lugar)."""
        ws['C76'] = config.ubicacion_centro if config else "Juan Aldama, Chihuahua"
        ws['N76'] = date.today().strftime("%d/%m/%Y")

    def get(self, request):
        roles_totales = ['ADMIN', 'SECRETARIO']
        if not (request.user.is_superuser or getattr(request.user, 'role', '') in roles_totales):
            return Response({"detail": "No tienes permiso."}, status=403)
        
        config = SystemConfiguration.objects.first()

        try:
            ciclo = get_current_ciclo_escolar_instance()
        except Exception as e:
            return Response({"detail": str(e)}, status=400)


        template_path = os.path.join(settings.BASE_DIR, 'rae', 'static', 'excel_templates', 'rae_template.xlsx')
        if not os.path.exists(template_path):
            return Response({"detail": "Plantilla no encontrada."}, status=500)

        try:
            master_workbook = load_workbook(template_path)
            template_sheet = master_workbook["Sheet1"]
        except Exception as e:
            return Response({"detail": f"Error cargando plantilla: {e}"}, status=500)

        registros = RegistroRAE.objects.filter(ciclo_escolar=ciclo).select_related(
            'escuela', 'ciclo_escolar'
        ).prefetch_related('detalles_alumnos__alumno__profesor').order_by('escuela__nombre')

        if not registros.exists():
            return Response({"detail": "No hay registros para exportar."}, status=404)

        for registro in registros:
            new_sheet = master_workbook.copy_worksheet(template_sheet)
            sheet_name_base = registro.escuela.clave_estatal or f"RAE_{registro.id}"
            clean_name = "".join(c for c in sheet_name_base if c.isalnum() or c in [' ', '_']).replace(' ', '_')
            new_sheet.title = clean_name[:31]

            escuela = registro.escuela

            # 1. Encabezado
            self._llenar_encabezado(new_sheet, escuela, registro, config)

            # 2. Queryset de alumnos para esta hoja
            qs = registro.detalles_alumnos.all().order_by(
                'alumno__grado', 'alumno__grupo',
                'alumno__apellido_paterno', 'alumno__nombres'
            ).select_related('alumno__profesor')

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
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename=Todos_los_Registros_RAE.xlsx'
        return response