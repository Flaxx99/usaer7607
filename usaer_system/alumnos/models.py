# alumnos/models.py

from django.db import models
from django.conf import settings
from escuelas.models import Escuela

class Alumno(models.Model):
    # --- Datos de la escuela y profesor responsable ---
    escuela          = models.ForeignKey(
        Escuela,
        on_delete=models.CASCADE,
        verbose_name="Escuela"
    )
    profesor         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        limit_choices_to={'role':'Profesor'},
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Profesor responsable"
    )

    # --- Punto 6: Identificación del alumno ---
    curp             = models.CharField(
        "CURP",
        max_length=18,
        unique=True
    )
    apellido_paterno = models.CharField(
        "Apellido paterno",
        max_length=100
    )
    apellido_materno = models.CharField(
        "Apellido materno",
        max_length=100
    )
    nombres          = models.CharField(
        "Nombre(s)",
        max_length=100
    )

    # --- Punto 7: Datos demográficos básicos ---
    SEXO_CHOICES     = [('M','M'),('H','H')]
    sexo             = models.CharField(
        "Sexo",
        max_length=1,
        choices=SEXO_CHOICES
    )
    edad             = models.PositiveIntegerField(
        "Edad"
    )
    grado            = models.CharField(
        "Grado",
        max_length=20
    )
    grupo            = models.CharField(
        "Grupo",
        max_length=5,
        help_text="Ejemplo: A, B, C"
    )

    class Meta:
        verbose_name        = "Alumno"
        verbose_name_plural = "Alumnos"
        ordering            = ['apellido_paterno','apellido_materno','nombres']

    def __str__(self):
        return f"{self.apellido_paterno} {self.apellido_materno}, {self.nombres}"
