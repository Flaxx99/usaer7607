import os
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Expediente, OtroArchivo

@receiver(post_delete, sender=Expediente)
def eliminar_archivos_expediente(sender, instance, **kwargs):
    # 1) Borrar los archivos principales usando delete()
    for campo in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion']:
        archivo = getattr(instance, campo)
        if archivo:
            archivo.delete(save=False)

    # 2) Borrar cada objeto OtroArchivo (esto a su vez borra el archivo)
    for otro in instance.otros_archivos.all():
        otro.delete()

    # 3) Intentar eliminar la carpeta del alumno si queda vacía
    carpeta = os.path.join(settings.MEDIA_ROOT, f'expedientes/alumno_{instance.alumno.id}')
    if os.path.isdir(carpeta) and not os.listdir(carpeta):
        os.rmdir(carpeta)
