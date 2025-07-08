from django.db import models
from django.conf import settings

class EventoCalendario(models.Model):
    TIPO_EVENTO = [
        ('INSTITUCIONAL', 'Evento institucional'),
        ('PERSONAL', 'Evento personal'),
    ]

    titulo = models.CharField("Título", max_length=200)
    descripcion = models.TextField("Descripción", blank=True)
    fecha_inicio = models.DateTimeField("Inicio del evento")
    fecha_fin = models.DateTimeField("Fin del evento")
    tipo = models.CharField(max_length=20, choices=TIPO_EVENTO, default='PERSONAL')

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='eventos_creados'
    )

    archivo = models.FileField(upload_to='calendario/archivos/', blank=True, null=True)

    def __str__(self):
        return f"{self.titulo} ({self.tipo})"

    class Meta:
        verbose_name = "Evento de Calendario"
        verbose_name_plural = "Eventos de Calendario"
        ordering = ['-fecha_inicio']
