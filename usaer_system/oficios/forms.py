# oficios/forms.py
from django import forms
from .models import Oficio

class OficioForm(forms.ModelForm):
    class Meta:
        model = Oficio
        fields = ['titulo', 'descripcion', 'archivo']
