"""
Management command para reparar datos generados por populate_data.py.

Corrige:
1. CURPs con caracteres '#' literales (lexify no reemplaza #)
2. Alumnos sin fecha_nacimiento (edad queda en null porque el setter es no-op)
3. Registros RAC sin datos de SUPERVISION ESPECIAL / EDUCACION ESPECIAL
   por falta de SystemConfiguration al momento de la creación

Uso:
    python manage.py fix_seed_data
"""

import random
import re
from datetime import date, timedelta

from alumnos.models import Alumno
from django.core.management.base import BaseCommand
from faker import Faker
from rac.models import RegistroRAC
from usuarios.models import SystemConfiguration

fake = Faker("es_MX")

# Regex para detectar CURPs con # literales generados por lexify
# Formato: 4 letras + ###### + 6 letras + ##
CURP_LEXIFY_PATTERN = re.compile(r"^[A-Z]{4}######[A-Z]{6}##$")


class Command(BaseCommand):
    help = (
        "Repara datos generados por populate_data.py con bugs de lexify, edad y SystemConfiguration"
    )

    def handle(self, *args, **options):
        self.stdout.write("\n--- Reparando datos del seed ---\n")

        # ─── 1. Crear SystemConfiguration si no existe ───
        self._fix_system_config()

        # ─── 2. Reparar CURPs con # literal ───
        self._fix_curps()

        # ─── 3. Reparar fecha_nacimiento faltante ───
        self._fix_fecha_nacimiento()

        # ─── 4. Re-autorrellenar RACs (sup_especial, centro, curp, edad) ───
        self._fix_rac_records()

        self.stdout.write(self.style.SUCCESS("\n>> Reparacion completa."))

    def _fix_system_config(self):
        """Crea SystemConfiguration si no existe."""
        created = SystemConfiguration.objects.get_or_create(
            defaults={
                "centro_nombre": "USAER 7607",
                "centro_cct": "08FUA0093E",
                "sup_especial_cct": "08FUA0041G",
                "sup_especial_zona": "22",
                "director_responsable": "Nubia Idaly Solis Mendias",
            }
        )[1]
        if created:
            self.stdout.write("  + SystemConfiguration creada.")
        else:
            self.stdout.write("  o SystemConfiguration ya existe.")

    def _fix_curps(self):
        """Reemplaza CURPs con # literales por CURPs válidos sintéticamente."""
        afectados = Alumno.objects.filter(curp__contains="#")
        total = afectados.count()
        if total == 0:
            self.stdout.write("  o No hay CURPs con # que reparar.")
            return

        self.stdout.write(f"  -> Reparando {total} CURPs...")
        for alumno in afectados:
            # Generar un CURP sintético único con bothify (reemplaza # y ?)
            nuevo_curp = fake.unique.bothify(text="????######??????##").upper()
            alumno.curp = nuevo_curp
            alumno.save(update_fields=["curp"])
        self.stdout.write(f"  + {total} CURPs reparados.")

    def _fix_fecha_nacimiento(self):
        """Asigna fecha_nacimiento a alumnos que no tienen."""
        afectados = Alumno.objects.filter(fecha_nacimiento__isnull=True)
        total = afectados.count()
        if total == 0:
            self.stdout.write("  o No hay alumnos sin fecha_nacimiento.")
            return

        self.stdout.write(f"  -> Asignando fecha_nacimiento a {total} alumnos...")
        for alumno in afectados:
            edad_aprox = random.randint(6, 12)
            alumno.fecha_nacimiento = date.today() - timedelta(
                days=edad_aprox * 365 + random.randint(0, 364)
            )
            alumno.save(update_fields=["fecha_nacimiento"])
        self.stdout.write(f"  + {total} fechas asignadas.")

    def _fix_rac_records(self):
        """Re-autorrellena campos de RAC que dependen de SystemConfiguration o del alumno."""
        config = SystemConfiguration.objects.first()
        racs = RegistroRAC.objects.all()
        total = racs.count()

        if total == 0:
            self.stdout.write("  o No hay registros RAC que reparar.")
            return

        cambios = 0
        for rac in racs:
            dirty = False

            # Auto-fill desde SystemConfiguration
            if config:
                if not rac.sup_especial_cct and config.sup_especial_cct:
                    rac.sup_especial_cct = config.sup_especial_cct
                    dirty = True
                if not rac.sup_especial_zona and config.sup_especial_zona:
                    rac.sup_especial_zona = config.sup_especial_zona
                    dirty = True
                if not rac.centro_cct and config.centro_cct:
                    rac.centro_cct = config.centro_cct
                    dirty = True
                if not rac.centro_nombre and config.centro_nombre:
                    rac.centro_nombre = config.centro_nombre
                    dirty = True

            # Auto-fill desde Alumno
            alumno = rac.alumno
            if alumno:
                if not rac.curp and alumno.curp:
                    rac.curp = alumno.curp
                    dirty = True
                if not rac.edad and alumno.edad:
                    rac.edad = alumno.edad
                    dirty = True
                if not rac.grado and alumno.grado:
                    rac.grado = alumno.grado
                    dirty = True
                if not rac.sexo and alumno.sexo:
                    rac.sexo = alumno.sexo
                    dirty = True
                # zona_regular desde escuela
                if not rac.zona_regular and alumno.escuela and alumno.escuela.zona:
                    rac.zona_regular = alumno.escuela.zona
                    dirty = True

            if dirty:
                rac.save(
                    update_fields=[
                        "sup_especial_cct",
                        "sup_especial_zona",
                        "centro_cct",
                        "centro_nombre",
                        "curp",
                        "edad",
                        "grado",
                        "sexo",
                        "zona_regular",
                    ]
                )
                cambios += 1

        self.stdout.write(
            f"  + {cambios}/{total} registros RAC actualizados (los que tenian campos vacios)."
        )
