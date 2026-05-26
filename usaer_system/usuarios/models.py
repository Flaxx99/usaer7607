from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from escuelas.models import Escuela
from .managers import CustomUserManager

class SystemConfiguration(models.Model):
    centro_nombre = models.CharField(_("Nombre del Centro (USAER)"), max_length=200, default="USAER 7607")
    centro_cct = models.CharField(_("CCT del Centro"), max_length=20, default="08FUA0093E")
    director_responsable = models.CharField(_("Nombre del Director Responsable"), max_length=200, default="Nubia Idaly Solis Mendias")
    sup_especial_cct = models.CharField(_("CCT Supervisión Especial"), max_length=20, default="08FUA0041G")
    sup_especial_zona = models.CharField(_("Zona Supervisión Especial"), max_length=10, default="22")
    ubicacion_centro = models.CharField(_("Ubicación del Centro (Ciudad)"), max_length=200, default="Juan Aldama, Chihuahua")

    class Meta:
        verbose_name = _('Configuración del Sistema')
        verbose_name_plural = _('Configuraciones del Sistema')

    def __str__(self):
        return f"Configuración de {self.centro_nombre}"

    def save(self, *args, **kwargs):
        if not self.pk and SystemConfiguration.objects.exists():
            return
        super().save(*args, **kwargs)

