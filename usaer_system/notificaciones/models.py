from django.conf import settings
from django.db import models

from .managers import NotificacionManager


class Notificacion(models.Model):
    objects = NotificacionManager()
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notificaciones"
    )
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    url = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-fecha_creacion"]
        indexes = [
            models.Index(fields=["usuario", "leida"], name="notif_usuario_leida_idx"),
        ]

    def __str__(self):
        return f"Notificación para {self.usuario.email}: {self.mensaje[:50]}..."
