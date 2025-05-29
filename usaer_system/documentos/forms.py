from django import forms
from .models import Expediente
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout
import os

class ExpedienteForm(forms.ModelForm):
    class Meta:
        model = Expediente
        fields = '__all__'
        widgets = {
            'informe_deteccion': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
            }),
            'informe_psicopedagogico': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
            }),
            'plan_intervencion': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
            }),
            'otros': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
            }),
            'alumno': forms.TextInput(attrs={'class': 'form-control'}),
            'escuela': forms.TextInput(attrs={'class': 'form-control'}),
            'grado': forms.TextInput(attrs={'class': 'form-control'}),
            'grupo': forms.TextInput(attrs={'class': 'form-control'}),
            'observaciones': forms.Textarea(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_enctype = 'multipart/form-data'

    def clean(self):
        cleaned_data = super().clean()
        archivos = [
            cleaned_data.get('informe_deteccion'),
            cleaned_data.get('informe_psicopedagogico'),
            cleaned_data.get('plan_intervencion'),
            cleaned_data.get('otros'),
        ]

        extensiones_permitidas = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif']

        for archivo in archivos:
            if archivo:
                ext = os.path.splitext(archivo.name)[1].lower()
                if ext not in extensiones_permitidas:
                    raise forms.ValidationError(f"Archivo no permitido: {archivo.name}")
                if archivo.size > 5 * 1024 * 1024:  # 5 MB
                    raise forms.ValidationError(f"{archivo.name} excede los 5MB permitidos.")