import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from documentos.models import Expediente


class Command(BaseCommand):
    help = "Reubica los archivos de los expedientes en carpetas por alumno"

    def handle(self, *args, **kwargs):
        moved = 0
        base_media = Path(settings.MEDIA_ROOT)
        for exp in Expediente.objects.all():
            alumno_id = exp.alumno.id
            nueva_ruta = base_media / f"expedientes/alumno_{alumno_id}"

            nueva_ruta.mkdir(parents=True, exist_ok=True)

            for field in ["informe_deteccion", "informe_psicopedagogico", "plan_intervencion"]:
                archivo = getattr(exp, field)
                if (
                    archivo
                    and archivo.name.startswith("expedientes/")
                    and f"alumno_{alumno_id}/" not in archivo.name
                ):
                    origen = base_media / archivo.name
                    destino = nueva_ruta / Path(archivo.name).name

                    try:
                        shutil.move(str(origen), str(destino))
                        nuevo_path = f"expedientes/alumno_{alumno_id}/{destino.name}"
                        setattr(exp, field, nuevo_path)
                        moved += 1
                    except FileNotFoundError:
                        self.stdout.write(self.style.WARNING(f"No encontrado: {archivo.name}"))

            exp.save()

        self.stdout.write(self.style.SUCCESS(f"{moved} archivo(s) reubicados exitosamente."))
