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
            'cct',
            'nombre',
            'nivel',
            'domicilio',
            'colonia',
            'telefono',
            'zona',
            'inspector',
            'telefono_inspector',
            'correo_inspector',
            'director',
            'celular_director',
            'correo_director',
        ]
        labels = {
            'clave_estatal': _('CLAVE ESTATAL'),
            'cct': _('CCT'),
            'nombre': _('NOMBRE'),
            'nivel': _('NIVEL'),
            'domicilio':_('DOMICILIO'),
            'colonia':_('COLONIA'),
            'telefono': _('TELÉFONO DE LA ESCUELA'),
            'zona': _('ZONA'),
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
                Div(
                    Div(Field('clave_estatal'), css_class='col-md-6'),
                    Div(Field('cct'), css_class='col-md-6'),
                    css_class='row'
                ),
                Div(
                    Div(Field('nombre'), css_class='col-md-12'),
                    css_class='row'
                ),
                Div(
                    Div(Field('nivel', css_class='text-uppercase'), css_class='col-md-6'),
                    Div(Field('telefono'), css_class='col-md-6'),
                    css_class='row'
                ),
                Div(
                    Div(Field('domicilio'), css_class='col-md-8'),
                    Div(Field('colonia'), css_class='col-md-4'),
                    css_class='row'
                ),
                Div(
                    Div(Field('zona'), css_class='col-md-12'),
                    css_class='row'
                ),
            ),
            Fieldset(_('Datos del Inspector'),
                Div(
                    Div(Field('inspector'), css_class='col-md-12'),
                    css_class='row'
                ),
                Div(
                    Div(Field('telefono_inspector'), css_class='col-md-6'),
                    Div(Field('correo_inspector'), css_class='col-md-6'),
                    css_class='row'
                )
            ),
            Fieldset(_('Datos del Director'),
                Div(
                    Div(Field('director'), css_class='col-md-12'),
                    css_class='row'
                ),
                Div(
                    Div(Field('celular_director'), css_class='col-md-6'),
                    Div(Field('correo_director'), css_class='col-md-6'),
                    css_class='row'
                )
            ),
            ButtonHolder(Submit('submit', _('Guardar escuela'), css_class='btn btn-primary mt-3'))
        )

    def clean(self):
        cleaned = super().clean()
        return convertir_mayusculas(cleaned, excluir=['nivel'])
