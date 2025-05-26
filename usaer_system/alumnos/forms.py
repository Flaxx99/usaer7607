from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit

from .models import Alumno

class AlumnoForm(forms.ModelForm):
    class Meta:
        model = Alumno
        fields = [
            'apellido_paterno','apellido_materno','nombres','curp',
            'sexo','edad','grado','clasificacion','clasificacion_otro'
        ]

    def __init__(self, *args, profesor=None, **kwargs):
        super().__init__(*args, **kwargs)
        # ocultamos el profesor y escuela; se asignan en la vista
        if 'profesor' in self.fields:  
            del self.fields['profesor']
        if 'escuela' in self.fields:
            del self.fields['escuela']

        # helper Crispy
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
            Submit('submit','Guardar Alumno', css_class='btn btn-primary mt-4')
        )
