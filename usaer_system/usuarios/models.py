from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from escuelas.models import Escuela

class User(AbstractUser):
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

    # Validadores mejorados
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=_("El número debe estar en formato: '+999999999'. Hasta 15 dígitos.")
    )
    curp_regex = RegexValidator(
        regex=r'^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$',
        message=_("Formato de CURP inválido. Debe seguir el formato oficial.")
    )
    rfc_regex = RegexValidator(
        regex=r'^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2}[0-9A]$',
        message=_("Formato de RFC inválido. Debe seguir el formato oficial.")
    )

    # Campos principales
    role = models.CharField(
        _("Rol"),
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

    # Datos personales
    nombre = models.CharField(
        _("Nombre(s)"),
        max_length=50,
        blank=True,
        help_text=_("Nombre(s) del usuario")
    )
    apellido_paterno = models.CharField(
        _("Apellido paterno"),
        max_length=50,
        blank=True,
        help_text=_("Apellido paterno del usuario")
    )
    apellido_materno = models.CharField(
        _("Apellido materno"),
        max_length=50,
        blank=True,
        help_text=_("Apellido materno del usuario")
    )

    # Datos de contacto
    domicilio = models.TextField(
        _("Domicilio particular"),
        blank=True,
        help_text=_("Calle, número, colonia, código postal")
    )
    telefono = models.CharField(
        _("Teléfono particular"),
        max_length=15,
        validators=[phone_regex],
        blank=True,
        help_text=_("Teléfono fijo de contacto")
    )
    celular = models.CharField(
        _("Celular"),
        max_length=15,
        validators=[phone_regex],
        blank=True,
        help_text=_("Número de celular personal")
    )
    correo = models.EmailField(
        _("Correo electrónico alterno"),
        blank=True,
        help_text=_("Correo electrónico personal alternativo")
    )

    # Datos oficiales
    rfc = models.CharField(
        _("R.F.C."),
        max_length=13,
        validators=[rfc_regex],
        blank=True,
        null=True,
        unique=True,
        help_text=_("Registro Federal de Contribuyentes")
    )
    curp = models.CharField(
        _("C.U.R.P."),
        max_length=18,
        validators=[curp_regex],
        blank=True,
        null=True,
        unique=True,
        help_text=_("Clave Única de Registro de Población")
    )
    clave_presupuestal = models.CharField(
        _("Clave presupuestal"),
        max_length=30,
        blank=True,
        help_text=_("Clave presupuestal asignada por la SEP")
    )
    numero_empleado = models.CharField(
        _("Número de empleado"),
        max_length=20,
        blank=True,
        unique=True,
        help_text=_("Número único de empleado en el sistema")
    )
    numero_pensiones = models.CharField(
        _("Número de pensiones"),
        max_length=20,
        blank=True,
        help_text=_("Número de pensión o seguro social")
    )

    # Datos académicos
    class NivelEducativo(models.TextChoices):
        PRIMARIA = 'PRIM', _('Primaria')
        SECUNDARIA = 'SEC', _('Secundaria')
        FISICA = 'FIS', _('Educación Física')

    nivel = models.CharField(
        _("Nivel educativo"),
        max_length=4,
        choices=NivelEducativo.choices,
        blank=True,
        help_text=_("Nivel educativo donde labora")
    )
    grado = models.CharField(
        _("Grado(s) que atiende"),
        max_length=30,
        blank=True,
        help_text=_("Grados escolares que atiende (separados por comas)")
    )

    # Datos laborales
    class Puesto(models.TextChoices):
        DIRECTOR = 'DIRECTOR', _('Director(a) de Escuela')
        MAESTRO_APOYO = 'MAESTRO_APOYO', _('Maestro(a) de Apoyo')
        TRABAJADOR_SOCIAL = 'TRAB_SOCIAL', _('Trabajador(a) Social')
        PSICOLOGO = 'PSICOLOGO', _('Psicólogo(a)')
        PSICOMOTRICIDAD = 'PSICOMOTRICIDAD', _('Maestro(a) de Psicomotricidad')
        COMUNICACION = 'COMUNICACION', _('Maestro(a) de Comunicación')
        TRABAJADOR_MANUAL = 'TRAB_MANUAL', _('Trabajador(a) Manual')
        SECRETARIO = 'SECRETARIO', _('Secretario(a)')
        ADMINISTRADOR = 'ADMIN', _('Administrador(a)')


    puesto = models.CharField(
        _("Puesto"),
        max_length=20,
        choices=Puesto.choices,
        blank=True,
        help_text=_("Puesto que desempeña en la institución")
    )

    class Situacion(models.TextChoices):
        BASE = 'BASE', _('Base')
        HORAS = 'HORAS', _('Por Horas')
        INTERINO = 'INTER', _('Interino')


    situacion = models.CharField(
        _("Situación laboral"),
        max_length=5,
        choices=Situacion.choices,
        blank=True,
        help_text=_("Situación contractual del empleado")
    )
    escolaridad = models.CharField(
        _("Escolaridad"),
        max_length=100,
        blank=True,
        help_text=_("Grado máximo de estudios")
    )
    fecha_ingreso = models.DateField(
        _("Fecha de ingreso"),
        null=True,
        blank=True,
        help_text=_("Fecha de ingreso al servicio educativo")
    )
    activo = models.BooleanField(
        _("¿Activo?"),
        default=True,
        help_text=_("Indica si el usuario está activo en el sistema")
    )

    # Permisos y grupos
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
        return self.get_full_name() or self.username

    def get_full_name(self):
        parts = [self.apellido_paterno, self.apellido_materno]
        name = ', '.join(filter(None, parts))
        if self.nombre:
            name = f"{name}, {self.nombre}" if name else self.nombre
        return name

    def save(self, *args, **kwargs):
        # Si es superusuario, forzamos rol Administrador y guardamos inmediatamente
        if self.is_superuser:
            self.role = self.Role.ADMINISTRATIVO
            return super().save(*args, **kwargs)

        # Autoasignar rol Director si corresponde
        if self.escuela and hasattr(self.escuela, 'director') and self.escuela.director == self:
            self.role = self.Role.DIRECTOR

        # Validar nombre según rol
        if self.role in [self.Role.DIRECTOR]:
            if not self.nombre or not self.apellido_paterno:
                raise ValueError(_("Nombre y apellido paterno son obligatorios para este rol"))

        super().save(*args, **kwargs)

    @property
    def nombre_completo(self):
        return self.get_full_name()


    @property
    def antiguedad(self):
        if self.fecha_ingreso:
            from datetime import date
            today = date.today()
            delta = today.year - self.fecha_ingreso.year - ((today.month, today.day) < (self.fecha_ingreso.month, self.fecha_ingreso.day))
            return delta
        return None