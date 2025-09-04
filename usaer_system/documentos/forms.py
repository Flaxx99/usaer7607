from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit
from alumnos.models import Alumno
from .models import Expediente, OtroArchivo
from usuarios.models import User
from usaer_system.forms_utils import convertir_mayusculas
from django.core.files.uploadedfile import UploadedFile
from pathlib import Path
from django.forms.models import inlineformset_factory

class ExpedienteForm(forms.ModelForm):
    class Meta:
        model = Expediente
        fields = [
            'alumno',
            'informe_deteccion',
            'informe_psicopedagogico',
            'plan_intervencion',
            'observaciones',
        ]
        widgets = {
            'informe_deteccion':       forms.ClearableFileInput(attrs={'class':'form-control','accept':'.pdf,.doc,.docx,.xlsx'}),
            'informe_psicopedagogico': forms.ClearableFileInput(attrs={'class':'form-control','accept':'.pdf,.doc,.docx,.xlsx'}),
            'plan_intervencion':       forms.ClearableFileInput(attrs={'class':'form-control','accept':'.pdf,.doc,.docx,.xlsx'}),
            'observaciones':           forms.Textarea(attrs={'class':'form-control','rows':3}),
        }

    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)

        # Crispy
        self.helper = FormHelper(self)
        self.helper.form_method = 'post'
        self.helper.form_enctype = 'multipart/form-data'
        self.helper.add_input(Submit('submit', 'Guardar expediente'))

        # — LÓGICA DE ALUMNOS —
        if self.instance and self.instance.pk:
            # en edición: sólo el alumno actual, y bloqueado
            self.fields['alumno'].queryset = Alumno.objects.filter(pk=self.instance.alumno.pk)
            self.fields['alumno'].disabled = True
        else:
            # en creación:
            if user and (user.is_superuser or user.role in [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]):
                self.fields['alumno'].queryset = Alumno.objects.filter(expediente__isnull=True)
            elif user:
                self.fields['alumno'].queryset = Alumno.objects.filter(
                    profesor=user,
                    expediente__isnull=True
                )
            else:
                self.fields['alumno'].queryset = Alumno.objects.none()
       
        # — texto de ayuda para reemplazo de archivos —
        aviso = "Al seleccionar un archivo nuevo, el anterior será reemplazado."
        for campo in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion']:
            self.fields[campo].help_text = aviso

    def clean(self):
        cleaned = super().clean()
        extensiones = ['.pdf','.doc','.docx','.jpg','.jpeg','.png','.xlsx','.xls']
        for field in ['informe_deteccion','informe_psicopedagogico','plan_intervencion']:
            archivo = cleaned.get(field)
            if archivo and isinstance(archivo, UploadedFile):
                ext = Path(archivo.name).suffix.lower()
                if ext not in extensiones:
                    raise forms.ValidationError(f"Extensión no permitida: {archivo.name}")
                if archivo.size > 50*1024*1024:
                    raise forms.ValidationError(f"{archivo.name} excede 50MB.")
        return convertir_mayusculas(cleaned)

    def save(self, commit=True):
        instancia = super().save(commit=False)
        if commit:
            instancia.save()
        return instancia

class OtroArchivoForm(forms.ModelForm):
    class Meta:
        model = OtroArchivo
        fields = ['archivo','descripcion']
        widgets = {
            'archivo':     forms.ClearableFileInput(attrs={'class':'form-control'}),
            'descripcion': forms.TextInput(attrs={'class':'form-control','placeholder':'Descripción (opcional)'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # ✅ nunca exigir el archivo al editar (ni en formularios extra)
        self.fields['archivo'].required = False

## Formset que usas para CREAR: permite 1 extra
OtroArchivoFormSet = inlineformset_factory(
    Expediente,
    OtroArchivo,
    form=OtroArchivoForm,
    extra=1,
    can_delete=True,
)

# Formset que usarás SÓLO para EDITAR: sin formularios extras
OtroArchivoFormSetEdit = inlineformset_factory(
    Expediente,
    OtroArchivo,
    form=OtroArchivoForm,
    extra=1,
    can_delete=True,
)