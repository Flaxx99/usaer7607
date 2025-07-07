# rac/views.py

import json
import openpyxl
from django.urls import reverse_lazy
from django.views.generic import ListView, CreateView, UpdateView, View
from django.http import HttpResponse

from .models import RegistroRAC
from .forms import RegistroRACForm
from alumnos.models import Alumno
from escuelas.models import Escuela


class RegistroRACListView(ListView):
    model = RegistroRAC
    template_name = 'rac/registro_list.html'
    context_object_name = 'registros'
    paginate_by = 20


class RegistroRACCreateView(CreateView):
    model = RegistroRAC
    form_class = RegistroRACForm
    template_name = 'rac/registro_form.html'
    success_url = reverse_lazy('rac:registro_list')

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        # Datos de alumnos, incluyendo el profesor asociado (profesor_id)
        alumnos = list(
            Alumno.objects.values(
                'id',
                'curp',
                'sexo',
                'edad',
                'grado',
                'profesor_id'
            )
        )
        ctx['alumnos_data'] = json.dumps(alumnos)

        # Datos de escuelas para zona de escuela regular
        escuelas = list(
            Escuela.objects.values(
                'id',
                'zona'
            )
        )
        ctx['escuelas_data'] = json.dumps(escuelas)

        # Usamos las mismas escuelas para zona de escuela básica
        ctx['basicas_data'] = json.dumps(escuelas)

        return ctx


class RegistroRACUpdateView(RegistroRACCreateView, UpdateView):
    """
    Reusa el mismo form, template y context_data que la creación,
    pero actúa como UpdateView.
    """
    pass


class ExportRACExcelView(View):
    def get(self, request, *args, **kwargs):
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'RAC'

        # Encabezados en el orden requerido
        headers = [
            'NOMBRE DE ESCUELA REGULAR',
            'TIPO DE SERVICIO',
            'CCT', 'ZONA',                            # Supervisión especial
            'CCT', 'NOMBRE CENTRO DE TRABAJO', 'NOMBRE DEL MAESTRO',  # Educación especial
            'CCT', 'ZONA', 'NOMBRE ESCUELA',         # Escuela básica
            'APELLIDO PATERNO', 'APELLIDO MATERNO', 'NOMBRE(S)',      # Alumno
            'CURP ALUMNO(A)', 'SEXO', 'EDAD', 'GRADO',
            'CON DISCAPACIDAD', 'DIFICULTADES SEVERAS',
            'TRASTORNOS', 'APTITUDES SOBRESALIENTES',
            'OTRO (ESPECIFICAR)', 'OBSERVACIONES',
        ]
        ws.append(headers)

        for reg in RegistroRAC.objects.all().order_by('alumno__apellido_paterno'):
            # Clasificación en columnas separadas
            con_disc = reg.subclasificacion if reg.clasificacion == 'DISCAPACIDAD' else 'NO APLICA'
            dif_sev  = reg.subclasificacion if reg.clasificacion == 'DIFICULTADES_SEVERAS' else 'NO APLICA'
            trast    = reg.subclasificacion if reg.clasificacion == 'TRASTORNOS' else 'NO APLICA'
            apti     = reg.subclasificacion if reg.clasificacion == 'APTITUDES_SOBRESALIENTES' else 'NO APLICA'
            otro     = reg.subclasificacion if reg.clasificacion == 'OTRO' else ''

            row = [
                # Escuela regular
                reg.escuela_regular.nombre,
                reg.get_service_type_display(),

                # Supervisión especial
                reg.sup_especial_cct,
                reg.sup_especial_zona,

                # Educación especial
                reg.centro_cct,
                reg.centro_nombre,
                reg.maestro_apoyo.get_full_name(),

                # Escuela básica
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

                # Subclassifications
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
