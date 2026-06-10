import random
from datetime import date

from alumnos.models import Alumno
from ciclos_escolares.models import CicloEscolar
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from escuelas.models import Escuela
from faker import Faker
from rac.models import (
    APTITUDES_SUB,
    DISCAPACIDAD_SUB,
    DIFICULTADES_SUB,
    RegistroRAC,
    TRASTORNOS_SUB,
)

User = get_user_model()
fake = Faker("es_MX")

# Mapa de clasificación → lista de subclasificaciones válidas
SUBCLASIFICACION_MAP = {
    "DISCAPACIDAD": [c[0] for c in DISCAPACIDAD_SUB],
    "DIFICULTADES_SEVERAS": [c[0] for c in DIFICULTADES_SUB],
    "TRASTORNOS": [c[0] for c in TRASTORNOS_SUB],
    "APTITUDES_SOBRESALIENTES": [c[0] for c in APTITUDES_SUB],
}


class Command(BaseCommand):
    help = "Populate the database with test data for schools, teachers, students, and RAC records."

    def handle(self, *args, **kwargs):
        self.stdout.write("\n--- Iniciando la población de datos de prueba ---")

        self.stdout.write("\n1. Limpiando datos existentes...")
        User.objects.filter(is_superuser=False).delete()
        Escuela.objects.all().delete()
        Alumno.objects.all().delete()
        RegistroRAC.objects.all().delete()
        self.stdout.write("   Datos antiguos eliminados.")

        self.stdout.write("\n2. Creando usuarios de prueba (Admin, Secretario, Maestros)...")
        # Admin user
        admin, created = User.objects.get_or_create(
            email="admin@usaer.com",
            defaults={
                "first_name": "Admin",
                "last_name": "USAER",
                "role": "ADMINISTRADOR",
                "is_staff": True,
                "is_superuser": True,
                "numero_empleado": "ADM001",
            },
        )
        if created:
            admin.set_password("admin123")
            admin.save()
            self.stdout.write("   Admin creado.")
        else:
            self.stdout.write("   Admin ya existe.")

        # Secretario user
        secretario = User.objects.create_user(
            email="secretario@usaer.com",
            password="secretario123",
            first_name="Secretario",
            last_name="General",
            role="SECRETARIO",
            numero_empleado="SEC001",
        )
        self.stdout.write("   Secretario creado.")

        # Maestro de Apoyo 1
        maestra1 = User.objects.create_user(
            email="maestra1@usaer.com",
            password="maestra123",
            first_name="Laura",
            last_name="García",
            role="MAESTRO_APOYO",
            numero_empleado="MAE001",
        )
        maestra1.sexo = "M"
        maestra1.save()
        self.stdout.write("   Maestra Laura García creada.")

        # Maestro de Apoyo 2
        maestra2 = User.objects.create_user(
            email="maestra2@usaer.com",
            password="maestra123",
            first_name="Carlos",
            last_name="Pérez",
            role="MAESTRO_APOYO",
            numero_empleado="MAE002",
        )
        maestra2.sexo = "H"
        maestra2.save()
        self.stdout.write("   Maestro Carlos Pérez creado.")

        self.stdout.write("\n3. Creando escuelas de prueba...")
        escuela1 = Escuela.objects.create(
            nombre="Escuela Primaria Benito Juárez",
            cct="12DPR1234A",
            nivel="PRIMARIA",
            zona="052",
            clave_estatal="12DPR1234A",
        )
        escuela2 = Escuela.objects.create(
            nombre="Jardín de Niños Rosaura Zapata",
            cct="12DJN5678B",
            nivel="PREESCOLAR",
            zona="015",
            clave_estatal="12DJN5678B",
        )
        escuela3 = Escuela.objects.create(
            nombre="Escuela Secundaria Técnica 1",
            cct="12DST9012C",
            nivel="SECUNDARIA",
            zona="030",
            clave_estatal="12DST9012C",
        )
        self.stdout.write("   Escuelas creadas.")

        self.stdout.write("\n3.5. Creando ciclo escolar actual...")
        ciclo, created = CicloEscolar.objects.get_or_create(
            nombre="2025-2026",
            defaults={
                "fecha_inicio": date(2025, 8, 15),
                "fecha_fin": date(2026, 7, 15),
                "activo": True,
            },
        )
        if created:
            self.stdout.write("   Ciclo escolar 2025-2026 creado.")
        else:
            self.stdout.write("   Ciclo escolar 2025-2026 ya existe.")

        self.stdout.write("\n4. Creando alumnos y registros RAC asociados...")
        self._create_students_for_teacher(maestra1, escuela1, ciclo, 10)
        self._create_students_for_teacher(maestra2, escuela2, ciclo, 8)
        self._create_students_for_teacher(maestra1, escuela3, ciclo, 5)
        self.stdout.write("   Alumnos y registros RAC creados.")

        self.stdout.write(
            self.style.SUCCESS("\n--- Proceso de población de datos finalizado exitosamente. ---")
        )

    def _create_students_for_teacher(self, teacher, school, ciclo, count):
        escuelas = list(Escuela.objects.all())
        for i in range(count):
            sexo = random.choice(["H", "M"])
            first_name = fake.first_name_male() if sexo == "H" else fake.first_name_female()
            last_name_p = fake.last_name()
            last_name_m = fake.last_name()

            alumno = Alumno.objects.create(
                nombres=first_name,
                apellido_paterno=last_name_p,
                apellido_materno=last_name_m,
                curp=fake.unique.lexify(text="????######??????##").upper(),
                sexo=sexo,
                edad=random.randint(6, 12),
                grado=str(random.randint(1, 6)),
                grupo=random.choice(["A", "B", "C"]),
                escuela=school,
                profesor=teacher,
                clasificacion=random.choice(
                    [c[0] for c in Alumno.CLASIFICACION_CHOICES]
                ),
            )

            self._create_random_rac(alumno, teacher, ciclo, escuelas)

    def _create_random_rac(self, alumno, maestro, ciclo, escuelas):
        clasificacion = alumno.clasificacion
        opciones = SUBCLASIFICACION_MAP.get(clasificacion, ["NO_APLICA"])
        subclasificacion = random.choice(opciones)

        escuela_regular = random.choice(escuelas)
        escuela_basica = random.choice([e for e in escuelas if e != escuela_regular] or escuelas)

        RegistroRAC.objects.create(
            alumno=alumno,
            ciclo_escolar=ciclo,
            maestro_apoyo=maestro,
            escuela_regular=escuela_regular,
            escuela_basica=escuela_basica,
            clasificacion=clasificacion,
            subclasificacion=subclasificacion,
            service_type=random.choice(["USAER", "CAM_BASICO", "CAM_LABORAL"]),
            observaciones=fake.sentence(nb_words=10),
        )
