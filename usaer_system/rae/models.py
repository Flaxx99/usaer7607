# usaer_system/rae/models.py

from alumnos.models import Alumno
from ciclos_escolares.models import CicloEscolar
from django.conf import settings
from django.db import models
from escuelas.models import Escuela


class RegistroRAE(models.Model):
    escuela = models.ForeignKey(  # Cambiado a ForeignKey si puede haber múltiples registros por escuela en diferentes ciclos
        Escuela,
        on_delete=models.CASCADE,
        related_name="registros_rae",  # Cambiado a plural
        verbose_name="Escuela",
    )
    ciclo_escolar = models.ForeignKey(  # <--- CAMPO AÑADIDO
        CicloEscolar,
        on_delete=models.PROTECT,
        related_name="registros_rae",
        verbose_name="Ciclo Escolar",
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Usa settings.AUTH_USER_MODEL para referenciar tu modelo de usuario personalizado
        on_delete=models.SET_NULL,
        null=True,
        related_name="registros_rae_creados",
        verbose_name="Creado por",
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    docente_hombres = models.PositiveSmallIntegerField(
        default=0, verbose_name="Número de Docentes Hombres"
    )
    docente_mujeres = models.PositiveSmallIntegerField(
        default=0, verbose_name="Número de Docentes Mujeres"
    )

    class Meta:
        unique_together = (
            "escuela",
            "ciclo_escolar",
        )  # <--- Asegura un único registro por escuela y ciclo
        verbose_name = "Registro RAE"
        verbose_name_plural = "Registros RAE"
        ordering = ["escuela__nombre", "ciclo_escolar__nombre"]

    def __str__(self):
        return f"RAE {self.escuela.nombre} - {self.ciclo_escolar.nombre}"


class RAEAlumno(models.Model):
    registro = models.ForeignKey(
        RegistroRAE,
        on_delete=models.CASCADE,
        related_name="detalles_alumnos",  # Cambiado a plural
        verbose_name="Registro RAE",
    )
    alumno = models.ForeignKey(  # CAMBIADO: De OneToOneField a ForeignKey
        Alumno,
        on_delete=models.PROTECT,
        related_name="rae_detalles",
        verbose_name="Alumno atendido",
    )
    capturado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="rae_alumnos_capturados",
        verbose_name="Docente de apoyo",
    )

    # Datos básicos (estos se rellenan automáticamente al guardar)
    curp = models.CharField(
        "CURP", max_length=18, blank=True, null=True
    )  # Añadido blank=True, null=True
    genero = models.CharField(
        "Género", max_length=1, choices=Alumno.SEXO_CHOICES, blank=True, null=True
    )  # Añadido blank=True, null=True
    edad = models.PositiveSmallIntegerField(
        "Edad", blank=True, null=True
    )  # Añadido blank=True, null=True
    grado = models.CharField(
        "Grado-Grupo", max_length=10, blank=True, null=True
    )  # Añadido blank=True, null=True

    # Condición del alumno
    ceg = models.BooleanField("Ceguera (CEG)", default=False)
    bv = models.BooleanField("Baja visión (BV)", default=False)
    so = models.BooleanField("Sordera (SO)", default=False)
    hp = models.BooleanField("Hipoacusia (HP)", default=False)
    scg = models.BooleanField("Sordoceguera (SCG)", default=False)
    dmo = models.BooleanField("Discapacidad motriz (DMO)", default=False)
    di = models.BooleanField("Discapacidad intelectual (DI)", default=False)
    dme = models.BooleanField(
        "Psicosocial (DME)", default=False
    )  # Se mantiene como lo tienes en el modelo
    psicosocial = models.BooleanField(
        "Psicosocial", default=False
    )  # Se mantiene como lo tienes en el modelo
    dm = models.BooleanField("Discapacidad múltiple (DM)", default=False)

    dsc = models.BooleanField("DS Conducta (DSC)", default=False)
    dsco = models.BooleanField("DS Comunicación (DSCO)", default=False)
    dsa = models.BooleanField("DS Aprendizaje (DSA)", default=False)
    tda = models.BooleanField("TDA/TDAH", default=False)
    tea = models.BooleanField("TEA", default=False)

    asi = models.BooleanField("AS Intelectual (ASI)", default=False)
    asc = models.BooleanField("AS Creativa (ASC)", default=False)
    asa = models.BooleanField("AS Artística (ASA)", default=False)
    asp = models.BooleanField("AS Psicomotriz (ASP)", default=False)
    ass = models.BooleanField("AS Socioafectiva (ASS)", default=False)

    ot = models.BooleanField("Otra condición", default=False)

    # Apoyo específico
    psicologia = models.BooleanField("Psicología", default=False)
    comunicacion = models.BooleanField("Comunicación", default=False)
    psicomotricidad = models.BooleanField("Psicomotricidad", default=False)
    trabajo_social = models.BooleanField("Trabajo social", default=False)
    aprendizaje = models.BooleanField("Aprendizaje", default=False)
    nuevo_ingreso = models.BooleanField("Nuevo ingreso", default=False)
    subsecuente = models.BooleanField("Subsecuente", default=False)

    # Portafolio
    diagnostico = models.BooleanField("Diagnóstico médico/psicológico", default=False)
    educativo = models.BooleanField("Diagnóstico educativo", default=False)
    deteccion = models.BooleanField("Informe detección inicial", default=False)
    psicopedagogico = models.BooleanField("Evaluación psicopedagógica", default=False)
    plan = models.BooleanField("Plan de intervención", default=False)
    modelo = models.BooleanField("Modelo de enriquecimiento", default=False)

    class Meta:
        verbose_name = "Detalle RAE"
        verbose_name_plural = "Detalle RAE"
        ordering = ["grado", "alumno__apellido_paterno"]
        unique_together = (
            "registro",
            "alumno",
        )  # AÑADIDO: Un alumno solo puede tener un RAE por registro

    def __str__(self):
        return f"{self.alumno.get_full_name()} en RAE {self.registro.escuela.nombre} ({self.registro.ciclo_escolar.nombre})"
