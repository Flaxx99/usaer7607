# asistencias/forms.py

from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Submit

class AsistenciaCheckForm(forms.Form):
    numero_empleado = forms.CharField(
        label="Código de empleado",
        max_length=20,
<<<<<<< HEAD
        widget=forms.TextInput(attrs={'placeholder': 'Ingresa tu código…'})
=======
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
<<<<<<< HEAD
            Field('numero_empleado'),
            Submit('submit', 'Marcar asistencia', css_class='btn btn-primary w-100 mt-3')
=======
            Field('numero_empleado', placeholder="Ingresa tu código..."),
            Submit('submit', 'Registrar Entrada', css_class='btn btn-primary w-100 mt-3')
        )


class AsistenciaSalidaForm(forms.Form):
    numero_empleado = forms.CharField(
        label="Código de empleado",
        max_length=20,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Field('numero_empleado', placeholder="Ingresa tu código..."),
            Submit('submit', 'Registrar Salida', css_class='btn btn-primary w-100 mt-3')
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
        )
