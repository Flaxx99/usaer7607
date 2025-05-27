# usuarios/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django.utils.translation import gettext_lazy as _
from .models import User
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Fieldset, Field, Div, Submit, ButtonHolder


class UsuarioCreationForm(UserCreationForm):
    """
    Formulario para crear nuevos usuarios.
    """
    class Meta:
        model = User
        fields = [
            "username", "role", "escuela",
            "nombre", "apellido_paterno", "apellido_materno",
            "curp", "rfc", "numero_empleado",
            "password1", "password2",
        ]
        field_classes = {
            'username': forms.CharField,
        }
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': _('Nombre de usuario')}),
        }
        labels = {
            'username': _("Usuario"),
            'role': _("Rol"),
            'escuela': _("Escuela asignada"),
            'curp': _("C.U.R.P."),
            'rfc': _("R.F.C."),
            'numero_empleado': _("Número de empleado"),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Crispy helper
        self.helper = FormHelper()
        self.helper.form_method = "post"
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(
                _("Datos de cuenta"),
                "username", "password1", "password2", "role", "escuela",
            ),
            Fieldset(
                _("Datos personales"),
                Div(
                    Field("nombre", css_class="me-2"),
                    Field("apellido_paterno", css_class="me-2"),
                    Field("apellido_materno"),
                    css_class="d-flex"
                ),
                "curp", "rfc", "numero_empleado",
            ),
            ButtonHolder(
                Submit("submit", _("Crear usuario"), css_class="btn btn-primary")
            )
        )


class UsuarioChangeForm(UserChangeForm):
    """
    Formulario para actualizar usuarios existentes.
    """
    password = None  # ocultamos el campo password para edición normal

    class Meta:
        model = User
        fields = [
            "username", "role", "escuela",
            "nombre", "apellido_paterno", "apellido_materno",
            "curp", "rfc", "numero_empleado",
            "domicilio", "telefono", "celular", "correo",
            "nivel", "grado", "puesto", "situacion",
            "escolaridad", "fecha_ingreso", "activo",
        ]
        labels = {
            'username': _("Usuario"),
            'role': _("Rol"),
            'escuela': _("Escuela asignada"),
            'curp': _("C.U.R.P."),
            'rfc': _("R.F.C."),
            'numero_empleado': _("Número de empleado"),
            'activo': _("¿Activo?"),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Crispy helper
        self.helper = FormHelper()
        self.helper.form_method = "post"
        self.helper.form_show_labels = True
        self.helper.layout = Layout(
            Fieldset(
                _("Cuenta y rol"),
                "username", "role", "escuela", "activo"
            ),
            Fieldset(
                _("Identificación"),
                Div(
                    Field("nombre", css_class="me-2"),
                    Field("apellido_paterno", css_class="me-2"),
                    Field("apellido_materno"),
                    css_class="d-flex"
                ),
                Div(
                    Field("curp", css_class="me-2"),
                    Field("rfc", css_class="me-2"),
                    Field("numero_empleado"),
                    css_class="d-flex"
                ),
            ),
            Fieldset(
                _("Contacto"),
                "domicilio", Div(Field("telefono", css_class="me-2"), Field("celular"), css_class="d-flex"), "correo"
            ),
            Fieldset(
                _("Datos académicos"),
                Div(Field("nivel", css_class="me-2"), Field("grado"), css_class="d-flex")
            ),
            Fieldset(
                _("Datos laborales"),
                Div(Field("puesto", css_class="me-2"), Field("situacion"), css_class="d-flex"),
                "escolaridad", "fecha_ingreso"
            ),
            ButtonHolder(
                Submit("submit", _("Guardar cambios"), css_class="btn btn-success")
            )
        )
