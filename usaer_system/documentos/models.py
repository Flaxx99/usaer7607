from django.db import models
from alumnos.models import Alumno
from django.conf import settings
from pathlib import Path

# Función general para generar rutas limpias con nombres estandarizados
def ruta_archivo(instance, filename, tipo):
    extension = Path(filename).suffix.lower()  # conserva extensión (.pdf, .docx, etc.)
    nombre_archivo = f"{tipo}{extension}"
    return f"expedientes/alumno_{instance.alumno.id}/{nombre_archivo}"

# Funciones específicas para cada tipo de documento
def ruta_informe_deteccion(instance, filename):
    return ruta_archivo(instance, filename, "deteccion")

def ruta_informe_psicopedagogico(instance, filename):
    return ruta_archivo(instance, filename, "psico")

def ruta_plan_intervencion(instance, filename):
    return ruta_archivo(instance, filename, "plan")

def ruta_otros(instance, filename):
    return ruta_archivo(instance, filename, "otros")


class Expediente(models.Model):
    alumno = models.ForeignKey(
        Alumno, 
        on_delete=models.CASCADE, 
        verbose_name="Alumno"
    )
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        verbose_name="Profesor que sube", 
        editable=False
    )

    informe_deteccion = models.FileField(
        upload_to=ruta_informe_deteccion, 
        verbose_name="Informe de Detección Inicial"
    )
    informe_psicopedagogico = models.FileField(
        upload_to=ruta_informe_psicopedagogico, 
        verbose_name="Informe Psicopedagógico"
    )
    plan_intervencion = models.FileField(
        upload_to=ruta_plan_intervencion, 
        verbose_name="Plan de Intervención"
    )
    otros = models.FileField(
        upload_to=ruta_otros, 
        blank=True, 
        null=True, 
        verbose_name="Otros archivos"
    )

    observaciones = models.TextField(blank=True)
    fecha_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.alumno} - {self.profesor}"
