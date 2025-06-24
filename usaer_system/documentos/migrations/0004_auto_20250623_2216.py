from django.db import migrations, models
import documentos.models

class Migration(migrations.Migration):

    dependencies = [
        ('documentos', '0003_remove_expediente_otros'),
    ]

    operations = [
        migrations.CreateModel(
            name='OtroArchivo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('archivo', models.FileField(upload_to=documentos.models.ruta_otros, verbose_name='Archivo adicional')),
                ('descripcion', models.CharField(blank=True, max_length=255)),
                ('expediente', models.ForeignKey(on_delete=models.CASCADE, related_name='otros_archivos', to='documentos.expediente')),
            ],
        ),
    ]
