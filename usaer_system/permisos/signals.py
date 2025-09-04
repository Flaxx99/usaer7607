from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Permiso
from notificaciones.models import Notificacion
from usuarios.models import User # Assuming your custom User model is here

@receiver(post_save, sender=Permiso)
def create_notification_on_permiso_save(sender, instance, created, **kwargs):
    if created:
        # Create a notification for all ADMIN users
        admin_users = User.objects.filter(role=User.Role.ADMINISTRADOR.value, is_active=True)
        for admin_user in admin_users:
            Notificacion.objects.create(
                usuario=admin_user,
                mensaje=f"Nueva solicitud de permiso de {instance.profesor.get_full_name()} ({instance.get_tipo_display()}).",
                url=f"/permisos/{instance.id}/gestionar/", # Assuming a URL to manage the permission
            )
