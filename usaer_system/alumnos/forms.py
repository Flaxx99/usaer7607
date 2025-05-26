# alumnos/forms.py

from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit
from .models import Alumno

class AlumnoForm(forms.ModelForm):
    class Meta:
        model = Alumno
        # 'profesor' y 'escuela' se fijan en la vista, no en el formulario
        exclude = ('profesor', 'escuela')

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

        # Configuración de Crispy Forms
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Div(
                Div(Field('curp'),               css_class='col-md-4'),
                Div(Field('apellido_paterno'),   css_class='col-md-4'),
                Div(Field('apellido_materno'),   css_class='col-md-4'),
                css_class='row g-3 mb-3'
            ),
            Div(
                Div(Field('nombres'),            css_class='col-md-6'),
                Div(Field('sexo'),               css_class='col-md-3'),
                Div(Field('edad'),               css_class='col-md-3'),
                css_class='row g-3 mb-3'
            ),
            Div(
                Div(Field('grado'),              css_class='col-md-6'),
                Div(Field('grupo'),              css_class='col-md-6'),
                css_class='row g-3 mb-4'
            ),
            Submit('submit', 'Guardar Alumno', css_class='btn btn-success')
        )
