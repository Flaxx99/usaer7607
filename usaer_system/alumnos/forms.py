# alumnos/forms.py

from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit
from .models import Alumno
from usaer_system.forms_utils import convertir_mayusculas

class AlumnoForm(forms.ModelForm):
    class Meta:
        model = Alumno
        fields = [
            'apellido_paterno', 'apellido_materno', 'nombres', 'curp',
            'sexo', 'edad', 'grado', 'clasificacion', 'clasificacion_otro'
        ]

    def __init__(self, *args, profesor=None, **kwargs):
        super().__init__(*args, **kwargs)

        # Si se pasa el profesor, ocultamos y fijamos los campos
        if profesor:
            # Ocultamos el campo 'escuela' y fijamos su valor
            self.fields['escuela'].initial = profesor.escuela
            self.fields['escuela'].widget = forms.HiddenInput()
            # Ocultamos el campo 'profesor' y fijamos su valor
            self.fields['profesor'].initial = profesor
            self.fields['profesor'].widget = forms.HiddenInput()
        else:
            # Si no hay profesor, eliminamos los campos
            if 'profesor' in self.fields:  
                del self.fields['profesor']
            if 'escuela' in self.fields:
                del self.fields['escuela']

        # Configuración de Crispy Forms
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Div(
                Div(Field('apellido_paterno'), css_class='col-md-6'),
                Div(Field('apellido_materno'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('nombres'), css_class='col-md-6'),
                Div(Field('curp'),    css_class='col-md-6'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('sexo'), css_class='col-md-4'),
                Div(Field('edad'), css_class='col-md-4'),
                Div(Field('grado'),css_class='col-md-4'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('clasificacion'),     css_class='col-md-6'),
                Div(Field('clasificacion_otro'),css_class='col-md-6'),
                css_class='row g-3'
            ),
            Submit('submit', 'Guardar Alumno', css_class='btn btn-primary mt-4')
        )
    
    def clean(self):
        cleaned = super().clean()
        return convertir_mayusculas(cleaned)