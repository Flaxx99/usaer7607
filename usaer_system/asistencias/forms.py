from crispy_forms.helper import FormHelper
from crispy_forms.layout import Field, Layout, Submit
from django import forms
from usaer_system.forms_utils import convertir_mayusculas


class AsistenciaCheckForm(forms.Form):
    numero_empleado = forms.CharField(label="Código de empleado", max_length=20, required=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = "post"
        self.helper.form_class = "form-horizontal"
        self.helper.layout = Layout(
            Field("numero_empleado", css_class="form-control", placeholder="Ingresa tu código..."),
            Submit("submit", "Registrar Entrada", css_class="btn btn-primary w-100 mt-3"),
        )

    def clean(self):
        cleaned_data = super().clean()
        return convertir_mayusculas(cleaned_data)


class AsistenciaSalidaForm(forms.Form):
    numero_empleado = forms.CharField(label="Código de empleado", max_length=20, required=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = "post"
        self.helper.form_class = "form-horizontal"
        self.helper.layout = Layout(
            Field("numero_empleado", css_class="form-control", placeholder="Ingresa tu código..."),
            Submit("submit", "Registrar Salida", css_class="btn btn-primary w-100 mt-3"),
        )

    def clean(self):
        cleaned_data = super().clean()
        return convertir_mayusculas(cleaned_data)
