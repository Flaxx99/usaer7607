import os
from django.db import models
from django.conf import settings

def ruta_archivo_oficio(instance, filename):
    return f'oficios/{filename}'

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

    def delete(self, *args, **kwargs):
        if self.archivo and self.archivo.storage.exists(self.archivo.name):
            self.archivo.delete(save=False)
        super().delete(*args, **kwargs)

    
    def save(self, *args, **kwargs):
        # Si es una actualización (ya tiene PK)
        if self.pk:
            try:
                old_instance = Oficio.objects.get(pk=self.pk)
                # Si el archivo cambió y el viejo existe, bórralo
                if old_instance.archivo and self.archivo != old_instance.archivo:
                    old_instance.archivo.delete(save=False)
            except Oficio.DoesNotExist:
                pass # Es un create nuevo, no pasa nada
        super().save(*args, **kwargs)
