# alumnos/forms.py
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit
from django.contrib.auth import get_user_model

from .models import Alumno
from usaer_system.forms_utils import convertir_mayusculas

User = get_user_model()

class AlumnoForm(forms.ModelForm):
    class Meta:
        model = Alumno
        fields = [
            'escuela', 'grado', 'grupo',
            'apellido_paterno', 'apellido_materno',
            'nombres', 'curp',
            'sexo', 'edad',
            'clasificacion', 'clasificacion_otro',
            'profesor',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # restringir el queryset de profesores
        self.fields['profesor'].queryset = User.objects.all().order_by('last_name', 'first_name')

        # Crispy Layout: **no** incluyo explícitamente 'escuela' ni 'grado' aquí,
        # porque los pintaré a mano en la plantilla para añadir el data-nivel.
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            # fila 1: Grupo
            Div(
                Div(Field('grupo'), css_class='col-md-12'),
                css_class='row g-3'
            ),
            # fila 2: Apellidos
            Div(
                Div(Field('apellido_paterno'), css_class='col-md-6'),
                Div(Field('apellido_materno'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            # fila 3: Nombre y CURP
            Div(
                Div(Field('nombres'), css_class='col-md-6'),
                Div(Field('curp'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            # fila 4: Sexo y Edad
            Div(
                Div(Field('sexo'), css_class='col-md-3'),
                Div(Field('edad'), css_class='col-md-3'),
                css_class='row g-3'
            ),
            # fila 5: Clasificación
            Div(
                Div(Field('clasificacion'), css_class='col-md-6'),
                Div(Field('clasificacion_otro'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            # fila 6: Profesor
            Div(
                Div(Field('profesor'), css_class='col-md-12'),
                css_class='row g-3'
            ),
            Submit('submit', 'Guardar Alumno', css_class='btn btn-primary mt-4')
        )

    def clean(self):
        datos = super().clean()
        return convertir_mayusculas(datos)
