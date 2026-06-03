from django.db.models.signals import post_save
from django.dispatch import receiver
from notificaciones.models import Notificacion
from usuarios.models import User  # Assuming your custom User model is here

from .models import Anuncio


@receiver(post_save, sender=Anuncio)
def create_notification_on_anuncio_save(sender, instance, created, **kwargs):
    if created and instance.is_active():
        # Crear notificaciones en bulk (1 query en vez de N)
        notificaciones = [
            Notificacion(
                usuario=user,
                mensaje=f"Nuevo aviso: {instance.titulo}",
                url=f"/avisos/{instance.id}/",
            )
            for user in User.objects.filter(is_active=True)
            if user != instance.autor
        ]

        # Notificación para el autor
        if instance.autor.is_active:
            notificaciones.append(
                Notificacion(
                    usuario=instance.autor,
                    mensaje=f'Tu aviso "{instance.titulo}" ha sido publicado.',
                    url=f"/avisos/{instance.id}/",
                    leida=True,
                )
            )

        Notificacion.objects.bulk_create(notificaciones)
