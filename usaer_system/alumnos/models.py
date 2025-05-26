<<<<<<< HEAD
=======
# alumnos/models.py

>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
from django.db import models
from django.conf import settings
from escuelas.models import Escuela

class Alumno(models.Model):
<<<<<<< HEAD
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        limit_choices_to={'role': 'Profesor'},
        on_delete=models.CASCADE
    )
    escuela = models.ForeignKey(Escuela, on_delete=models.SET_NULL, null=True)

    apellido_paterno    = models.CharField("Apellido paterno", max_length=50)
    apellido_materno    = models.CharField("Apellido materno", max_length=50)
    nombres             = models.CharField("Nombre(s)", max_length=100)
    curp                = models.CharField("C.U.R.P.", max_length=18, unique=True)

    SEXO_CHOICES = [
        ('M','Mujer'),
        ('H','Hombre'),
    ]
    sexo                = models.CharField("Sexo", max_length=1, choices=SEXO_CHOICES)
    edad                = models.PositiveSmallIntegerField("Edad")

    grado               = models.CharField("Grado", max_length=20)

    CLASIFICACION_CHOICES = [
        ('DISCAPACIDAD',           'Con discapacidad'),
        ('DIFICULTADES_SEVERAS',   'Dificultades severas'),
        ('TRASTORNOS',             'Trastornos'),
        ('APTITUDES_SOBRESALIENTES','Aptitudes sobresalientes'),
        ('NINGUNO',                 'Ninguno'),
        ('OTRO',                   'Otro'),
    ]
    clasificacion       = models.CharField(
        "Clasificación",
        max_length=30,
        choices=CLASIFICACION_CHOICES
    )
    clasificacion_otro  = models.CharField(
        "Otro (especificar)",
        max_length=100,
        blank=True
    )
=======
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
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a

    def __str__(self):
        return f"{self.apellido_paterno} {self.apellido_materno}, {self.nombres}"
