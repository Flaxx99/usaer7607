import os
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Expediente

@receiver(post_delete, sender=Expediente)
def eliminar_archivos_expediente(sender, instance, **kwargs):
    for campo in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion', 'otros']:
        archivo = getattr(instance, campo)
        if archivo and hasattr(archivo, 'path') and os.path.isfile(archivo.path):
            os.remove(archivo.path)
