from django.db import models

class Escuela(models.Model):
    CLAVE_NIVELES = [
    ('Primaria', 'PRIMARIA'),
    ('Secundaria', 'SECUNDARIA'),
    ]   

    clave_estatal = models.CharField("Clave estatal", max_length=10, unique=True)
    clave_federal = models.CharField("Clave federal", max_length=20, unique=True)
    cct = models.CharField("Clave de Centro de Trabajo (CCT)", max_length=20, unique=True)
    nombre = models.CharField("Nombre de la escuela", max_length=200)
    nivel = models.CharField("Nivel educativo", max_length=20, choices=CLAVE_NIVELES)
    domicilio = models.CharField("Domicilio", max_length=200)
    colonia = models.CharField("Colonia", max_length=100)
    telefono = models.CharField("Teléfono de la escuela", max_length=20, blank=True, null=True)

    zona = models.CharField("Zona escolar", max_length=10)

    inspector = models.CharField("Nombre del inspector/a", max_length=100, blank=True)
    telefono_inspector = models.CharField("Teléfono del inspector", max_length=20, blank=True)
    correo_inspector = models.EmailField("Correo del inspector", blank=True)

    director = models.CharField("Nombre del director/a", max_length=100, blank=True)
    celular_director = models.CharField("Celular del director", max_length=20, blank=True)
    correo_director = models.EmailField("Correo del director", blank=True)

    def save(self, *args, **kwargs):
        if self.nivel:
            self.nivel = self.nivel.upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.clave_federal} – {self.nombre}"
