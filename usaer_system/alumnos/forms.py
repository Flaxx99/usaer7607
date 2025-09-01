from django import forms
from django.contrib.auth import get_user_model
from .models import Alumno

User = get_user_model()

class AlumnoForm(forms.ModelForm):
    fecha_nacimiento = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        required=False,
        label="Fecha de nacimiento"
    )

    class Meta:
        model = Alumno
        # Excluimos escuela y grado porque los asignaremos manualmente en la vista
        exclude = ['escuela', 'grado', 'edad'] # Excluimos edad también ya que se calcula sola

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Aplicar clases de Bootstrap a todos los widgets
        for name, field in self.fields.items():
            if isinstance(field.widget, forms.CheckboxInput):
                field.widget.attrs.update({
                    'class': 'form-check-input',
                })
            else:
                field.widget.attrs.update({
                    'class': 'form-control',
                })
            field.widget.attrs.update({'id': f'id_{name}'})

        # Profesor ordenado alfabéticamente
        self.fields['profesor'].queryset = (
            User.objects.all().order_by('last_name', 'first_name')
        )
