from rest_framework import viewsets, status, views, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model, login, logout
from django.db.models import Q, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404

# --- MODELOS ---
from escuelas.models import Escuela
from alumnos.models import Alumno
from avisos.models import Anuncio
from ciclos_escolares.models import CicloEscolar
from permisos.models import Permiso 

# Apps pendientes (Incidencias, etc.)
try:
    from incidencias.models import Incidencia
    from calendario.models import EventoCalendario
    from oficios.models import Oficio
    from documentos.models import Expediente
except ImportError:
    pass

from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer

User = get_user_model()

# --- VISTAS DE AUTENTICACIÓN ---

class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    authentication_classes = [] 
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        login(request, user)
        token, created = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user, context=self.get_serializer_context()).data

        return Response({
            "detail": "Login exitoso",
            "token": token.key,
            "user": user_data
        })

class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        logout(request)
        return Response({"detail": "Sesión cerrada correctamente."}, status=status.HTTP_200_OK)


# --- VIEWSET DE USUARIOS (¡ESTO ES LO QUE FALTABA!) ---

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('escuela')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated] 
    
    filter_backends = [filters.SearchFilter]
    search_fields = ['numero_empleado', 'nombre', 'apellido_paterno', 'apellido_materno', 'email']

    def get_queryset(self):
        qs = super().get_queryset()

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
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({"error": "No puedes desactivar tu propia cuenta."}, status=400)
            
        user.activo = not user.activo
        user.save()
        estado = "activado" if user.activo else "desactivado"
        return Response({'status': f'Usuario {estado}', 'activo': user.activo})

    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
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
        
        # 1. Obtener Ciclo Activo
        ciclo_nombre = "Sin Ciclo Activo"
        try:
            ciclo_actual = CicloEscolar.objects.filter(activo=True).first()
            if ciclo_actual: ciclo_nombre = ciclo_actual.nombre
        except NameError: pass

        # Estructura base
        data = {
            'ciclo_actual': ciclo_nombre,
            'ultimos_avisos': [],
            'permisos_pendientes': 0,
            'incidencias_pendientes': 0,
            'stats': {},
            'grafica_clasificacion': [],
            'grafica_escuelas': []
        }

        # 2. LOGICA PERMISOS PENDIENTES
        try:
            qs_permisos = Permiso.objects.filter(estado='PENDIENTE')

            es_admin = user.role in ['ADMIN', 'ADMINISTRADOR'] or user.is_superuser
            es_director = user.role == 'DIRECTOR'

            if es_admin:
                pass
            elif es_director:
                if user.escuela:
                    qs_permisos = qs_permisos.filter(escuela=user.escuela)
            else:
                qs_permisos = qs_permisos.filter(profesor=user)

            data['permisos_pendientes'] = qs_permisos.count()

        except Exception as e:
            print(f"Error contando permisos: {e}")

        # 3. LOGICA AVISOS
        try:
            now = timezone.now()
            ultimos_avisos = Anuncio.objects.filter(
                (Q(fecha_expiracion__gte=now) | Q(fecha_expiracion__isnull=True)),
                fecha_publicacion__lte=now
            ).select_related('autor').order_by('-fecha_publicacion')[:5]
            
            data['ultimos_avisos'] = [{
                'id': a.id, 
                'titulo': a.titulo, 
                'contenido': a.contenido, 
                'autor': a.autor.get_full_name() if hasattr(a.autor, 'get_full_name') else str(a.autor), 
                'fecha': a.fecha_publicacion
            } for a in ultimos_avisos]
        except Exception as e:
            print(f"Error cargando avisos: {e}")

        # 4. ESTADÍSTICAS BÁSICAS
        try:
            data['stats'] = {
                'total_alumnos': Alumno.objects.filter(activo=True).count(),
                'total_escuelas': Escuela.objects.count(),
                'total_usuarios': User.objects.filter(activo=True).count(),
                'total_maestros': User.objects.filter(role='MAESTRO_APOYO', activo=True).count()
            }
        except Exception as e:
            data['stats'] = {'total_alumnos': 0, 'total_escuelas': 0, 'total_usuarios': 0}

        # 5. GRÁFICAS
        try:
            alumnos_por_clasif = Alumno.objects.filter(activo=True).values('clasificacion').annotate(total=Count('id'))
            data['grafica_clasificacion'] = list(alumnos_por_clasif)
            
            alumnos_por_escuela = Alumno.objects.filter(activo=True).values('escuela__nombre').annotate(total=Count('id')).order_by('-total')[:5]
            data['grafica_escuelas'] = list(alumnos_por_escuela)
        except Exception: pass

        return Response(data)