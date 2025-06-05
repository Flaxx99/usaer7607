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
        widgets = {
            'email': forms.EmailInput(attrs={'placeholder': _('Correo institucional'), 'required': True}),
            'numero_empleado': forms.TextInput(attrs={'placeholder': _('Número de empleado'), 'maxlength': 20}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['role'].initial = User.Role.DOCENTE

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(_('Datos de cuenta'), 'email', 'numero_empleado', 'password1', 'password2', 'role', 'escuela'),
            Fieldset(_('Datos personales'),
                Div(Field('nombre', css_class='me-2'), Field('apellido_paterno', css_class='me-2'), Field('apellido_materno'), css_class='d-flex')
            ),
            Fieldset(_('Identificación oficial'),
                Div(Field('curp', css_class='me-2'), Field('rfc', css_class='me-2'), Field('clave_presupuestal'), css_class='d-flex'),
                Field('numero_pensiones')
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
        if role in [User.Role.DIRECTOR, User.Role.DOCENTE]:
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
            Fieldset(_('Cuenta y rol'), 'email', 'numero_empleado', 'role', 'escuela', 'activo'),
            Fieldset(_('Identificación oficial'),
                Div(Field('nombre', css_class='me-2'), Field('apellido_paterno', css_class='me-2'), Field('apellido_materno'), css_class='d-flex'),
                Div(Field('curp', css_class='me-2'), Field('rfc', css_class='me-2'), Field('clave_presupuestal'), css_class='d-flex'),
                Field('numero_pensiones')
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
        curp = self.cleaned_data.get('curp')
        return curp.upper() if curp else curp

    def clean_rfc(self):
        rfc = self.cleaned_data.get('rfc')
        return rfc.upper() if rfc else rfc

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


class CustomLoginForm(AuthenticationForm):
    username = forms.CharField(
        label=_("Correo institucional o número de empleado"),
        widget=forms.TextInput(attrs={
            'autofocus': True,
            'placeholder': 'correo@mail.com o número de empleado',
            'class': 'form-control',
        }),
    )
    password = forms.CharField(
        label=_("Contraseña"),
        strip=False,
        widget=forms.PasswordInput(attrs={
            'placeholder': '••••••••',
            'class': 'form-control',
        }),
    )
