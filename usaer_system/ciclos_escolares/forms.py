from django import forms

from .models import CicloEscolar


class CicloEscolarForm(forms.ModelForm):
    class Meta:
        model = CicloEscolar
        fields = ["nombre", "fecha_inicio", "fecha_fin", "activo"]
        widgets = {
            "fecha_inicio": forms.DateInput(attrs={"type": "date"}),
            "fecha_fin": forms.DateInput(attrs={"type": "date"}),
        }
