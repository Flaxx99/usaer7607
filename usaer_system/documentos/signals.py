import os

from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Expediente, OtroArchivo


@receiver(post_delete, sender=OtroArchivo)
def eliminar_archivo_de_otroarchivo(sender, instance, **kwargs):
    """
    Elimina el archivo físico de un OtroArchivo cuando el objeto es eliminado.
    """
    if instance.archivo:
        instance.archivo.delete(save=False)


@receiver(post_delete, sender=Expediente)
def eliminar_archivos_expediente(sender, instance, **kwargs):
    # 1) Borrar los archivos principales usando delete()
    for campo in ["informe_deteccion", "informe_psicopedagogico", "plan_intervencion"]:
        archivo = getattr(instance, campo)
        if archivo:
            archivo.delete(save=False)

    # 2) Los objetos OtroArchivo se borran por la cascada (on_delete=CASCADE).
    # La señal `eliminar_archivo_de_otroarchivo` se encargará de borrar sus archivos físicos.
    # No se necesita un bucle aquí.

    # 3) Intentar eliminar la carpeta del alumno si queda vacía
    if instance.alumno and instance.alumno.id:
        carpeta = os.path.join(settings.MEDIA_ROOT, f"expedientes/alumno_{instance.alumno.id}")
        if os.path.isdir(carpeta) and not os.listdir(carpeta):
            try:
                os.rmdir(carpeta)
            except OSError:
                # La carpeta no está vacía, lo cual es posible en condiciones de carrera.
                pass
