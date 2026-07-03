from django.conf import settings
from django.db import models
from escuelas.models import Escuela


class Asistencia(models.Model):
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name="Profesor"
    )
    escuela = models.ForeignKey(Escuela, on_delete=models.PROTECT, verbose_name="Escuela")
    fecha = models.DateField("Fecha")
    presente = models.BooleanField("Presente")
    hora_entrada = models.TimeField("Hora de entrada", blank=True, null=True)
    hora_salida = models.TimeField("Hora de salida", blank=True, null=True)
    created_at = models.DateTimeField("Creado en", auto_now_add=True)

    class Meta:
        unique_together = ("profesor", "fecha")
        ordering = ["-fecha"]
        indexes = [
            models.Index(fields=["fecha"], name="asistencia_fecha_idx"),
            models.Index(fields=["escuela"], name="asistencia_escuela_idx"),
        ]

    def __str__(self):
        estado = "Presente" if self.presente else "Ausente"
        return f"{self.profesor} - {self.fecha} - {estado}"
