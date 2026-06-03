from django.conf import settings
from django.db import models
from django.utils import timezone


class Anuncio(models.Model):
    titulo = models.CharField(max_length=200)
    contenido = models.TextField()
    fecha_publicacion = models.DateTimeField(default=timezone.now)
    fecha_expiracion = models.DateTimeField(null=True, blank=True)
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="anuncios_publicados"
    )

    class Meta:
        verbose_name = "Anuncio"
        verbose_name_plural = "Anuncios"
        ordering = ["-fecha_publicacion"]

    def __str__(self):
        return self.titulo

    def is_active(self):
        now = timezone.now()
        return self.fecha_publicacion <= now and (
            self.fecha_expiracion is None or self.fecha_expiracion >= now
        )
