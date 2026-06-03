import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "usaer_system.settings")
django.setup()

from django.db.migrations.recorder import MigrationRecorder

print("Intentando eliminar la entrada 'documentos.0001_initial' de django_migrations...")
try:
    deleted_count, _ = MigrationRecorder.Migration.objects.filter(
        app="documentos", name="0001_initial"
    ).delete()
    if deleted_count > 0:
        print(f"Entrada 'documentos.0001_initial' eliminada con éxito. Cantidad: {deleted_count}")
    else:
        print("La entrada 'documentos.0001_initial' no fue encontrada o ya había sido eliminada.")
except Exception as e:
    print(f"Error al intentar eliminar la entrada de migración: {e}")
