from datetime import date

from django.db import models


class CicloEscolar(models.Model):
    nombre = models.CharField(
        "Nombre del ciclo", max_length=100, unique=True, help_text="Ej. 2024-2025"
    )
    fecha_inicio = models.DateField("Fecha de inicio")
    fecha_fin = models.DateField("Fecha de fin")
    activo = models.BooleanField(
        "Ciclo activo",
        default=False,
        help_text="Marcar solo si este es el ciclo escolar actual. Solo un ciclo puede estar activo a la vez.",
    )

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if self.activo:
            # Asegurarse de que solo un ciclo esté activo
            CicloEscolar.objects.exclude(pk=self.pk).filter(activo=True).update(activo=False)
        super().save(*args, **kwargs)

    @classmethod
    def get_current_or_next_cycle(cls, current_date=None):
        if current_date is None:
            current_date = date.today()

        # Intenta encontrar un ciclo donde la fecha actual esté entre la fecha de inicio y fin.
        current_cycle = (
            cls.objects.filter(fecha_inicio__lte=current_date, fecha_fin__gte=current_date)
            .order_by("-fecha_inicio")
            .first()
        )

        if current_cycle:
            return current_cycle
        else:
            # Si no hay un ciclo activo, busca el próximo ciclo (que aún no ha comenzado)
            next_cycle = (
                cls.objects.filter(fecha_inicio__gt=current_date).order_by("fecha_inicio").first()
            )

            if next_cycle:
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

    class Meta:
        verbose_name = "Ciclo Escolar"
        verbose_name_plural = "Ciclos Escolares"
        ordering = ["-fecha_inicio"]
