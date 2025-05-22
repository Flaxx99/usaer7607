from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required

from .models import Profesor
from .forms import ProfesorForm

@staff_member_required
def listar_profesores(request):
    """
    Lista todos los profesores ordenados por apellido.
    """
    profesores = Profesor.objects.all().order_by('apellido_paterno', 'apellido_materno')
    return render(request, 'usuarios/listar.html', {
        'profesores': profesores
    })

@staff_member_required
def crear_profesor(request):
    """
    Crea un nuevo profesor. Muestra el form en GET y lo procesa en POST.
    """
    if request.method == 'POST':
        form = ProfesorForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Profesor creado correctamente.")
            return redirect('usuarios:listar_profesores')
    else:
        form = ProfesorForm()

    return render(request, 'usuarios/form.html', {
        'form': form,
        'titulo': 'Crear Profesor'
    })

@staff_member_required
def editar_profesor(request, pk):
    """
    Edita un profesor existente identificado por su PK.
    """
    profesor = get_object_or_404(Profesor, pk=pk)
    if request.method == 'POST':
        form = ProfesorForm(request.POST, instance=profesor)
        if form.is_valid():
            form.save()
            messages.success(request, "Profesor actualizado correctamente.")
            return redirect('usuarios:listar_profesores')
    else:
        form = ProfesorForm(instance=profesor)

    return render(request, 'usuarios/form.html', {
        'form': form,
        'titulo': 'Editar Profesor'
    })

@staff_member_required
def eliminar_profesor(request, pk):
    """
    Confirma y elimina un profesor.
    """
    profesor = get_object_or_404(Profesor, pk=pk)
    if request.method == 'POST':
        profesor.delete()
        messages.success(request, "Profesor eliminado correctamente.")
        return redirect('usuarios:listar_profesores')

    return render(request, 'usuarios/confirmar_eliminar.html', {
        'profesor': profesor
    })

@staff_member_required
def detalle_profesor(request, pk):
    """
    Muestra los detalles de un profesor.
    """
    profesor = get_object_or_404(Profesor, pk=pk)
    return render(request, 'usuarios/detalle.html', {
        'profesor': profesor
    })
