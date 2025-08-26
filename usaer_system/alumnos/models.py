# alumnos/models.py

from django.db import models
from django.conf import settings
from escuelas.models import Escuela

class Alumno(models.Model):
    # --- Relaciones con escuela y profesor ---
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Profesor responsable"
    )
    escuela = models.ForeignKey(
        Escuela,
        on_delete=models.CASCADE,
        verbose_name="Escuela"
    )

    # --- Datos personales ---
    apellido_paterno = models.CharField("Apellido paterno", max_length=100)
    apellido_materno = models.CharField("Apellido materno", max_length=100, blank= True, default='')
    nombres = models.CharField("Nombre(s)", max_length=100)
    curp = models.CharField("C.U.R.P.", max_length=18, unique=True)

    # --- Datos demográficos ---
    SEXO_CHOICES = [
        ('M', 'Mujer'),
        ('H', 'Hombre'),
    ]
    sexo = models.CharField("Sexo", max_length=1, choices=SEXO_CHOICES)
    edad = models.PositiveSmallIntegerField("Edad")

    # --- Datos académicos ---
    GRADOS = [(str(i), str(i)) for i in range(1, 7)]  # Temporal (1 al 6)
    grado = models.CharField("Grado", max_length=1, choices=GRADOS)
    grupo = models.CharField(
        "Grupo", 
        max_length=5, 
        blank=True,
        help_text="Ejemplo: A, B, C"
    )

    # --- Clasificación especial ---
    CLASIFICACION_CHOICES = [
        ('DISCAPACIDAD', 'Con discapacidad'),
        ('DIFICULTADES_SEVERAS', 'Dificultades severas de aprendizaje'),
        ('TRASTORNOS', 'Trastornos'),
        ('APTITUDES_SOBRESALIENTES', 'Aptitudes sobresalientes'),
        ('NINGUNO', 'Ninguno'),
        ('OTRO', 'Otro'),
    ]
    clasificacion = models.CharField(
        "Clasificación",
        max_length=30,
        choices=CLASIFICACION_CHOICES
    )
    clasificacion_otro = models.CharField(
        "Otro (especificar)",
        max_length=100,
        blank=True
    )
    def get_full_name(self):
        return f"{self.nombres} {self.apellido_paterno} {self.apellido_materno}".upper()

    def __str__(self):
        return self.get_full_name()

    class Meta:
        verbose_name = "Alumno"
        verbose_name_plural = "Alumnos"
        ordering = ['apellido_paterno', 'apellido_materno', 'nombres']
