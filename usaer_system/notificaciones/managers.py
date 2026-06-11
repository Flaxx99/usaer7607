from django.db import models


class NotificacionManager(models.Manager):
    """QuerySet managers para Notificacion."""

    def no_leidas(self):
        return self.filter(leida=False)

    def de_usuario(self, usuario):
        return self.filter(usuario=usuario)

    def no_leidas_de_usuario(self, usuario):
        return self.filter(usuario=usuario, leida=False)
