# rac/models.py

from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from alumnos.models import Alumno
from escuelas.models import Escuela
from rae.models import CicloEscolar # <--- IMPORTADO

User = get_user_model()

SERVICE_CHOICES = [
    ('USAER', 'USAER'),
    ('CAM_BASICO', 'CAM Básico'),
    ('CAM_BASICO_FPT', 'CAM Básico con FpT'),
    ('CAM_LABORAL', 'CAM Laboral'),
    ('OTRO', 'Otro'),
]

DISCAPACIDAD_SUB = [
    ('DI', 'Discapacidad intelectual'),
    ('DMO', 'Discapacidad motriz'),
    ('SO', 'Sordera'),
    ('HP', 'Hipoacusia'),
    ('CEG', 'Ceguera'),
    ('BV', 'Baja visión'),
    ('DM', 'Discapacidad múltiple'),
    ('SCG', 'Sordoceguera'),
    ('DME', 'Discapacidad mental o psicosocial'),
    ('NO_APLICA', 'No aplica'),
]

DIFICULTADES_SUB = [
    ('DSC', 'Dificultades severas de conducta'),
    ('DSCO', 'Dificultades severas de comunicación'),
    ('DSA', 'Dificultades severas de aprendizaje'),
    ('NO_APLICA', 'No aplica'),
]

TRASTORNOS_SUB = [
    ('TEA', 'Trastorno del espectro autista'),
    ('TDAH', 'Trastorno por Déficit de Atención e Hiperactividad'),
    ('NO_APLICA', 'No aplica'),
]

APTITUDES_SUB = [
    ('ASI', 'Aptitudes sobresalientes intelectuales'),
    ('ASC', 'Aptitudes sobresalientes creativas'),
    ('ASS', 'Aptitudes sobresalientes socioafetivas'),
    ('ASA', 'Aptitudes sobresalientes artísticas'),
    ('ASP', 'Aptitudes sobresalientes psicomotrices'),
    ('NO_APLICA', 'No aplica'),
]

SUBCLASIFICACION_CHOICES = (
    DISCAPACIDAD_SUB +
    DIFICULTADES_SUB +
    TRASTORNOS_SUB +
    APTITUDES_SUB
)

class RegistroRAC(models.Model):
    alumno = models.ForeignKey(
        Alumno,
        on_delete=models.CASCADE,
        verbose_name="Alumno"
    )
    ciclo_escolar = models.ForeignKey(
        CicloEscolar,
        on_delete=models.PROTECT,
        related_name='racs',
        verbose_name='Ciclo Escolar',
        null=True # <--- AÑADIDO TEMPORALMENTE
    )

    # Escuela regular y zona (se autorrellena)
    escuela_regular = models.ForeignKey(
        Escuela,
        on_delete=models.PROTECT,
        related_name='rac_regular',
        verbose_name="Escuela regular"
    )
    zona_regular = models.CharField(
        "Zona Escuela Regular",
        max_length=10,
        null=True,
        blank=True
    )

    # Datos del alumno (se autorrellenan)
    curp = models.CharField(
        "CURP Alumno",
        max_length=18,
        null=True,
        blank=True
    )
    sexo = models.CharField(
        "Sexo Alumno",
        max_length=1,
        choices=[('H','Hombre'),('M','Mujer')],
        null=True,
        blank=True
    )
    edad = models.PositiveSmallIntegerField(
        "Edad Alumno",
        null=True,
        blank=True
    )
    grado = models.CharField(
        "Grado Alumno",
        max_length=20,
        null=True,
        blank=True
    )

    # Servicio y supervisión
    service_type = models.CharField(
        "Tipo de servicio",
        max_length=20,
        choices=SERVICE_CHOICES,
        default='USAER'
    )
    sup_especial_cct = models.CharField(
        "CCT Supervisión",
        max_length=20,
        default='08FUA0041G'
    )
    sup_especial_zona = models.CharField(
        "Zona Supervisión",
        max_length=10,
        default='22'
    )

    # Centro de Educación Especial (constantes)
    centro_cct = models.CharField(
        "CCT Centro Educación Especial",
        max_length=20,
        default='08FUA0093E'
    )
    centro_nombre = models.CharField(
        "Nombre Centro Educación Especial",
        max_length=200,
        default='USAER 7607'
    )
    maestro_apoyo = models.ForeignKey(
        User,
        limit_choices_to={'role': 'MAESTRO_APOYO'},
        on_delete=models.PROTECT,
        verbose_name="Maestro de apoyo"
    )

    # Escuela básica
    escuela_basica = models.ForeignKey(
        Escuela,
        on_delete=models.PROTECT,
        related_name='rac_basica',
        verbose_name="Escuela básica"
    )

    # Clasificación y subclasificación
    clasificacion = models.CharField(
        "Clasificación",
        max_length=30,
        choices=Alumno.CLASIFICACION_CHOICES
    )
    subclasificacion = models.CharField(
        "Subclasificación",
        max_length=20,
        choices=SUBCLASIFICACION_CHOICES
    )

    observaciones = models.TextField("Observaciones", blank=True)
    fecha_registro = models.DateField("Fecha de registro", auto_now_add=True)

    class Meta:
        verbose_name = "Registro RAC"
        verbose_name_plural = "Registros RAC"
        unique_together = ('alumno', 'ciclo_escolar')
        ordering = ['-fecha_registro']

    def clean(self):
        super().clean()
        valid_map = {
            'DISCAPACIDAD': [c[0] for c in DISCAPACIDAD_SUB],
            'DIFICULTADES_SEVERAS': [c[0] for c in DIFICULTADES_SUB],
            'TRASTORNOS': [c[0] for c in TRASTORNOS_SUB],
            'APTITUDES_SOBRESALIENTES': [c[0] for c in APTITUDES_SUB],
        }
        opciones = valid_map.get(self.clasificacion, [])
        if opciones and self.subclasificacion not in opciones:
            raise ValidationError({
                'subclasificacion': "Subclasificación no válida para la clasificación seleccionada."
            })

    def __str__(self):
        return f"RAC de {self.alumno} ({self.fecha_registro})"
