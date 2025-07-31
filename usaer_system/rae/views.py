# usaer_system/rae/views.py

import os
import json
import logging
from datetime import date

from io import BytesIO

from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import View, ListView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse, JsonResponse
from django.db.models import Prefetch, Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from openpyxl import load_workbook
from openpyxl.utils import get_column_letter

from .models import RAEAlumno, RegistroRAE, CicloEscolar 
from alumnos.models import Alumno
from escuelas.models import Escuela # Asegúrate de que este import sea correcto
from .forms import RAEAlumnoForm

logger = logging.getLogger(__name__)

# Función para obtener el ciclo escolar actual (como una INSTANCIA del modelo CicloEscolar)
def get_current_ciclo_escolar_instance():
    """
    Intenta obtener el CicloEscolar activo para la fecha actual.
    Si no encuentra uno activo, busca el próximo ciclo y levanta una excepción
    con un mensaje informativo.
    """
    try:
        return CicloEscolar.get_current_or_next_cycle()
    except CicloEscolar.DoesNotExist as e:
        # Re-lanzamos la excepción para que la vista pueda manejarla y mostrar un mensaje de error.
        raise e
    except Exception as e:
        logger.error(f"Error inesperado en get_current_ciclo_escolar_instance: {e}")
        raise Exception("Error interno al determinar el ciclo escolar actual.")

class CapturaRAEView(LoginRequiredMixin, View):
    """
    Muestra las fichas de captura con un RAEAlumnoForm por alumno.
    """
    template_name = 'rae/captura.html'

    def get_queryset(self, registro, alumnos_maestra):
        for alumno in alumnos_maestra:
            RAEAlumno.objects.get_or_create(
                registro=registro,
                alumno=alumno,
                defaults={
                    'capturado_por': self.request.user,
                    'curp': alumno.curp,
                    'genero': alumno.sexo,
                    'edad': alumno.edad,
                    'grado': f"{alumno.grado}°{alumno.grupo}" # Se usa 'grado' en el modelo RAEAlumno
                }
            )
        return RAEAlumno.objects.filter(registro=registro, alumno__in=alumnos_maestra)

    def get(self, request, *args, **kwargs):
        escuela = request.user.escuela
        if not escuela:
            return render(request, self.template_name, {'error': 'No tienes escuela asignada.'})

        # OBTENER INSTANCIA DE CICLO ESCOLAR de forma dinámica
        try:
            current_ciclo_escolar = get_current_ciclo_escolar_instance() 
        except CicloEscolar.DoesNotExist as e:
            # Si no hay un ciclo actual, mostrar un mensaje al usuario.
            return render(request, self.template_name, {'error': str(e)})
        except Exception as e:
            # Manejo de otros errores inesperados al obtener el ciclo
            logger.error(f"Error inesperado al cargar la página de captura RAE: {e}")
            return render(request, self.template_name, {'error': "Ocurrió un error inesperado al determinar el ciclo escolar."})

        # Crear o obtener el RegistroRAE utilizando la INSTANCIA del CicloEscolar
        registro, _ = RegistroRAE.objects.get_or_create(
            escuela=escuela,
            ciclo_escolar=current_ciclo_escolar, # Asignar la INSTANCIA del CicloEscolar
            defaults={'creado_por': request.user}
        )
        alumnos_maestra = Alumno.objects.filter(profesor=request.user)
        queryset = self.get_queryset(registro, alumnos_maestra)

        forms = [
            RAEAlumnoForm(instance=inst, prefix=str(inst.pk))
            for inst in queryset
        ]

        context = {
            'forms': forms,
            'registro': registro,
            'grupo_discapacidad': ["ceg","bv","so","hp","scg","dmo","di","dme","dm", "psicosocial"], # Incluir psicosocial
            'grupo_dificultades': ["dsc","dsco","dsa"],
            'grupo_trastornos': ["tda","tea"], 
            'grupo_aptitudes': ["asi","asc","asa","asp","ass"],
            'grupo_otras': ["ot"],
            'grupo_apoyos': [
                "psicologia","comunicacion","psicomotricidad",
                "trabajo_social","aprendizaje"
            ],
            'grupo_portafolio': [
                "diagnostico","educativo","deteccion",
                "psicopedagogico","plan","modelo"
            ],
            'grupo_situacion_usaer': ["nuevo_ingreso", "subsecuente"], # Nuevo grupo para estos campos
            'current_ciclo_name': current_ciclo_escolar.nombre # Pasa el nombre del ciclo al contexto

        }
        return render(request, self.template_name, context)

