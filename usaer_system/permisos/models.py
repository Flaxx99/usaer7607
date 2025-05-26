from django.db import models
from django.conf import settings
from escuelas.models import Escuela

class Permiso(models.Model):
<<<<<<< HEAD
    profesor = models.ForeignKey(settings.AUTH_USER_MODEL, limit_choices_to={'role': 'Profesor'}, on_delete=models.SET_NULL, null=True, verbose_name="Profesor")
    escuela = models.ForeignKey(Escuela, on_delete=models.CASCADE, verbose_name="Escuela")

=======
    profesor       = models.ForeignKey(
                        settings.AUTH_USER_MODEL,
                        limit_choices_to={'role':'Profesor'},
                        on_delete=models.CASCADE
                     )
    escuela        = models.ForeignKey(
                        Escuela,
                        on_delete=models.CASCADE
                     )
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    TIPO_PERMISO = [
        ('Personal', 'Personal'),
        ('Enfermedad', 'Enfermedad'),
        ('Comisión', 'Comisión'),
        ('Llegada Tarde', 'Llegada Tarde'),
        ('Salida Temprano', 'Salida Temprano'),
    ]
    tipo_permiso   = models.CharField("Tipo de permiso", max_length=30, choices=TIPO_PERMISO)
    motivo         = models.TextField("Motivo")
    ESTADO = [
        ('Pendiente', 'Pendiente'),
        ('Aprobado',  'Aprobado'),
        ('Rechazado', 'Rechazado'),
    ]
    estado         = models.CharField("Estado", max_length=10, choices=ESTADO, default='Pendiente')
    comentario_admin = models.TextField("Comentario admin", blank=True, null=True)
    fecha_inicio   = models.DateField("Fecha inicio")
    fecha_fin      = models.DateField("Fecha fin")
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.profesor} → {self.tipo_permiso} ({self.estado})"
