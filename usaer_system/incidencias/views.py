from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required


from .models import Incidencia
from .forms import IncidenciaForm

@login_required
def crear_incidencia(request):
    """
    Permite al profesor reportar una incidencia.
    """
    if request.method == 'POST':
        form = IncidenciaForm(request.POST)
        if form.is_valid():
            incidencia = form.save(commit=False)
            incidencia.profesor = request.user.profesor
            incidencia.created_at = timezone.now()
            incidencia.save()
            messages.success(request, "Incidencia reportada correctamente.")
            return redirect('incidencias:listar_incidencias')
    else:
        form = IncidenciaForm()
    return render(request, 'incidencias/form.html', {
        'form': form,
        'titulo': 'Reportar Incidencia'
    })

@login_required
def listar_incidencias(request):
    """
    Muestra las incidencias creadas por el profesor.
    """
    incidencias = Incidencia.objects.filter(profesor=request.user.profesor).order_by('-fecha')
    return render(request, 'incidencias/listar.html', {
        'incidencias': incidencias
    })

@staff_member_required
def revisar_incidencias(request):
    """
    Lista todas las incidencias para que el admin/director las atienda.
    """
    incidencias = Incidencia.objects.all().order_by('-fecha')
    return render(request, 'incidencias/revisar.html', {
        'incidencias': incidencias
    })

@staff_member_required
def editar_incidencia(request, pk):
    """
    Permite al admin/director responder una incidencia (llenar respuesta_admin).
    """
    incidencia = get_object_or_404(Incidencia, pk=pk)
    if request.method == 'POST':
        form = IncidenciaForm(request.POST, instance=incidencia)
        if form.is_valid():
            incidencia = form.save(commit=False)
            incidencia.fecha = incidencia.fecha  # no cambia la fecha original
            incidencia.save()
            messages.success(request, "Respuesta de incidencia guardada.")
            return redirect('incidencias:revisar_incidencias')
    else:
        form = IncidenciaForm(instance=incidencia)
    return render(request, 'incidencias/form.html', {
        'form': form,
        'titulo': 'Responder Incidencia'
    })

@staff_member_required
def eliminar_incidencia(request, pk):
    """
    Permite al admin/director eliminar una incidencia.
    """
    incidencia = get_object_or_404(Incidencia, pk=pk)
    if request.method == 'POST':
        incidencia.delete()
        messages.success(request, "Incidencia eliminada.")
        return redirect('incidencias:revisar_incidencias')
    return render(request, 'incidencias/confirmar_eliminar.html', {
        'incidencia': incidencia
    })
