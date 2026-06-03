from django import forms

from .models import Anuncio


class AnuncioForm(forms.ModelForm):
    class Meta:
        model = Anuncio
        fields = ["titulo", "contenido", "fecha_publicacion", "fecha_expiracion"]
        widgets = {
            "fecha_publicacion": forms.DateInput(attrs={"type": "date"}),
            "fecha_expiracion": forms.DateInput(attrs={"type": "date"}),
        }
