# asistencias/forms.py

from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Submit

class AsistenciaCheckForm(forms.Form):
    numero_empleado = forms.CharField(
        label="Código de empleado",
        max_length=20,
        widget=forms.TextInput(attrs={'placeholder': 'Ingresa tu código…'})
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Field('numero_empleado'),
            Submit('submit', 'Marcar asistencia', css_class='btn btn-primary w-100 mt-3')
        )
