# escuelas/models.py
from django.db import models

class Escuela(models.Model):
    CLAVE_NIVELES = [
        ('Primaria',   'Primaria'),
        ('Secundaria', 'Secundaria'),
    ]

    clave_estatal = models.CharField("Clave estatal", max_length=10, unique=True)
    clave_federal = models.CharField("Clave federal", max_length=20, unique=True)
    nombre = models.CharField("Nombre", max_length=200)
    nivel = models.CharField("Nivel educativo", max_length=20, choices=CLAVE_NIVELES)
    domicilio = models.CharField("Domicilio", max_length=200)
    colonia = models.CharField("Colonia", max_length=100)
    telefono_escuela = models.CharField("Teléfono escuela", max_length=20)
    zona = models.CharField("Zona", max_length=10)

    # Datos del Director
    director = models.CharField("Director/a", max_length=100, blank=True)
    cel_director = models.CharField("Cel. Director/a", max_length=20, blank=True)
    correo_director = models.EmailField("Correo Director/a", blank=True)

    # Datos del Inspector
    inspector = models.CharField("Inspector/a", max_length=100, blank=True)
    tel_inspector = models.CharField("Tel. Inspector/a", max_length=20, blank=True)
    correo_inspector = models.EmailField("Correo Inspector/a", blank=True)

    # Información adicional
    situacion = models.CharField("Situación", max_length=50, blank=True)

    def __str__(self):
        return f"{self.clave_federal} – {self.nombre}"
