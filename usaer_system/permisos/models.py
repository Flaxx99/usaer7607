from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from escuelas.models import Escuela


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

    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='permisos_solicitados',
        verbose_name=_("Profesor solicitante")
    )
    escuela = models.ForeignKey(
        Escuela,
        on_delete=models.CASCADE,
        related_name='permisos_escuela',
        verbose_name=_("Escuela"),
        editable=False
    )

    tipo = models.CharField(
        _("Tipo de permiso"),
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.PERSONAL
    )
    motivo = models.TextField(
        _("Motivo del permiso"),
        max_length=500,
        help_text=_("Explique claramente el motivo de su solicitud.")
    )
    fecha_inicio = models.DateField(_("Fecha de inicio"))
    fecha_fin = models.DateField(_("Fecha de finalización"))

    estado = models.CharField(
        _("Estado"),
        max_length=10,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )

    respuesta_admin = models.TextField(
        _("Respuesta del administrador"),
        max_length=500,
        blank=True,
        null=True,
        editable=False,
        help_text=_("Explicación del rechazo (si aplica)")
    )

    administrador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        editable=False,
        related_name='permisos_gestionados',
        verbose_name=_("Administrador que gestionó")
    )

    fecha_solicitud = models.DateTimeField(
        _("Fecha de solicitud"),
        auto_now_add=True
    )
    fecha_respuesta = models.DateTimeField(
        _("Fecha de respuesta"),
        null=True,
        blank=True,
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
        profesor_str = str(self.profesor) if self.profesor_id else "Sin asignar"
        return f"Permiso #{self.id or 'nuevo'} | {profesor_str} | {self.get_estado_display()}"


    def clean(self):
        if self.fecha_fin and self.fecha_inicio and self.fecha_fin < self.fecha_inicio:
            raise ValidationError(_("La fecha de finalización no puede ser anterior a la fecha de inicio."))

        if self.estado == self.Estado.RECHAZADO and not self.respuesta_admin:
            raise ValidationError(_("Debe proporcionar una razón para el rechazo."))

        # ✅ Evitar error si aún no hay profesor asignado
        if self.profesor_id and not self.escuela_id:
            self.escuela = getattr(self.profesor, 'escuela', None)


    def save(self, *args, **kwargs):
        # ✅ Validación segura
        if self.profesor_id and not self.escuela_id:
            self.escuela = getattr(self.profesor, 'escuela', None)

        # Registrar respuesta y administrador si aplica
        if self.pk and self.estado in [self.Estado.APROBADO, self.Estado.RECHAZADO]:
            if not self.fecha_respuesta:
                self.fecha_respuesta = timezone.now()
            if not self.administrador_id and hasattr(self, '_current_user'):
                self.administrador = self._current_user

        super().save(*args, **kwargs)


    @property
    def puede_aprobar(self):
        return self.estado == self.Estado.PENDIENTE

    @property
    def duracion_dias(self):
        return (self.fecha_fin - self.fecha_inicio).days + 1
