import os
from django.db import models
from django.conf import settings
from django.utils.timezone import now

def ruta_archivo_oficio(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{now().strftime('%Y%m%d%H%M%S')}_{instance.titulo[:50].replace(' ', '_')}.{ext}"
    return os.path.join("oficios", now().strftime("%Y/%m"), filename)

class Oficio(models.Model):
    titulo = models.CharField("Título del oficio", max_length=255)
    descripcion = models.TextField("Descripción", blank=True)
    archivo = models.FileField(upload_to=ruta_archivo_oficio, verbose_name="Archivo")
    fecha_subida = models.DateTimeField(auto_now_add=True)
    subido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Subido por"
    )

    def __str__(self):
        return self.titulo
