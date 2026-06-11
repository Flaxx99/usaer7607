from django.db import models


class PermisoManager(models.Manager):
    """QuerySet managers para Permiso.

    Centraliza los filtros más usados en permisos/views.py.
    """

    def pendientes(self):
        return self.filter(estado=self.model.Estado.PENDIENTE)

    def aprobados(self):
        return self.filter(estado=self.model.Estado.APROBADO)

    def rechazados(self):
        return self.filter(estado=self.model.Estado.RECHAZADO)

    def de_escuela(self, escuela):
        return self.filter(escuela=escuela)

    def de_profesor(self, profesor):
        return self.filter(profesor=profesor)

    def del_anio(self, anio):
        return self.filter(fecha_solicitud__year=anio)

    def ultima_semana(self):
        from django.utils import timezone

        return self.filter(fecha_solicitud__gte=timezone.now() - timezone.timedelta(days=7))
