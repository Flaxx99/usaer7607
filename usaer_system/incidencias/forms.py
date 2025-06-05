from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit
from django.contrib.auth import get_user_model
from .models import Incidencia

User = get_user_model()

class IncidenciaForm(forms.ModelForm):
    class Meta:
        model = Incidencia
        fields = ['escuela', 'profesor', 'descripcion', 'respuesta_admin']

    def __init__(self, *args, escuela=None, **kwargs):
        super().__init__(*args, **kwargs)

        # Filtro dinámico si se pasa escuela
        if escuela:
            self.fields['profesor'].queryset = User.objects.filter(
                escuela=escuela, role='Profesor'
            )
        else:
            self.fields['profesor'].queryset = User.objects.filter(role='Profesor')

        # Configuración de Crispy
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Div(
                Div(Field('escuela'),   css_class='col-md-6'),
                Div(Field('profesor'),  css_class='col-md-6'),
                css_class='row g-3'
            ),
            Field('descripcion'),
            Field('respuesta_admin'),
            Submit('submit', 'Guardar', css_class='btn btn-primary mt-3')
        )
