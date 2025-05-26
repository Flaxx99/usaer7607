from django.contrib.auth.models import AbstractUser
from django.db import models
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
        null=True,
        blank=True
    )

    # Campos de perfil (antes en Profesor)
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
    nivel    = models.CharField("Nivel educativo",       max_length=20, choices=NIVEL_EDUCATIVO, blank=True)
    grado    = models.CharField("Grado(s) que atiende",  max_length=30, blank=True)

    PUESTOS = [
        ('Maestro/a de Apoyo',    'Maestro/a de Apoyo'),
        ('Psicólogo/a',           'Psicólogo/a'),
        ('Psicomotricidad',       'Psicomotricidad'),
        ('Trabajador/a Social',   'Trabajador/a Social'),
    ]
    puesto    = models.CharField("Función",    max_length=30, choices=PUESTOS, blank=True)

    SITUACION = [
        ('Base',      'Base'),
        ('Por Horas', 'Por Horas'),
    ]
    situacion = models.CharField("Situación",  max_length=10, choices=SITUACION, blank=True)

    escolaridad   = models.CharField("Escolaridad",   max_length=100, blank=True)
    fecha_ingreso = models.DateField("Fecha de ingreso", null=True, blank=True)

    activo        = models.BooleanField("¿Activo?", default=True)

    def __str__(self):
        return self.get_full_name() or self.username
