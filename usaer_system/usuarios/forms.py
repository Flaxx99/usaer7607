from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm, AuthenticationForm
from django.utils.translation import gettext_lazy as _
from .models import User
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Fieldset, Field, Div, Submit, ButtonHolder
import re

class UsuarioCreationForm(UserCreationForm):
    """
    Formulario para crear nuevos usuarios sin campo username.
    """
    class Meta:
        model = User
        fields = [
            "email", "numero_empleado", "role", "escuela",
            "nombre", "apellido_paterno", "apellido_materno",
            "curp", "rfc", "clave_presupuestal", "numero_pensiones",
            "puesto", "situacion",
            "nivel", "grado",
            "domicilio", "telefono", "celular", "correo",
            "password1", "password2",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'].initial = User.Role.APOYO

        self.fields['password1'].help_text = _(
            "Tu contraseña debe contener al menos 8 caracteres, incluyendo una mayúscula, un número y un carácter especial."
        )
        self.fields['password2'].help_text = _("Repite la contraseña para confirmarla.")

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Datos de cuenta'),
                Div(Field('email'), css_class='col-md-6'),
                Div(Field('numero_empleado'), css_class='col-md-6'),
                Div(Field('password1'), Field('password2'), css_class='col-md-12'),
                Div(Field('role'), Field('escuela'), css_class='col-md-12'),
                css_class='row g-3'
            ),
            Fieldset(_('Datos personales'),
                Div(Field('nombre'), Field('apellido_paterno'), Field('apellido_materno'), css_class='col-md-4'),
                css_class='row g-3'
            ),
            Fieldset(_('Identificación oficial'),
                Div(Field('curp'), Field('rfc'), Field('clave_presupuestal'), css_class='col-md-4'),
                Div(Field('numero_pensiones'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Fieldset(_('Datos laborales'),
                Div(Field('puesto'), Field('situacion'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Fieldset(_('Datos académicos'),
                Div(Field('nivel'), Field('grado'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Fieldset(_('Contacto'),
                Field('domicilio'),
                Div(Field('telefono'), Field('celular'), css_class='col-md-6'),
                Field('correo'),
                css_class='row g-3'
            ),
            ButtonHolder(Submit('submit', _('Crear usuario'), css_class='btn btn-primary'))
        )

    def clean_curp(self):
        curp = self.cleaned_data.get('curp')
        return curp.upper() if curp else curp

    def clean_rfc(self):
        rfc = self.cleaned_data.get('rfc')
        return rfc.upper() if rfc else rfc

    def clean_telefono(self):
        tel = self.cleaned_data.get('telefono')
        return re.sub(r'\D+', '', tel) if tel else tel

    def clean_celular(self):
        cel = self.cleaned_data.get('celular')
        return re.sub(r'\D+', '', cel) if cel else cel

    def clean(self):
        cleaned = super().clean()
        role = cleaned.get('role')
        if role in [User.Role.DIRECTOR, User.Role.APOYO]:
            if not cleaned.get('nombre') or not cleaned.get('apellido_paterno'):
                raise forms.ValidationError(_('Nombre y apellido paterno son obligatorios para este rol.'))
        return cleaned


class UsuarioChangeForm(UserChangeForm):
    password = None

    class Meta:
        model = User
        fields = [
            'email', 'numero_empleado', 'role', 'escuela', 'activo',
            'nombre', 'apellido_paterno', 'apellido_materno',
            'curp', 'rfc', 'clave_presupuestal', 'numero_pensiones',
            'domicilio', 'telefono', 'celular', 'correo',
            'nivel', 'grado', 'puesto', 'situacion', 'escolaridad', 'fecha_ingreso',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Cuenta y rol'),
                Div(Field('email'), Field('numero_empleado'), Field('role'), Field('escuela'), Field('activo'), css_class='col-md-12'),
                css_class='row g-3'
            ),
            Fieldset(_('Datos personales'),
                Div(Field('nombre'), Field('apellido_paterno'), Field('apellido_materno'), css_class='col-md-4'),
                css_class='row g-3'
            ),
            Fieldset(_('Identificación oficial'),
                Div(Field('curp'), Field('rfc'), Field('clave_presupuestal'), css_class='col-md-4'),
                Div(Field('numero_pensiones'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Fieldset(_('Contacto'),
                Field('domicilio'),
                Div(Field('telefono'), Field('celular'), css_class='col-md-6'),
                Field('correo'),
                css_class='row g-3'
            ),
            Fieldset(_('Datos académicos'),
                Div(Field('nivel'), Field('grado'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Fieldset(_('Datos laborales'),
                Div(Field('puesto'), Field('situacion'), css_class='col-md-6'),
                Field('escolaridad'),
                Field('fecha_ingreso'),
                css_class='row g-3'
            ),
            ButtonHolder(Submit('submit', _('Guardar cambios'), css_class='btn btn-success'))
        )

    def clean_curp(self):
        curp = self.cleaned_data.get('curp')
        return curp.upper() if curp else curp

    def clean_rfc(self):
        rfc = self.cleaned_data.get('rfc')
        return rfc.upper() if rfc else rfc

    def clean_telefono(self):
        tel = self.cleaned_data.get('telefono')
        return re.sub(r'\D+', '', tel) if tel else tel

    def clean_celular(self):
        cel = self.cleaned_data.get('celular')
        return re.sub(r'\D+', '', cel) if cel else cel

    def clean(self):
        cleaned = super().clean()
        role = cleaned.get('role')
        if role in [User.Role.DIRECTOR, User.Role.APOYO]:
            if not cleaned.get('nombre') or not cleaned.get('apellido_paterno'):
                raise forms.ValidationError(_('Nombre y apellido paterno son obligatorios para este rol.'))
        return cleaned
