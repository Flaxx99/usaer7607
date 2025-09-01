# usaer_system/rae/models.py

from datetime import date
from django.db import models
from django.conf import settings
from escuelas.models import Escuela
from alumnos.models import Alumno
from usuarios.models import User # Asegúrate de que tu modelo User esté en usuarios.models

# Nuevo Modelo: CicloEscolar
class CicloEscolar(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Ciclo Escolar"
        verbose_name_plural = "Ciclos Escolares"

    def __str__(self):
        return self.nombre

    @classmethod
    def get_current_or_next_cycle(cls, current_date=None):
            if current_date is None:
                current_date = date.today()

            # Intenta encontrar un ciclo donde la fecha actual esté entre la fecha de inicio y fin.
            current_cycle = cls.objects.filter(
                fecha_inicio__lte=current_date,
                fecha_fin__gte=current_date
            ).order_by('-fecha_inicio').first() # Ordena por fecha para el caso de solapamientos (aunque no deberían haber con unique=True)

            if current_cycle:
                return current_cycle
            else:
                # Si no hay un ciclo activo, busca el próximo ciclo (que aún no ha comenzado)
                next_cycle = cls.objects.filter(
                    fecha_inicio__gt=current_date
                ).order_by('fecha_inicio').first()
                
                if next_cycle:
                    # Podrías decidir si quieres retornar el próximo ciclo aquí,
                    # o si prefieres que se lance una excepción para forzar al admin a activar/crear uno.
                    # Para la vista de captura, es mejor que se lance una excepción si no hay un ciclo activo.
                    raise cls.DoesNotExist(
                        f"No hay un Ciclo Escolar activo para la fecha actual ({current_date}). "
                        f"El próximo ciclo encontrado es: '{next_cycle.nombre}' (inicia: {next_cycle.fecha_inicio}). "
                        f"Por favor, asegúrate de que el ciclo escolar actual esté configurado correctamente."
                    )
                else:
                    raise cls.DoesNotExist(
                        f"No se encontró ningún Ciclo Escolar activo para la fecha actual ({current_date}), "
                        f"ni futuros ciclos. Por favor, crea el próximo ciclo escolar."
                    )

class RegistroRAE(models.Model):
    
    escuela = models.ForeignKey( # Cambiado a ForeignKey si puede haber múltiples registros por escuela en diferentes ciclos
        Escuela,
        on_delete=models.CASCADE,
        related_name='registros_rae', # Cambiado a plural
        verbose_name='Escuela'
    )
    ciclo_escolar = models.ForeignKey( # <--- CAMPO AÑADIDO
        CicloEscolar,
        on_delete=models.PROTECT,        
        related_name='registros_rae',
        verbose_name='Ciclo Escolar'
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL, # Usa settings.AUTH_USER_MODEL para referenciar tu modelo de usuario personalizado
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="Creado por"
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    docente_hombres = models.PositiveSmallIntegerField(default=0, verbose_name="Número de Docentes Hombres")
    docente_mujeres = models.PositiveSmallIntegerField(default=0, verbose_name="Número de Docentes Mujeres")


    class Meta:
        unique_together = ('escuela', 'ciclo_escolar') # <--- Asegura un único registro por escuela y ciclo
        verbose_name = "Registro RAE"
        verbose_name_plural = "Registros RAE"
        ordering = ['escuela__nombre', 'ciclo_escolar__nombre']

    def __str__(self):
        return f"RAE {self.escuela.nombre} - {self.ciclo_escolar.nombre}"


class RAEAlumno(models.Model):
    registro = models.ForeignKey(
        RegistroRAE,
        on_delete=models.CASCADE,
        related_name='detalles_alumnos', # Cambiado a plural
        verbose_name="Registro RAE"
    )
    alumno = models.ForeignKey( # CAMBIADO: De OneToOneField a ForeignKey
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
    curp = models.CharField("CURP", max_length=18, blank=True, null=True) # Añadido blank=True, null=True
    genero = models.CharField("Género", max_length=1, choices=Alumno.SEXO_CHOICES, blank=True, null=True) # Añadido blank=True, null=True
    edad = models.PositiveSmallIntegerField("Edad", blank=True, null=True) # Añadido blank=True, null=True
    grado = models.CharField("Grado-Grupo", max_length=10, blank=True, null=True) # Añadido blank=True, null=True

    # Condición del alumno
    ceg = models.BooleanField("Ceguera (CEG)", default=False)
    bv = models.BooleanField("Baja visión (BV)", default=False)
    so = models.BooleanField("Sordera (SO)", default=False)
    hp = models.BooleanField("Hipoacusia (HP)", default=False)
    scg = models.BooleanField("Sordoceguera (SCG)", default=False)
    dmo = models.BooleanField("Discapacidad motriz (DMO)", default=False)
    di = models.BooleanField("Discapacidad intelectual (DI)", default=False)
    dme = models.BooleanField("Psicosocial (DME)", default=False) # Se mantiene como lo tienes en el modelo
    psicosocial = models.BooleanField("Psicosocial", default=False) # Se mantiene como lo tienes en el modelo
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
        unique_together = ('registro', 'alumno') # AÑADIDO: Un alumno solo puede tener un RAE por registro

    def __str__(self):
        return f"{self.alumno.get_full_name()} en RAE {self.registro.escuela.nombre} ({self.registro.ciclo_escolar.nombre})"