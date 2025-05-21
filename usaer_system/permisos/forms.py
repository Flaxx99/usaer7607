from django import forms
from .models import Permiso

class PermisoForm(forms.ModelForm):
    class Meta:
        model = Permiso
        fields = ['escuela', 'tipo_permiso', 'motivo', 'fecha_inicio', 'fecha_fin']
        widgets = {
            'motivo': forms.Textarea(attrs={'rows': 3}),
            'fecha_inicio': forms.DateInput(attrs={'type': 'date'}),
            'fecha_fin': forms.DateInput(attrs={'type': 'date'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        inicio = cleaned_data.get('fecha_inicio')
        fin = cleaned_data.get('fecha_fin')
        if inicio and fin and inicio > fin:
            raise forms.ValidationError("La fecha de inicio no puede ser posterior a la fecha de fin.")
        return cleaned_data
