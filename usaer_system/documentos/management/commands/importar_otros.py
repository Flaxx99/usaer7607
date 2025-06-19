import os
from django.core.management.base import BaseCommand
from django.conf import settings
from documentos.models import Expediente, OtroArchivo

class Command(BaseCommand):
    help = 'Importa una vez todos los archivos otros.* de la carpeta media a la tabla OtroArchivo'

    def handle(self, *args, **options):
        total = 0
        for exp in Expediente.objects.all():
            carpeta = os.path.join(settings.MEDIA_ROOT,
                                   f"expedientes/alumno_{exp.alumno.id}")
            if not os.path.isdir(carpeta):
                continue

            for nombre in os.listdir(carpeta):
                if nombre.startswith("otros.") and not exp.otros_archivos.filter(
                        archivo__endswith=nombre
                   ).exists():
                    ruta_absoluta = os.path.join(carpeta, nombre)
                    if os.path.isfile(ruta_absoluta):
                        oa = OtroArchivo(expediente=exp)
                        # asignamos el path directamente sin copiar ni renombrar
                        oa.archivo.name = f"expedientes/alumno_{exp.alumno.id}/{nombre}"
                        oa.save()
                        self.stdout.write(f"Importado: {nombre} para expediente {exp.pk}")
                        total += 1

        self.stdout.write(self.style.SUCCESS(f"Total importados: {total}"))
