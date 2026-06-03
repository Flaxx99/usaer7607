from django import forms
from django.utils.translation import gettext_lazy as _
from usaer_system.forms_utils import convertir_mayusculas

from .models import Escuela


class EscuelaForm(forms.ModelForm):
    """
    Formulario para crear y actualizar Escuelas.
    El layout se define en la plantilla HTML para compatibilidad con el tema.
    """

    class Meta:
        model = Escuela
        fields = [
            "clave_estatal",
            "cct",
            "nombre",
            "nivel",
            "domicilio",
            "colonia",
            "telefono",
            "zona",
            "inspector",
            "telefono_inspector",
            "correo_inspector",
            "director",
            "celular_director",
            "correo_director",
        ]
        widgets = {
            "clave_estatal": forms.TextInput(attrs={"placeholder": "Clave estatal única"}),
            "cct": forms.TextInput(attrs={"placeholder": "Clave de Centro de Trabajo"}),
            "nombre": forms.TextInput(attrs={"placeholder": "Nombre completo de la escuela"}),
            "domicilio": forms.TextInput(attrs={"placeholder": "Calle, número, etc."}),
            "colonia": forms.TextInput(attrs={"placeholder": "Colonia o localidad"}),
            "telefono": forms.TextInput(attrs={"placeholder": "Teléfono a 10 dígitos"}),
            "zona": forms.TextInput(attrs={"placeholder": "Zona escolar"}),
            "inspector": forms.TextInput(attrs={"placeholder": "Nombre completo del inspector/a"}),
            "telefono_inspector": forms.TextInput(attrs={"placeholder": "Teléfono a 10 dígitos"}),
            "correo_inspector": forms.EmailInput(
                attrs={"placeholder": "correo.inspector@ejemplo.com"}
            ),
            "director": forms.TextInput(attrs={"placeholder": "Nombre completo del director/a"}),
            "celular_director": forms.TextInput(attrs={"placeholder": "Teléfono a 10 dígitos"}),
            "correo_director": forms.EmailInput(
                attrs={"placeholder": "correo.director@ejemplo.com"}
            ),
        }
        help_texts = {
            "cct": _("La CCT es un identificador único para cada centro educativo."),
            "nivel": _("Seleccione el nivel educativo correspondiente."),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Aplicar clase form-control a todos los campos
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-control")

    def clean(self):
        cleaned_data = super().clean()
        return convertir_mayusculas(cleaned_data, excluir=["correo_inspector", "correo_director"])
