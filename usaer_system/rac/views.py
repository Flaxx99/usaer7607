# rac/views.py

import json
import openpyxl

from datetime import date
from django import forms
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, View
from django.http import HttpResponse
from django.contrib import messages

from .models import RegistroRAC
from .forms import RegistroRACForm
from alumnos.models import Alumno
from escuelas.models import Escuela
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.styles import Alignment



from django.urls import reverse_lazy
class RegistroRACListView(ListView):
    model = RegistroRAC
    template_name = 'rac/registro_list.html'
    context_object_name = 'registros'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset().order_by('-fecha_registro')
        user = self.request.user
        # Si es maestro de apoyo, ve solo sus registros
        if hasattr(user, 'role') and user.role == 'MAESTRO_APOYO':
            qs = qs.filter(maestro_apoyo=user)
        return qs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ]
        context['current_page_title'] = 'Registros RAC'
        return context


class RegistroRACCreateView(CreateView):
    model = RegistroRAC
    form_class = RegistroRACForm
    template_name = 'rac/registro_form.html'
    success_url = reverse_lazy('rac:registro_list')

    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        user = self.request.user

        # Si es maestro de apoyo, limitar alumnos y ocultar el campo maestro_apoyo
        if hasattr(user, 'role') and user.role == 'MAESTRO_APOYO':
            form.fields['maestro_apoyo'].widget = forms.HiddenInput()
            form.initial['maestro_apoyo'] = user.pk
            qs = Alumno.objects.filter(profesor=user)
        else:
            qs = Alumno.objects.all()

        # Excluir alumnos que ya tienen un RAC hoy
        hoy = date.today()
        qs = qs.exclude(registrorac__fecha_registro=hoy)
        form.fields['alumno'].queryset = qs
        return form

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        # Datos para JS: alumnos
        alumnos = list(
            Alumno.objects.values(
                'id', 'curp', 'sexo', 'edad', 'grado', 'profesor_id'
            )
        )
        ctx['alumnos_data'] = json.dumps(alumnos)
        # Datos para JS: escuelas (para zona regular)
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
    """
    Reusa get_form y get_context_data de CreateView, pero
    permite que al editar el alumno actual (incluso si ya tenía un RAC hoy)
    siga apareciendo en el select.
    """
    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        # Incluir al alumno de esta instancia en el queryset
        if self.object and self.object.alumno:
            qs = form.fields['alumno'].queryset
            qs = qs | Alumno.objects.filter(pk=self.object.alumno.pk)
            form.fields['alumno'].queryset = qs
        return form

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['current_page_title'] = f'Editar Registro RAC #{self.object.pk}'
        return context

    def form_valid(self, form):
        messages.success(self.request, "Registro RAC actualizado correctamente.")
        return super().form_valid(form)


class ExportRACExcelView(View):
    def get(self, request, *args, **kwargs):
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'RAC'

        headers = [
            'NOMBRE DE ESCUELA REGULAR',
            'TIPO DE SERVICIO',
            'CCT', 'ZONA',
            'CCT', 'NOMBRE CENTRO DE TRABAJO', 'NOMBRE DEL MAESTRO',
            'CCT', 'ZONA', 'NOMBRE ESCUELA',
            'APELLIDO PATERNO', 'APELLIDO MATERNO', 'NOMBRE(S)',
            'CURP ALUMNO(A)', 'SEXO', 'EDAD', 'GRADO',
            'CON DISCAPACIDAD', 'DIFICULTADES SEVERAS',
            'TRASTORNOS', 'APTITUDES SOBRESALIENTES',
            'OTRO (ESPECIFICAR)', 'OBSERVACIONES',
        ]
        ws.append(headers)

        for reg in RegistroRAC.objects.all().order_by('alumno__apellido_paterno'):
            con_disc = reg.subclasificacion if reg.clasificacion == 'DISCAPACIDAD' else 'NO APLICA'
            dif_sev  = reg.subclasificacion if reg.clasificacion == 'DIFICULTADES_SEVERAS' else 'NO APLICA'
            trast    = reg.subclasificacion if reg.clasificacion == 'TRASTORNOS' else 'NO APLICA'
            apti     = reg.subclasificacion if reg.clasificacion == 'APTITUDES_SOBRESALIENTES' else 'NO APLICA'
            otro     = reg.subclasificacion if reg.clasificacion == 'OTRO' else ''

            row = [
                # Escuela Regular
                reg.escuela_regular.nombre,
                reg.get_service_type_display(),
                # Supervisión Especial
                reg.sup_especial_cct,
                reg.sup_especial_zona,
                # Educación Especial
                reg.centro_cct,
                reg.centro_nombre,
                reg.maestro_apoyo.get_full_name(),
                # Escuela Básica
                reg.escuela_basica.cct,
                reg.escuela_basica.zona,
                reg.escuela_basica.nombre,
                # Alumno
                reg.alumno.apellido_paterno,
                reg.alumno.apellido_materno,
                reg.alumno.nombres,
                reg.curp,
                reg.sexo,
                reg.edad,
                reg.grado,
                # Clasificaciones
                con_disc,
                dif_sev,
                trast,
                apti,
                otro,
                # Observaciones
                reg.observaciones or '',
            ]
            ws.append(row)

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="RAC_USAER7607.xlsx"'
        wb.save(response)
        return response


