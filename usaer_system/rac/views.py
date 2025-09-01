# rac/views.py
import json
import os
from datetime import date
from io import BytesIO

from openpyxl import load_workbook

from django import forms
from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponse, Http404
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, View
from django.contrib import messages

from .forms import RegistroRACForm
from .models import RegistroRAC
from alumnos.models import Alumno
from escuelas.models import Escuela

# --- Views for CRUD operations ---

class RegistroRACListView(LoginRequiredMixin, ListView):
    model = RegistroRAC
    template_name = 'rac/registro_list.html'
    context_object_name = 'registros'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset().order_by('-fecha_registro')
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'MAESTRO_APOYO':
            qs = qs.filter(maestro_apoyo=user)
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ]
        context['current_page_title'] = 'Registros RAC'
        roles_con_acceso_total = ['ADMIN', 'SECRETARIO']
        context['can_export_all'] = self.request.user.is_superuser or self.request.user.role in roles_con_acceso_total
        return context


class RegistroRACCreateView(LoginRequiredMixin, CreateView):
    model = RegistroRAC
    form_class = RegistroRACForm
    template_name = 'rac/registro_form.html'
    success_url = reverse_lazy('rac:registro_list')

    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        user = self.request.user

        if hasattr(user, 'role') and user.role == 'MAESTRO_APOYO':
            form.fields['maestro_apoyo'].widget = forms.HiddenInput()
            form.initial['maestro_apoyo'] = user.pk
            qs = Alumno.objects.filter(profesor=user)
        else:
            qs = Alumno.objects.all()

        hoy = date.today()
        if self.object and self.object.pk:
             qs = qs.exclude(registrorac__fecha_registro=hoy).exclude(pk=self.object.alumno.pk)
        else:
             qs = qs.exclude(registrorac__fecha_registro=hoy)

        form.fields['alumno'].queryset = qs
        return form

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        alumnos = list(Alumno.objects.values('id', 'curp', 'sexo', 'edad', 'grado', 'profesor_id'))
        ctx['alumnos_data'] = json.dumps(alumnos)
        escuelas = list(Escuela.objects.values('id', 'zona'))
        ctx['escuelas_data'] = json.dumps(escuelas)
        ctx['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Registros RAC', 'url': reverse_lazy('rac:registro_list')}
        ]
        ctx['current_page_title'] = 'Nuevo Registro RAC'
        return ctx

    def form_valid(self, form):
        messages.success(self.request, "Registro RAC creado correctamente.")
        return super().form_valid(form)


class RegistroRACUpdateView(RegistroRACCreateView, UpdateView):
    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        if self.object and self.object.alumno:
            qs = form.fields['alumno'].queryset
            qs = qs | Alumno.objects.filter(pk=self.object.alumno.pk)
            form.fields['alumno'].queryset = qs.distinct()
        return form

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['current_page_title'] = f'Editar Registro RAC #{self.object.pk}'
        return context

    def form_valid(self, form):
        messages.success(self.request, "Registro RAC actualizado correctamente.")
        return super().form_valid(form)


# --- Helper functions for Excel Export ---

