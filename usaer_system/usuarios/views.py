from django.contrib.auth.views import LoginView
from django.contrib.auth import login, update_session_auth_hash
from django.contrib import messages
from asistencias.forms import AsistenciaCheckForm

class CustomLoginView(LoginView):
    template_name = 'registration/login.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['asistencia_form'] = AsistenciaCheckForm()
        return context

    def form_valid(self, form):
        # Obtener el nombre de usuario o email para el mensaje
        user_identifier = form.cleaned_data.get('username')
        
        # Llamar al método original para que se complete el login
        response = super().form_valid(form)
        
        # Añadir mensaje de éxito
        messages.success(self.request, f"Bienvenido, {user_identifier}. Has iniciado sesión correctamente.")
        
        return response

# usuarios/views.py
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.views.generic import ListView, UpdateView, DeleteView, CreateView, DetailView
from django.utils.decorators import method_decorator

from .models import User
from .forms import UsuarioCreationForm, UsuarioChangeForm, UserProfileForm
from .decoradores import roles_permitidos
from django.contrib.auth.forms import PasswordChangeForm
from escuelas.models import Escuela
from alumnos.models import Alumno
from incidencias.models import Incidencia
from django.conf import settings
from permisos.models import Permiso
from escuelas.models import Escuela
from calendario.models import EventoCalendario
from oficios.models import Oficio
from avisos.models import Anuncio
from django.db.models import Q
from django.utils import timezone

from documentos.models import Expediente  # Ajusta al nombre de tu modelo de expediente si difiere

# -----------------------------
# Vistas basadas en clases para usuarios
# -----------------------------
@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]), name='dispatch')
class UserListView(LoginRequiredMixin, ListView):
    model = User
    template_name = 'usuarios/lista_usuarios.html'
    context_object_name = 'usuarios'
    
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.GET.get('role')
        escuela = self.request.GET.get('escuela')
        activo = self.request.GET.get('activo')
        query = self.request.GET.get('q')

        if role:
            qs = qs.filter(role=role)
        if escuela:
            qs = qs.filter(escuela__id=escuela)
        if activo:
            qs = qs.filter(activo=(activo == '1'))
        if query:
            qs = qs.filter(
                Q(numero_empleado__icontains=query) |
                Q(nombre__icontains=query) |
                Q(apellido_paterno__icontains=query) |
                Q(apellido_materno__icontains=query) |
                Q(email__icontains=query)
            )

        return qs.select_related('escuela').order_by('apellido_paterno', 'apellido_materno', 'nombre')

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['roles'] = User.Role.choices
        ctx['escuelas'] = Escuela.objects.all()
        ctx['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ]
        ctx['current_page_title'] = 'Gestión de Usuarios'
        return ctx


@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]), name='dispatch')
class UserCreateView(LoginRequiredMixin, CreateView):
    model = User
    form_class = UsuarioCreationForm
    template_name = 'usuarios/formulario_usuario.html'
    success_url = reverse_lazy('usuarios:list')

    def form_valid(self, form):
        try:
            resp = super().form_valid(form)
            messages.success(self.request, _('Usuario creado exitosamente'))
            return resp
        except Exception as e:
            form.add_error(None, _('Error al guardar el usuario: ') + str(e))
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['titulo'] = _('Crear nuevo usuario')
        ctx['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Usuarios', 'url': reverse_lazy('usuarios:list')}
        ]
        ctx['current_page_title'] = _('Crear nuevo usuario')
        return ctx


@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]), name='dispatch')
class UserUpdateView(LoginRequiredMixin, UpdateView):
    model = User
    form_class = UsuarioChangeForm
    template_name = 'usuarios/formulario_usuario.html'
    success_url = reverse_lazy('usuarios:list')

    def form_valid(self, form):
        try:
            self.object = form.save(commit=False)
            self.object.save(skip_auto_role=True)
            form.save_m2m()
            messages.success(self.request, _('Usuario actualizado exitosamente'))
            return redirect(self.success_url)
        except Exception as e:
            form.add_error(None, _('Error al actualizar el usuario: ') + str(e))
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['titulo'] = _('Editar usuario')
        ctx['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Usuarios', 'url': reverse_lazy('usuarios:list')},
            {'name': f'Detalle de {self.object.get_full_name()}', 'url': reverse_lazy('usuarios:detail', kwargs={'pk': self.object.pk})}
        ]
        ctx['current_page_title'] = _('Editar usuario')
        return ctx


class UserDetailView(LoginRequiredMixin, DetailView):
    model = User
    template_name = 'usuarios/detalle_usuario.html'
    
    context_object_name = 'usuario'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Usuarios', 'url': reverse_lazy('usuarios:list')}
        ]
        context['current_page_title'] = f'Detalle de {self.object.get_full_name()}'
        return context


