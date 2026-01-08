# ciclos_escolares/views.py
from rest_framework import viewsets, status, views, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from django.shortcuts import get_object_or_404

from .models import CicloEscolar
from alumnos.models import Alumno
from .serializers import CicloEscolarSerializer, PromocionPreviewSerializer

class IsAdminUser(permissions.BasePermission):
    """Solo administradores pueden tocar ciclos escolares."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'

class CicloEscolarViewSet(viewsets.ModelViewSet):
    queryset = CicloEscolar.objects.all().order_by('-fecha_inicio')
    serializer_class = CicloEscolarSerializer
    permission_classes = [IsAdminUser] # Solo admin gestiona esto

    @action(detail=False, methods=['get'])
    def activo(self, request):
        """Endpoint rápido para obtener el ciclo actual: /api/ciclos/activo/"""
        try:
            ciclo = CicloEscolar.objects.get(activo=True)
            serializer = self.get_serializer(ciclo)
            return Response(serializer.data)
        except CicloEscolar.DoesNotExist:
            return Response({"detail": "No hay ciclo activo configurado."}, status=404)


class PromocionAlumnosView(views.APIView):
    """
    Gestiona la promoción masiva.
    GET: Simulación (Preview).
    POST: Ejecución Real (Commit).
    """
    permission_classes = [IsAdminUser]

    def get_alumnos_data(self):
        """Helper para calcular lógica de promoción sin guardar."""
        alumnos_activos = Alumno.objects.filter(activo=True)
        resultado = {
            'promover': [],
            'graduar': [],
            'errores': []
        }

        for alumno in alumnos_activos:
            try:
                grado_actual = int(alumno.grado)
                if grado_actual >= 6:
                    resultado['graduar'].append(f"{alumno.nombre_completo} ({grado_actual}°)")
                else:
                    resultado['promover'].append(f"{alumno.nombre_completo} ({grado_actual}° -> {grado_actual + 1}°)")
            except (ValueError, TypeError):
                resultado['errores'].append(f"{alumno.nombre_completo}: Grado '{alumno.grado}' inválido")
        
        return resultado

    def get(self, request):
        """
        Simulación: Devuelve qué pasaría si ejecutas la promoción.
        """
        data = self.get_alumnos_data()
        
        response_data = {
            'total_activos': Alumno.objects.filter(activo=True).count(),
            'a_promover_count': len(data['promover']),
            'a_graduar_count': len(data['graduar']),
            'errores_count': len(data['errores']),
            # Enviamos detalles para que el frontend muestre listas si quiere
            'detalles_promover': data['promover'], 
            'detalles_graduar': data['graduar'],
            'detalles_errores': data['errores']
        }
        
        serializer = PromocionPreviewSerializer(response_data)
        return Response(serializer.data)

    def post(self, request):
        """
        Ejecución: Aplica los cambios en la BD de forma atómica.
        Requiere confirmar: { "confirmed": true }
        """
        if not request.data.get('confirmed'):
            return Response({"detail": "Se requiere confirmar la acción."}, status=400)

        with transaction.atomic():
            alumnos_activos = Alumno.objects.filter(activo=True)
            promovidos = 0
            graduados = 0
            
            for alumno in alumnos_activos:
                try:
                    grado_actual = int(alumno.grado)
                    if grado_actual >= 6:
                        alumno.activo = False
                        graduados += 1
                    else:
                        alumno.grado = str(grado_actual + 1)
                        alumno.grupo = '' # Limpiamos grupo al cambiar de grado
                        promovidos += 1
                    
                    alumno.save()
                except (ValueError, TypeError):
                    continue # Saltamos errores silenciosamente en el POST (ya se vieron en el GET)

            # Desactivar ciclo actual
            CicloEscolar.objects.filter(activo=True).update(activo=False)

            return Response({
                "status": "success",
                "detail": f"Proceso finalizado. {promovidos} promovidos, {graduados} graduados.",
                "promovidos": promovidos,
                "graduados": graduados
            })