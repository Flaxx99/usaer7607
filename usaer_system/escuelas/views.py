from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Q

from .models import Escuela
from .forms import EscuelaForm

# Create your views here.

from django.urls import reverse_lazy
@staff_member_required
def listar_escuelas(request):
    """
    Muestra el listado de todas las escuelas.
    Solo accesible para usuarios con is_staff=True.
    """
    escuelas = Escuela.objects.all().order_by('nombre')
    query = request.GET.get("q", "").strip()

    if query:
        escuelas = escuelas.filter(
            Q(nombre__icontains=query) |
            Q(cct__icontains=query) |
            Q(clave_estatal__icontains=query)
        )

    return render(request, 'escuelas/listar.html', {
        'escuelas': escuelas,
        'query': query,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ],
        'current_page_title': 'Gestión de Escuelas'
    })

from django.urls import reverse_lazy
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
        'titulo': 'Crear escuela',
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Escuelas', 'url': reverse_lazy('escuelas:listar_escuelas')}
        ],
        'current_page_title': 'Crear Escuela'
    })

from django.urls import reverse_lazy
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
        'titulo': 'Editar escuela',
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Escuelas', 'url': reverse_lazy('escuelas:listar_escuelas')}
        ],
        'current_page_title': f'Editar {escuela.nombre}'
    })

@staff_member_required
def eliminar_escuela(request, pk):
    """
    Elimina una escuela directamente desde la lista.
    """
    escuela = get_object_or_404(Escuela, pk=pk)
    if request.method == 'POST':
        try:
            escuela.delete()
            messages.success(request, f"Escuela ‘{escuela.nombre}’ eliminada correctamente.")
        except Exception as e:
            messages.error(request, f"Error al eliminar la escuela: {e}")
    return redirect('escuelas:listar_escuelas')