class UserDeleteView(LoginRequiredMixin, DeleteView):
    model = User
    success_url = reverse_lazy('usuarios:list')

    def post(self, request, *args, **kwargs):
        return self.delete(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        messages.success(request, _('Usuario eliminado exitosamente'))
        return super().delete(request, *args, **kwargs)


# -----------------------------
# Vistas de funciones para usuario individual y autenticación
# -----------------------------
def toggle_user_active(request, pk):
    user = get_object_or_404(User, pk=pk)
    user.activo = not user.activo
    user.save()
    action = _('activado') if user.activo else _('desactivado')
    messages.success(request, _('Usuario %(action)s exitosamente') % {'action': action})
    return redirect('usuarios:list')


@login_required
def profile(request):
    user = request.user
    
    # Determinar qué formulario usar
    if request.user.role in [User.Role.ADMINISTRADOR.value, User.Role.SECRETARIO.value]:
        FormClass = UsuarioChangeForm
    else:
        FormClass = UserProfileForm

    if request.method == 'POST':
        form = FormClass(request.POST, instance=user)
        if form.is_valid():
            form.save()
            messages.success(request, _('Perfil actualizado exitosamente'))
            return redirect('usuarios:profile')
    else:
        form = FormClass(instance=user)
        
    return render(request, 'usuarios/perfil.html', {
        'form': form,
        'usuario': user,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ],
        'current_page_title': 'Mi Perfil'
    })


@login_required
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            usr = form.save()
            update_session_auth_hash(request, usr)
            messages.success(request, _('Contraseña cambiada exitosamente'))
            return redirect('usuarios:profile')
    else:
        form = PasswordChangeForm(request.user)
    return render(request, 'usuarios/cambiar_contrasena.html', {
        'form': form,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Mi Perfil', 'url': reverse_lazy('usuarios:profile')}
        ],
        'current_page_title': 'Cambiar Contraseña'
    })


# -----------------------------
# Redirección post-login según rol
# -----------------------------
@login_required
def redireccion_post_login(request):
    return redirect('usuarios:dashboard')

# -----------------------------
# Dashboard genérico con módulos dinámicos
# -----------------------------
@login_required
def dashboard(request):
    user = request.user

    # Definir queryset base para permisos según el rol del usuario
    permisos_base_qs = Permiso.objects.all()
    eventos_base_qs = EventoCalendario.objects.all()
    incidencias_base_qs = Incidencia.objects.all()
    expedientes_base_qs = Expediente.objects.all()
    oficios_base_qs = Oficio.objects.all()

    # Filtrar datos para roles que no son administradores
    if user.role != User.Role.ADMINISTRADOR.value:
        permisos_base_qs = permisos_base_qs.filter(profesor=user)
        eventos_base_qs = eventos_base_qs.filter(Q(tipo='INSTITUCIONAL') | Q(tipo='PERSONAL', creado_por=user))
        incidencias_base_qs = incidencias_base_qs.filter(profesor=user)
        expedientes_base_qs = expedientes_base_qs.filter(alumno__profesor=user)
        oficios_base_qs = oficios_base_qs.filter(subido_por=user)

    # --- Consultas Optimizadas ---
    ultimos_permisos = permisos_base_qs.select_related('profesor').order_by('-fecha_solicitud')[:5]
    ultimas_incidencias = incidencias_base_qs.select_related('profesor').order_by('-fecha_reporte')[:5]
    ultimos_expedientes = expedientes_base_qs.select_related('alumno').order_by('-fecha_subida')[:5]
    ultimos_avisos = Anuncio.objects.filter(
        (Q(fecha_expiracion__gte=timezone.now()) | Q(fecha_expiracion__isnull=True)),
        fecha_publicacion__lte=timezone.now()
    ).select_related('autor').order_by('-fecha_publicacion')[:5]
    
    context = {
        'permisos_pendientes': permisos_base_qs.filter(estado='PENDIENTE').count(),
        'incidencias_pendientes': incidencias_base_qs.filter(estado='PENDIENTE').count(),
        'ultimos_eventos': eventos_base_qs.order_by('-fecha_inicio')[:5],
        'ultimos_permisos': ultimos_permisos,
        'ultimas_incidencias': ultimas_incidencias,
        'ultimos_expedientes': ultimos_expedientes,
        'ultimos_oficios': oficios_base_qs.order_by('-fecha_subida')[:5],
        'ultimos_avisos': ultimos_avisos,
        'breadcrumbs': [],
        'current_page_title': 'Dashboard',
        'is_admin_dashboard': False
    }

    # El dashboard de administrador muestra estadísticas globales
    if user.role == User.Role.ADMINISTRADOR.value:
        context['is_admin_dashboard'] = True # Esta bandera puede usarse en la plantilla para mostrar/ocultar secciones
        context.update({
            'total_alumnos': Alumno.objects.count(),
            'total_escuelas': Escuela.objects.count(),
            'total_usuarios': User.objects.count(),
        })

    return render(request, 'usuarios/dashboard.html', context)

# -----------------------------
# Vista de redirección para el checador
# -----------------------------
def checador_redirect(request):
    if request.user.is_authenticated:
        return redirect('usuarios:dashboard')
    return redirect('asistencias:mostrar_checador')