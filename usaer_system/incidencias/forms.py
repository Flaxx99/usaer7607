from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field
from django.contrib.auth import get_user_model
from .models import Incidencia
from usaer_system.forms_utils import convertir_mayusculas

User = get_user_model()

class IncidenciaForm(forms.ModelForm):
    class Meta:
        model = Incidencia
        fields = ['titulo', 'escuela', 'profesor', 'descripcion', 'respuesta_admin']

    def __init__(self, *args, escuela=None, **kwargs):
        super().__init__(*args, **kwargs)

        # Filtro dinámico si se pasa escuela
        if escuela:
            self.fields['profesor'].queryset = User.objects.filter(
                escuela=escuela, role='MAESTRO_APOYO'
            )
        else:
            self.fields['profesor'].queryset = User.objects.filter(role='MAESTRO_APOYO')

        # Configuración de Crispy (sin botones)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Field('titulo', css_class='form-control'),
            Div(
                Div(Field('escuela', css_class='form-control'),   css_class='col-md-6'),
                Div(Field('profesor', css_class='form-control'),  css_class='col-md-6'),
                css_class='row g-3'
            ),
            Field('descripcion', css_class='form-control'),
            Field('respuesta_admin', css_class='form-control')
        )
    
    def clean(self):
        cleaned = super().clean()
        return convertir_mayusculas(cleaned)