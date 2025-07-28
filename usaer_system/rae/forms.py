# usaer_system/rae/forms.py

from django import forms
from .models import RAEAlumno

class RAEAlumnoForm(forms.ModelForm):
    class Meta:
        model = RAEAlumno
        exclude = [
            'registro', 'alumno', 'capturado_por',
            'curp', 'genero', 'edad', 'grado'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for name, field in self.fields.items():
            # Aplica 'form-check-input' a los checkboxes
            if isinstance(field.widget, forms.CheckboxInput):
                field.widget.attrs.update({
                    'class': 'form-check-input',
                    'data-field': name # Mantén el data-field para tu JS
                })
            # Aplica 'form-control' a la mayoría de los otros campos de entrada
            elif isinstance(field.widget, (
                forms.TextInput,
                forms.NumberInput,
                forms.EmailInput,
                forms.URLInput,
                forms.PasswordInput,
                forms.DateInput,
                forms.DateTimeInput,
                forms.TimeInput,
                forms.Select,
                forms.Textarea,
            )):
                field.widget.attrs.update({'class': 'form-control'})

