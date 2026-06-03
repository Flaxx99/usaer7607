import random

from alumnos.models import Alumno
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from escuelas.models import Escuela
from faker import Faker
from rac.models import RegistroRAC

User = get_user_model()
fake = Faker("es_MX")


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

        self.stdout.write("\n4. Creando alumnos y registros RAC asociados...")
        self._create_students_for_teacher(maestra1, escuela1, 10)
        self._create_students_for_teacher(maestra2, escuela2, 8)
        self._create_students_for_teacher(maestra1, escuela3, 5)
        self.stdout.write("   Alumnos y registros RAC creados.")

        self.stdout.write(
            self.style.SUCCESS("\n--- Proceso de población de datos finalizado exitosamente. ---")
        )

    def _create_students_for_teacher(self, teacher, school, count):
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
                edad=random.randint(6, 12),  # Usar edad en lugar de fecha_nacimiento
                grado=str(random.randint(1, 6)),
                grupo=random.choice(["A", "B", "C"]),
                escuela=school,
                profesor=teacher,
                clasificacion=random.choice(
                    [choice[0] for choice in Alumno.CLASIFICACION_CHOICES]
                ),  # Asignar clasificación
            )

            self._create_random_rac(alumno, teacher)

    def _create_random_rac(self, alumno, maestro):
        rac_fields = {
            f.name: random.choice([True, False])
            for f in RegistroRAC._meta.get_fields()
            if f.name.startswith(
                ("discapacidad_", "dificultad_", "trastorno_", "aptitud_", "apoyo_", "portafolio_")
            )
        }
        if not any(rac_fields.values()):
            random_field = random.choice(list(rac_fields.keys()))
            rac_fields[random_field] = True

        if random.choice([True, False]):
            rac_fields["es_nuevo_ingreso"] = True
            rac_fields["es_subsecuente"] = False
        else:
            rac_fields["es_nuevo_ingreso"] = False
            rac_fields["es_subsecuente"] = True

        RegistroRAC.objects.create(
            alumno=alumno,
            maestro_apoyo=maestro,
            observaciones=fake.sentence(nb_words=10),
            **rac_fields,
        )
