from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Anuncio
from notificaciones.models import Notificacion
from usuarios.models import User # Assuming your custom User model is here

@receiver(post_save, sender=Anuncio)
def create_notification_on_anuncio_save(sender, instance, created, **kwargs):
    if created and instance.is_active():
        # Create a notification for all active users
        # TODO: Refine target users based on roles or specific criteria if needed.
        # For now, sending to all active users.
        active_users = User.objects.filter(is_active=True)
        for user in active_users:
            # Avoid sending notification to the author of the announcement if they are also a recipient
            if user != instance.autor:
                Notificacion.objects.create(
                    usuario=user,
                    mensaje=f"Nuevo aviso: {instance.titulo}",
                    url=f"/avisos/{instance.id}/", # Assuming a detail view for Anuncio
                )

        # Create a notification for the author (admin) if they are not already a recipient
        # This is for the admin to know their announcement was published and notified
        if instance.autor.is_active:
            Notificacion.objects.create(
                usuario=instance.autor,
                mensaje=f"Tu aviso \"{instance.titulo}\" ha sido publicado.",
                url=f"/avisos/{instance.id}/",
                leida=True # Mark as read for the author, as they just published it
            )
