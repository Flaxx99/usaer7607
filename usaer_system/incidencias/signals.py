from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from notificaciones.models import Notificacion

from .models import Incidencia

User = get_user_model()


@receiver(post_save, sender=Incidencia)
def create_notification_on_incidencia_save(sender, instance, created, **kwargs):
    if created:
        admin_users = User.objects.filter(role=User.Role.ADMINISTRADOR.value, is_active=True)
        Notificacion.objects.bulk_create(
            [
                Notificacion(
                    usuario=admin_user,
                    mensaje=f"Nueva incidencia reportada por {instance.reportado_por.get_full_name()} en {instance.escuela.nombre}: {instance.titulo}.",
                    url=f"/dashboard/incidencias/{instance.id}/detalle",
                )
                for admin_user in admin_users
            ]
        )
