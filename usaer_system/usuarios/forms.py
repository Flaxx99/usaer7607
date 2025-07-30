from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.translation import gettext_lazy as _
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Fieldset, Field, Div, ButtonHolder, Submit
from .models import User
from usaer_system.forms_utils import convertir_mayusculas


class UsuarioCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = [
            'nombre', 'apellido_paterno', 'apellido_materno',
            'domicilio', 'telefono', 'celular',
            'rfc', 'curp',
            'clave_presupuestal', 'numero_empleado', 'numero_pensiones',
            'grado', 'puesto', 'situacion',
            'escolaridad', 'fecha_ingreso',
            'email', 'role', 'escuela',
            'password1', 'password2'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # ✅ Reemplaza ayuda predeterminada por la personalizada
        self.fields['password1'].help_text = _(
            "Tu contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial."
        )
        self.fields['password2'].help_text = _("Repite la contraseña para confirmarla.")
        self.fields['role'].label = 'Función'

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Nombre del Personal'),
                Div(
                    Div(Field('nombre', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('apellido_paterno', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('apellido_materno', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                )
            ),
            Fieldset(_('Contacto'),
                Div(Field('domicilio', css_class='form-control'), css_class='col-md-12'),
                Div(
                    Div(Field('telefono', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('celular', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('rfc', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('curp', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
            ),
            Fieldset(_('Datos administrativos'),
                Div(
                    Div(Field('clave_presupuestal', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('numero_empleado', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('numero_pensiones', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('grado', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('puesto', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('situacion', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('escolaridad', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('fecha_ingreso', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                )
            ),
            Fieldset(_('Cuenta institucional'),
                Div(Field('email', css_class='form-control'), css_class='col-md-12'),
                Div(
                    Div(Field('role', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('escuela', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('password1', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('password2', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
            ),
            ButtonHolder(Submit('submit', _('Crear usuario'), css_class='btn btn-primary mt-3'))
        )

    def clean(self):
        cleaned_data = super().clean()
        return convertir_mayusculas(cleaned_data, excluir=[
            'telefono', 'celular', 'fecha_ingreso', 'email', 'password1', 'password2', 'role', 'escuela'
        ])


class UsuarioChangeForm(UserChangeForm):
    password = None

    class Meta:
        model = User
        fields = [
            'nombre', 'apellido_paterno', 'apellido_materno',
            'domicilio', 'telefono', 'celular',
            'rfc', 'curp',
            'clave_presupuestal', 'numero_empleado', 'numero_pensiones',
            'grado', 'puesto', 'situacion',
            'escolaridad', 'fecha_ingreso',
            'email', 'role', 'escuela',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Nombre del Personal'),
                Div(
                    Div(Field('nombre', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('apellido_paterno', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('apellido_materno', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                )
            ),
            Fieldset(_('Contacto'),
                Div(Field('domicilio', css_class='form-control'), css_class='col-md-12'),
                Div(
                    Div(Field('telefono', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('celular', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('rfc', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('curp', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
            ),
            Fieldset(_('Datos administrativos'),
                Div(
                    Div(Field('clave_presupuestal', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('numero_empleado', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('numero_pensiones', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('grado', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('puesto', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('situacion', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('escolaridad', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('fecha_ingreso', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                )
            ),
            Fieldset(_('Cuenta institucional'),
                Div(Field('email', css_class='form-control'), css_class='col-md-12'),
                Div(
                    Div(Field('role', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('escuela', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
            ),
            ButtonHolder(Submit('submit', _('Actualizar usuario'), css_class='btn btn-success mt-3'))
        )

    def clean(self):
        cleaned_data = super().clean()
        return convertir_mayusculas(cleaned_data, excluir=[
            'telefono', 'celular', 'fecha_ingreso', 'email', 'role', 'escuela'
        ])


class UserProfileForm(UsuarioChangeForm):
    class Meta(UsuarioChangeForm.Meta):
        exclude = ('role',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper.layout = Layout(
            Fieldset(_('Nombre del Personal'),
                Div(
                    Div(Field('nombre', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('apellido_paterno', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('apellido_materno', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                )
            ),
            Fieldset(_('Contacto'),
                Div(Field('domicilio', css_class='form-control'), css_class='col-md-12'),
                Div(
                    Div(Field('telefono', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('celular', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('rfc', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('curp', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                ),
            ),
            Fieldset(_('Datos administrativos'),
                Div(
                    Div(Field('clave_presupuestal', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('numero_empleado', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('numero_pensiones', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('grado', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('puesto', css_class='form-control'), css_class='col-md-4'),
                    Div(Field('situacion', css_class='form-control'), css_class='col-md-4'),
                    css_class='row g-3'
                ),
                Div(
                    Div(Field('escolaridad', css_class='form-control'), css_class='col-md-6'),
                    Div(Field('fecha_ingreso', css_class='form-control'), css_class='col-md-6'),
                    css_class='row g-3'
                )
            ),
            Fieldset(_('Cuenta institucional'),
                Div(Field('email', css_class='form-control'), css_class='col-md-12'),
                Div(
                    Div(Field('escuela', css_class='form-control'), css_class='col-md-12'),
                    css_class='row g-3'
                ),
            ),
            ButtonHolder(Submit('submit', _('Actualizar usuario'), css_class='btn btn-success mt-3'))
        )

