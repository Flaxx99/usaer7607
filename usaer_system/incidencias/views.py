from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.admin.views.decorators import staff_member_required

from .models import Incidencia
from .forms import IncidenciaForm

User = get_user_model()

def es_director(user):
    return user.is_authenticated and user.role == 'Director'

def es_profesor(user):
    return user.is_authenticated and user.role == 'Profesor'


@login_required
@user_passes_test(es_director)
def crear_incidencia(request):
    """
    El Director asigna una incidencia a un Profesor.
    """
    if request.method == 'POST':
        form = IncidenciaForm(request.POST)
        if form.is_valid():
            incidencia = form.save(commit=False)
            # created_at lo maneja auto_now_add en el modelo
            incidencia.save()
            messages.success(request, "Incidencia creada y asignada correctamente.")
            return redirect('incidencias:revisar_incidencias')
    else:
        # El form debe incluir un field 'profesor' para elegir destino
        form = IncidenciaForm()

    return render(request, 'incidencias/form.html', {
        'form': form,
        'titulo': 'Crear Incidencia'
    })


@login_required
@user_passes_test(es_profesor)
def listar_incidencias(request):
    """
    El Profesor ve sólo las incidencias que le han sido asignadas.
    """
    incidencias = Incidencia.objects.filter(profesor=request.user).order_by('-fecha')
    return render(request, 'incidencias/listar.html', {
        'incidencias': incidencias
    })


@login_required
@user_passes_test(es_director)
def revisar_incidencias(request):
    """
    El Director ve todas las incidencias (para seguimiento).
    """
    incidencias = Incidencia.objects.all().order_by('-fecha')
    return render(request, 'incidencias/revisar.html', {
        'incidencias': incidencias
    })


@login_required
@user_passes_test(es_director)
def editar_incidencia(request, pk):
    """
    El Director puede editar/actualizar cualquier incidencia.
    """
    incidencia = get_object_or_404(Incidencia, pk=pk)
    if request.method == 'POST':
        form = IncidenciaForm(request.POST, instance=incidencia)
        if form.is_valid():
            form.save()
            messages.success(request, "Incidencia actualizada correctamente.")
            return redirect('incidencias:revisar_incidencias')
    else:
        form = IncidenciaForm(instance=incidencia)

    return render(request, 'incidencias/form.html', {
        'form': form,
        'titulo': 'Editar Incidencia'
    })


@login_required
@user_passes_test(es_director)
@staff_member_required
def eliminar_incidencia(request, pk):
    """
    El Director puede eliminar cualquier incidencia.
    """
    incidencia = get_object_or_404(Incidencia, pk=pk)
    if request.method == 'POST':
        incidencia.delete()
        messages.success(request, "Incidencia eliminada.")
        return redirect('incidencias:revisar_incidencias')

    return render(request, 'incidencias/confirmar_eliminar.html', {
        'incidencia': incidencia
    })