class ExportRACExcelView(View):
    def get(self, request, *args, **kwargs):
        user = request.user

        # 1) Recuperar y filtrar registros
        registros = RegistroRAC.objects.select_related(
            'alumno__escuela',
            'escuela_regular',
            'escuela_basica',
            'maestro_apoyo'
        ).order_by('escuela_regular__nombre', 'alumno__apellido_paterno')
        if getattr(user, 'role', None) == 'MAESTRO_APOYO':
            registros = registros.filter(maestro_apoyo=user)

        # 2) Hoja “RAC” igual que antes
        wb = openpyxl.Workbook()
        ws1 = wb.active
        ws1.title = 'RAC'

        headers1 = [
            'NOMBRE DE ESCUELA REGULAR', 'TIPO DE SERVICIO',
            'CCT', 'ZONA',
            'CCT', 'NOMBRE CENTRO DE TRABAJO', 'NOMBRE DEL MAESTRO',
            'CCT', 'ZONA', 'NOMBRE ESCUELA',
            'APELLIDO PATERNO', 'APELLIDO MATERNO', 'NOMBRE(S)',
            'CURP ALUMNO(A)', 'SEXO', 'EDAD', 'GRADO',
            'CON DISCAPACIDAD', 'DIFICULTADES SEVERAS',
            'TRASTORNOS', 'APTITUDES SOBRESALIENTES',
            'OTRO (ESPECIFICAR)', 'OBSERVACIONES',
        ]
        ws1.append(headers1)
        self._format_header(ws1, [headers1])

        for reg in registros:
            nivel = reg.alumno.escuela.get_nivel_display()
            grado_txt = f"{reg.grado} {nivel}"
            con_d = reg.subclasificacion if reg.clasificacion == 'DISCAPACIDAD' else 'NO APLICA'
            dif_s = reg.subclasificacion if reg.clasificacion == 'DIFICULTADES_SEVERAS' else 'NO APLICA'
            trast = reg.subclasificacion if reg.clasificacion == 'TRASTORNOS' else 'NO APLICA'
            apti = reg.subclasificacion if reg.clasificacion == 'APTITUDES_SOBRESALIENTES' else 'NO APLICA'
            otro = 'NO APLICA'

            row1 = [
                reg.escuela_regular.nombre,
                reg.get_service_type_display(),
                reg.sup_especial_cct, reg.sup_especial_zona,
                reg.centro_cct, reg.centro_nombre, reg.maestro_apoyo.get_full_name(),
                reg.escuela_basica.cct, reg.escuela_basica.zona, reg.escuela_basica.nombre,
                reg.alumno.apellido_paterno, reg.alumno.apellido_materno, reg.alumno.nombres,
                reg.alumno.curp, reg.alumno.sexo, reg.alumno.edad, grado_txt,
                con_d, dif_s, trast, apti, otro,
                reg.observaciones or '',
            ]
            ws1.append(row1)

        ws1.auto_filter.ref = ws1.dimensions
        ws1.freeze_panes = 'A2'

        # Centrar todo ws1
        for row in ws1.iter_rows(
            min_row=1, max_row=ws1.max_row,
            min_col=1, max_col=ws1.max_column
        ):
            for cell in row:
                cell.alignment = Alignment(horizontal='center', vertical='center')

        # AUTO‐AJUSTAR ANCHO DE COLUMNAS EN ws1
        for column_cells in ws1.columns:
            # get_column_letter necesita el índice de columna
            col_letter = get_column_letter(column_cells[0].column)
            # calcular el largo máximo de texto en la columna
            max_length = 0
            for cell in column_cells:
                if cell.value is not None:
                    text = str(cell.value)
                    if len(text) > max_length:
                        max_length = len(text)
            # fijar ancho (un par de caracteres de padding)
            ws1.column_dimensions[col_letter].width = max_length + 2

        # 3) Hoja “Estadística Población”
        ws2 = wb.create_sheet('Estadística Población')

        # --- 3.1) Tabla general por servicio ---
        servicios = [
            ('CAM Básico',   'CAM_BASICO'),
            ('CAM laboral',  'CAM_LABORAL'),
            ('USAER',        'USAER'),
        ]
        # contar subcategorías
        cat_labels = [
            ('Intelectual','DI'), ('Motriz','DMO'), ('Sordera','SO'),
            ('Hipoacusia','HP'), ('Ceguera','CEG'), ('Baja visión','BV'),
            ('Múltiple','DM'), ('Sordoceguera','SCG'), ('Psicosocial/mental','DME'),
            ('DS Conducta','DSC'), ('DS Comunicación','DSCO'), ('DS Aprendizaje','DSA'),
            ('TDA/TDAH','TDAH'), ('TEA','TEA'),
            ('AS Intelectual','ASI'), ('AS Creativa','ASC'),
            ('AS Artística','ASA'), ('AS Psicomotriz','ASP'),
            ('AS Socioafectiva','ASS'), ('Otros','OTRO'),
        ]

        # 3.1.a) Tres filas de encabezado
        total_cols = 1 + len(servicios)*3 + 3
        last_col = get_column_letter(total_cols)

        # Fila 1: Título general
        ws2.merge_cells(f"A1:{last_col}1")
        c = ws2["A1"]
        c.value = "Población atendida por los servicios de educación especial"
        c.font = Font(bold=True)
        c.alignment = Alignment(horizontal='center', vertical='center')

        # Fila 2: Agrupadores CAM Básico / CAM laboral / USAER / TOTALES
        ws2.merge_cells("A2:A3")
        col = 2
        for label, _ in servicios:
            start = get_column_letter(col)
            end = get_column_letter(col+2)
            ws2.merge_cells(f"{start}2:{end}2")
            cell = ws2[f"{start}2"]
            cell.value = label
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center')
            col += 3
        # Totales generales
        start = get_column_letter(col)
        end = get_column_letter(col+2)
        ws2.merge_cells(f"{start}2:{end}2")
        cell = ws2[f"{start}2"]
        cell.value = "TOTALES"
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center', vertical='center')

        # Fila 3: subdivisión H / M / Total
        col = 2
        for _ in servicios:
            for sub in ("H","M","Total"):
                c = ws2.cell(row=3, column=col, value=sub)
                c.font = Font(bold=True)
                c.alignment = Alignment(horizontal='center', vertical='center')
                col += 1
        # Totales generales H/M/Total
        for sub in ("H","M","Total"):
            c = ws2.cell(row=3, column=col, value=sub)
            c.font = Font(bold=True)
            c.alignment = Alignment(horizontal='center', vertical='center')
            col += 1

        # 3.1.b) Datos, desde fila 4
        start_data = 4
        for idx, (label, code) in enumerate(cat_labels, start=start_data):
            fila = [label]
            h_sum = m_sum = 0
            for _lbl, svc_code in servicios:
                h = registros.filter(subclasificacion=code, service_type=svc_code,
                                     alumno__sexo='H').count()
                m = registros.filter(subclasificacion=code, service_type=svc_code,
                                     alumno__sexo='M').count()
                fila += [h, m, h+m]
                h_sum += h
                m_sum += m
            fila += [h_sum, m_sum, h_sum+m_sum]
            for col_idx, val in enumerate(fila, start=1):
                ws2.cell(row=idx, column=col_idx, value=val)

        # Fila de totales generales (SUM de cada columna)
        final_row = start_data + len(cat_labels)
        for col_idx in range(2, total_cols+1):
            letter = get_column_letter(col_idx)
            formula = f"=SUM({letter}{start_data}:{letter}{final_row-1})"
            ws2.cell(row=final_row, column=col_idx, value=formula)
        ws2.cell(row=final_row, column=1, value="TOTALES").font = Font(bold=True)

        # --- 3.2) Las tres tablas “DISCAPACIDADES”, “APTITUDES SOBRESALIENTES” y “OTRAS CONDICIONES” ---
        blocks = [
            ('DISCAPACIDADES',      cat_labels),
            ('APTITUDES SOBRESALIENTES', cat_labels[14:19]),
            ('OTRAS CONDICIONES',   [('Otros','OTRO')]),
        ]
        cursor = final_row + 2

        for title, items in blocks:
            # Título del bloque
            end = get_column_letter(1 + len(items)*2)
            ws2.merge_cells(f"A{cursor}:{end}{cursor}")
            cell = ws2.cell(row=cursor, column=1, value=title)
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal='center', vertical='center')
            cursor += 1

            # Encabezado: fila de “Servicios” + subcategorías H/M
            # Col A
            ws2.cell(row=cursor, column=1, value='SERVICIOS').font = Font(bold=True)
            for col_idx, (_lbl, code) in enumerate(items, start=2):
                # cada subcategoría ocupa dos columnas: H y M
                h_col = 2*(col_idx-2) + 2
                m_col = h_col + 1
                ws2.cell(row=cursor, column=h_col, value= _lbl).font = Font(bold=True)
                ws2.merge_cells(
                    f"{get_column_letter(h_col)}{cursor}:{get_column_letter(m_col)}{cursor}"
                )
            # TOTAL al final
            tot_start = 2 + len(items)*2
            ws2.cell(row=cursor, column=tot_start, value='TOTAL').font = Font(bold=True)
            ws2.merge_cells(
                f"{get_column_letter(tot_start)}{cursor}:{get_column_letter(tot_start+1)}{cursor}"
            )
            cursor += 1

            # Sub-encabezado H / M
            for col_idx in range(2, 2 + len(items)*2 + 2):
                # saltamos A
                if col_idx == 1: continue
                sub = 'H' if (col_idx-2) % 2 == 0 else 'M'
                cell = ws2.cell(row=cursor, column=col_idx, value=sub)
                cell.font = Font(bold=True)
                cell.alignment = Alignment(horizontal='center', vertical='center')
            cursor += 1

            # Filas Preescolar, Primaria, Secundaria
            for nivel in ('PREESCOLAR','PRIMARIA','SECUNDARIA'):
                ws2.cell(row=cursor, column=1, value=nivel.title()).font = Font(bold=True)
                h_tot = m_tot = 0
                for idx_item, (_lbl, code) in enumerate(items):
                    h = registros.filter(
                        subclasificacion=code,
                        alumno__escuela__nivel=nivel,
                        alumno__sexo='H'
                    ).count()
                    m = registros.filter(
                        subclasificacion=code,
                        alumno__escuela__nivel=nivel,
                        alumno__sexo='M'
                    ).count()
                    col_h = 2 + idx_item*2
                    col_m = col_h + 1
                    ws2.cell(row=cursor, column=col_h, value=h)
                    ws2.cell(row=cursor, column=col_m, value=m)
                    h_tot += h
                    m_tot += m
                # totales fila
                ws2.cell(row=cursor, column=2+len(items)*2,     value=h_tot)
                ws2.cell(row=cursor, column=2+len(items)*2 + 1, value=m_tot)
                cursor += 1

            # Fila TOTAL del bloque
            ws2.cell(row=cursor, column=1, value='TOTAL').font = Font(bold=True)
            h_all = m_all = 0
            for idx_item, (_lbl, code) in enumerate(items):
                h = registros.filter(subclasificacion=code, alumno__sexo='H').count()
                m = registros.filter(subclasificacion=code, alumno__sexo='M').count()
                col_h = 2 + idx_item*2
                col_m = col_h + 1
                ws2.cell(row=cursor, column=col_h, value=h).font = Font(bold=True)
                ws2.cell(row=cursor, column=col_m, value=m).font = Font(bold=True)
                h_all += h
                m_all += m
            # totales generales bloque
            ws2.cell(row=cursor, column=2+len(items)*2,     value=h_all).font = Font(bold=True)
            ws2.cell(row=cursor, column=2+len(items)*2 + 1, value=m_all).font = Font(bold=True)
            cursor += 2  # separador antes del siguiente bloque

        # Congelar y filtro
        ws2.auto_filter.ref = f"A1:{last_col}{cursor}"
        ws2.freeze_panes = 'A4'
        # centrar todo ws2
        for row in ws2.iter_rows(min_row=1, max_row=ws2.max_row,
                                min_col=1, max_col=ws2.max_column):
            for cell in row:
                cell.alignment = Alignment(horizontal='center', vertical='center')

        # 4) Responder
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="ESTADISTICA_RAC.xlsx"'
        wb.save(response)
        return response


    def _format_header(self, sheet, header_rows, row_offset=0):
        fill = PatternFill('solid', fgColor='CCCCCC')
        font = Font(bold=True)
        align = Alignment(horizontal='center', vertical='center', wrap_text=True)
        for i, row in enumerate(header_rows, start=1+row_offset):
            for j, _ in enumerate(row, start=1):
                cell = sheet.cell(row=i, column=j)
                cell.fill = fill
                cell.font = font
                cell.alignment = align