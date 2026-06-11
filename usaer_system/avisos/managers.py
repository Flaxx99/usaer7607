from django.db import models
from django.utils import timezone


class AnuncioManager(models.Manager):
    """QuerySet managers para Anuncio.

    Centraliza lógica de visibilidad y filtros por autor.
    """

    def publicados(self):
        """Anuncios cuya fecha de publicación ya llegó."""
        return self.filter(fecha_publicacion__lte=timezone.now())

    def vigentes(self):
        """Anuncios publicados que aún no han expirado."""
        ahora = timezone.now()
        return self.filter(
            fecha_publicacion__lte=ahora,
        ).exclude(
            fecha_expiracion__lt=ahora,
            fecha_expiracion__isnull=False,
        )

    def de_autor(self, usuario):
        """Anuncios creados por un usuario específico."""
        return self.filter(autor=usuario)

    def visibles_para(self, usuario):
        """Para admins: todos los anuncios. Para otros: solo los propios."""
        if usuario.is_superuser or usuario.role == "ADMIN":
            return self.all()
        return self.de_autor(usuario)
