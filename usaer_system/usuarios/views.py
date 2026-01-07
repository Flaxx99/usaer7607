from rest_framework import viewsets, status, views, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model, update_session_auth_hash
from django.db.models import Q
from django.utils import timezone
from django.shortcuts import get_object_or_404

# Modelos externos (para el dashboard)
from escuelas.models import Escuela
from alumnos.models import Alumno
from incidencias.models import Incidencia
from permisos.models import Permiso
from calendario.models import EventoCalendario
from oficios.models import Oficio
from avisos.models import Anuncio
from documentos.models import Expediente

from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer
from .permissions import IsAdminOrSecretario, IsAdminUserOnly

User = get_user_model()

class AuthViewSet(viewsets.ViewSet):
    """
    ViewSet especial para autenticación (Login / Logout).
    """
    permission_classes = [] # Pública

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generar o recuperar token
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'role': user.role,
            'email': user.email,
            'nombre_completo': user.get_full_name()
        })

class UserViewSet(viewsets.ModelViewSet):
    """
    Maneja el CRUD de usuarios.
    """
    queryset = User.objects.all().select_related('escuela')
    serializer_class = UserSerializer
    # Por defecto protegemos todo con Admin/Secretario
    permission_classes = [IsAdminOrSecretario]
    
    # Búsqueda y filtros
    filter_backends = [filters.SearchFilter]
    search_fields = ['numero_empleado', 'nombre', 'apellido_paterno', 'apellido_materno', 'email']

    def get_permissions(self):
        """
        Ajuste fino de permisos por acción.
        """
        if self.action == 'destroy':
            return [IsAdminUserOnly()]
        if self.action in ['me', 'change_password']:
            return [IsAuthenticated()] # Cualquier usuario logueado puede ver su perfil
        return super().get_permissions()

    def get_queryset(self):
        """
        Replica el filtrado por query parameters de tu vista original.
        """
        qs = super().get_queryset()
        role = self.request.query_params.get('role')
        escuela = self.request.query_params.get('escuela')
        activo = self.request.query_params.get('activo')

        if role:
            qs = qs.filter(role=role)
        if escuela:
            qs = qs.filter(escuela__id=escuela)
        if activo:
            # '1' o 'true' para activo, '0' o 'false' para inactivo
            is_active = activo.lower() in ['1', 'true']
            qs = qs.filter(activo=is_active)
            
        return qs.order_by('apellido_paterno', 'nombre')

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Retorna el perfil del usuario logueado actualmente."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activa o desactiva un usuario."""
        user = self.get_object()
        user.activo = not user.activo
        user.save()
        estado = "activado" if user.activo else "desactivado"
        return Response({'status': f'Usuario {estado} exitosamente', 'activo': user.activo})

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Cambio de contraseña para el usuario logueado."""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Contraseña incorrecta."]}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.data.get("new_password"))
            user.save()
            update_session_auth_hash(request, user)  # Mantiene la sesión activa si se usa session auth
            return Response({"status": "Contraseña actualizada correctamente."})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DashboardView(views.APIView):
    """
    Endpoint maestro que entrega toda la data para el dashboard.
    Replica exactamente la lógica de permisos y filtrado de usuarios/views.py.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'ultimos_avisos': [],
            'permisos_pendientes': 0,
            'ultimos_permisos': [],
            'incidencias_pendientes': 0,
            'ultimas_incidencias': [],
            'ultimos_eventos': [],
            'ultimos_expedientes': [],
            'ultimos_oficios': [],
            'stats': {}
        }

        # 1. Avisos
        if user.has_perm('avisos.view_anuncio'):
            ultimos_avisos = Anuncio.objects.filter(
                (Q(fecha_expiracion__gte=timezone.now()) | Q(fecha_expiracion__isnull=True)),
                fecha_publicacion__lte=timezone.now()
            ).select_related('autor').order_by('-fecha_publicacion')[:5]
            
            # Serializamos manualmente (o usa un serializer si lo tienes)
            data['ultimos_avisos'] = [{
                'id': a.id, 'titulo': a.titulo, 'contenido': a.contenido, 
                'autor': a.autor.get_full_name(), 'fecha': a.fecha_publicacion
            } for a in ultimos_avisos]

        # 2. Permisos
        if user.has_perm('permisos.view_permiso'):
            permisos_qs = Permiso.objects.all()
            if user.role != User.Role.ADMINISTRADOR.value:
                permisos_qs = permisos_qs.filter(profesor=user)
            
            data['permisos_pendientes'] = permisos_qs.filter(estado='PENDIENTE').count()
            # Simplificamos retorno
            data['ultimos_permisos'] = list(permisos_qs.values('id', 'motivo', 'estado', 'fecha_solicitud')[:5])

        # 3. Incidencias
        if user.has_perm('incidencias.view_incidencia'):
            incidencias_qs = Incidencia.objects.all()
            if user.role != User.Role.ADMINISTRADOR.value:
                incidencias_qs = incidencias_qs.filter(profesor=user)
            
            data['incidencias_pendientes'] = incidencias_qs.filter(estado='PENDIENTE').count()
            data['ultimas_incidencias'] = list(incidencias_qs.values('id', 'descripcion', 'estado', 'fecha_reporte')[:5])

        # 4. Calendario
        if user.has_perm('calendario.view_eventocalendario'):
            eventos_qs = EventoCalendario.objects.all()
            if user.role != User.Role.ADMINISTRADOR.value:
                eventos_qs = eventos_qs.filter(Q(tipo='INSTITUCIONAL') | Q(tipo='PERSONAL', creado_por=user))
            data['ultimos_eventos'] = list(eventos_qs.values('id', 'titulo', 'fecha_inicio', 'tipo')[:5])

        # 5. Expedientes
        if user.has_perm('documentos.view_expediente'):
            expedientes_qs = Expediente.objects.all()
            if user.role != User.Role.ADMINISTRADOR.value:
                expedientes_qs = expedientes_qs.filter(alumno__profesor=user)
            # Aquí idealmente usarías un serializer de Expediente, por ahora valores simples
            data['ultimos_expedientes'] = list(expedientes_qs.values('id', 'tipo_documento', 'fecha_subida')[:5])

        # 6. Oficios
        if user.has_perm('oficios.view_oficio'):
            oficios_qs = Oficio.objects.all()
            if user.role != User.Role.ADMINISTRADOR.value:
                oficios_qs = oficios_qs.filter(subido_por=user)
            data['ultimos_oficios'] = list(oficios_qs.values('id', 'asunto', 'fecha_subida')[:5])

        # 7. Estadísticas Admin
        if user.role == User.Role.ADMINISTRADOR.value:
            data['stats'] = {
                'total_alumnos': Alumno.objects.count(),
                'total_escuelas': Escuela.objects.count(),
                'total_usuarios': User.objects.count(),
            }

        return Response(data)