# forms_utils.py

from crispy_forms.layout import Div, Field, Fieldset, Layout
from django.utils.translation import gettext_lazy as _


def convertir_mayusculas(cleaned_data, excluir=None):
    """
    Convierte todos los campos de texto a mayúsculas,
    excepto los que estén en la lista `excluir`.
    """
    excluir = excluir or []
    datos_normalizados = cleaned_data.copy()

    for campo, valor in cleaned_data.items():
        if campo not in excluir and isinstance(valor, str):
            datos_normalizados[campo] = valor.upper()

    return datos_normalizados


class CommonUserFormLayoutMixin:
    def get_common_layout(self):
        return Layout(
            Fieldset(
                _("Nombre del Personal"),
                Div(
                    Div(Field("nombre", css_class="form-control"), css_class="col-md-4"),
                    Div(Field("apellido_paterno", css_class="form-control"), css_class="col-md-4"),
                    Div(Field("apellido_materno", css_class="form-control"), css_class="col-md-4"),
                    css_class="row g-3",
                ),
            ),
            Fieldset(
                _("Contacto"),
                Div(Field("domicilio", css_class="form-control"), css_class="col-md-12"),
                Div(
                    Div(Field("telefono", css_class="form-control"), css_class="col-md-6"),
                    Div(Field("celular", css_class="form-control"), css_class="col-md-6"),
                    css_class="row g-3",
                ),
                Div(
                    Div(Field("rfc", css_class="form-control"), css_class="col-md-6"),
                    Div(Field("curp", css_class="form-control"), css_class="col-md-6"),
                    css_class="row g-3",
                ),
            ),
            Fieldset(
                _("Datos administrativos"),
                Div(
                    Div(
                        Field("clave_presupuestal", css_class="form-control"), css_class="col-md-4"
                    ),
                    Div(Field("numero_empleado", css_class="form-control"), css_class="col-md-4"),
                    Div(Field("numero_pensiones", css_class="form-control"), css_class="col-md-4"),
                    css_class="row g-3",
                ),
                Div(
                    Div(Field("grado", css_class="form-control"), css_class="col-md-4"),
                    Div(Field("puesto", css_class="form-control"), css_class="col-md-4"),
                    Div(Field("situacion", css_class="form-control"), css_class="col-md-4"),
                    css_class="row g-3",
                ),
                Div(
                    Div(Field("escolaridad", css_class="form-control"), css_class="col-md-6"),
                    Div(Field("fecha_ingreso", css_class="form-control"), css_class="col-md-6"),
                    css_class="row g-3",
                ),
            ),
        )
