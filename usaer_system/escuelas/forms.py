from django import forms
from .models import Escuela

class EscuelaForm(forms.ModelForm):
    class Meta:
        model = Escuela
        fields = '__all__'
