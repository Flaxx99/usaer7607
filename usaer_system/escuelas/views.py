from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required

from .models import Escuela
from .forms import EscuelaForm

# Create your views here.

@staff_member_required
def listar_escuelas(request):
    """
    Muestra el listado de todas las escuelas.
    Solo accesible para usuarios con is_staff=True.
    """
    escuelas = Escuela.objects.all().order_by('nombre')
    return render(request, 'escuelas/listar.html', {
        'escuelas': escuelas
    })

@staff_member_required
def crear_escuela(request):
    """
    Formulario para crear una nueva escuela.
    Muestra un form GET y procesa POST guardando la instancia.
    """
    if request.method == 'POST':
        form = EscuelaForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Escuela creada correctamente.")
            return redirect('escuelas:listar_escuelas')
    else:
        form = EscuelaForm()

    return render(request, 'escuelas/form.html', {
        'form': form,
        'titulo': 'Crear escuela'
    })

@staff_member_required
def editar_escuela(request, pk):
    """
    Formulario para editar una escuela existente.
    Carga la instancia por PK y guarda cambios.
    """
    escuela = get_object_or_404(Escuela, pk=pk)
    if request.method == 'POST':
        form = EscuelaForm(request.POST, instance=escuela)
        if form.is_valid():
            form.save()
            messages.success(request, "Escuela actualizada correctamente.")
            return redirect('escuelas:listar_escuelas')
    else:
        form = EscuelaForm(instance=escuela)

    return render(request, 'escuelas/form.html', {
        'form': form,
        'titulo': 'Editar escuela'
    })

@staff_member_required
def eliminar_escuela(request, pk):
    """
    Confirmación y eliminación de una escuela.
    GET muestra confirmación, POST borra y redirige.
    """
    escuela = get_object_or_404(Escuela, pk=pk)
    if request.method == 'POST':
        escuela.delete()
        messages.success(request, "Escuela eliminada correctamente.")
        return redirect('escuelas:listar_escuelas')

    return render(request, 'escuelas/confirmar_eliminar.html', {
        'escuela': escuela
    })