@method_decorator(csrf_exempt, name='dispatch')

class SaveRAEBulkView(LoginRequiredMixin, View):
    """
    Recibe JSON para actualizar en bloque las fichas de RAEAlumno.
    """
    http_method_names = ['post']

    def post(self, request, *args, **kwargs):
        payload = json.loads(request.body)
        registro_id = payload.get('registro_id')
        registro = get_object_or_404(RegistroRAE, pk=registro_id, escuela=request.user.escuela)

        # Incluir 'psicosocial' en la lista de campos
        campos = [
            'ceg','bv','so','hp','scg','dmo','di','dme','dm',
            'psicosocial', # Asegúrate de que este campo esté aquí
            'dsc','dsco','dsa',
            'tda','tea', 
            'asi','asc','ass','asa','asp',
            'ot',
            'psicologia','comunicacion','psicomotricidad',
            "trabajo_social","aprendizaje","nuevo_ingreso","subsecuente",
            "diagnostico","educativo","deteccion",
            "psicopedagogico","plan","modelo"
        ]

        instances_to_update = []
        for alum_data in payload.get('alumnos', []):
            pk = alum_data.get('id')
            try:
                inst = RAEAlumno.objects.get(pk=pk, registro=registro)
            except RAEAlumno.DoesNotExist:
                continue

            update_fields = []
            for f in campos:
                if f in alum_data:
                    val = bool(alum_data[f])
                    if getattr(inst, f) != val:
                        setattr(inst, f, val)
                        update_fields.append(f)
            if update_fields:
                instances_to_update.append(inst)

        if instances_to_update:
            RAEAlumno.objects.bulk_update(instances_to_update, fields=campos)

        return JsonResponse({'status': 'ok'})

# usaer_system/rae/views.py

from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView
from .models import RegistroRAE

class RegistroRAEListView(LoginRequiredMixin, ListView):
    model = RegistroRAE
    template_name = 'rae/mis_raes_list.html' # El nombre que uses para listar los registros RAE
    context_object_name = 'registros_rae'
    paginate_by = 10

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        roles_con_acceso_total = ['ADMIN', 'SECRETARIO'] 
        if not (user.is_superuser or user.role in roles_con_acceso_total):
            # Tu lógica actual de filtrado por escuela y ciclo escolar
            if not hasattr(user, 'escuela') or not user.escuela:
                return RegistroRAE.objects.none()

            escuela_usuario = user.escuela
            try:
                current_ciclo_escolar = CicloEscolar.get_current_or_next_cycle()
            except CicloEscolar.DoesNotExist:
                return RegistroRAE.objects.none()

            queryset = queryset.filter(
                escuela=escuela_usuario,
                ciclo_escolar=current_ciclo_escolar
            )

        # Si el usuario es superusuario O si su rol está en la lista de roles con acceso total,
        # el filtro anterior no se aplica y la vista devolverá todos los registros.
        
        queryset = queryset.order_by('escuela__nombre', 'ciclo_escolar__nombre', 'fecha_creacion')
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # También adapta esta lógica para usar el rol en lugar de los grupos
        roles_con_acceso_total = ['ADMIN', 'SECRETARIO']
        context['can_export_all'] = self.request.user.is_superuser or \
                                    self.request.user.role in roles_con_acceso_total
        return context

    
