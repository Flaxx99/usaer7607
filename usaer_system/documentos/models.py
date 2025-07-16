from django.db import models
from alumnos.models import Alumno
from django.conf import settings
from pathlib import Path
import os

def ruta_archivo(instance, filename, tipo):
    extension = Path(filename).suffix.lower()
    return f"expedientes/alumno_{instance.alumno.id}/{tipo}{extension}"

def ruta_informe_deteccion(instance, filename):
    return ruta_archivo(instance, filename, "deteccion")

def ruta_informe_psicopedagogico(instance, filename):
    return ruta_archivo(instance, filename, "psico")

def ruta_plan_intervencion(instance, filename):
    return ruta_archivo(instance, filename, "plan")

def ruta_otros(instance, filename):
    # guardo cada archivo “otro” con su nombre original
    return f"expedientes/alumno_{instance.expediente.alumno.id}/{filename}"

class Expediente(models.Model):
    alumno                  = models.ForeignKey(Alumno, on_delete=models.CASCADE, verbose_name="Alumno")
    profesor                = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, editable=False)
    informe_deteccion       = models.FileField(upload_to=ruta_informe_deteccion,     verbose_name="Informe de Detección Inicial")
    informe_psicopedagogico = models.FileField(upload_to=ruta_informe_psicopedagogico, verbose_name="Informe Psicopedagógico")
    plan_intervencion       = models.FileField(upload_to=ruta_plan_intervencion,      verbose_name="Plan de Intervención")
    observaciones           = models.TextField(blank=True)
    fecha_subida            = models.DateTimeField(auto_now_add=True)
   
    def __str__(self):
        return f"{self.alumno} - {self.profesor}"

    def delete(self, *args, **kwargs):
        # borro los 3 archivos principales al eliminar el expediente
        for field in ['informe_deteccion','informe_psicopedagogico','plan_intervencion']:
            archivo = getattr(self, field)
            if archivo and archivo.storage.exists(archivo.name):
                archivo.delete(save=False)
        super().delete(*args, **kwargs)

class OtroArchivo(models.Model):
    expediente  = models.ForeignKey(Expediente, related_name="otros_archivos", on_delete=models.CASCADE)
    archivo     = models.FileField(upload_to=ruta_otros, verbose_name="Archivo adicional")
    descripcion = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.nombre

    @property
    def nombre(self):
        # devuelve sólo el nombre de fichero (sin ruta)
        return os.path.basename(self.archivo.name)

    def delete(self, *args, **kwargs):
        # borro el archivo físico al eliminar este registro
        if self.archivo and self.archivo.storage.exists(self.archivo.name):
            self.archivo.delete(save=False)
        super().delete(*args, **kwargs)
