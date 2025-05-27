from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Field, Submit
from .models import Escuela

class EscuelaForm(forms.ModelForm):
    class Meta:
        model  = Escuela
        fields = [
            'clave_estatal', 'clave_federal', 'nombre', 'nivel',
            'domicilio', 'colonia', 'telefono_escuela', 'zona',
            'directora', 'cel_directora', 'correo_directora',
            'inspector', 'tel_inspector', 'correo_inspector',
            'situacion',
        ]
        labels = {
            'clave_estatal':    "Clave estatal",
            'clave_federal':    "Clave federal",
            'nombre':           "Nombre de la escuela",
            'nivel':            "Nivel educativo",
            'domicilio':        "Domicilio",
            'colonia':          "Colonia",
            'telefono_escuela': "Teléfono escuela",
            'zona':             "Zona",
            'directora':        "Directora",
            'cel_directora':    "Cel. Directora",
            'correo_directora': "Correo Directora",
            'inspector':        "Inspector",
            'tel_inspector':    "Tel. Inspector",
            'correo_inspector': "Correo Inspector",
            'situacion':        "Situación",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Crispy Forms helper
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.layout = Layout(
            Div(
                Div(Field('clave_estatal'),    css_class='col-md-3'),
                Div(Field('clave_federal'),    css_class='col-md-3'),
                Div(Field('nombre'),           css_class='col-md-6'),
                css_class='row mb-3'
            ),
            Div(
                Div(Field('nivel'),            css_class='col-md-3'),
                Div(Field('domicilio'),        css_class='col-md-5'),
                Div(Field('colonia'),          css_class='col-md-4'),
                css_class='row mb-3'
            ),
            Div(
                Div(Field('telefono_escuela'), css_class='col-md-4'),
                Div(Field('zona'),             css_class='col-md-2'),
                Div(Field('situacion'),        css_class='col-md-6'),
                css_class='row mb-3'
            ),
            # Bloque Directora
            Div(
                Div(Field('directora'),        css_class='col-md-4'),
                Div(Field('cel_directora'),    css_class='col-md-4'),
                Div(Field('correo_directora'), css_class='col-md-4'),
                css_class='row mb-3'
            ),
            # Bloque Inspector
            Div(
                Div(Field('inspector'),        css_class='col-md-4'),
                Div(Field('tel_inspector'),    css_class='col-md-4'),
                Div(Field('correo_inspector'), css_class='col-md-4'),
                css_class='row mb-4'
            ),
            Submit('submit', 'Guardar Escuela', css_class='btn btn-primary')
        )
