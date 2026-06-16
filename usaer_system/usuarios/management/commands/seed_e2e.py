from datetime import date

from alumnos.models import Alumno
from ciclos_escolares.models import CicloEscolar
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from escuelas.models import Escuela
from rae.models import RAEAlumno, RegistroRAE

User = get_user_model()


class Command(BaseCommand):
    help = "Seeds the database with test data for E2E tests"

    def handle(self, *args, **options):
        self.stdout.write("Seeding E2E data...")

        # 1. Crear Ciclo Escolar
        ciclo, _ = CicloEscolar.objects.get_or_create(
            nombre="Ciclo E2E 2025-2026",
            defaults={
                "fecha_inicio": date(2025, 8, 1),
                "fecha_fin": date(2026, 7, 1),
                "activo": True,
            },
        )
        self.stdout.write(f"Ciclo creado: {ciclo.nombre}")

        # 2. Crear Escuela
        escuela, _ = Escuela.objects.get_or_create(
            cct="CCTE2E01",
            defaults={
                "nombre": "Escuela E2E",
                "clave_estatal": "CLE2E01",
                "zona": "Z01",
                "nivel": "Primaria",
            },
        )
        self.stdout.write(f"Escuela creada: {escuela.nombre}")

        # 3. Crear Usuarios
        admin_email = "admin@test.com"
        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_superuser(
                email=admin_email, numero_empleado="ADME2E", password="pass123", escuela=escuela
            )
            self.stdout.write(f"Admin creado: {admin_email}")

        sec_email = "sec@test.com"
        if not User.objects.filter(email=sec_email).exists():
            User.objects.create_user(
                email=sec_email,
                numero_empleado="SECE2E",
                password="pass123",
                role=User.Role.SECRETARIO,
                escuela=escuela,
            )
            self.stdout.write(f"Secretario creado: {sec_email}")

        maestro_email = "maestro@test.com"
        if not User.objects.filter(email=maestro_email).exists():
            User.objects.create_user(
                email=maestro_email,
                numero_empleado="MAESTE2E",
                password="pass123",
                role=User.Role.MAESTRO_APOYO,
                escuela=escuela,
            )
            self.stdout.write(f"Maestro creado: {maestro_email}")

        # 4. Crear Alumnos
        alumnos_data = [
            {
                "nombres": "Juan",
                "apellido_paterno": "Perez",
                "curp": "PERJUA01",
                "grado": "3",
                "clasificacion": "NINGUNO",
            },
            {
                "nombres": "Maria",
                "apellido_paterno": "Lopez",
                "curp": "LOPMAR02",
                "grado": "5",
                "clasificacion": "NINGUNO",
            },
        ]

        for data in alumnos_data:
            Alumno.objects.get_or_create(
                curp=data["curp"], defaults={**data, "escuela": escuela, "activo": True}
            )

        self.stdout.write("Alumnos creados.")

        # 5. Crear Registro RAE y RAEAlumnos (para exportación E2E)
        admin = User.objects.filter(email=admin_email).first()
        if admin:
            registro_rae, created = RegistroRAE.objects.get_or_create(
                escuela=escuela,
                ciclo_escolar=ciclo,
                defaults={
                    "creado_por": admin,
                    "docente_hombres": 1,
                    "docente_mujeres": 1,
                },
            )
            if created:
                self.stdout.write(f"Registro RAE creado: {registro_rae}")

            for alumno in Alumno.objects.filter(escuela=escuela):
                RAEAlumno.objects.get_or_create(
                    registro=registro_rae,
                    alumno=alumno,
                    defaults={
                        "capturado_por": admin,
                        "curp": alumno.curp,
                        "edad": alumno.edad,
                        "grado": f"{alumno.grado}°A",
                        "ceg": alumno.curp == "PERJUA01",
                        "dsc": alumno.curp == "LOPMAR02",
                        "psicologia": alumno.curp == "PERJUA01",
                        "diagnostico": True,
                        "modelo": True,
                    },
                )
                self.stdout.write(f"  RAEAlumno para {alumno.get_full_name()}")
            self.stdout.write("Datos RAE creados.")

        self.stdout.write("Seeding complete!")
