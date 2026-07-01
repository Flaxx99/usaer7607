from django.conf import settings
from django.db import models


class EventoCalendario(models.Model):
    EVENT_TYPE_CHOICES = [
        ("EVALUACION", "Evaluación Psicopedagógica"),
        ("REUNION", "Reunión con Padres"),
        ("VISITA", "Visita a Escuela"),
        ("TAREA", "Tarea Administrativa"),
        ("OTRO", "Otro"),
    ]

    STATUS_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("COMPLETADO", "Completado"),
        ("CANCELADO", "Cancelado"),
    ]

    PRIORITY_CHOICES = [
        ("BAJA", "Baja"),
        ("MEDIA", "Media"),
        ("ALTA", "Alta"),
    ]

    TIPO_EVENTO = [
        ("INSTITUCIONAL", "Evento institucional"),
        ("PERSONAL", "Evento personal"),
    ]

    # ─── Campos originales ──────────────────────────────────────
    titulo = models.CharField("Título", max_length=200)
    descripcion = models.TextField("Descripción", blank=True)
    fecha_inicio = models.DateTimeField("Inicio del evento")
    fecha_fin = models.DateTimeField("Fin del evento")
    tipo = models.CharField(max_length=20, choices=TIPO_EVENTO, default="PERSONAL")

    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="eventos_creados",
    )

    # ─── Nuevos campos para el frontend CalendarEvent ────────────
    event_type = models.CharField(
        "Tipo de actividad",
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default="TAREA",
    )
    status = models.CharField(
        "Estado",
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDIENTE",
    )
    priority = models.CharField(
        "Prioridad",
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="MEDIA",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="eventos_asignados",
        verbose_name="Asignado a",
    )
    alumno = models.ForeignKey(
        "alumnos.Alumno",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="eventos",
        verbose_name="Alumno relacionado",
    )
    escuela = models.ForeignKey(
        "escuelas.Escuela",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="eventos",
        verbose_name="Escuela relacionada",
    )
    color = models.CharField(
        "Color del evento",
        max_length=7,
        default="#3B82F6",
        help_text="Código hex del color (ej. #EF4444)",
    )

    def __str__(self):
        return f"{self.titulo} ({self.tipo})"

    class Meta:
        verbose_name = "Evento de Calendario"
        verbose_name_plural = "Eventos de Calendario"
        ordering = ["-fecha_inicio"]
