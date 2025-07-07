# rac/views.py

import json
import openpyxl
from datetime import date
from django import forms
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

    def get_queryset(self):
        qs = super().get_queryset().order_by('-fecha_registro')
        user = self.request.user
        # Si es maestro de apoyo, ve solo sus registros
        if hasattr(user, 'role') and user.role == 'MAESTRO_APOYO':
            qs = qs.filter(maestro_apoyo=user)
        return qs


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
        return ctx


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
