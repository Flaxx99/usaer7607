from django.db import models
from django.conf import settings
from escuelas.models import Escuela
from alumnos.models import Alumno


class RegistroRAE(models.Model):
    escuela = models.OneToOneField(
        Escuela,
        on_delete=models.CASCADE,
        related_name='registro_rae',
        verbose_name='Escuela'
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Creado por"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"RAE {self.escuela.nombre}"


class RAEAlumno(models.Model):
    registro = models.ForeignKey(
        RegistroRAE,
        on_delete=models.CASCADE,
        related_name='detalle',
        verbose_name="Registro RAE"
    )
    alumno = models.OneToOneField(
        Alumno,
        on_delete=models.PROTECT,
        verbose_name="Alumno atendido"
    )
    capturado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Docente de apoyo"
    )

    # Datos básicos (estos se rellenan automáticamente al guardar)
    curp = models.CharField("CURP", max_length=18)
    genero = models.CharField("Género", max_length=1, choices=Alumno.SEXO_CHOICES)
    edad = models.PositiveSmallIntegerField("Edad")
    grado = models.CharField("Grado-Grupo", max_length=10)

    # Condición del alumno
    ceg = models.BooleanField("Ceguera (CEG)", default=False)
    bv = models.BooleanField("Baja visión (BV)", default=False)
    so = models.BooleanField("Sordera (SO)", default=False)
    hp = models.BooleanField("Hipoacusia (HP)", default=False)
    scg = models.BooleanField("Sordoceguera (SCG)", default=False)
    dmo = models.BooleanField("Discapacidad motriz (DMO)", default=False)
    di = models.BooleanField("Discapacidad intelectual (DI)", default=False)
    dme = models.BooleanField("Psicosocial/mental (DME)", default=False)
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
        ordering = ['grado', 'alumno__apellido_paterno']

    def __str__(self):
        return f"{self.alumno} en RAE {self.registro_id}"
