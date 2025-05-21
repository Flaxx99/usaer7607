from django.db import models
from usuarios.models import Profesor
from escuelas.models import Escuela

class Asistencia(models.Model):
    profesor = models.ForeignKey(Profesor, on_delete=models.CASCADE, verbose_name="Profesor")
    escuela = models.ForeignKey(Escuela, on_delete=models.CASCADE, verbose_name="Escuela")
    fecha = models.DateField("Fecha")
    presente = models.BooleanField("Presente")
    hora_entrada = models.TimeField("Hora de entrada", blank=True, null=True)
    hora_salida = models.TimeField("Hora de salida", blank=True, null=True)
    created_at = models.DateTimeField("Creado en", auto_now_add=True)

    class Meta:
        unique_together = ('profesor', 'fecha')
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.profesor} - {self.fecha} - {'Presente' if self.presente else 'Ausente'}"
