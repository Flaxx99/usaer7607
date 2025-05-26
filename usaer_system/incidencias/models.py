from django.db import models
from django.conf import settings
from escuelas.models import Escuela

class Incidencia(models.Model):
    escuela         = models.ForeignKey(
                         Escuela,
                         on_delete=models.CASCADE,
                         verbose_name="Escuela"
                      )
    profesor        = models.ForeignKey(
                         settings.AUTH_USER_MODEL,
                         limit_choices_to={'role':'Profesor'},
                         on_delete=models.SET_NULL,
                         null=True
                      )
    descripcion     = models.TextField("Descripción de la incidencia")
    respuesta_admin = models.TextField("Observaciones de la directora", blank=True, null=True)
    fecha           = models.DateTimeField("Fecha de reporte", auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"Incidencia: {self.profesor} - {self.fecha:%Y-%m-%d}"
