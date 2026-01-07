from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Permiso
from notificaciones.models import Notificacion
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Permiso)
def create_notification_on_permiso_save(sender, instance, created, **kwargs):
    if created:
        # Notificar a todos los ADMINS activos
        admin_users = User.objects.filter(role=User.Role.ADMINISTRADOR.value, is_active=True)
        for admin_user in admin_users:
            Notificacion.objects.create(
                usuario=admin_user,
                mensaje=f"Nueva solicitud de permiso de {instance.profesor.get_full_name()} ({instance.get_tipo_display()}).",
                # URL de React
                url=f"/dashboard/permisos/{instance.id}/gestionar", 
            )