from alumnos.models import Alumno
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Recalculates and updates the age of all students based on their date of birth."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting age update process..."))

        alumnos_to_update = Alumno.objects.filter(fecha_nacimiento__isnull=False)
        updated_count = 0
        skipped_count = 0

        total_alumnos = Alumno.objects.count()
        alumnos_with_dob = alumnos_to_update.count()
        skipped_count = total_alumnos - alumnos_with_dob

        self.stdout.write(f"Found {total_alumnos} total students.")
        self.stdout.write(f"Found {alumnos_with_dob} students with a date of birth to update.")

        for alumno in alumnos_to_update:
            # The age calculation is now in the model's save() method.
            # We just need to call save() for the logic to trigger.
            try:
                alumno.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Successfully updated age for: {alumno.get_full_name()}")
                )
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"Could not update age for {alumno.get_full_name()}: {e}")
                )

        self.stdout.write(self.style.SUCCESS("\n--------------------------------"))
        self.stdout.write(self.style.SUCCESS("Age update process finished."))
        self.stdout.write(f"{updated_count} students' ages were updated.")
        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"{skipped_count} students were skipped because they don't have a date of birth set."
                )
            )
