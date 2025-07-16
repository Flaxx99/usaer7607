# forms.py
from django import forms
from django.forms import BaseModelFormSet
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div
from .models import RAEAlumno

class RAEAlumnoForm(forms.ModelForm):
    class Meta:
        model = RAEAlumno
        exclude = ['registro', 'alumno', 'capturado_por', 'curp', 'genero', 'edad', 'grado']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.helper = FormHelper()
        self.helper.form_tag = False
        self.helper.disable_csrf = True
        self.helper.layout = Layout(
            Div(*[Div(f, css_class='col-1 form-check') for f in [
                'ceg', 'bv', 'so', 'hp', 'scg', 'dmo', 'di', 'dme', 'dm'
            ]], css_class='row mb-1'),
            Div(*[Div(f, css_class='col-2 form-check') for f in [
                'dsc', 'dsco', 'dsa'
            ]], css_class='row mb-1'),
            Div(*[Div(f, css_class='col-2 form-check') for f in [
                'tda', 'tea'
            ]], css_class='row mb-1'),
            Div(*[Div(f, css_class='col-1 form-check') for f in [
                'asi', 'asc', 'asa', 'asp', 'ass'
            ]], css_class='row mb-1'),
            Div(Div('ot', css_class='col-2 form-check'), css_class='row mb-1'),
            Div(*[Div(f, css_class='col-2 form-check') for f in [
                'psicologia', 'comunicacion', 'psicomotricidad',
                'trabajo_social', 'aprendizaje', 'nuevo_ingreso', 'subsecuente'
            ]], css_class='row mb-1'),
            Div(*[Div(f, css_class='col-2 form-check') for f in [
                'diagnostico', 'educativo', 'deteccion',
                'psicopedagogico', 'plan', 'modelo'
            ]], css_class='row mb-1'),
        )

class RAEAlumnoBaseFormSet(BaseModelFormSet):
    def clean(self):
        for form in self.forms:
            if self.can_delete and self._should_delete_form(form):
                continue
            if not form.instance.pk and not form.has_changed():
                raise forms.ValidationError("Formulario vacío no permitido.")