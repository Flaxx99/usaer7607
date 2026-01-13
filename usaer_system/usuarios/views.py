# usuarios/views.py
from rest_framework import viewsets, status, views, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model, login, logout
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

User = get_user_model()

# --- VISTAS DE AUTENTICACIÓN ---

class LoginView(generics.GenericAPIView):
    """
    Vista estandarizada para Login. Devuelve Token + Datos de Usuario.
    """
    # 1. Permite acceso a cualquiera (Público)
    permission_classes = [AllowAny]
    
    # 2. CORRECCIÓN CRÍTICA: Desactiva la autenticación automática (Session/CSRF)
    # Esto evita el error 403 cuando React intenta entrar sin cookies.
    authentication_classes = [] 
    
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # 1. Login de sesión (Opcional: útil para que funcione el Admin de Django en el navegador)
        login(request, user)
        
        # 2. Generar Token (Vital para React)
        token, created = Token.objects.get_or_create(user=user)
        
        # 3. Serializar usuario para devolver info completa al Frontend
        user_data = UserSerializer(user, context=self.get_serializer_context()).data

        return Response({
            "detail": "Login exitoso",
            "token": token.key,
            "user": user_data
        })

class LogoutView(views.APIView):
    """
    Cierra sesión (elimina cookie) y opcionalmente borra el token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Borrar token si existe (Cierra sesión en React)
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        
        # Cerrar sesión django (Cierra sesión en Admin)
        logout(request)
        return Response({"detail": "Sesión cerrada correctamente."}, status=status.HTTP_200_OK)


# --- VIEWSET DE USUARIOS (CRUD + ACCIONES) ---

class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de usuarios con filtros personalizados.
    """
    queryset = User.objects.all().select_related('escuela')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated] 
    
    # Filtros nativos de DRF (Búsqueda textual)
    filter_backends = [filters.SearchFilter]
    search_fields = ['numero_empleado', 'nombre', 'apellido_paterno', 'apellido_materno', 'email']

    def get_queryset(self):
        """
        Lógica de filtrado personalizada (rol, escuela, activo) + seguridad de acceso.
        """
        qs = super().get_queryset()

        # Filtros por Query Params (?role=MAESTRO&activo=true)
        role = self.request.query_params.get('role')
        escuela = self.request.query_params.get('escuela')
        activo = self.request.query_params.get('activo')

        if role:
            qs = qs.filter(role=role)
        if escuela:
            qs = qs.filter(escuela__id=escuela)
        if activo:
            is_active = activo.lower() in ['1', 'true']
            qs = qs.filter(activo=is_active)
            
        return qs.order_by('apellido_paterno', 'nombre')

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Devuelve el perfil del usuario actual."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Acción extra: Activar/Desactivar usuario rápidamente."""
        user = self.get_object()
        # Evitar desactivarse a uno mismo por error
        if user == request.user:
            return Response({"error": "No puedes desactivar tu propia cuenta."}, status=400)
            
        user.activo = not user.activo
        user.save()
        estado = "activado" if user.activo else "desactivado"
        return Response({'status': f'Usuario {estado}', 'activo': user.activo})

    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, pk=None):
        """Cambio de contraseña administrativo o propio."""
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Validar password anterior si es necesario
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Contraseña incorrecta."]}, status=400)
            
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"status": "Contraseña actualizada"})
            
        return Response(serializer.errors, status=400)


# --- DASHBOARD ---

class DashboardView(views.APIView):
    """
    Endpoint maestro para el Dashboard.
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

        # 1. Avisos (Ejemplo mantenido)
        if user.has_perm('avisos.view_anuncio'):
            ultimos_avisos = Anuncio.objects.filter(
                (Q(fecha_expiracion__gte=timezone.now()) | Q(fecha_expiracion__isnull=True)),
                fecha_publicacion__lte=timezone.now()
            ).select_related('autor').order_by('-fecha_publicacion')[:5]
            
            data['ultimos_avisos'] = [{
                'id': a.id, 'titulo': a.titulo, 'contenido': a.contenido, 
                'autor': a.autor.get_full_name(), 'fecha': a.fecha_publicacion
            } for a in ultimos_avisos]

        # ... (Aquí va el resto de tu lógica del Dashboard original) ...
        # Se mantiene la estructura para que la rellenes con tus consultas específicas.
        
        # Ejemplo de estadísticas
        if user.role == User.Role.ADMINISTRADOR.value:
            data['stats'] = {
                'total_alumnos': Alumno.objects.count(),
                'total_escuelas': Escuela.objects.count(),
                'total_usuarios': User.objects.count(),
            }

        return Response(data)