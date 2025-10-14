from django.db import migrations

def populate_ciclo_escolar(apps, schema_editor):
    CicloEscolar = apps.get_model('ciclos_escolares', 'CicloEscolar')
    RegistroRAC = apps.get_model('rac', 'RegistroRAC')

    # Get the first cycle, or you can define a more specific logic
    default_cycle = CicloEscolar.objects.first()

    if default_cycle:
        RegistroRAC.objects.filter(ciclo_escolar__isnull=True).update(ciclo_escolar=default_cycle)

class Migration(migrations.Migration):

    dependencies = [
        ('rac', '0005_alter_registrorac_ciclo_escolar'),
        ('ciclos_escolares', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(populate_ciclo_escolar),
    ]