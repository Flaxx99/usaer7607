from django.db import models


class IncidenciaManager(models.Manager):
    """QuerySet managers para Incidencia."""

    def pendientes(self):
        return self.filter(estado="PENDIENTE")

    def resueltas(self):
        return self.filter(estado="RESUELTA")

    def de_escuela(self, escuela):
        return self.filter(escuela=escuela)

    def de_profesor(self, profesor):
        return self.filter(profesor=profesor)

    def pendientes_de_escuela(self, escuela):
        return self.filter(escuela=escuela, estado="PENDIENTE")
