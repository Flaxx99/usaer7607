from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from escuelas.models import Escuela  # Asegúrate de importar tu modelo Escuela

class Permiso(models.Model):
    class Tipo(models.TextChoices):
        PERSONAL = 'PERSONAL', _('Personal')
        ENFERMEDAD = 'ENFERMEDAD', _('Enfermedad')
        COMISION = 'COMISION', _('Comisión oficial')
        LLEGADA_TARDE = 'LLEGADA_TARDE', _('Llegada tarde')
        SALIDA_TEMPRANA = 'SALIDA_TEMPRANA', _('Salida temprana')

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', _('Pendiente de revisión')
        APROBADO = 'APROBADO', _('Aprobado')
        RECHAZADO = 'RECHAZADO', _('Rechazado')

    # Relación con el profesor (solicitante)
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name=_("Profesor solicitante"),
        related_name='permisos_solicitados',
        limit_choices_to={'role': 'Profesor'}
    )

    # Relación con la escuela (automática desde el profesor)
    escuela = models.ForeignKey(
        Escuela,
        on_delete=models.CASCADE,
        verbose_name=_("Escuela"),
        related_name='permisos_solicitados',
        editable=False  # Se autoasigna, no editable manualmente
    )

    tipo = models.CharField(
        _("Tipo de permiso"),
        max_length=15,
        choices=Tipo.choices,
        default=Tipo.PERSONAL
    )

    fecha_solicitud = models.DateTimeField(
        _("Fecha de solicitud"),
        auto_now_add=True,
        editable=False
    )

    fecha_inicio = models.DateField(
        _("Fecha de inicio"),
        help_text=_("Fecha en que inicia el permiso solicitado")
    )

    fecha_fin = models.DateField(
        _("Fecha de finalización"),
        help_text=_("Fecha en que finaliza el permiso solicitado")
    )

    motivo = models.TextField(
        _("Motivo del permiso"),
        max_length=500,
        help_text=_("Explicación detallada del motivo de la solicitud")
    )

    estado = models.CharField(
        _("Estado"),
        max_length=10,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )

    respuesta_admin = models.TextField(
        _("Respuesta del administrador"),
        blank=True,
        null=True,
        max_length=500,
        help_text=_("Comentarios del administrador (obligatorio si se rechaza)"),
        editable=False
    )

    administrador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Administrador que gestionó"),
        related_name='permisos_gestionados',
        editable=False
    )

    fecha_respuesta = models.DateTimeField(
        _("Fecha de respuesta"),
        blank=True,
        null=True,
        editable=False
    )

    class Meta:
        verbose_name = _("Solicitud de permiso")
        verbose_name_plural = _("Solicitudes de permiso")
        ordering = ['-fecha_solicitud']
        permissions = [
            ("gestionar_permisos", "Puede aprobar/rechazar solicitudes de permiso"),
        ]

    def __str__(self):
        return f"Solicitud #{self.id} - {self.escuela.nombre} ({self.get_estado_display()})"

    def clean(self):
        """Validaciones adicionales"""
        if not hasattr(self, 'profesor'):
            return
            
        # Validación de fechas
        if self.fecha_fin < self.fecha_inicio:
            raise ValidationError(_("La fecha de fin no puede ser anterior a la de inicio"))
        
        # Validación de rechazo
        if self.estado == self.Estado.RECHAZADO and not self.respuesta_admin:
            raise ValidationError(_("Debe proporcionar una razón para el rechazo"))
        
        # Auto-asignar escuela del profesor
        if self.profesor and not self.escuela_id:
            self.escuela = self.profesor.escuela

    def save(self, *args, **kwargs):
        """Lógica automática al guardar"""
        # Auto-asignar escuela si no está asignada
        if self.profesor and not self.escuela_id:
            self.escuela = self.profesor.escuela
        
        # Registrar admin y fecha cuando se cambia el estado
        if self.pk and self.estado in [self.Estado.APROBADO, self.Estado.RECHAZADO]:
            if not self.fecha_respuesta:
                self.fecha_respuesta = timezone.now()
            if not self.administrador_id and hasattr(self, '_current_user'):
                self.administrador = self._current_user
                
        super().save(*args, **kwargs)

    @property
    def puede_aprobar(self):
        """Indica si la solicitud está pendiente"""
        return self.estado == self.Estado.PENDIENTE

    @property
    def duracion_dias(self):
        """Calcula la duración del permiso en días"""
        return (self.fecha_fin - self.fecha_inicio).days + 1