def fill_rac_data(ws, registros):
    start_row = 3
    for i, reg in enumerate(registros, start=start_row):
        maestro_nombre_completo = ''
        if reg.maestro_apoyo:
            maestro_nombre_completo = " ".join(filter(None, [reg.maestro_apoyo.nombre, reg.maestro_apoyo.apellido_paterno, reg.maestro_apoyo.apellido_materno]))

        grado_formateado = reg.grado
        if reg.alumno and reg.alumno.escuela:
            grado_formateado = f"{reg.grado} {reg.alumno.escuela.get_nivel_display().upper()}"

        ws[f'A{i}'] = reg.escuela_regular.nombre if reg.escuela_regular else ''
        ws[f'B{i}'] = reg.get_service_type_display()
        ws[f'C{i}'] = reg.sup_especial_cct
        ws[f'D{i}'] = reg.sup_especial_zona
        ws[f'E{i}'] = reg.centro_cct
        ws[f'F{i}'] = reg.centro_nombre
        ws[f'G{i}'] = maestro_nombre_completo
        ws[f'H{i}'] = reg.escuela_basica.cct if reg.escuela_basica else ''
        ws[f'I{i}'] = reg.escuela_basica.zona if reg.escuela_basica else ''
        ws[f'J{i}'] = reg.escuela_basica.nombre if reg.escuela_basica else ''
        ws[f'K{i}'] = reg.alumno.apellido_paterno if reg.alumno else ''
        ws[f'L{i}'] = reg.alumno.apellido_materno if reg.alumno else ''
        ws[f'M{i}'] = reg.alumno.nombres if reg.alumno else ''
        ws[f'N{i}'] = reg.alumno.curp if reg.alumno else ''
        ws[f'O{i}'] = reg.alumno.sexo if reg.alumno else ''
        ws[f'P{i}'] = reg.edad
        ws[f'Q{i}'] = grado_formateado
        ws[f'R{i}'] = reg.subclasificacion if reg.clasificacion == 'DISCAPACIDAD' else 'NA (NO APLICA)'
        ws[f'S{i}'] = reg.subclasificacion if reg.clasificacion == 'DIFICULTADES_SEVERAS' else 'NA (NO APLICA)'
        ws[f'T{i}'] = reg.subclasificacion if reg.clasificacion == 'TRASTORNOS' else 'NA (NO APLICA)'
        ws[f'U{i}'] = reg.subclasificacion if reg.clasificacion == 'APTITUDES_SOBRESALIENTES' else 'NA (NO APLICA)'
        ws[f'V{i}'] = reg.subclasificacion if reg.clasificacion == 'OTRO' else 'NA (NO APLICA)'
        ws[f'W{i}'] = reg.observaciones or ''


def fill_statistics_data(ws, registros):
    cat_labels = [
        ('Intelectual', 'DI'), ('Motriz', 'DMO'), ('Sordera', 'SO'),
        ('Hipoacusia', 'HP'), ('Ceguera', 'CEG'), ('Baja visión', 'BV'),
        ('Múltiple', 'DM'), ('Sordoceguera', 'SCG'), ('Psicosocial/mental', 'DME'),
        ('DS Conducta', 'DSC'), ('DS Comunicación', 'DSCO'), ('DS Aprendizaje', 'DSA'),
        ('TDA/TDAH', 'TDAH'), ('TEA', 'TEA'),
        ('AS Intelectual', 'ASI'), ('AS Creativa', 'ASC'),
        ('AS Artística', 'ASA'), ('AS Psicomotriz', 'ASP'),
        ('AS Socioafectiva', 'ASS'),
        ('Otros', 'OTRO'),
        ('Doble Excepcionalidad', 'DE'), # Nueva categoría
    ]
    servicios = [('CAM Básico', 'CAM_BASICO'), ('CAM laboral', 'CAM_LABORAL'), ('USAER', 'USAER')]

    start_row_main = 10
    for i, (label, code) in enumerate(cat_labels):
        row = start_row_main + i
        for j, (svc_label, svc_code) in enumerate(servicios):
            col = 3 + j * 3
            h = registros.filter(subclasificacion=code, service_type=svc_code, alumno__sexo='H').count()
            m = registros.filter(subclasificacion=code, service_type=svc_code, alumno__sexo='M').count()
            ws.cell(row=row, column=col, value=h)
            ws.cell(row=row, column=col + 1, value=m)

    # Definición de los tres bloques de tablas de resumen
    blocks = [
        # Tabla 1: DISCAPACIDADES (incluye DS y Trastornos)
        ('DISCAPACIDADES', cat_labels[0:14], 35), # DI a TEA
        # Tabla 2: APTITUDES SOBRESALIENTES (incluye Doble Excepcionalidad)
        ('APTITUDES SOBRESALIENTES', cat_labels[14:20], 43), # ASI a DE
        # Tabla 3: OTRAS CONDICIONES
        ('OTRAS CONDICIONES', [cat_labels[19]], 51), # Solo OTRO
    ]

    for title, items, start_row_block in blocks:
        # Limpiar celdas antes de escribir para evitar residuos de conteos anteriores
        # Asumiendo que cada bloque tiene 4 filas de datos (Preescolar, Primaria, Secundaria, Total)
        # y que cada item tiene 2 columnas (H, M)
        num_cols_per_item = 2
        num_rows_data = 4 # Preescolar, Primaria, Secundaria, Total
        
        # Calcular el rango de columnas a limpiar para este bloque
        # Empieza en la columna 3 (C) y va hasta 3 + (num_items * 2) - 1
        # El total de columnas de datos es 2 (H/M) * num_items
        max_col_to_clear = 3 + len(items) * num_cols_per_item -1
        
        for r_clear in range(start_row_block, start_row_block + num_rows_data):
            for c_clear in range(3, max_col_to_clear + 1):
                ws.cell(row=r_clear, column=c_clear).value = None

        for i, nivel in enumerate(['PREESCOLAR', 'PRIMARIA', 'SECUNDARIA']):
            row = start_row_block + i
            for j, (label, code) in enumerate(items):
                col = 3 + j * 2
                h = registros.filter(subclasificacion=code, alumno__escuela__nivel=nivel, alumno__sexo='H').count()
                m = registros.filter(subclasificacion=code, alumno__escuela__nivel=nivel, alumno__sexo='M').count()
                ws.cell(row=row, column=col, value=h)
                ws.cell(row=row, column=col + 1, value=m)

        # Calcular y escribir la fila TOTAL para cada bloque
        total_row_block = start_row_block + 3 # Fila del TOTAL (Preescolar+Primaria+Secundaria)
        for j, (label, code) in enumerate(items):
            col = 3 + j * 2
            total_h = registros.filter(subclasificacion=code, alumno__sexo='H').count()
            total_m = registros.filter(subclasificacion=code, alumno__sexo='M').count()
            ws.cell(row=total_row_block, column=col, value=total_h)
            ws.cell(row=total_row_block, column=col + 1, value=total_m)

