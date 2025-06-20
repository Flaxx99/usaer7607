from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit
from .models import Alumno
from usaer_system.forms_utils import convertir_mayusculas
from django.contrib.auth import get_user_model
from escuelas.models import Escuela

class AlumnoForm(forms.ModelForm):
    GRADOS_PRIMARIA = [(str(i), f"{i}") for i in range(1, 7)]
    GRADOS_SECUNDARIA = [(str(i), f"{i}") for i in range(1, 4)]

    grado = forms.ChoiceField(choices=[], label="Grado")

    class Meta:
        model = Alumno
        fields = [
            'apellido_paterno', 'apellido_materno', 'nombres', 'curp',
            'sexo', 'edad', 'grado', 'grupo',
            'clasificacion', 'clasificacion_otro',
            'escuela', 'profesor',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        User = get_user_model()
        self.fields['profesor'].queryset = User.objects.all().order_by('last_name', 'first_name')

        # Asignar dinámicamente los grados según el nivel educativo
        if 'escuela' in self.data:
            try:
                escuela_id = int(self.data.get('escuela'))
                escuela = Escuela.objects.get(id=escuela_id)

                if escuela.nivel.upper() == "PRIMARIA":
                    self.fields['grado'].choices = self.GRADOS_PRIMARIA
                elif escuela.nivel.upper() == "SECUNDARIA":
                    self.fields['grado'].choices = self.GRADOS_SECUNDARIA
                else:
                    self.fields['grado'].choices = []
            except (ValueError, Escuela.DoesNotExist):
                self.fields['grado'].choices = []
        else:
            self.fields['grado'].choices = []

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
                Div(Field('curp'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('sexo'), css_class='col-md-3'),
                Div(Field('edad'), css_class='col-md-3'),
                Div(Field('grado'), css_class='col-md-3'),
                Div(Field('grupo'), css_class='col-md-3'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('clasificacion'), css_class='col-md-6'),
                Div(Field('clasificacion_otro'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('escuela'), css_class='col-md-6'),
                Div(Field('profesor'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Submit('submit', 'Guardar Alumno', css_class='btn btn-primary mt-4')
        )

    def clean_grupo(self):
        grupo = self.cleaned_data.get("grupo")
        if grupo and (len(grupo) != 1 or not grupo.isalpha()):
            raise forms.ValidationError("El grupo debe ser una sola letra (por ejemplo: A, B, C).")
        return grupo.upper()

    def clean_grado(self):
        grado = self.cleaned_data.get("grado")
        if grado not in dict(self.fields['grado'].choices):
            raise forms.ValidationError("Grado inválido para el nivel educativo seleccionado.")
        return grado

    def clean(self):
        cleaned = super().clean()
        return convertir_mayusculas(cleaned)
