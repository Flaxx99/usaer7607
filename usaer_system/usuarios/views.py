# usuarios/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test

from .forms import ProfesorCreationForm, ProfesorChangeForm

User = get_user_model()

def es_director(user):
    return user.is_authenticated and user.role == 'Director'


@login_required
@user_passes_test(es_director)
def listar_profesores(request):
<<<<<<< HEAD
=======
    """
    El Director ve todos los usuarios con role='Profesor'.
    """
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    profesores = User.objects.filter(role='Profesor', activo=True)
    return render(request, 'usuarios/listar_profesores.html', {
        'profesores': profesores
    })


@login_required
@user_passes_test(es_director)
def crear_profesor(request):
<<<<<<< HEAD
    if request.method == 'POST':
        form = ProfesorCreationForm(request.POST)
        if form.is_valid():
            form.save()
=======
    """
    El Director da de alta a un nuevo Profesor (incluye password).
    """
    if request.method == 'POST':
        form = ProfesorCreationForm(request.POST)
        if form.is_valid():
            form.save()  # El form ya fija role='Profesor' y encripta el password
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
            messages.success(request, "Profesor creado exitosamente.")
            return redirect('usuarios:listar_profesores')
    else:
        form = ProfesorCreationForm()

    return render(request, 'usuarios/form_profesor.html', {
        'form': form,
        'titulo': 'Nuevo Profesor'
    })


@login_required
@user_passes_test(es_director)
def editar_profesor(request, pk):
<<<<<<< HEAD
=======
    """
    El Director actualiza datos del Profesor (no password).
    """
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    profesor = get_object_or_404(User, pk=pk, role='Profesor')
    if request.method == 'POST':
        form = ProfesorChangeForm(request.POST, instance=profesor)
        if form.is_valid():
            form.save()
            messages.success(request, "Profesor actualizado correctamente.")
            return redirect('usuarios:listar_profesores')
    else:
        form = ProfesorChangeForm(instance=profesor)

    return render(request, 'usuarios/form_profesor.html', {
        'form': form,
        'titulo': 'Editar Profesor'
    })


@login_required
@user_passes_test(es_director)
def eliminar_profesor(request, pk):
<<<<<<< HEAD
=======
    """
    El Director elimina un Profesor.
    """
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    profesor = get_object_or_404(User, pk=pk, role='Profesor')
    if request.method == 'POST':
        profesor.delete()
        messages.success(request, "Profesor eliminado.")
        return redirect('usuarios:listar_profesores')
<<<<<<< HEAD
=======

>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    return render(request, 'usuarios/confirmar_eliminar_profesor.html', {
        'profesor': profesor
    })