class BaseRACExportView(LoginRequiredMixin, View):
    template_name = 'rac/static/excel_templates/rac_template_v2.xlsx'
    
    def get(self, request, *args, **kwargs):
        template_path = settings.BASE_DIR / self.template_name
        if not os.path.exists(template_path):
            return HttpResponse("Error: La plantilla de Excel no fue encontrada.", status=500)

        try:
            wb = load_workbook(template_path)
            ws_rac = wb['RAC']
            ws_stats = wb['ESTADÍSTICA POBLACIÓN 2025']
        except (KeyError, FileNotFoundError):
            return HttpResponse("Error: El formato de la plantilla es incorrecto o faltan hojas.", status=500)

        print("--- INICIANDO EXPORTACIÓN RAC ---")
        print(f"Usuario: {request.user} (Rol: {getattr(request.user, 'role', 'N/A')})")

        registros = self.get_queryset()
        print(f"Registros encontrados: {registros.count()}")

        fill_rac_data(ws_rac, registros)
        fill_statistics_data(ws_stats, registros)

        # Ajustar ancho de columnas
        ws_rac.column_dimensions['O'].width = 5
        ws_rac.column_dimensions['P'].width = 6

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        filename = self.get_filename()
        print(f"Nombre de archivo generado: {filename}")
        print("--- FINALIZANDO EXPORTACIÓN RAC ---")

        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

        output = BytesIO()
        wb.save(output)
        output.seek(0)

        filename = self.get_filename()
        print(f"Nombre de archivo generado: {filename}")
        print("--- FINALIZANDO EXPORTACIÓN RAC ---")

        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def get_queryset(self):
        raise NotImplementedError("Subclasses must implement get_queryset.")

    def get_filename(self):
        raise NotImplementedError("Subclasses must implement get_filename.")


class ExportRACExcelView(BaseRACExportView):
    def get_queryset(self):
        user = self.request.user
        registros = RegistroRAC.objects.select_related(
            'alumno__escuela', 'escuela_regular', 'escuela_basica', 'maestro_apoyo'
        )
        if hasattr(user, 'role') and user.role == 'MAESTRO_APOYO':
            registros = registros.filter(maestro_apoyo=user)
        
        return registros.order_by('alumno__apellido_paterno')

    def get_filename(self):
        user = self.request.user
        return f"RAC_{user.first_name}_{user.last_name}.xlsx"


class ExportAllRACExcelView(BaseRACExportView):
    def dispatch(self, request, *args, **kwargs):
        roles_con_acceso_total = ['ADMIN', 'SECRETARIO']
        if not (request.user.is_superuser or getattr(request.user, 'role', '') in roles_con_acceso_total):
            return HttpResponse("No tienes permiso para realizar esta acción.", status=403)
        return super().dispatch(request, *args, **kwargs)

    def get_queryset(self):
        return RegistroRAC.objects.select_related(
            'alumno__escuela', 'escuela_regular', 'escuela_basica', 'maestro_apoyo'
        ).order_by('escuela_regular__nombre', 'alumno__grado')

    def get_filename(self):
        return f"RAC_COMPLETO_{date.today().strftime('%Y-%m-%d')}.xlsx"
