from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Incidencia
from notificaciones.models import Notificacion
from usuarios.models import User # Assuming your custom User model is here

@receiver(post_save, sender=Incidencia)
def create_notification_on_incidencia_save(sender, instance, created, **kwargs):
    if created:
        # Create a notification for all ADMIN users
        admin_users = User.objects.filter(role=User.Role.ADMINISTRADOR.value, is_active=True)
        for admin_user in admin_users:
            Notificacion.objects.create(
                usuario=admin_user,
                mensaje=f"Nueva incidencia reportada por {instance.reportado_por.get_full_name()} en {instance.escuela.nombre}: {instance.titulo}.",
                url=f"/incidencias/{instance.id}/", # Assuming a detail view for Incidencia
            )
