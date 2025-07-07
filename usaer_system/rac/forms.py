from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit

from django.core.exceptions import ValidationError
from datetime import date

from .models import (
    RegistroRAC,
    DISCAPACIDAD_SUB,
    DIFICULTADES_SUB,
    TRASTORNOS_SUB,
    APTITUDES_SUB,
)

CLASS_TO_SUB = {
    'DISCAPACIDAD': DISCAPACIDAD_SUB,
    'DIFICULTADES_SEVERAS': DIFICULTADES_SUB,
    'TRASTORNOS': TRASTORNOS_SUB,
    'APTITUDES_SOBRESALIENTES': APTITUDES_SUB,
    'NINGUNO': [('NO_APLICA', 'No aplica')],
    'OTRO':   [('NO_APLICA', 'No aplica')],
}

class RegistroRACForm(forms.ModelForm):
    class Meta:
        model = RegistroRAC
        fields = [
            'alumno',
            'escuela_regular',
            'zona_regular',
            'curp',
            'sexo',
            'edad',
            'grado',
            'service_type',
            'sup_especial_cct',
            'sup_especial_zona',
            'centro_cct',
            'centro_nombre',
            'maestro_apoyo',
            'escuela_basica',
            'clasificacion',
            'subclasificacion',
            'observaciones',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Campos autorrellenados readonly/disabled
        for fld in ['zona_regular', 'curp', 'edad', 'grado']:
            self.fields[fld].widget.attrs.update({
                'readonly': True,
                'class': 'form-control'
            })
        self.fields['sexo'].widget.attrs.update({
            'disabled': True,
            'class': 'form-select'
        })
        for fld in ['sup_especial_cct', 'sup_especial_zona',
                    'centro_cct', 'centro_nombre']:
            self.fields[fld].widget.attrs.update({
                'readonly': True,
                'class': 'form-control'
            })

        # Oculta escuela_basica y la hace obligatoria
        self.fields['escuela_basica'].widget = forms.HiddenInput()
        self.fields['escuela_basica'].required = True

        # ID y clases para JS
        self.fields['alumno'].widget.attrs.update({
            'id': 'id_alumno', 'class': 'form-select'
        })
        self.fields['escuela_regular'].widget.attrs.update({
            'id': 'id_escuela_regular', 'class': 'form-select'
        })
        self.fields['maestro_apoyo'].widget.attrs.update({
            'id': 'id_maestro_apoyo', 'class': 'form-select'
        })
        self.fields['clasificacion'].widget.attrs.update({
            'id': 'id_clasificacion', 'class': 'form-select'
        })

        # Subclasificación con placeholder
        self.fields['subclasificacion'].required = True
        self.fields['subclasificacion'].widget = forms.Select(
            choices=[('', '--- Seleccione subcategoría ---')],
            attrs={'id': 'id_subclasificacion', 'class': 'form-select'}
        )

        # Configuro Crispy Helper con botón Guardar
        self.helper = FormHelper(self)
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Div(
                Field('alumno'),
                Field('escuela_regular'),
                Field('zona_regular'),
                Field('curp'),
                Field('sexo'),
                Field('edad'),
                Field('grado'),
                css_class='row g-3'
            ),
            Div(
                Field('service_type'),
                Field('sup_especial_cct'),
                Field('sup_especial_zona'),
                Field('centro_cct'),
                Field('centro_nombre'),
                Field('maestro_apoyo'),
                css_class='row g-3'
            ),
            Div(
                Field('clasificacion'),
                Field('subclasificacion'),
                css_class='row g-3'
            ),
            Field('observaciones'),
            # Aquí el botón que faltaba
            Submit('save', 'Guardar', css_class='btn btn-success mt-3')
        )

        # Inicializar subclasificaciones según clasificación
        cls = self.data.get('clasificacion') or getattr(self.instance, 'clasificacion', None)
        init_choices = CLASS_TO_SUB.get(cls, [('NO_APLICA', 'No aplica')])
        self.fields['subclasificacion'].choices = [('', '--- Seleccione subcategoría ---')] + init_choices

    def clean(self):
        cleaned = super().clean()
        alumno = cleaned.get('alumno')
        # Asumimos que fecha_registro se graba con auto_now_add=date.today()
        if alumno and RegistroRAC.objects.filter(
            alumno=alumno,
            fecha_registro=date.today()
        ).exists():
            raise ValidationError(
                "Este alumno ya tiene un registro RAC para la fecha de hoy."
            )
        return cleaned