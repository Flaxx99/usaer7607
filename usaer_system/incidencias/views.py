from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Q

from .models import Incidencia
from .forms import IncidenciaForm

User = get_user_model()

def es_director(user):
    """Verifica si el usuario es director"""
    return user.is_authenticated and hasattr(user, 'role') and user.role == 'Director'

def es_profesor(user):
    """Verifica si el usuario es profesor"""
    return user.is_authenticated and hasattr(user, 'role') and user.role == 'Profesor'

@login_required
@user_passes_test(es_director)
def crear_incidencia(request):
    """
    Permite al director crear y asignar una incidencia a un profesor
    """
    if request.method == 'POST':
        form = IncidenciaForm(request.POST, escuela=request.user.escuela)
        if form.is_valid():
            incidencia = form.save(commit=False)
            incidencia.escuela = request.user.escuela
            incidencia.save()
            
            if incidencia.profesor:
                messages.success(
                    request, 
                    f"Incidencia creada y asignada al profesor {incidencia.profesor.get_full_name()}"
                )
            else:
                messages.success(request, "Incidencia creada (sin asignar a profesor)")
            
            return redirect('incidencias:revisar_incidencias')
    else:
        form = IncidenciaForm(escuela=request.user.escuela)

    return render(request, 'incidencias/form.html', {
        'form': form,
        'titulo': 'Nueva Incidencia',
        'modo': 'crear'
    })

@login_required
@user_passes_test(es_profesor)
def listar_incidencias(request):
    """
    Muestra al profesor solo sus incidencias con filtros por estado
    """
    estado = request.GET.get('estado', '')
    query = request.GET.get('q', '')
    
    incidencias = Incidencia.objects.filter(profesor=request.user)
    
    if estado:
        incidencias = incidencias.filter(estado=estado)
    
    if query:
        incidencias = incidencias.filter(
            Q(titulo__icontains=query) | 
            Q(descripcion__icontains=query)
        )
    
    total = incidencias.count()
    pendientes = incidencias.filter(estado='PENDIENTE').count()
    
    return render(request, 'incidencias/listar.html', {
        'incidencias': incidencias.order_by('-fecha_reporte'),  # Eliminado orden por prioridad
        'total_incidencias': total,
        'pendientes': pendientes,
        'estado_filtrado': estado,
        'query': query
    })

@login_required
@user_passes_test(es_director)
def revisar_incidencias(request):
    """
    Panel del director con todas las incidencias de su escuela
    """
    estado = request.GET.get('estado', '')
    profesor_id = request.GET.get('profesor', '')
    query = request.GET.get('q', '')
    
    incidencias = Incidencia.objects.filter(escuela=request.user.escuela)
    
    if estado:
        incidencias = incidencias.filter(estado=estado)
    if profesor_id:
        incidencias = incidencias.filter(profesor__id=profesor_id)
    if query:
        incidencias = incidencias.filter(
            Q(titulo__icontains=query) | 
            Q(descripcion__icontains=query) |
            Q(profesor__first_name__icontains=query) |
            Q(profesor__last_name__icontains=query)
        )
    
    total = incidencias.count()
    pendientes = incidencias.filter(estado='PENDIENTE').count()
    resueltas = incidencias.filter(estado='RESUELTA').count()
    
    profesores = User.objects.filter(
        escuela=request.user.escuela, 
        role='Profesor'
    ).only('id', 'first_name', 'last_name')
    
    return render(request, 'incidencias/revisar.html', {
        'incidencias': incidencias.order_by('-fecha_reporte'),  # Eliminado orden por prioridad
        'total_incidencias': total,
        'pendientes': pendientes,
        'resueltas': resueltas,
        'profesores': profesores,
        'filtros': {
            'estado': estado,
            'profesor': profesor_id,
            'query': query
        }
    })

@login_required
@user_passes_test(es_director)
def editar_incidencia(request, pk):
    """
    Permite al director editar una incidencia y cambiar su estado
    """
    incidencia = get_object_or_404(Incidencia, pk=pk, escuela=request.user.escuela)
    
    if request.method == 'POST':
        form = IncidenciaForm(request.POST, instance=incidencia, escuela=request.user.escuela)
        if form.is_valid():
            incidencia = form.save()
            
            if 'estado' in form.changed_data:
                if incidencia.estado == 'RESUELTA':
                    messages.success(request, f"Incidencia marcada como RESUELTA")
                else:
                    messages.info(request, f"Estado actualizado a {incidencia.get_estado_display()}")
            
            if 'respuesta_admin' in form.changed_data:
                messages.info(request, "Comentarios de dirección actualizados")
            
            return redirect('incidencias:revisar_incidencias')
    else:
        form = IncidenciaForm(instance=incidencia, escuela=request.user.escuela)
    
    return render(request, 'incidencias/form.html', {
        'form': form,
        'titulo': f'Editar Incidencia #{incidencia.id}',
        'modo': 'editar',
        'incidencia': incidencia
    })

@login_required
@user_passes_test(es_director)
@staff_member_required
def resolver_incidencia(request, pk):
    """
    Vista específica para marcar una incidencia como resuelta
    """
    incidencia = get_object_or_404(Incidencia, pk=pk, escuela=request.user.escuela)
    
    if request.method == 'POST':
        incidencia.estado = 'RESUELTA'
        incidencia.respuesta_admin = request.POST.get('respuesta_admin', '')
        incidencia.save()
        
        messages.success(request, f"Incidencia #{incidencia.id} marcada como resuelta")
        return redirect('incidencias:revisar_incidencias')
    
    return render(request, 'incidencias/resolver.html', {
        'incidencia': incidencia
    })

@login_required
@user_passes_test(es_director)
@staff_member_required
def eliminar_incidencia(request, pk):
    """
    Elimina una incidencia con confirmación previa
    """
    incidencia = get_object_or_404(Incidencia, pk=pk, escuela=request.user.escuela)
    
    if request.method == 'POST':
        incidencia.delete()
        messages.success(request, f"Incidencia #{pk} eliminada correctamente")
        return redirect('incidencias:revisar_incidencias')
    
    return render(request, 'incidencias/confirmar_eliminar.html', {
        'incidencia': incidencia
    })