from django.db import models
from django.conf import settings
from escuelas.models import Escuela

class Permiso(models.Model):
    profesor = models.ForeignKey(settings.AUTH_USER_MODEL, limit_choices_to={'role': 'Profesor'}, on_delete=models.SET_NULL, null=True, verbose_name="Profesor")
    escuela = models.ForeignKey(Escuela, on_delete=models.CASCADE, verbose_name="Escuela")

    TIPO_PERMISO = [
        ('Personal', 'Personal'),
        ('Enfermedad', 'Enfermedad'),
        ('Comisión', 'Comisión'),
        ('Llegada Tarde', 'Llegada Tarde'),
        ('Salida Temprano', 'Salida Temprano'),
    ]
    tipo_permiso = models.CharField("Tipo de permiso", max_length=30, choices=TIPO_PERMISO)

    motivo = models.TextField("Motivo del permiso")

    ESTADO = [
        ('Pendiente', 'Pendiente'),
        ('Aprobado', 'Aprobado'),
        ('Rechazado', 'Rechazado'),
    ]
    estado = models.CharField("Estado", max_length=10, choices=ESTADO, default='Pendiente')
    comentario_admin = models.TextField("Comentario del administrador", blank=True, null=True)

    fecha_inicio = models.DateField("Fecha de inicio")
    fecha_fin = models.DateField("Fecha de fin")

    created_at = models.DateTimeField("Creado en", auto_now_add=True)
    updated_at = models.DateTimeField("Última modificación", auto_now=True)

    def __str__(self):
        return f"{self.profesor} - {self.tipo_permiso} ({self.fecha_inicio} a {self.fecha_fin})"
