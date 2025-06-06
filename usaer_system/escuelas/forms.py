from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Fieldset, Field, Div, Submit, ButtonHolder
from .models import Escuela
from django.utils.translation import gettext_lazy as _
from usaer_system.forms_utils import convertir_mayusculas



class EscuelaForm(forms.ModelForm):
    class Meta:
        model = Escuela
        fields = [
            'clave_estatal',
            'clave_federal',
            'nombre',
            'nivel',
            'domicilio',
            'colonia',
            'telefono',
            'zona',
            'direccion',
            'inspector',
            'telefono_inspector',
            'correo_inspector',
            'director',
            'celular_director',
            'correo_director',
        ]
        labels = {
            'clave_estatal': _('CLAVE ESTATAL'),
            'clave_federal': _('CLAVE FEDERAL'),
            'nombre': _('NOMBRE'),
            'nivel': _('NIVEL'),
            'domicilio': _('DOMICILIO'),
            'colonia': _('COLONIA'),
            'telefono': _('TELÉFONO DE LA ESCUELA'),
            'zona': _('ZONA'),
            'direccion': _('DIRECCIÓN'),
            'inspector': _('INSPECTOR'),
            'telefono_inspector': _('TEL INSPECTOR'),
            'correo_inspector': _('CORREO INSPECTOR'),
            'director': _('NOMBRE DEL DIRECTOR'),
            'celular_director': _('CEL DIRECTOR'),
            'correo_director': _('CORREO DIRECTOR'),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_show_labels = True

        self.helper.layout = Layout(
            Fieldset(_('Datos Generales'),
                Div(Field('clave_estatal'), Field('clave_federal'), css_class='row'),
                Field('nombre'),
                Field('nivel'),
                Div(Field('domicilio'), Field('colonia'), css_class='row'),
                Field('telefono'),
                Field('zona'),
                Field('direccion')
            ),
            Fieldset(_('Datos del Inspector'),
                Field('inspector'),
                Div(Field('telefono_inspector'), Field('correo_inspector'), css_class='row')
            ),
            Fieldset(_('Datos del Director'),
                Field('director'),
                Div(Field('celular_director'), Field('correo_director'), css_class='row')
            ),
            ButtonHolder(Submit('submit', _('Guardar escuela'), css_class='btn btn-primary'))
        )

    def clean(self):
        cleaned = super().clean()
        return convertir_mayusculas(cleaned)