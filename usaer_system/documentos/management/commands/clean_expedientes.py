import os
from django.core.management.base import BaseCommand
from django.conf import settings
from documentos.models import Expediente

class Command(BaseCommand):
    help = 'Elimina carpetas de media/expedientes/alumno_X sin expediente en BD'

    def handle(self, *args, **options):
        base = os.path.join(settings.MEDIA_ROOT, 'expedientes')
        if not os.path.isdir(base):
            self.stdout.write(self.style.WARNING(f'No existe {base}'))
            return

        for nombre in os.listdir(base):
            ruta = os.path.join(base, nombre)
            if os.path.isdir(ruta) and nombre.startswith('alumno_'):
                try:
                    alumno_id = int(nombre.split('_')[1])
                except (IndexError, ValueError):
                    continue

                if not Expediente.objects.filter(alumno_id=alumno_id).exists():
                    self.stdout.write(f'{self.style.NOTICE("Borrando carpeta huérfana:")} {ruta}')
                    # eliminar todo dentro
                    for root, dirs, files in os.walk(ruta, topdown=False):
                        for f in files:
                            os.remove(os.path.join(root, f))
                        for d in dirs:
                            os.rmdir(os.path.join(root, d))
                    os.rmdir(ruta)
        self.stdout.write(self.style.SUCCESS('Limpieza finalizada.'))
