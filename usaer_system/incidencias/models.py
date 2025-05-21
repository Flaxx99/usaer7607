from django.db import models
from usuarios.models import Profesor
from escuelas.models import Escuela

class Incidencia(models.Model):
    profesor = models.ForeignKey(Profesor, on_delete=models.CASCADE, verbose_name="Profesor")
    escuela = models.ForeignKey(Escuela, on_delete=models.CASCADE, verbose_name="Escuela")
    descripcion = models.TextField("Descripción de la incidencia", help_text="Describe el incidente o situación reportada")
    respuesta_admin = models.TextField("Observaciones de la directora", blank=True, null=True)
    fecha = models.DateTimeField("Fecha de reporte", auto_now_add=True)

    class Meta:
        ordering = ['-fecha']

    def __str__(self):
        return f"Incidencia: {self.profesor} - {self.fecha.date()}"
