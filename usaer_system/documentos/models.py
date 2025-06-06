from django.db import models

from django.db import models

class Expediente(models.Model):
    alumno = models.CharField(max_length=100)
    escuela = models.CharField(max_length=100)
    grado = models.CharField(max_length=10)
    grupo = models.CharField(max_length=10)
  

    informe_deteccion = models.FileField(upload_to='expedientes/', verbose_name="Informe de Detección Inicial")
    informe_psicopedagogico = models.FileField(upload_to='expedientes/', verbose_name="Informe Psicopedagógico")
    plan_intervencion = models.FileField(upload_to='expedientes/', verbose_name="Plan de Intervención")
    otros = models.FileField(upload_to='expedientes/', blank=True, null=True, verbose_name="Otros archivos")

    observaciones = models.TextField(blank=True)

    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.alumno} - {self.escuela}"