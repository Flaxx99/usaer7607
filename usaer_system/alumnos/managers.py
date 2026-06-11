from django.db import models


class AlumnoManager(models.Manager):
    """QuerySet managers para Alumno.

    Centraliza los filtros más repetidos en views y servicios.
    """

    def activos(self):
        """Alumnos activos (filtro más usado en el códigobase)."""
        return self.filter(activo=True)

    def de_profesor(self, profesor):
        """Alumnos asignados a un profesor específico."""
        return self.filter(profesor=profesor)

    def activos_de_profesor(self, profesor):
        """Atajo para el combo profesor + activo (RAE views)."""
        return self.filter(profesor=profesor, activo=True)

    def de_escuela(self, escuela):
        """Alumnos de una escuela específica."""
        return self.filter(escuela=escuela)

    def activos_de_escuela(self, escuela):
        """Alumnos activos de una escuela."""
        return self.filter(escuela=escuela, activo=True)

    def busqueda(self, termino):
        """Búsqueda por CURP o nombre (usado en ciclos_escolares views)."""
        return self.filter(
            models.Q(curp__icontains=termino)
            | models.Q(nombres__icontains=termino)
            | models.Q(apellido_paterno__icontains=termino)
            | models.Q(apellido_materno__icontains=termino)
        )
