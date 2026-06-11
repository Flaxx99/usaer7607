# alumnos/models.py

from datetime import date

from ciclos_escolares.models import CicloEscolar
from django.conf import settings
from django.db import models
from escuelas.models import Escuela

from .managers import AlumnoManager


class Alumno(models.Model):
    objects = AlumnoManager()
    # --- Relaciones con escuela y profesor ---
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Profesor responsable",
    )
    escuela = models.ForeignKey(Escuela, on_delete=models.CASCADE, verbose_name="Escuela")

    # --- Datos personales ---
    apellido_paterno = models.CharField("Apellido paterno", max_length=100)
    apellido_materno = models.CharField("Apellido materno", max_length=100, blank=True, default="")
    nombres = models.CharField("Nombre(s)", max_length=100)
    curp = models.CharField("C.U.R.P.", max_length=18, unique=True)
    fecha_nacimiento = models.DateField("Fecha de nacimiento", null=True, blank=True)

    # --- Datos demográficos ---
    SEXO_CHOICES = [
        ("M", "Mujer"),
        ("H", "Hombre"),
    ]
    sexo = models.CharField("Sexo", max_length=1, choices=SEXO_CHOICES)
    # Edad: se computa como @property desde fecha_nacimiento.
    # No hay columna en DB — usar .edad() para acceso en Python.

    # --- Datos académicos ---
    GRADOS = [(str(i), str(i)) for i in range(1, 7)]  # Temporal (1 al 6)
    # TODO: Si los grados son dinámicos o dependen del nivel de la escuela,
    # considera una solución más robusta (ej. un modelo para Grado, o un campo dinámico).
    grado = models.CharField("Grado", max_length=1, choices=GRADOS)
    grupo = models.CharField("Grupo", max_length=5, blank=True, help_text="Ejemplo: A, B, C")
    last_promotion_cycle = models.ForeignKey(
        CicloEscolar,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Último ciclo de promoción",
        related_name="alumnos_promovidos",
    )
    # --- Clasificación especial ---
    activo = models.BooleanField(default=True, verbose_name="¿Está activo?")
    CLASIFICACION_CHOICES = [
        ("DISCAPACIDAD", "Con discapacidad"),
        ("DIFICULTADES_SEVERAS", "Dificultades severas de aprendizaje"),
        ("TRASTORNOS", "Trastornos"),
        ("APTITUDES_SOBRESALIENTES", "Aptitudes sobresalientes"),
        ("NINGUNO", "Ninguno"),
        ("OTRO", "Otro"),
    ]
    clasificacion = models.CharField("Clasificación", max_length=30, choices=CLASIFICACION_CHOICES)
    clasificacion_otro = models.CharField("Otro (especificar)", max_length=100, blank=True)

    def get_full_name(self):
        return f"{self.nombres} {self.apellido_paterno} {self.apellido_materno}".upper()

    @property
    def edad(self):
        """Edad calculada en tiempo real desde fecha_nacimiento."""
        if not self.fecha_nacimiento:
            return None
        today = date.today()
        return (
            today.year
            - self.fecha_nacimiento.year
            - ((today.month, today.day) < (self.fecha_nacimiento.month, self.fecha_nacimiento.day))
        )

    @edad.setter
    def edad(self, value):
        """No-op setter: edad siempre se computa desde fecha_nacimiento.

        Existe para compatibilidad con código legacy que aún pasa `edad=`
        en kwargs (tests, forms). El valor se ignora silenciosamente.
        """
        pass

    def __str__(self):
        return self.get_full_name()

    class Meta:
        verbose_name = "Alumno"
        verbose_name_plural = "Alumnos"
        ordering = ["apellido_paterno", "apellido_materno", "nombres"]
        indexes = [
            models.Index(fields=["escuela", "activo"], name="alumno_escuela_activo_idx"),
            models.Index(fields=["profesor", "activo"], name="alumno_profesor_activo_idx"),
            models.Index(fields=["curp"], name="alumno_curp_idx"),
        ]
