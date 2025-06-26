from django import forms
from django.contrib.auth import get_user_model
from .models import Alumno

User = get_user_model()

class AlumnoForm(forms.ModelForm):
    class Meta:
        model = Alumno
        # Excluimos escuela y grado porque los asignaremos manualmente en la vista
        exclude = ['escuela', 'grado']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Aplicar clases de Bootstrap a todos los widgets
        for name, field in self.fields.items():
            field.widget.attrs.update({
                'class': 'form-control',
                'id': f'id_{name}'
            })
        # Profesor ordenado alfabéticamente
        self.fields['profesor'].queryset = (
            User.objects.all().order_by('last_name', 'first_name')
        )
