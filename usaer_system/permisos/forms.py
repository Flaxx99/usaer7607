from django import forms
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Submit, Field, Div

from .models import Permiso
from usaer_system.forms_utils import convertir_mayusculas


class SolicitudPermisoForm(forms.ModelForm):
    class Meta:
        model = Permiso
        fields = ['tipo', 'fecha_inicio', 'fecha_fin', 'motivo']
        widgets = {
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'fecha_inicio': forms.DateInput(
                attrs={'type': 'date', 'min': timezone.localdate().isoformat(), 'class': 'form-control'}
            ),
            'fecha_fin': forms.DateInput(
                attrs={'type': 'date', 'min': timezone.localdate().isoformat(), 'class': 'form-control'}
            ),
            'motivo': forms.Textarea(
                attrs={'rows': 4, 'placeholder': _('Describa el motivo...'), 'class': 'form-control'}
            ),
        }
        help_texts = {
            'fecha_inicio': _('Primer día que solicita permiso'),
            'fecha_fin': _('Último día que solicita permiso'),
        }
        labels = {
            'tipo': _('Tipo de permiso'),
            'fecha_inicio': _('Desde'),
            'fecha_fin': _('Hasta'),
            'motivo': _('Motivo del permiso'),
        }

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.layout = Layout(
            Field('tipo'),
            Div(
                Div(Field('fecha_inicio', css_class='form-control'), css_class='col-md-6'),
                Div(Field('fecha_fin', css_class='form-control'), css_class='col-md-6'),
                css_class='row g-3'
            ),
            Field('motivo'),
            Submit('submit', _('Solicitar Permiso'), css_class='btn btn-primary mt-3')
        )

        if user and not (user.is_staff or getattr(user, 'rol', '') == 'SECRETARIO'):
            self.fields['tipo'].initial = 'PERSONAL'
            self.fields['tipo'].widget = forms.HiddenInput()

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')

        if fecha_inicio and fecha_fin:
            if fecha_fin < fecha_inicio:
                raise ValidationError(_('La fecha de fin no puede ser anterior a la fecha de inicio.'))

            if (fecha_fin - fecha_inicio).days > 30:
                raise ValidationError(_('No se pueden solicitar más de 30 días de permiso.'))

        return convertir_mayusculas(cleaned_data)


class GestionPermisoForm(forms.ModelForm):
    estado = forms.ChoiceField(
        choices=Permiso.Estado.choices,
        widget=forms.RadioSelect(attrs={'class': 'form-check-input'}),
        label=_('Estado de la solicitud')
    )

    respuesta_admin = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 4,
            'placeholder': _('Ingrese aquí la justificación (obligatoria si se rechaza).')
        }),
        label=_('Respuesta administrativa')
    )

    class Meta:
        model = Permiso
        fields = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.layout = Layout(
            Div(Field('estado'), css_class='col-md-12'),
            Div(Field('respuesta_admin'), css_class='col-md-12'),
            Submit('submit', _('Guardar Respuesta'), css_class='btn btn-primary mt-3')
        )
        if self.instance:
            self.fields['estado'].initial = self.instance.estado
            self.fields['respuesta_admin'].initial = self.instance.respuesta_admin

    def clean(self):
        cleaned_data = super().clean()

        # Convertimos todos los textos a mayúsculas
        cleaned_data = convertir_mayusculas(cleaned_data)

        estado = cleaned_data.get('estado')
        respuesta = cleaned_data.get('respuesta_admin')

        if estado == Permiso.Estado.RECHAZADO and not respuesta:
            self.add_error('respuesta_admin', _('Debe proporcionar una razón para el rechazo.'))

        return convertir_mayusculas(cleaned_data)

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.estado = self.cleaned_data['estado']
        instance.respuesta_admin = self.cleaned_data.get('respuesta_admin', '')

        if 'estado' in self.changed_data and not instance.fecha_respuesta:
            instance.fecha_respuesta = timezone.now()

        if commit:
            instance.save()
        return instance

