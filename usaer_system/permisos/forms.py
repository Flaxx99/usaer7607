from django import forms
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import Permiso

class SolicitudPermisoForm(forms.ModelForm):
    class Meta:
        model = Permiso
        fields = ['tipo', 'fecha_inicio', 'fecha_fin', 'motivo']
        widgets = {
            'fecha_inicio': forms.DateInput(attrs={
                'type': 'date',
                'min': timezone.localdate().isoformat()
            }),
            'fecha_fin': forms.DateInput(attrs={
                'type': 'date',
                'min': timezone.localdate().isoformat()
            }),
            'motivo': forms.Textarea(attrs={
                'rows': 4,
                'placeholder': _('Describa detalladamente el motivo de su solicitud...')
            })
        }
        help_texts = {
            'fecha_inicio': _('Primer día que necesita el permiso'),
            'fecha_fin': _('Último día que necesita el permiso'),
        }

    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')

        if fecha_inicio and fecha_fin:
            if fecha_fin < fecha_inicio:
                raise ValidationError(_('La fecha de fin no puede ser anterior a la fecha de inicio'))
            
            if (fecha_fin - fecha_inicio).days > 30:
                raise ValidationError(_('No puede solicitar permisos de más de 30 días de duración'))

        return cleaned_data

class GestionPermisoForm(forms.ModelForm):
    # Definimos los campos manualmente en lugar de usar Meta.fields
    estado = forms.ChoiceField(
        choices=Permiso.Estado.choices,
        widget=forms.RadioSelect(),
        label=_('Estado')
    )
    
    respuesta_admin = forms.CharField(
        widget=forms.Textarea(attrs={
            'rows': 4,
            'placeholder': _('Ingrese los comentarios relevantes...')
        }),
        required=False,
        label=_('Comentarios de la dirección')
    )

    class Meta:
        model = Permiso
        # No incluimos fields ya que los definimos manualmente arriba
        fields = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Si estamos editando una instancia existente, establecemos los valores iniciales
        if self.instance and self.instance.pk:
            self.fields['estado'].initial = self.instance.estado
            self.fields['respuesta_admin'].initial = self.instance.respuesta_admin

    def clean(self):
        cleaned_data = super().clean()
        estado = cleaned_data.get('estado')
        respuesta = cleaned_data.get('respuesta_admin')

        if estado == Permiso.Estado.RECHAZADO and not respuesta:
            raise ValidationError({
                'respuesta_admin': _('Debe proporcionar una razón para el rechazo')
            })

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Actualizamos los campos manualmente
        instance.estado = self.cleaned_data['estado']
        instance.respuesta_admin = self.cleaned_data['respuesta_admin']
        
        if 'estado' in self.changed_data:
            instance.fecha_respuesta = timezone.now()
        
        if commit:
            instance.save()
        
        return instance