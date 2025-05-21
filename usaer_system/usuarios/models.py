from django.contrib.auth.models import User
from django.db import models
from escuelas.models import Escuela  # Importar modelo Escuela

class Profesor(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)

    # Identificación personal
    nombre = models.CharField("Nombre(s)", max_length=50)
    apellido_paterno = models.CharField("Apellido paterno", max_length=50)
    apellido_materno = models.CharField("Apellido materno", max_length=50)

    domicilio = models.TextField("Domicilio particular")
    telefono = models.CharField("Teléfono particular", max_length=15)
    celular = models.CharField("Celular", max_length=15, blank=True, null=True)
    correo = models.EmailField("Correo electrónico")

    rfc = models.CharField("R.F.C.", max_length=13)
    curp = models.CharField("C.U.R.P.", max_length=18, unique=True)
    clave_presupuestal = models.CharField("Clave presupuestal", max_length=30)
    numero_empleado = models.CharField("Número de empleado", max_length=20)
    numero_pensiones = models.CharField("Número de pensiones", max_length=20)

    # Asignación de escuelas
    escuelas = models.ManyToManyField(Escuela, verbose_name="Escuelas asignadas")

    # Nivel y grado(s) atendidos
    NIVEL_EDUCATIVO = [
        ('Primaria', 'Primaria'),
        ('Secundaria', 'Secundaria'),
    ]
    nivel = models.CharField("Nivel educativo", max_length=20, choices=NIVEL_EDUCATIVO)
    grado = models.CharField("Grado(s) que atiende", max_length=30, help_text="Ejemplo: 1°, 2° a 3°, Todos")

    # Función y situación laboral
    PUESTOS = [
        ('Maestra de Apoyo', 'Maestra de Apoyo'),
        ('Psicólogo', 'Psicólogo'),
        ('Psicomotricista', 'Psicomotricista'),
        ('Trabajador Social', 'Trabajador Social'),
    ]
    puesto = models.CharField("Función", max_length=30, choices=PUESTOS)

    SITUACION = [
        ('Base', 'Base'),
        ('Interino', 'Interino'),
    ]
    situacion = models.CharField("Situación", max_length=10, choices=SITUACION)

    escolaridad = models.CharField("Escolaridad", max_length=100)
    fecha_ingreso = models.DateField("Fecha de ingreso")

    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.apellido_paterno} {self.apellido_materno}, {self.nombre}"