class User(AbstractUser):
    username = None  # ✅ Se elimina el campo username
    email = models.EmailField(
        _('Correo institucional'),
        unique=True,
        help_text=_("Correo institucional del usuario")
    )

    numero_empleado = models.CharField(
        _("Número de empleado"),
        max_length=20,
        blank=True,
        null=True,
        unique=True,
        help_text=_("Número único de empleado en el sistema")
    )

    objects = CustomUserManager()
    USERNAME_FIELD = 'email'  # ✅ Campo principal de login
    REQUIRED_FIELDS = ['numero_empleado']  # Campo requerido para superusuarios

    class Role(models.TextChoices):
        DIRECTOR = 'DIRECTOR', _('Director(a) de Escuela')
        MAESTRO_APOYO = 'MAESTRO_APOYO', _('Maestro(a) de Apoyo')
        TRABAJADOR_SOCIAL = 'TRAB_SOCIAL', _('Trabajador(a) Social')
        PSICOLOGO = 'PSICOLOGO', _('Psicólogo(a)')
        PSICOMOTRICIDAD = 'PSICOMOTRICIDAD', _('Maestro(a) de Psicomotricidad')
        COMUNICACION = 'COMUNICACION', _('Maestro(a) de Comunicación')
        TRABAJADOR_MANUAL = 'TRAB_MANUAL', _('Trabajador(a) Manual')
        SECRETARIO = 'SECRETARIO', _('Secretario(a)')
        ADMINISTRADOR = 'ADMIN', _('Administrador(a)')

    phone_regex = RegexValidator(
        regex=r'^\+?\d{10,15}$',
        message=_("El número debe tener entre 10 y 15 dígitos, puede comenzar con '+'.")
    )
    curp_regex = RegexValidator(
        regex=r'^[A-Z][AEIOU][A-Z]{2}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$',
        message=_("Formato de CURP inválido. Asegúrate de que tenga 18 caracteres y siga el formato oficial.")
    )
    rfc_regex = RegexValidator(
        regex=r'^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$',
        message=_("Formato de RFC inválido. Debe seguir el formato oficial (12 o 13 caracteres).")
    )

    role = models.CharField(
        _("Función"),
        max_length=30,
        choices=Role.choices,
        default=Role.MAESTRO_APOYO,
        db_index=True
    )

    escuela = models.ForeignKey(
        Escuela,
        verbose_name=_("Escuela asignada"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='personal'
    )

    nombre = models.CharField(_("Nombre(s)"), max_length=50, blank=True)
    apellido_paterno = models.CharField(_("Apellido paterno"), max_length=50, blank=True)
    apellido_materno = models.CharField(_("Apellido materno"), max_length=50, blank=True)

    domicilio = models.TextField(_("Domicilio particular"), blank=True)
    telefono = models.CharField(_("Teléfono particular"), max_length=15, validators=[phone_regex], blank=True)
    celular = models.CharField(_("Celular"), max_length=15, validators=[phone_regex], blank=True)
    correo = models.EmailField(_("Correo electrónico alterno"), blank=True)

    rfc = models.CharField(_("R.F.C."), max_length=13, validators=[rfc_regex], blank=True, null=True, unique=True)
    curp = models.CharField(_("C.U.R.P."), max_length=18, validators=[curp_regex], blank=True, null=True, unique=True)
    clave_presupuestal = models.CharField(_("Clave presupuestal"), max_length=30, blank=True)
    numero_pensiones = models.CharField(_("Número de pensiones"), max_length=20, blank=True)

    class NivelEducativo(models.TextChoices):
        PREESCOLAR = 'PRE', _('Preescolar')
        PRIMARIA = 'PRIM', _('Primaria')
        SECUNDARIA = 'SEC', _('Secundaria')
        FISICA = 'FIS', _('Educación Física')

    nivel = models.CharField(_("Escolaridad"), max_length=4, choices=NivelEducativo.choices, blank=True)
    grado = models.CharField(_("Grado(s) que atiende"), max_length=30, blank=True)

    class Situacion(models.TextChoices):
        BASE = 'BASE', _('Base')
        HORAS = 'HORAS', _('Por Horas')
        INTERINO = 'INTER', _('Interino')

    situacion = models.CharField(_("Situación laboral"), max_length=5, choices=Situacion.choices, blank=True)
    escolaridad = models.CharField(_("Escolaridad"), max_length=100, blank=True)
    fecha_ingreso = models.DateField(_("Fecha de ingreso"), null=True, blank=True)
    activo = models.BooleanField(_("¿Activo?"), default=True)

    groups = models.ManyToManyField(
        Group,
        verbose_name=_('Grupos'),
        blank=True,
        help_text=_('Los grupos a los que pertenece este usuario.'),
        related_name='usuarios_user_set',
        related_query_name='user'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('Permisos de usuario'),
        blank=True,
        help_text=_('Permisos específicos para este usuario.'),
        related_name='usuarios_user_permissions_set',
        related_query_name='user'
    )

    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        ordering = ['apellido_paterno', 'apellido_materno', 'nombre']
        constraints = [
            models.UniqueConstraint(
                fields=['numero_empleado'],
                name='unique_numero_empleado',
                condition=models.Q(numero_empleado__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['curp'],
                name='unique_curp',
                condition=models.Q(curp__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['rfc'],
                name='unique_rfc',
                condition=models.Q(rfc__isnull=False)
            ),
        ]
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['escuela']),
            models.Index(fields=['numero_empleado']),
        ]

    def __str__(self):
        return self.get_full_name() or self.email or self.numero_empleado or "Usuario"

# ... (keep User class)
    def get_full_name(self):
        parts = [self.apellido_paterno, self.apellido_materno]
        name = ', '.join(filter(None, parts))
        return f"{name}, {self.nombre}" if self.nombre else name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    @property
    def nombre_completo(self):
        return self.get_full_name()

    @property
    def antiguedad(self):
        if self.fecha_ingreso:
            from datetime import date
            today = date.today()
            return today.year - self.fecha_ingreso.year - (
                (today.month, today.day) < (self.fecha_ingreso.month, self.fecha_ingreso.day)
            )
        return None

class CalendarEvent(models.Model):
    class EventType(models.TextChoices):
        EVALUACION = 'EVALUACION', _('Evaluación Psicopedagógica')
        REUNION = 'REUNION', _('Reunión con Padres')
        VISITA = 'VISITA', _('Visita a Escuela')
        TAREA = 'TAREA', _('Tarea Administrativa')
        OTRO = 'OTRO', _('Otro')

    class EventStatus(models.TextChoices):
        PENDIENTE = 'PENDIENTE', _('Pendiente')
        COMPLETADO = 'COMPLETADO', _('Completado')
        CANCELADO = 'CANCELADO', _('Cancelado')

    class Priority(models.TextChoices):
        BAJA = 'BAJA', _('Baja')
        MEDIA = 'MEDIA', _('Media')
        ALTA = 'ALTA', _('Alta')

    title = models.CharField(_("Título"), max_length=200)
    description = models.TextField(_("Descripción"), blank=True)
    start_time = models.DateTimeField(_("Inicio"))
    end_time = models.DateTimeField(_("Fin"))
    event_type = models.CharField(_("Tipo de evento"), max_length=20, choices=EventType.choices, default=EventType.OTRO)
    status = models.CharField(_("Estado"), max_length=20, choices=EventStatus.choices, default=EventStatus.PENDIENTE)
    priority = models.CharField(_("Prioridad"), max_length=20, choices=Priority.choices, default=Priority.MEDIA)
    
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='events_created',
        verbose_name=_("Creado por")
    )
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='events_assigned',
        verbose_name=_("Asignado a")
    )
    
    alumno = models.ForeignKey(
        'alumnos.Alumno', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name=_("Alumno relacionado")
    )
    escuela = models.ForeignKey(
        'escuelas.Escuela', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name=_("Escuela relacionada")
    )
    
    color = models.CharField(_("Color del evento"), max_length=7, default='#3B82F6')

    class Meta:
        verbose_name = _('Evento/Tarea de Calendario')
        verbose_name_plural = _('Eventos/Tareas de Calendario')
        ordering = ['start_time']

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title} - {self.start_time.strftime('%d/%m/%Y %H:%M')}"

