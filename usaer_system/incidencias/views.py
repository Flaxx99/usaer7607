from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError  # Imported ValidationError
from rest_framework.response import Response

from .models import Incidencia
from .permissions import IncidenciaPermission
from .serializers import IncidenciaSerializer

User = get_user_model()


class IncidenciaViewSet(viewsets.ModelViewSet):
    serializer_class = IncidenciaSerializer
    permission_classes = [IncidenciaPermission]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["titulo", "descripcion", "profesor__nombre", "profesor__apellido_paterno"]
    ordering_fields = ["fecha_reporte", "estado"]
    ordering = ["-fecha_reporte"]

    def get_queryset(self):
        """
        Strict filtering logic based on Roles and School.
        """
        user = self.request.user
        queryset = Incidencia.objects.select_related("escuela", "profesor", "reportado_por")

        # 1. ADMINISTRATOR (or Superuser): Sees EVERYTHING from ALL schools
        if user.is_superuser or user.role == User.Role.ADMINISTRADOR.value:
            return queryset

        # 2. DIRECTOR: Sees EVERYTHING, but ONLY from THEIR school
        if user.role == User.Role.DIRECTOR.value:
            if not user.escuela:
                return queryset.none()  # Security: Director without school sees nothing
            return queryset.filter(escuela=user.escuela)

        # 3. SECRETARY (If allowed to list): Only their school
        if user.role == User.Role.SECRETARIO.value:
            if not user.escuela:
                return queryset.none()
            return queryset.filter(escuela=user.escuela)

        # 4. SUPPORT TEACHER / OTHERS:
        # Only see what they reported OR where they are the involved party
        return queryset.filter(Q(reportado_por=user) | Q(profesor=user))

    def perform_create(self, serializer):
        """
        On create:
        1. Assigns 'reportado_por' to the current user.
        2. Calculates the 'escuela':
           - If User has a school -> Use User's school.
           - If Admin (no school) -> Use the selected Professor's school.
        """
        user = self.request.user
        save_kwargs = {"reportado_por": user}

        # Get the professor instance from the validated data to check their school
        involved_professor = serializer.validated_data.get("profesor")

        # Logic for School Assignment
        if user.escuela:
            # Case A: Director/Teacher creating -> Use THEIR school
            save_kwargs["escuela"] = user.escuela

        elif user.role == User.Role.ADMINISTRADOR.value or user.is_superuser:
            # Case B: Admin creating -> Use the PROFESSOR'S school
            if involved_professor and involved_professor.escuela:
                save_kwargs["escuela"] = involved_professor.escuela
            else:
                # If the professor has no school, we cannot link the incidence
                raise ValidationError(
                    {
                        "escuela": "The selected professor does not have an assigned school. Cannot create incidence."
                    }
                )

        else:
            # Case C: User without school and without permissions
            raise PermissionDenied("You do not have an assigned school to create incidences.")

        serializer.save(**save_kwargs)

    @action(detail=True, methods=["post"])
    def resolver(self, request, pk=None):
        """
        Resolves the incidence.
        get_object() already applied the school filter, so a Director
        cannot resolve incidences from another school by mistake.
        """
        incidencia = self.get_object()

        if incidencia.estado == "RESUELTA":
            return Response(
                {"detail": "This incidence is already resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        respuesta = request.data.get("respuesta_admin")
        if not respuesta:
            return Response(
                {"detail": "You must provide an administrative response."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        incidencia.estado = "RESUELTA"
        incidencia.respuesta_admin = respuesta.upper()
        incidencia.fecha_resolucion = timezone.now()
        incidencia.save()

        # Serialize to return updated response
        serializer = self.get_serializer(incidencia)
        return Response(serializer.data)
