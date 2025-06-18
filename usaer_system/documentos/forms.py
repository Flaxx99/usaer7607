from django import forms
from .models import Expediente
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit
from alumnos.models import Alumno
from usaer_system.forms_utils import convertir_mayusculas
from django.core.files.uploadedfile import UploadedFile
from pathlib import Path

class ExpedienteForm(forms.ModelForm):
    class Meta:
        model = Expediente
        fields = [
            'alumno',
            'informe_deteccion',
            'informe_psicopedagogico',
            'plan_intervencion',
            'otros',
            'observaciones'
        ]
        widgets = {
            'informe_deteccion': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx'}),
            'informe_psicopedagogico': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx'}),
            'plan_intervencion': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx'}),
            'otros': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'observaciones': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_enctype = 'multipart/form-data'

        # Lógica de filtrado de alumnos
        if user:
            if self.instance and self.instance.pk:
                # Edición: mostrar solo el alumno asignado
                self.fields['alumno'].queryset = Alumno.objects.filter(pk=self.instance.alumno.pk)
                self.fields['alumno'].disabled = True
            elif user.is_superuser or user.role in ['ADMIN', 'SECRETARIO']:
                self.fields['alumno'].queryset = Alumno.objects.exclude(expediente__isnull=False)
            else:
                self.fields['alumno'].queryset = Alumno.objects.filter(profesor=user).exclude(expediente__isnull=False)

    def clean(self):
        cleaned = super().clean()
        extensiones = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xlsx', '.xls']

        for field in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion', 'otros']:
            archivo = cleaned.get(field)

            if archivo and isinstance(archivo, UploadedFile):
                ext = Path(archivo.name).suffix.lower()
                if ext not in extensiones:
                    raise forms.ValidationError(f"Archivo no permitido: {archivo.name}")
                if archivo.size > 50 * 1024 * 1024:
                    raise forms.ValidationError(f"{archivo.name} excede los 50MB permitidos.")

        return convertir_mayusculas(cleaned)

    def save(self, commit=True):
        instancia = super().save(commit=False)

        # Si se sube un nuevo archivo, reemplaza el anterior
        for field in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion', 'otros']:
            nuevo_archivo = self.cleaned_data.get(field)
            if isinstance(nuevo_archivo, UploadedFile):
                setattr(instancia, field, nuevo_archivo)

        if commit:
            instancia.save()
        return instancia

