from django import forms
from .models import Oficio

class OficioForm(forms.ModelForm):
    class Meta:
        model = Oficio
        fields = ['titulo', 'descripcion', 'archivo']
        widgets = {
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'archivo': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }
