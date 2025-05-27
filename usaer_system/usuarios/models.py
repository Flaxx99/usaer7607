from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from escuelas.models import Escuela

class User(AbstractUser):
    class Role(models.TextChoices):
        DIRECTOR = 'DIRECTOR', _('Director')
        PROFESOR = 'PROFESOR', _('Profesor')
        SECRETARIO = 'SECRETARIO', _('Secretario')
        ADMINISTRATIVO = 'ADMIN', _('Personal Administrativo')

    # Validadores
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=_("El número debe estar en formato: '+999999999'. Hasta 15 dígitos.")
    )
    curp_regex = RegexValidator(
        regex=r'^[A-Z]{4}\d{6}[A-Z]{6}[A-Z\d]{2}$',
        message=_("Formato de CURP inválido")
    )
    rfc_regex = RegexValidator(
        regex=r'^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$',
        message=_("Formato de RFC inválido")
    )

    # Campos principales
    role = models.CharField(
        _("Rol"),
        max_length=10,
        choices=Role.choices,
        default=Role.PROFESOR
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
        blank=True
    )
    apellido_paterno = models.CharField(
        _("Apellido paterno"),
        max_length=50,
        blank=True
    )
    apellido_materno = models.CharField(
        _("Apellido materno"),
        max_length=50,
        blank=True
    )

    # Datos de contacto
    domicilio = models.TextField(
        _("Domicilio particular"),
        blank=True
    )
    telefono = models.CharField(
        _("Teléfono particular"),
        max_length=15,
        validators=[phone_regex],
        blank=True
    )
    celular = models.CharField(
        _("Celular"),
        max_length=15,
        validators=[phone_regex],
        blank=True
    )
    correo = models.EmailField(
        _("Correo electrónico alterno"),
        blank=True
    )

    # Datos oficiales
    rfc = models.CharField(
        _("R.F.C."),
        max_length=13,
        validators=[rfc_regex],
        blank=True,
        null=True,
        unique=True
    )
    curp = models.CharField(
        _("C.U.R.P."),
        max_length=18,
        validators=[curp_regex],
        blank=True,
        null=True,
        unique=True
    )
    clave_presupuestal = models.CharField(
        _("Clave presupuestal"),
        max_length=30,
        blank=True
    )
    numero_empleado = models.CharField(
        _("Número de empleado"),
        max_length=20,
        blank=True,
        unique=True
    )
    numero_pensiones = models.CharField(
        _("Número de pensiones"),
        max_length=20,
        blank=True
    )

    # Datos académicos
    class NivelEducativo(models.TextChoices):
        PRIMARIA = 'PRIM', _('Primaria')
        SECUNDARIA = 'SEC', _('Secundaria')
        PREESCOLAR = 'PRE', _('Preescolar')
        ESPECIAL = 'ESP', _('Educación Especial')

    nivel = models.CharField(
        _("Nivel educativo"),
        max_length=4,
        choices=NivelEducativo.choices,
        blank=True
    )
    grado = models.CharField(
        _("Grado(s) que atiende"),
        max_length=30,
        blank=True
    )

    # Datos laborales
    class Puesto(models.TextChoices):
        MAESTRO = 'MAESTRO', _('Maestro de Grupo')
        APOYO = 'APOYO', _('Maestro de Apoyo')
        PSICOLOGO = 'PSIC', _('Psicólogo')
        PSICOMOTRICISTA = 'PSICO', _('Psicomotricista')
        TRABAJADOR_SOCIAL = 'TRAB', _('Trabajador Social')
        DIRECTOR = 'DIR', _('Director')
        SUBDIRECTOR = 'SUBDIR', _('Subdirector')
        ADMINISTRATIVO = 'ADMIN', _('Personal Administrativo')

    puesto = models.CharField(
        _("Puesto"),
        max_length=10,
        choices=Puesto.choices,
        blank=True
    )

    class Situacion(models.TextChoices):
        BASE = 'BASE', _('Base')
        HORAS = 'HORAS', _('Por Horas')
        INTERINO = 'INTER', _('Interino')
        CONTRATO = 'CONT', _('Por Contrato')

    situacion = models.CharField(
        _("Situación laboral"),
        max_length=5,
        choices=Situacion.choices,
        blank=True
    )

    escolaridad = models.CharField(
        _("Escolaridad"),
        max_length=100,
        blank=True
    )
    fecha_ingreso = models.DateField(
        _("Fecha de ingreso"),
        null=True,
        blank=True
    )
    activo = models.BooleanField(
        _("¿Activo?"),
        default=True
    )

    # Configuración de permisos
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_('Los grupos a los que pertenece este usuario.'),
        related_name='usuarios_user_set',
        related_query_name='user'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
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
                condition=models.Q(numero_empleado__ne='')
            ),
            models.UniqueConstraint(
                fields=['curp'],
                name='unique_curp',
                condition=models.Q(curp__ne='')
            ),
            models.UniqueConstraint(
                fields=['rfc'],
                name='unique_rfc',
                condition=models.Q(rfc__ne='')
            )
        ]

    def __str__(self):
        return self.get_full_name() or self.username

    def get_full_name(self):
        """Devuelve el nombre completo del usuario"""
        return f"{self.apellido_paterno or ''} {self.apellido_materno or ''}, {self.nombre or ''}".strip()

    def save(self, *args, **kwargs):
        """Lógica personalizada al guardar"""
        # Autoasignar rol de director si es el director de la escuela
        if self.escuela and self.escuela.director == self:
            self.role = self.Role.DIRECTOR
        super().save(*args, **kwargs)

    @property
    def es_director(self):
        """Verifica si el usuario es director"""
        return self.role == self.Role.DIRECTOR

    @property
    def es_profesor(self):
        """Verifica si el usuario es profesor"""
        return self.role == self.Role.PROFESOR