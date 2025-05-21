from django.db import models

class Escuela(models.Model):
    nombre = models.CharField("Nombre", max_length=100, unique=True)
    clave = models.CharField("Clave de centro de trabajo", max_length=20, unique=True)
    direccion = models.TextField("Dirección")
    telefono = models.CharField("Teléfono", max_length=15)
    zona = models.CharField("Zona escolar", max_length=50)

    def __str__(self):
        return f"{self.nombre} ({self.clave})"
