from django.contrib import messages
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.views.generic import ListView, UpdateView, DeleteView, CreateView, DetailView
from .models import User
from .forms import UsuarioCreationForm, UsuarioChangeForm
from django.contrib.auth.forms import PasswordChangeForm
from escuelas.models import Escuela

class UserListView(LoginRequiredMixin, PermissionRequiredMixin, ListView):
    model = User
    template_name = 'usuarios/lista_usuarios.html'
    context_object_name = 'usuarios'
    permission_required = 'usuarios.view_user'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtros adicionales
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

class UserCreateView(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    model = User
    form_class = UsuarioCreationForm
    template_name = 'usuarios/formulario_usuario.html'
    permission_required = 'usuarios.add_user'
    success_url = reverse_lazy('usuarios:list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, _('Usuario creado exitosamente'))
        return response
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['titulo'] = _('Crear nuevo usuario')
        return context

class UserUpdateView(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):
    model = User
    form_class = UsuarioChangeForm
    template_name = 'usuarios/formulario_usuario.html'
    permission_required = 'usuarios.change_user'
    success_url = reverse_lazy('usuarios:list')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, _('Usuario actualizado exitosamente'))
        return response
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['titulo'] = _('Editar usuario')
        return context

class UserDetailView(LoginRequiredMixin, PermissionRequiredMixin, DetailView):
    model = User
    template_name = 'usuarios/detalle_usuario.html'
    permission_required = 'usuarios.view_user'
    context_object_name = 'usuario'

class UserDeleteView(LoginRequiredMixin, PermissionRequiredMixin, DeleteView):
    model = User
    template_name = 'usuarios/confirmar_eliminar_usuario.html'
    permission_required = 'usuarios.delete_user'
    success_url = reverse_lazy('usuarios:list')
    
    def delete(self, request, *args, **kwargs):
        messages.success(request, _('Usuario eliminado exitosamente'))
        return super().delete(request, *args, **kwargs)

@login_required
def toggle_user_active(request, pk):
    if not request.user.has_perm('usuarios.change_user'):
        return redirect('permission_denied')
    
    user = get_object_or_404(User, pk=pk)
    user.activo = not user.activo
    user.save()
    
    action = _('activado') if user.activo else _('desactivado')
    messages.success(request, _(f'Usuario {action} exitosamente'))
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