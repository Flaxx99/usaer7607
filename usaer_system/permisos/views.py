from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required


from .models import Permiso
from .forms import PermisoForm

@login_required
def crear_permiso(request):
    """
    Permite al profesor solicitar un permiso nuevo.
    """
    if request.method == 'POST':
        form = PermisoForm(request.POST)
        if form.is_valid():
            permiso = form.save(commit=False)
            permiso.profesor = request.user.profesor
            permiso.created_at = timezone.now()
            permiso.save()
            messages.success(request, "Tu solicitud de permiso ha sido enviada.")
            return redirect('permisos:listar_permisos')
    else:
        form = PermisoForm()
    return render(request, 'permisos/form.html', {
        'form': form,
        'titulo': 'Solicitar Permiso'
    })

@login_required
def listar_permisos(request):
    """
    Muestra al profesor sus propias solicitudes de permiso.
    """
    permisos = Permiso.objects.filter(profesor=request.user.profesor).order_by('-created_at')
    return render(request, 'permisos/listar.html', {
        'permisos': permisos
    })

@staff_member_required
def revisar_permisos(request):
    """
    Lista todos los permisos, con énfasis en los Pendientes.
    """
    permisos = Permiso.objects.all().order_by('estado', '-created_at')
    return render(request, 'permisos/revisar.html', {
        'permisos': permisos
    })

@staff_member_required
def editar_permiso(request, pk):
    """
    Permite al admin aprobar o rechazar un permiso, añadiendo un comentario.
    """
    permiso = get_object_or_404(Permiso, pk=pk)
    if request.method == 'POST':
        form = PermisoForm(request.POST, instance=permiso)
        if form.is_valid():
            permiso = form.save(commit=False)
            permiso.updated_at = timezone.now()
            permiso.save()
            messages.success(request, "Permiso actualizado correctamente.")
            return redirect('permisos:revisar_permisos')
    else:
        form = PermisoForm(instance=permiso)
    return render(request, 'permisos/form.html', {
        'form': form,
        'titulo': f'Editar Permiso ({permiso.estado})'
    })

@staff_member_required
def eliminar_permiso(request, pk):
    """
    Permite al admin eliminar cualquier permiso.
    """
    permiso = get_object_or_404(Permiso, pk=pk)
    if request.method == 'POST':
        permiso.delete()
        messages.success(request, "Permiso eliminado.")
        return redirect('permisos:revisar_permisos')
    return render(request, 'permisos/confirmar_eliminar.html', {
        'permiso': permiso
    })
