from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('incidencias', '0002_alter_incidencia_profesor'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name='incidencia',
            name='profesor',
            field=models.ForeignKey(
                limit_choices_to={'role': 'MAESTRO_APOYO'},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='incidencias_reportadas',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Profesor reportado'
            ),
        ),
    ]
