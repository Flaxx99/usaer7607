from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Incidencia
from notificaciones.models import Notificacion
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Incidencia)
def create_notification_on_incidencia_save(sender, instance, created, **kwargs):
    if created:
        # Notificar a todos los ADMINISTRADORES activos
        admin_users = User.objects.filter(role=User.Role.ADMINISTRADOR.value, is_active=True)
        
        for admin_user in admin_users:
            Notificacion.objects.create(
                usuario=admin_user,
                mensaje=f"Nueva incidencia reportada por {instance.reportado_por.get_full_name()} en {instance.escuela.nombre}: {instance.titulo}.",
                # ⚠️ CAMBIO CLAVE: Apuntamos a la ruta del Frontend (React)
                url=f"/dashboard/incidencias/{instance.id}/detalle", 
            )