class ExportRAEExcelView(LoginRequiredMixin, View):
    """
    Exporta los datos RAE de un registro específico a un archivo Excel.
    Ahora, solo incluirá los alumnos asignados al usuario que exporta (si no es Admin/Secretario).
    """
    def get(self, request, pk, *args, **kwargs):
        registro_id = pk

        if not registro_id:
            logger.error("ExportRAEExcelView: No se proporcionó ID de registro en la URL.")
            return HttpResponse("No se proporcionó ID de registro.", status=400)

        try:
            registro = get_object_or_404(RegistroRAE.objects.select_related('escuela', 'ciclo_escolar'), pk=registro_id)
            logger.info(f"ExportRAEExcelView: Procesando exportación para RegistroRAE ID: {registro.pk}, Escuela: {registro.escuela.nombre}, Ciclo: {registro.ciclo_escolar.nombre}")
        except Exception as e:
            logger.error(f"ExportRAEExcelView: Error al obtener RegistroRAE con ID {registro_id}: {e}")
            return HttpResponse(f"Error al obtener Registro RAE: {e}", status=404)

        template_path = os.path.join(settings.BASE_DIR, 'rae', 'static', 'excel_templates', 'rae_template.xlsx')
        
        if not os.path.exists(template_path):
            logger.error(f"ExportRAEExcelView: Plantilla no encontrada en: {template_path}")
            return HttpResponse(f"Error: Plantilla de Excel no encontrada en {template_path}. Por favor, asegúrate de que el archivo 'rae_template.xlsx' esté en la carpeta 'usaer_system/rae/static/excel_templates/'.", status=500)

        try:
            wb = load_workbook(template_path)
            ws = wb["Sheet1"] # Asegúrate que el nombre de la hoja sea "Sheet1"
            logger.info(f"Plantilla '{template_path}' cargada exitosamente. Hoja activa: {ws.title}")
        except KeyError:
            logger.error(f"ExportRAEExcelView: La hoja 'Sheet1' no se encontró en la plantilla de Excel. Por favor, verifica el nombre de la hoja.")
            return HttpResponse(f"Error: La hoja 'Sheet1' no se encontró en la plantilla de Excel.", status=500)
        except Exception as e:
            logger.error(f"ExportRAEExcelView: Error al cargar la plantilla: {e}")
            return HttpResponse(f"Error al cargar la plantilla de Excel: {e}. Asegúrate de que es un archivo .xlsx válido.", status=500)

        # --- LÓGICA DE LLENADO DE DATOS ---
        # Información general del encabezado
        ws['D6'] = registro.escuela.nombre      # ESCUELA:
        ws['AC6'] = registro.escuela.get_nivel_display() if hasattr(registro.escuela, 'get_nivel_display') else registro.escuela.nivel       # NIVEL:
        ws['D8'] = registro.escuela.zona if hasattr(registro.escuela, 'zona') else ''        # ZONA DE LA ESCUELA:
        ws['H8'] = registro.escuela.clave_estatal if hasattr(registro.escuela, 'clave_estatal') else '' # NUMERO DE LA ESCUELA:
        ws['R8'] = registro.escuela.cct         # CCT:
        ws['AC8'] = registro.ciclo_escolar.nombre # CICLO ESCOLAR:
        ws['D10'] = registro.escuela.domicilio if hasattr(registro.escuela, 'domicilio') else '' # DIRECCIÓN:

        #Campos de USAER (VALORES FIJOS)
        ws['D12'] = "USAER 7607" # USAER:
        ws['R12'] = "08FUA0093E" # CCT USAER:

        # Campos de Director/a USAER y Docentes de Apoyo
        ws['D14'] = "Nubia Idaly Solis Mendias" # DIRECTOR/A USAER: (Si es fijo, bien. Si viene de RegistroRAE, asegura que se obtenga de ahí)
        ws['AG14'] = registro.docente_hombres # NÚMERO DE DOCENTES DE APOYO: HOMBRES:
        ws['AO14'] = registro.docente_mujeres # MUJERES:

        ws['C80'] = ws['D14'].value

        # CAMBIO: Usamos una lista de roles con acceso total, consistente con settings.py
        roles_con_acceso_total = ['ADMIN', 'SECRETARIO']

        # ************ INICIO DEL CAMBIO CLAVE PARA FILTRAR ALUMNOS ************
        qs = RAEAlumno.objects.filter(registro=registro)

        # Si el usuario NO es superusuario ni Secretario, filtra los RAEAlumno por el profesor del alumno
        if not (request.user.is_superuser or request.user.groups.filter(name='Secretario').exists()):
            qs = qs.filter(alumno__profesor=request.user) # <--- FILTRO DE ALUMNOS POR EL MAESTRO LOGUEADO
            logger.info(f"ExportRAEExcelView: Filtrando RAEAlumno por el profesor logueado ({request.user.get_full_name()}).")
        else:
            logger.info(f"ExportRAEExcelView: Usuario es Admin/Secretario, exportando TODOS los RAEAlumno.")

        qs = qs.order_by(
            'alumno__grado', 'alumno__grupo', 'alumno__apellido_paterno', 'alumno__apellido_materno', 'alumno__nombres'
        ).select_related('alumno__profesor')

        logger.info(f"ExportRAEExcelView: Cantidad de RAEAlumno encontrados para este registro Y FILTRO: {qs.count()}")
        # ************ FIN DEL CAMBIO CLAVE PARA FILTRAR ALUMNOS ************


        if not qs.exists():
            logger.warning(f"ExportRAEExcelView: No se encontraron RAEAlumno para el Registro ID {registro_id} y el profesor logueado. El archivo Excel se generará con la plantilla pero sin datos de alumnos.")

        # --- Totales por Aptitudes Sobresalientes (AS) ---
        # ... (la lógica de totales debe operar sobre el 'qs' ya filtrado) ...
        # Asegúrate de que todas las Q objects usen el 'qs' ya filtrado:
        aptitudes_q_objects = Q()
        for field_name in ['asi', 'asc', 'ass', 'asa', 'asp']:
            if hasattr(RAEAlumno, field_name):
                aptitudes_q_objects |= Q(**{field_name: True})
        
        total_as_h = qs.filter(aptitudes_q_objects, genero='H').count()
        total_as_m = qs.filter(aptitudes_q_objects, genero='M').count()
        total_as_general = total_as_h + total_as_m
        ws['AE11'] = total_as_h      
        ws['AF11'] = total_as_m      
        ws['AG11'] = total_as_general 

        discapacidad_q_objects = Q()
        for field_name in ['ceg', 'bv', 'so', 'hp', 'scg', 'dmo', 'di', 'dme', 'psicosocial', 'dm']:
            if hasattr(RAEAlumno, field_name):
                discapacidad_q_objects |= Q(**{field_name: True})
        
        total_disc_h = qs.filter(discapacidad_q_objects, genero='H').count()
        total_disc_m = qs.filter(discapacidad_q_objects, genero='M').count()
        total_disc_general = total_disc_h + total_disc_m

        ws['AJ11'] = total_disc_h    # DISC. H
        ws['AK11'] = total_disc_m    # M
        ws['AL11'] = total_disc_general # T

        otras_q_objects = Q()
        for field_name in ['ot', 'dsc', 'dsco', 'dsa', 'tea', 'tda']:
            if hasattr(RAEAlumno, field_name):
                otras_q_objects |= Q(**{field_name: True})

        total_otras_h = qs.filter(otras_q_objects, genero='H').count()
        total_otras_m = qs.filter(otras_q_objects, genero='M').count()
        total_otras_general = total_otras_h + total_otras_m

        ws['AP11'] = total_otras_h # OTRA H
        ws['AQ11'] = total_otras_m # OTRA M
        ws['AR11'] = total_otras_general # OTRA T

        # --- Tabla de datos de alumnos ---
        start_row_for_students_data = 19
        current_student_row = start_row_for_students_data
        alumno_num = 1
        
        column_map_conditions = {
            'ceg': 'H', 'bv': 'I', 'so': 'J', 'hp': 'K', 'scg': 'L', 'dmo': 'M', 'di': 'N', 'dme': 'O', 'psicosocial': 'P','dm': 'Q',
            'dsc': 'R', 'dsco': 'S', 'dsa': 'T',
            'tea': 'U', 'tda': 'V',
            'asi': 'W', 'asc': 'X', 'ass': 'Y', 'asa': 'Z', 'asp': 'AA',
            'ot': 'AB',
            'psicologia': 'AC', 'comunicacion': 'AD', 'psicomotricidad': 'AE', 'trabajo_social': 'AF', 'aprendizaje': 'AG',
            'nuevo_ingreso': 'AI', 'subsecuente': 'AJ',
            'diagnostico': 'AL', 'educativo': 'AM', 'deteccion': 'AN', 'psicopedagogico': 'AO', 'plan': 'AP', 'modelo': 'AQ',
        }

        max_rows_to_clear_single = 50
        for r_clear in range(start_row_for_students_data, start_row_for_students_data + max_rows_to_clear_single):
            for c_clear in range(1, 45):
                if c_clear == 2: # Columna 'B'
                    continue
                ws.cell(row=r_clear, column=c_clear).value = None
        
        for rae_alumno in qs: # Itera sobre el 'qs' ya filtrado
            logger.debug(f"Alumno {alumno_num}: {rae_alumno.alumno.get_full_name()}")

            ws[f'B{current_student_row}'] = alumno_num
            ws[f'C{current_student_row}'] = rae_alumno.alumno.get_full_name() if rae_alumno.alumno else ''
            ws[f'D{current_student_row}'] = rae_alumno.genero if rae_alumno.genero else ''
            ws[f'E{current_student_row}'] = rae_alumno.alumno.edad if rae_alumno.alumno else ''
            ws[f'F{current_student_row}'] = rae_alumno.grado
            ws[f'G{current_student_row}'] = rae_alumno.curp

            for field_name, col_letter in column_map_conditions.items():
                val = ''
                if hasattr(rae_alumno, field_name):
                    val = 'X' if getattr(rae_alumno, field_name) else ''
                
                if val:
                    ws[f'{col_letter}{current_student_row}'] = val

            docente_full_name = ""
            if rae_alumno.alumno and rae_alumno.alumno.profesor:
                docente_full_name = rae_alumno.alumno.profesor.get_full_name()
            
            logger.debug(f"   Nombre completo del docente a escribir en AR{current_student_row}: '{docente_full_name}'")
            ws[f'AR{current_student_row}'] = docente_full_name # Esto mostrará el maestro asignado al alumno
            
            current_student_row += 1
            alumno_num += 1
            
        ws['C76'] = "Juan Aldama, Chihuahua"
        ws['N76'] = date.today().strftime("%d/%m/%Y")

        # Obtener la escuela asociada al registro
        escuela = registro.escuela
        # Escribir el nombre del director de la escuela en la celda K80
        # Usamos .director o .get_director() si lo tuvieras
        director_nombre = escuela.director if escuela.director else "Nombre no disponible"
        ws['K80'] = director_nombre

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        if request.user.is_superuser or request.user.role in roles_con_acceso_total:
            filename = f"Reporte_RAE_{registro.escuela.nombre}_{registro.ciclo_escolar.nombre}.xlsx"
        else:
            filename = f"Reporte_RAE_{registro.escuela.nombre}_{registro.ciclo_escolar.nombre}_Maestro_{request.user.last_name}.xlsx"

        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class ExportAllRAEExcelView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        roles_con_acceso_total = ['ADMIN', 'SECRETARIO']

        # CAMBIO: La condición de permiso ahora usa el rol del usuario
        if not (request.user.is_superuser or request.user.role in roles_con_acceso_total):
            return HttpResponse("No tienes permiso para realizar esta acción.", status=403)

        template_path = os.path.join(settings.BASE_DIR, 'rae', 'static', 'excel_templates', 'rae_template.xlsx')
        try:
            master_workbook = load_workbook(template_path)
            logger.info(f"Plantilla '{template_path}' cargada exitosamente para exportación general.")
        except FileNotFoundError:
            logger.error(f"ExportAllRAEExcelView: Plantilla 'rae_template.xlsx' no encontrada en la ruta esperada: {template_path}")
            return HttpResponse("Error: Plantilla de Excel 'rae_template.xlsx' no encontrada.", status=500)
        except Exception as e:
            logger.error(f"ExportAllRAEExcelView: Error al cargar la plantilla de Excel: {e}")
            return HttpResponse(f"Error al cargar la plantilla de Excel: {e}", status=500)

        template_sheet_name = "Sheet1" # Asegúrate que el nombre de la hoja sea "Sheet1"
        if template_sheet_name not in master_workbook.sheetnames:
            logger.error(f"ExportAllRAEExcelView: La hoja '{template_sheet_name}' no se encontró en la plantilla de Excel. Por favor, verifica el nombre de la hoja.")
            return HttpResponse(f"Error: La hoja '{template_sheet_name}' no se encontró en la plantilla de Excel.", status=500)
        
        template_sheet = master_workbook[template_sheet_name]

        registros = RegistroRAE.objects.all().select_related(
            'escuela', 'ciclo_escolar', 'creado_por'
        ).prefetch_related(
            'detalles_alumnos__alumno__profesor'
        ).order_by('fecha_creacion')

        if not registros.exists():
            logger.warning("ExportAllRAEExcelView: No se encontraron registros RAE para exportar.")
            if template_sheet_name in master_workbook.sheetnames:
                master_workbook.remove(master_workbook[template_sheet_name])
            if not master_workbook.sheetnames:
                master_workbook.create_sheet("Sin Datos de Registros RAE")
            
            output_empty = BytesIO()
            master_workbook.save(output_empty)
            output_empty.seek(0)
            response_empty = HttpResponse(output_empty.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response_empty['Content-Disposition'] = 'attachment; filename=Todos_los_Registros_RAE_Sin_Datos.xlsx'
            return response_empty

        for registro in registros:
            new_sheet = master_workbook.copy_worksheet(template_sheet)
            
            # CAMBIO: Usar clave_estatal para el nombre de la hoja
            sheet_name_base = registro.escuela.clave_estatal if registro.escuela and hasattr(registro.escuela, 'clave_estatal') and registro.escuela.clave_estatal else f"RAE_{registro.id}"
            clean_sheet_name = "".join(c for c in sheet_name_base if c.isalnum() or c in [' ', '_', '-']).replace(' ', '_')
            new_sheet.title = clean_sheet_name[:31]
            logger.info(f"Creando hoja para Registro ID: {registro.pk}, Nombre de hoja: '{new_sheet.title}'")

            # --- INICIO DE LÓGICA DE LLENADO DE DATOS ---
            
            escuela = registro.escuela
            ciclo_escolar = registro.ciclo_escolar

            new_sheet['D6'] = escuela.nombre
            new_sheet['AC6'] = escuela.get_nivel_display() if hasattr(escuela, 'get_nivel_display') else escuela.nivel
            # CORREGIDO: Usar 'zona' en lugar de 'zona_escolar'
            new_sheet['D8'] = escuela.zona if hasattr(escuela, 'zona') else ''
            # CORREGIDO: Usar 'clave_estatal' en lugar de 'no_escuela' (asumiendo que es el número de la escuela)
            new_sheet['H8'] = escuela.clave_estatal if hasattr(escuela, 'clave_estatal') else ''
            new_sheet['R8'] = escuela.cct
            new_sheet['AC8'] = ciclo_escolar.nombre
            # CORREGIDO: Usar 'domicilio' en lugar de 'direccion'
            new_sheet['D10'] = escuela.domicilio if hasattr(escuela, 'domicilio') else ''

            #Campos de USAER (VALORES FIJOS)
            new_sheet['D12'] = "USAER 7607" # USAER:
            new_sheet['R12'] = "08FUA0093E" # CCT USAER:

            new_sheet['D14'] = "Nubia Idaly Solis Mendias" # DIRECTOR/A USAER:
            new_sheet['AG14'] = registro.docente_hombres
            new_sheet['AO14'] = registro.docente_mujeres

            new_sheet['C80'] = new_sheet['D14'].value

            # Obtener la escuela asociada al registro
            escuela = registro.escuela
            # Escribir el nombre del director de la escuela en la celda K80
            # Usamos .director o .get_director() si lo tuvieras
            director_nombre = escuela.director if escuela.director else "Nombre no disponible"
            new_sheet['K80'] = director_nombre
            
            qs_alumnos_rae = registro.detalles_alumnos.all().order_by(
                'alumno__grado', 'alumno__grupo', 'alumno__apellido_paterno', 'alumno__apellido_materno', 'alumno__nombres'
            ).select_related('alumno__profesor')

            logger.debug(f"  Cantidad de RAEAlumno para esta hoja ({registro.pk}): {qs_alumnos_rae.count()}")
            if not qs_alumnos_rae.exists():
                logger.warning(f"  No se encontraron RAEAlumno para el Registro ID {registro.pk}. La hoja se generará con la plantilla pero sin datos de alumnos.")

            aptitudes_q_objects = Q()
            for field_name in ['asi', 'asc', 'ass', 'asa', 'asp']:
                if hasattr(RAEAlumno, field_name):
                    aptitudes_q_objects |= Q(**{field_name: True})
            
            total_as_h = qs_alumnos_rae.filter(aptitudes_q_objects, genero='H').count()
            total_as_m = qs_alumnos_rae.filter(aptitudes_q_objects, genero='M').count()
            total_as_general = total_as_h + total_as_m

            new_sheet['AE11'] = total_as_h
            new_sheet['AF11'] = total_as_m
            new_sheet['AG11'] = total_as_general

            discapacidad_q_objects = Q()
            for field_name in ['ceg', 'bv', 'so', 'hp', 'scg', 'dmo', 'di', 'dme', 'psicosocial', 'dm']:
                if hasattr(RAEAlumno, field_name):
                    discapacidad_q_objects |= Q(**{field_name: True})
            
            total_disc_h = qs_alumnos_rae.filter(discapacidad_q_objects, genero='H').count()
            total_disc_m = qs_alumnos_rae.filter(discapacidad_q_objects, genero='M').count()
            total_disc_general = total_disc_h + total_disc_m

            new_sheet['AJ11'] = total_disc_h
            new_sheet['AK11'] = total_disc_m
            new_sheet['AL11'] = total_disc_general

            otras_q_objects = Q()
            for field_name in ['ot', 'dsc', 'dsco', 'dsa', 'tea', 'tda']:
                if hasattr(RAEAlumno, field_name):
                    otras_q_objects |= Q(**{field_name: True})

            total_otras_h = qs_alumnos_rae.filter(otras_q_objects, genero='H').count()
            total_otras_m = qs_alumnos_rae.filter(otras_q_objects, genero='M').count()
            total_otras_general = total_otras_h + total_otras_m

            new_sheet['AP11'] = total_otras_h
            new_sheet['AQ11'] = total_otras_m
            new_sheet['AR11'] = total_otras_general

            start_row_for_students_data = 19
            current_student_row = start_row_for_students_data
            alumno_num = 1
            
            column_map_conditions = {
                'ceg': 'H', 'bv': 'I', 'so': 'J', 'hp': 'K', 'scg': 'L', 'dmo': 'M', 'di': 'N', 'dme': 'O', 'psicosocial': 'P','dm': 'Q',
                'dsc': 'R', 'dsco': 'S', 'dsa': 'T',
                'tea': 'U', 'tda': 'V',
                'asi': 'W', 'asc': 'X', 'ass': 'Y', 'asa': 'Z', 'asp': 'AA',
                'ot': 'AB',
                'psicologia': 'AC', 'comunicacion': 'AD', 'psicomotricidad': 'AE', 'trabajo_social': 'AF', 'aprendizaje': 'AG',
                'nuevo_ingreso': 'AI', 'subsecuente': 'AJ',
                'diagnostico': 'AL', 'educativo': 'AM', 'deteccion': 'AN', 'psicopedagogico': 'AO', 'plan': 'AP', 'modelo': 'AQ',
            }

            max_rows_to_clear_single = 50
            for r_clear in range(start_row_for_students_data, start_row_for_students_data + max_rows_to_clear_single):
                for c_clear in range(1, 45):
                    if c_clear == 2: # Columna 'B'
                        continue
                    new_sheet.cell(row=r_clear, column=c_clear).value = None
            
            for rae_alumno in qs_alumnos_rae:
                logger.debug(f"  Alumno {alumno_num} en {new_sheet.title}: {rae_alumno.alumno.get_full_name()}")

                new_sheet[f'B{current_student_row}'] = alumno_num
                new_sheet[f'C{current_student_row}'] = rae_alumno.alumno.get_full_name() if rae_alumno.alumno else ''
                # Usar rae_alumno.genero directamente (H o M)
                new_sheet[f'D{current_student_row}'] = rae_alumno.genero if rae_alumno.genero else ''
                new_sheet[f'E{current_student_row}'] = rae_alumno.alumno.edad if rae_alumno.alumno else ''
                new_sheet[f'F{current_student_row}'] = rae_alumno.grado
                new_sheet[f'G{current_student_row}'] = rae_alumno.curp

                for field_name, col_letter in column_map_conditions.items():
                    val = ''
                    if hasattr(rae_alumno, field_name):
                        val = 'X' if getattr(rae_alumno, field_name) else ''
                    
                    if val:
                        new_sheet[f'{col_letter}{current_student_row}'] = val

                docente_full_name = ""
                if rae_alumno.alumno and rae_alumno.alumno.profesor:
                    docente_full_name = rae_alumno.alumno.profesor.get_full_name()
                
                logger.debug(f"    Docente para {rae_alumno.alumno.get_full_name()} en AR{current_student_row}: '{docente_full_name}'")
                new_sheet[f'AR{current_student_row}'] = docente_full_name
                
                current_student_row += 1
                alumno_num += 1
                
            new_sheet['C76'] = "Juan Aldama, Chihuahua"
            new_sheet['N76'] = date.today().strftime("%d/%m/%Y")


            # --- FIN DE LÓGICA DE LLENADO DE DATOS ---

        if template_sheet_name in master_workbook.sheetnames:
            master_workbook.remove(master_workbook[template_sheet_name])
            logger.info(f"Hoja '{template_sheet_name}' eliminada del libro maestro.")
        
        output = BytesIO()
        master_workbook.save(output)
        output.seek(0)

        response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename=Todos_los_Registros_RAE.xlsx'
        logger.info("Archivo 'Todos_los_Registros_RAE.xlsx' generado y listo para descarga.")
        return response
    




