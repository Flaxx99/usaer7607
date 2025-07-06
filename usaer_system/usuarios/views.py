# usuarios/views.py

from django.contrib import messages
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.views.generic import ListView, UpdateView, DeleteView, CreateView, DetailView
from django.utils.decorators import method_decorator

from .models import User
from .forms import UsuarioCreationForm, UsuarioChangeForm
from .decoradores import roles_permitidos
from django.contrib.auth.forms import PasswordChangeForm
from escuelas.models import Escuela
from django.conf import settings

from documentos.models import Expediente  # Ajusta al nombre de tu modelo de expediente si difiere

# -----------------------------
# Vistas basadas en clases para usuarios
# -----------------------------
@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR]), name='dispatch')
class UserListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = User
    template_name = 'usuarios/lista_usuarios.html'
    context_object_name = 'usuarios'
    permission_required = 'usuarios.view_user'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.GET.get('role')
        escuela = self.request.GET.get('escuela')
        activo = self.request.GET.get('activo')

        if role:
            qs = qs.filter(role=role)
        if escuela:
            qs = qs.filter(escuela__id=escuela)
        if activo:
            qs = qs.filter(activo=(activo == '1'))

        return qs.order_by('apellido_paterno', 'apellido_materno', 'nombre')

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['roles'] = User.Role.choices
        ctx['escuelas'] = Escuela.objects.all()
        return ctx


@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR]), name='dispatch')
class UserCreateView(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    model = User
    form_class = UsuarioCreationForm
    template_name = 'usuarios/formulario_usuario.html'
    permission_required = 'usuarios.add_user'
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
        return ctx


@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR]), name='dispatch')
class UserUpdateView(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):
    model = User
    form_class = UsuarioChangeForm
    template_name = 'usuarios/formulario_usuario.html'
    permission_required = 'usuarios.change_user'
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
        return ctx


@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR]), name='dispatch')
class UserDetailView(LoginRequiredMixin, PermissionRequiredMixin, DetailView):
    model = User
    template_name = 'usuarios/detalle_usuario.html'
    permission_required = 'usuarios.view_user'
    context_object_name = 'usuario'


@method_decorator(roles_permitidos([User.Role.ADMINISTRADOR]), name='dispatch')
class UserDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = User
    template_name = 'usuarios/confirmar_eliminar_usuario.html'
    permission_required = 'usuarios.delete_user'
    success_url = reverse_lazy('usuarios:list')

    def delete(self, request, *args, **kwargs):
        messages.success(request, _('Usuario eliminado exitosamente'))
        return super().delete(request, *args, **kwargs)


# -----------------------------
# Vistas de funciones para usuario individual y autenticación
# -----------------------------
@login_required
@roles_permitidos([User.Role.ADMINISTRADOR])
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
    form = UsuarioChangeForm(instance=user)
    if request.method == 'POST':
        form = UsuarioChangeForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            messages.success(request, _('Perfil actualizado exitosamente'))
            return redirect('usuarios:profile')
    return render(request, 'usuarios/perfil.html', {'form': form, 'usuario': user})


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
    return render(request, 'usuarios/cambiar_contrasena.html', {'form': form})


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
    user_role = request.user.role  # 'ADMIN', 'DIRECTOR', etc.
    allowed = settings.ROLE_PERMISSIONS.get(user_role, [])
    modules = []

    for m in settings.DASHBOARD_MODULES:
        if m['key'] not in allowed:
            continue

        mod = m.copy()
        url_name = mod.get('url_name')
        if not url_name:
            continue

        if mod.get('needs_pk'):
            try:
                exp = Expediente.objects.get(profesor=request.user)
                mod['url'] = reverse(url_name, args=[exp.pk])
            except Expediente.DoesNotExist:
                continue
        else:
            mod['url'] = reverse(url_name)

        modules.append(mod)

    return render(request, 'usuarios/dashboard.html', {
        'modules': modules,
        'role':     user_role,
    })
