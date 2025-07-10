from django import forms
from .models import EventoCalendario
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Submit, Field, Div

class EventoForm(forms.ModelForm):
    class Meta:
        model = EventoCalendario
        fields = ['titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'tipo', 'archivo']
        widgets = {
            'fecha_inicio': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'class': 'form-control',
            }),
            'fecha_fin': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'class': 'form-control',
            }),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'titulo': forms.TextInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3
            }),
            'archivo': forms.ClearableFileInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.layout = Layout(
            Div(
                Div(Field('titulo'), css_class='col-md-12'),
                css_class='row'
            ),
            Div(
                Div(Field('descripcion'), css_class='col-md-12'),
                css_class='row'
            ),
            Div(
                Div(Field('fecha_inicio'), css_class='col-md-6'),
                Div(Field('fecha_fin'), css_class='col-md-6'),
                css_class='row'
            ),
            Div(
                Div(Field('tipo'), css_class='col-md-6'),
                Div(Field('archivo'), css_class='col-md-6'),
                css_class='row'
            ),
            Submit('submit', 'Guardar Evento', css_class='btn btn-primary mt-3')
        )

        if user and not (user.is_staff or getattr(user, 'rol', '') == 'SECRETARIO'):
            self.fields['tipo'].initial = 'PERSONAL'
            self.fields['tipo'].widget = forms.HiddenInput()

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')

        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            raise forms.ValidationError("La fecha de inicio no puede ser posterior a la fecha de fin.")
        return cleaned_data
