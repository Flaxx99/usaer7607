# usuarios/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit

from .models import User

class ProfesorCreationForm(UserCreationForm):
    """
    Formulario para crear un usuario Profesor.
    Hereda de UserCreationForm y añade los campos de perfil.
    """
    class Meta:
        model  = User
        fields = [
            'username', 'password1', 'password2',
            'role', 'escuela',
            'nombre', 'apellido_paterno', 'apellido_materno',
            'curp', 'rfc', 'clave_presupuestal', 'numero_empleado',
            'telefono', 'celular', 'correo',
            'nivel', 'grado', 'puesto', 'situacion',
            'escolaridad', 'fecha_ingreso', 'activo'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Fijar role en Profesor y ocultarlo si quieres:
        self.fields['role'].initial = 'Profesor'
        self.fields['role'].widget  = forms.HiddenInput()
        # Crispy Forms helper
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Div(
                Div(Field('username'),    css_class='col-md-4'),
                Div(Field('password1'),   css_class='col-md-4'),
                Div(Field('password2'),   css_class='col-md-4'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('escuela'),         css_class='col-md-6'),
                Div(Field('numero_empleado'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Div(
                Div(Field('nombre'),           css_class='col-md-4'),
                Div(Field('apellido_paterno'), css_class='col-md-4'),
                Div(Field('apellido_materno'), css_class='col-md-4'),
                css_class='row g-3'
            ),
            # … continua agregando filas para los demás campos …
            Submit('submit', 'Crear Profesor', css_class='btn btn-primary mt-4')
        )


class ProfesorChangeForm(UserChangeForm):
    """
    Formulario para editar un usuario Profesor.
    Hereda de UserChangeForm y noopara el password.
    """
    password = None

    class Meta:
        model  = User
        fields = [
            'escuela',
            'nombre', 'apellido_paterno', 'apellido_materno',
            'curp', 'rfc', 'clave_presupuestal', 'numero_empleado',
            'telefono', 'celular', 'correo',
            'nivel', 'grado', 'puesto', 'situacion',
            'escolaridad', 'fecha_ingreso', 'activo'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Crispy Forms helper
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            # … define aquí tu layout similar al de creación …
            Submit('submit', 'Guardar cambios', css_class='btn btn-success mt-4')
        )
