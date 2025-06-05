# incidencias/models.py

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from escuelas.models import Escuela

class Incidencia(models.Model):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('RESUELTA',  'Resuelta'),
    ]

    escuela = models.ForeignKey(
        Escuela,
        on_delete=models.CASCADE,
        verbose_name="Escuela",
        related_name='incidencias'
    )
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        limit_choices_to={'role': 'Profesor'},
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Profesor reportado",
        related_name='incidencias_reportadas'
    )
    titulo = models.CharField(
        "Título de la incidencia",
        max_length=100,
        help_text="Descripción breve del problema"
    )
    descripcion = models.TextField(
        "Descripción detallada",
        help_text="Explica con detalle la incidencia"
    )
    fecha_reporte = models.DateTimeField(
        "Fecha de reporte",
        auto_now_add=True
    )
    estado = models.CharField(
        "Estado",
        max_length=10,
        choices=ESTADOS,
        default='PENDIENTE'
    )
    respuesta_admin = models.TextField(
        "Respuesta de dirección",
        blank=True,
        null=True,
        help_text="Comentarios de la dirección sobre la solución"
    )


    class Meta:
        verbose_name = "Incidencia"
        verbose_name_plural = "Incidencias"
        ordering = ['-fecha_reporte']
        permissions = [
            ("can_resolve_incidence", "Puede resolver incidencias"),
        ]

    def __str__(self):
        return f"Incidencia #{self.id}: {self.titulo} ({self.get_estado_display()})"

    def save(self, *args, **kwargs):
        # Si marcamos como resuelta y no hay fecha_resolucion, la ponemos ahora
        if self.estado == 'RESUELTA' and not self.fecha_resolucion:
            self.fecha_resolucion = timezone.now()
        super().save(*args, **kwargs)

    @property
    def puede_cerrar(self):
        """Sólo puede resolverse si aún está pendiente."""
        return self.estado == 'PENDIENTE'
