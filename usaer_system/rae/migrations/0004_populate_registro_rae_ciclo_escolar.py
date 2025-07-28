# usaer_system/rae/migrations/000X_populate_registro_rae_ciclo_escolar.py

from django.db import migrations
from datetime import date # Asegúrate de que date esté importado si lo necesitas, aunque no directamente en RunPython


def populate_ciclo_escolar(apps, schema_editor):
    # Obtenemos los modelos históricos.
    # Esto es importante para que la migración funcione incluso si los modelos cambian en el futuro.
    CicloEscolar = apps.get_model('rae', 'CicloEscolar')
    RegistroRAE = apps.get_model('rae', 'RegistroRAE')

    # Intentamos obtener el CicloEscolar que acabamos de crear (ID=1).
    # Si no existe por alguna razón, lo creamos.
    try:
        default_ciclo_escolar = CicloEscolar.objects.get(pk=1)
    except CicloEscolar.DoesNotExist:
        default_ciclo_escolar = CicloEscolar.objects.create(
            nombre='Ciclo Escolar 2024-2025',
            fecha_inicio=date(2024, 8, 26),
            fecha_fin=date(2025, 7, 25),
            activo=True
        )

    # Asignamos este ciclo escolar a todos los registros RAE existentes que no lo tengan
    # (es decir, donde ciclo_escolar_id es NULL).
    # Usamos update() para eficiencia, no hay necesidad de iterar y guardar uno por uno.
    RegistroRAE.objects.filter(ciclo_escolar__isnull=True).update(ciclo_escolar=default_ciclo_escolar)

def reverse_populate_ciclo_escolar(apps, schema_editor):
    # Esta función es para la operación de "revertir" la migración.
    # En este caso, simplemente ponemos el campo ciclo_escolar a NULL para todos los RegistroRAE
    # que lo tengan asignado al ciclo escolar por defecto.
    CicloEscolar = apps.get_model('rae', 'CicloEscolar')
    RegistroRAE = apps.get_model('rae', 'RegistroRAE')
    try:
        default_ciclo_escolar = CicloEscolar.objects.get(pk=1)
        RegistroRAE.objects.filter(ciclo_escolar=default_ciclo_escolar).update(ciclo_escolar=None)
    except CicloEscolar.DoesNotExist:
        pass # Si el ciclo por defecto ya no existe, no hay nada que revertir.


class Migration(migrations.Migration):

    dependencies = [
        ('rae', '0003_cicloescolar_alter_registrorae_options_and_more'), # Asegúrate que este sea el nombre de tu migración anterior
    ]

    operations = [
        migrations.RunPython(populate_ciclo_escolar, reverse_populate_ciclo_escolar),
    ]