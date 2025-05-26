# usuarios/models.py

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from escuelas.models import Escuela

class User(AbstractUser):
    ROLES = [
        ('Director',   'Director'),
        ('Profesor',   'Profesor'),
        ('Secretario', 'Secretario'),
    ]
    role = models.CharField("Rol", max_length=10, choices=ROLES)

    escuela = models.ForeignKey(
        Escuela,
        verbose_name="Escuela asignada",
        on_delete=models.SET_NULL,
        null=True, blank=True
    )

    # — Campos de perfil —
    nombre            = models.CharField("Nombre(s)",           max_length=50, blank=True)
    apellido_paterno  = models.CharField("Apellido paterno",    max_length=50, blank=True)
    apellido_materno  = models.CharField("Apellido materno",    max_length=50, blank=True)
    domicilio         = models.TextField("Domicilio particular", blank=True)
    telefono          = models.CharField("Teléfono particular", max_length=15, blank=True)
    celular           = models.CharField("Celular",             max_length=15, blank=True)
    correo            = models.EmailField("Correo electrónico",  blank=True)
    rfc               = models.CharField("R.F.C.",               max_length=13, blank=True)
    curp              = models.CharField("C.U.R.P.",             max_length=18, unique=True, blank=True)
    clave_presupuestal= models.CharField("Clave presupuestal",   max_length=30, blank=True)
    numero_empleado   = models.CharField("Número de empleado",   max_length=20, blank=True)
    numero_pensiones  = models.CharField("Número de pensiones",  max_length=20, blank=True)

    NIVEL_EDUCATIVO = [
        ('Primaria',   'Primaria'),
        ('Secundaria', 'Secundaria'),
    ]
    nivel     = models.CharField("Nivel educativo", max_length=20, choices=NIVEL_EDUCATIVO, blank=True)
    grado     = models.CharField("Grado(s) que atiende", max_length=30, blank=True)

    PUESTOS = [
        ('Maestro de Apoyo', 'Maestro de Apoyo'),
        ('Psicólogo',        'Psicólogo'),
        ('Psicomotricista',  'Psicomotricista'),
        ('Trabajador Social','Trabajador Social'),
    ]
    puesto    = models.CharField("Función", max_length=30, choices=PUESTOS, blank=True)

    SITUACION = [
        ('Base',     'Base'),
        ('Por Horas','Por Horas'),
    ]
    situacion = models.CharField("Situación", max_length=10, choices=SITUACION, blank=True)

    escolaridad   = models.CharField("Escolaridad", max_length=100, blank=True)
    fecha_ingreso = models.DateField("Fecha de ingreso", null=True, blank=True)
    activo        = models.BooleanField("¿Activo?", default=True)

    # — Sobrescribimos los M2M heredados de PermissionsMixin para evitar el choque —
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'Los grupos a los que pertenece este usuario.'
        ),
        related_name='usuarios_user_set',      # <-- aquí el nombre único
        related_query_name='user'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Permisos específicos para este usuario.'),
        related_name='usuarios_user_permissions_set',  # <-- y aquí también
        related_query_name='user'
    )

    def __str__(self):
        return self.get_full_name() or self.username
