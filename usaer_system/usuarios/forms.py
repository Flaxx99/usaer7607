from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.translation import gettext_lazy as _
from .models import User
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Fieldset, Field, Div, Submit, ButtonHolder
import re


class UsuarioCreationForm(UserCreationForm):
    """
    Formulario para crear nuevos usuarios con todos los campos relevantes.
    """
    class Meta:
        model = User
        fields = [
            "username", "email", "role", "escuela",
            "nombre", "apellido_paterno", "apellido_materno",
            "curp", "rfc", "numero_empleado", "clave_presupuestal", "numero_pensiones",
            "puesto", "situacion",
            "nivel", "grado",
            "domicilio", "telefono", "celular", "correo",
            "password1", "password2",
        ]
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': _('Nombre de usuario'), 'required': True}),
            'email': forms.EmailInput(attrs={'placeholder': _('Correo institucional'), 'required': True}),
            'curp': forms.TextInput(attrs={'placeholder': _('Ej: ABCD010203HMCLNS09'), 'maxlength': 18}),
            'rfc': forms.TextInput(attrs={'placeholder': _('Ej: ABCD650909ABC'), 'maxlength': 13}),
            'numero_empleado': forms.TextInput(attrs={'placeholder': _('Número de empleado'), 'maxlength': 20}),
            'clave_presupuestal': forms.TextInput(attrs={'placeholder': _('Clave presupuestal')}),
            'numero_pensiones': forms.TextInput(attrs={'placeholder': _('Número de pensiones')}),
        }
        labels = {
            'username': _('Usuario'),
            'email': _('Correo institucional'),
            'role': _('Rol'),
            'escuela': _('Escuela asignada'),
            'curp': _('C.U.R.P.'),
            'rfc': _('R.F.C.'),
            'numero_empleado': _('Número de empleado'),
            'clave_presupuestal': _('Clave presupuestal'),
            'numero_pensiones': _('Número de pensiones'),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'].initial = User.Role.DOCENTE

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Datos de cuenta'), 'username', 'email', 'password1', 'password2', 'role', 'escuela'),
            Fieldset(_('Datos personales'),
                Div(Field('nombre', css_class='me-2'), Field('apellido_paterno', css_class='me-2'), Field('apellido_materno'), css_class='d-flex')
            ),
            Fieldset(_('Identificación oficial'),
                Div(Field('curp', css_class='me-2'), Field('rfc', css_class='me-2'), Field('numero_empleado'), css_class='d-flex'),
                Div(Field('clave_presupuestal', css_class='me-2'), Field('numero_pensiones'), css_class='d-flex')
            ),
            Fieldset(_('Datos laborales'),
                Div(Field('puesto', css_class='me-2'), Field('situacion'), css_class='d-flex')
            ),
            Fieldset(_('Datos académicos'),
                Div(Field('nivel', css_class='me-2'), Field('grado'), css_class='d-flex')
            ),
            Fieldset(_('Contacto'),
                'domicilio',
                Div(Field('telefono', css_class='me-2'), Field('celular'), css_class='d-flex'),
                'correo'
            ),
            ButtonHolder(Submit('submit', _('Crear usuario'), css_class='btn btn-primary'))
        )

    def clean_curp(self):
        return self.cleaned_data.get('curp', '').upper()

    def clean_rfc(self):
        return self.cleaned_data.get('rfc', '').upper()

    def clean_telefono(self):
        return re.sub(r'\D+', '', self.cleaned_data.get('telefono', ''))

    def clean_celular(self):
        return re.sub(r'\D+', '', self.cleaned_data.get('celular', ''))

    def clean(self):
        cleaned = super().clean()
        role = cleaned.get('role')
        if role in [User.Role.DIRECTOR, User.Role.DOCENTE]:
            if not cleaned.get('nombre') or not cleaned.get('apellido_paterno'):
                raise forms.ValidationError(_('Nombre y apellido paterno son obligatorios para este rol.'))
        return cleaned


class UsuarioChangeForm(UserChangeForm):
    password = None

    class Meta:
        model = User
        fields = [
            'username', 'email', 'role', 'escuela', 'activo',
            'nombre', 'apellido_paterno', 'apellido_materno',
            'curp', 'rfc', 'numero_empleado', 'clave_presupuestal', 'numero_pensiones',
            'domicilio', 'telefono', 'celular', 'correo',
            'nivel', 'grado', 'puesto', 'situacion', 'escolaridad', 'fecha_ingreso',
        ]
        labels = {
            'username': _('Usuario'),
            'email': _('Correo institucional'),
            'role': _('Rol'),
            'escuela': _('Escuela asignada'),
            'curp': _('C.U.R.P.'),
            'rfc': _('R.F.C.'),
            'numero_empleado': _('Número de empleado'),
            'clave_presupuestal': _('Clave presupuestal'),
            'numero_pensiones': _('Número de pensiones'),
            'activo': _('¿Activo?'),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Cuenta y rol'), 'username', 'email', 'role', 'escuela', 'activo'),
            Fieldset(_('Identificación oficial'),
                Div(Field('nombre', css_class='me-2'), Field('apellido_paterno', css_class='me-2'), Field('apellido_materno'), css_class='d-flex'),
                Div(Field('curp', css_class='me-2'), Field('rfc', css_class='me-2'), Field('numero_empleado'), css_class='d-flex'),
                Div(Field('clave_presupuestal', css_class='me-2'), Field('numero_pensiones'), css_class='d-flex')
            ),
            Fieldset(_('Contacto'),
                'domicilio',
                Div(Field('telefono', css_class='me-2'), Field('celular'), css_class='d-flex'),
                'correo'
            ),
            Fieldset(_('Datos académicos'),
                Div(Field('nivel', css_class='me-2'), Field('grado'), css_class='d-flex')
            ),
            Fieldset(_('Datos laborales'),
                Div(Field('puesto', css_class='me-2'), Field('situacion'), css_class='d-flex'),
                'escolaridad', 'fecha_ingreso'
            ),
            ButtonHolder(Submit('submit', _('Guardar cambios'), css_class='btn btn-success'))
        )

    def clean_curp(self):
        return self.cleaned_data.get('curp', '').upper()

    def clean_rfc(self):
        return self.cleaned_data.get('rfc', '').upper()

    def clean_telefono(self):
        return re.sub(r'\D+', '', self.cleaned_data.get('telefono', ''))

    def clean_celular(self):
        return re.sub(r'\D+', '', self.cleaned_data.get('celular', ''))

    def clean(self):
        cleaned = super().clean()
        role = cleaned.get('role')
        if role in [User.Role.DIRECTOR, User.Role.DOCENTE]:
            if not cleaned.get('nombre') or not cleaned.get('apellido_paterno'):
                raise forms.ValidationError(_('Nombre y apellido paterno son obligatorios para este rol.'))
        return cleaned
