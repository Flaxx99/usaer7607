from django import forms
from escuelas.models import Escuela

class AsistenciaEntradaForm(forms.Form):
    numero_empleado = forms.CharField(
        label="Número de empleado",
        max_length=20,
        widget=forms.TextInput(attrs={
            'placeholder': 'Ingresa tu número de empleado',
            'class': 'form-control'
        })
    )

    escuela = forms.ModelChoiceField(
        queryset=Escuela.objects.none(),
        label="Escuela actual",
        empty_label="Seleccione una escuela",
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    def __init__(self, *args, **kwargs):
        profesor = kwargs.pop('profesor', None)
        super().__init__(*args, **kwargs)
        if profesor:
            self.fields['escuela'].queryset = profesor.escuelas.all()


class AsistenciaSalidaForm(forms.Form):
    numero_empleado = forms.CharField(
        label="Número de empleado",
        max_length=20,
        widget=forms.TextInput(attrs={
            'placeholder': 'Ingresa tu número de empleado',
            'class': 'form-control'
        })
    )
