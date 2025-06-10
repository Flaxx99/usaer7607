from django.contrib import messages
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.views.generic import ListView, UpdateView, DeleteView, CreateView, DetailView
from django.utils.decorators import method_decorator
from .models import User
from .forms import UsuarioCreationForm, UsuarioChangeForm
from .decoradores import roles_permitidos
from django.contrib.auth.forms import PasswordChangeForm
from escuelas.models import Escuela

@method_decorator(roles_permitidos(['ADMIN']), name='dispatch')
class UserListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = User
    template_name = 'usuarios/lista_usuarios.html'
    context_object_name = 'usuarios'
    permission_required = 'usuarios.view_user'
    paginate_by = 20

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.GET.get('role')
        escuela = self.request.GET.get('escuela')
        activo = self.request.GET.get('activo')

        if role:
            queryset = queryset.filter(role=role)
        if escuela:
            queryset = queryset.filter(escuela__id=escuela)
        if activo:
            queryset = queryset.filter(activo=(activo == '1'))

        return queryset.order_by('apellido_paterno', 'apellido_materno', 'nombre')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['roles'] = User.Role.choices
        context['escuelas'] = Escuela.objects.all()
        return context

@method_decorator(roles_permitidos(['ADMIN']), name='dispatch')
class UserCreateView(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    model = User
    form_class = UsuarioCreationForm
    template_name = 'usuarios/formulario_usuario.html'
    permission_required = 'usuarios.add_user'
    success_url = reverse_lazy('usuarios:list')

    def form_valid(self, form):
        try:
            response = super().form_valid(form)
            messages.success(self.request, _('Usuario creado exitosamente'))
            return response
        except Exception as e:
            form.add_error(None, _('Error al guardar el usuario: ') + str(e))
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['titulo'] = _('Crear nuevo usuario')
        return context

@method_decorator(roles_permitidos(['ADMIN']), name='dispatch')
class UserUpdateView(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):
    model = User
    form_class = UsuarioChangeForm
    template_name = 'usuarios/formulario_usuario.html'
    permission_required = 'usuarios.change_user'
    success_url = reverse_lazy('usuarios:list')

    def form_valid(self, form):
        try:
            self.object = form.save(commit=False)
            self.object.save(skip_auto_role=True)  # 👈 evitar sobrescritura automática
            form.save_m2m()
            messages.success(self.request, _('Usuario actualizado exitosamente'))
            return redirect(self.success_url)
        except Exception as e:
            form.add_error(None, _('Error al actualizar el usuario: ') + str(e))
            return self.form_invalid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['titulo'] = _('Editar usuario')
        return context


@method_decorator(roles_permitidos(['ADMIN']), name='dispatch')
class UserDetailView(LoginRequiredMixin, PermissionRequiredMixin, DetailView):
    model = User
    template_name = 'usuarios/detalle_usuario.html'
    permission_required = 'usuarios.view_user'
    context_object_name = 'usuario'

@method_decorator(roles_permitidos(['ADMIN']), name='dispatch')
class UserDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = User
    template_name = 'usuarios/confirmar_eliminar_usuario.html'
    permission_required = 'usuarios.delete_user'
    success_url = reverse_lazy('usuarios:list')

    def delete(self, request, *args, **kwargs):
        messages.success(request, _('Usuario eliminado exitosamente'))
        return super().delete(request, *args, **kwargs)

@login_required
@roles_permitidos(['ADMIN'])
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

    return render(request, 'usuarios/perfil.html', {
        'form': form,
        'usuario': user
    })

@login_required
def change_password(request):
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, _('Contraseña cambiada exitosamente'))
            return redirect('usuarios:profile')
    else:
        form = PasswordChangeForm(request.user)

    return render(request, 'usuarios/cambiar_contrasena.html', {
        'form': form
    })

@login_required
def redireccion_post_login(request):
    role = request.user.role
    if role == User.Role.ADMINISTRADOR:
        return redirect('usuarios:dashboard_admin')
    elif role == User.Role.DIRECTOR:
        return redirect('usuarios:dashboard_director')
    elif role == User.Role.SECRETARIO:
        return redirect('usuarios:dashboard_secretario')
    elif role == User.Role.DOCENTE:
        return redirect('usuarios:dashboard_docente')
    elif role == User.Role.MAESTRO_APOYO:
        return redirect('usuarios:panel_maestro_apoyo')
    elif role == User.Role.TRABAJADOR_SOCIAL:
        return redirect('usuarios:panel_trabajador_social')
    elif role == User.Role.PSICOLOGO:
        return redirect('usuarios:panel_psicologo')
    elif role == User.Role.PSICOMOTRICIDAD:
        return redirect('usuarios:panel_psicomotricidad')
    elif role == User.Role.COMUNICACION:
        return redirect('usuarios:panel_comunicacion')
    # Trabajador manual y otros roles sin panel propio van a perfil
    return redirect('usuarios:profile')


# Dashboard del DOCENTE
@login_required
@roles_permitidos(['DOCENTE'])
def dashboard_docente(request):
    return render(request, 'usuarios/dashboard_docente.html')

# Dashboard del SECRETARIO
@login_required
@roles_permitidos(['SECRETARIO'])
def dashboard_secretario(request):
    return render(request, 'usuarios/dashboard_secretario.html')

# Dashboard del DIRECTOR
@login_required
@roles_permitidos(['DIRECTOR'])
def dashboard_director(request):
    return render(request, 'usuarios/dashboard_director.html')

# Dashboard del ADMINISTRADOR
@login_required
@roles_permitidos(['ADMIN'])
def dashboard_admin(request):
    return render(request, 'usuarios/dashboard_admin.html')

@login_required
@roles_permitidos(['MAESTRO_APOYO'])
def dashboard_maestro_apoyo(request):
    return render(request, 'usuarios/dashboard_maestro_apoyo.html')

@login_required
@roles_permitidos(['TRABAJADOR_SOCIAL'])
def dashboard_trabajador_social(request):
    return render(request, 'usuarios/dashboard_trabajador_social.html')

@login_required
@roles_permitidos(['PSICOLOGO'])
def dashboard_psicologo(request):
    return render(request, 'usuarios/dashboard_psicologo.html')

@login_required
@roles_permitidos(['PSICOMOTRICIDAD'])
def dashboard_psicomotricidad(request):
    return render(request, 'usuarios/dashboard_psicomotricidad.html')

@login_required
@roles_permitidos(['COMUNICACION'])
def dashboard_comunicacion(request):
    return render(request, 'usuarios/dashboard_comunicacion.html')

