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
            'rfc', 'curp', 'correo',
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

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Nombre del Personal'),
                Div(Field('nombre', css_class='me-2'), Field('apellido_paterno', css_class='me-2'), Field('apellido_materno'), css_class='row g-3')
            ),
            Fieldset(_('Contacto'),
                'domicilio',
                Div(Field('telefono', css_class='me-2'), Field('celular'), css_class='row g-3'),
                Div(Field('rfc', css_class='me-2'), Field('curp'), css_class='row g-3'),
                'correo'
            ),
            Fieldset(_('Datos administrativos'),
                Div(Field('clave_presupuestal', css_class='me-2'), Field('numero_empleado', css_class='me-2'), Field('numero_pensiones'), css_class='row g-3'),
                Div(Field('grado', css_class='me-2'), Field('puesto', css_class='me-2'), Field('situacion'), css_class='row g-3'),
                Div(Field('escolaridad', css_class='me-2'), Field('fecha_ingreso'), css_class='row g-3')
            ),
            Fieldset(_('Cuenta institucional'),
                'email', 'role', 'escuela',
                Div(Field('password1', css_class='me-2'), Field('password2'), css_class='row g-3'),
            ),
            ButtonHolder(Submit('submit', _('Crear usuario'), css_class='btn btn-primary'))
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
            'rfc', 'curp', 'correo',
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
                Div(Field('nombre', css_class='me-2'), Field('apellido_paterno', css_class='me-2'), Field('apellido_materno'), css_class='row g-3')
            ),
            Fieldset(_('Contacto'),
                'domicilio',
                Div(Field('telefono', css_class='me-2'), Field('celular'), css_class='row g-3'),
                Div(Field('rfc', css_class='me-2'), Field('curp'), css_class='row g-3'),
                'correo'
            ),
            Fieldset(_('Datos administrativos'),
                Div(Field('clave_presupuestal', css_class='me-2'), Field('numero_empleado', css_class='me-2'), Field('numero_pensiones'), css_class='row g-3'),
                Div(Field('grado', css_class='me-2'), Field('puesto', css_class='me-2'), Field('situacion'), css_class='row g-3'),
                Div(Field('escolaridad', css_class='me-2'), Field('fecha_ingreso'), css_class='row g-3')
            ),
            Fieldset(_('Cuenta institucional'),
                'email', 'role', 'escuela',
            ),
            ButtonHolder(Submit('submit', _('Actualizar usuario'), css_class='btn btn-success'))
        )

    def clean(self):
        cleaned_data = super().clean()
        return convertir_mayusculas(cleaned_data, excluir=[
            'telefono', 'celular', 'fecha_ingreso', 'email', 'role', 'escuela'
        ])

