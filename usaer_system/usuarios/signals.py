from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


@receiver(post_save, sender=User)
def set_user_role_on_save(sender, instance, created, **kwargs):
    """
    Asigna automáticamente el rol del usuario basado en sus privilegios
    o su relación con la escuela.
    """
    # Evitar bucles infinitos al guardar
    if not instance.role:
        if instance.is_superuser:
            instance.role = User.Role.ADMINISTRADOR
        elif instance.escuela and instance.escuela.director == instance:
            instance.role = User.Role.DIRECTOR

        # Solo guardamos si hubo un cambio para evitar recursión infinita
        # Usamos update() para no disparar el signal de nuevo
        # o simplemente guardamos el campo específico
        User.objects.filter(pk=instance.pk).update(role=instance.role)
