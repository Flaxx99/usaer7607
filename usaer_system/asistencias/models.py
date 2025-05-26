from django.db import models
from django.conf import settings
from escuelas.models import Escuela

class Asistencia(models.Model):
    escuela      = models.ForeignKey(
                      Escuela,
                      on_delete=models.CASCADE,
                      verbose_name="Escuela"
                   )
    profesor     = models.ForeignKey(
                      settings.AUTH_USER_MODEL,
                      limit_choices_to={'role':'Profesor'},
                      on_delete=models.SET_NULL,
                      null=True
                   )
    fecha        = models.DateField("Fecha")
    presente     = models.BooleanField("Presente")
    hora_entrada = models.TimeField("Hora de entrada", blank=True, null=True)
    hora_salida  = models.TimeField("Hora de salida",   blank=True, null=True)
    created_at   = models.DateTimeField("Creado en", auto_now_add=True)

    class Meta:
        unique_together = ('profesor', 'fecha')
        ordering = ['-fecha']

    def __str__(self):
        estado = 'Presente' if self.presente else 'Ausente'
        return f"{self.profesor} - {self.fecha} - {estado}"
