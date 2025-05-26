# usuarios/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Field, Div, Submit

from .models import User

class ProfesorCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = [
            'username','password1','password2',
            'escuela','nombre','apellido_paterno','apellido_materno',
            'curp','rfc','clave_presupuestal','numero_empleado',
            'telefono','celular','correo',
            'nivel','grado','puesto','situacion',
            'escolaridad','fecha_ingreso','activo'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Fijamos y ocultamos role
        self.fields['role'].initial = 'Profesor'
        self.fields['role'].widget = forms.HiddenInput()
        # Crispy layout…
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Div(
                Div(Field('username'),     css_class='col-md-4'),
                Div(Field('password1'),    css_class='col-md-4'),
                Div(Field('password2'),    css_class='col-md-4'),
                css_class='row g-3 mb-4'
            ),
            # … resto de campos en filas de Bootstrap …
            Submit('submit','Crear Profesor', css_class='btn btn-primary')
        )


class ProfesorChangeForm(UserChangeForm):
    """
    Para editar sin tocar el password ni el role.
    """
    password = None  # oculta el campo password

    class Meta:
        model = User
        fields = [
            'escuela','nombre','apellido_paterno','apellido_materno',
            'curp','rfc','clave_presupuestal','numero_empleado',
            'telefono','celular','correo',
            'nivel','grado','puesto','situacion',
            'escolaridad','fecha_ingreso','activo'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Crispy layout similar al de creación
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            # … tu layout aquí …
            Submit('submit','Guardar cambios', css_class='btn btn-success')
        )
