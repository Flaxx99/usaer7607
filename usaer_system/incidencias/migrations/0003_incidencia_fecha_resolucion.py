from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('incidencias', '0002_alter_incidencia_profesor'),
    ]

    operations = [
        migrations.AddField(
            model_name='incidencia',
            name='fecha_resolucion',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
