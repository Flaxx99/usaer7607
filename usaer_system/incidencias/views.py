from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model

from .models import Incidencia
from .forms import IncidenciaForm

User = get_user_model()


@login_required
@roles_permitidos(['DIRECTOR', 'ADMIN'])
def crear_incidencia(request):
    """
    Permite al director o al administrador crear y asignar una incidencia a un profesor
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
        'form':   form,
        'titulo': 'Nueva Incidencia',
        'modo':   'crear'
    })


@login_required
@roles_permitidos(['DOCENTE', 'MAESTRO_APOYO', 'ADMIN'])
def listar_incidencias(request):
    """
    Muestra al docente, maestro de apoyo o admin solo sus incidencias
    """
    estado = request.GET.get('estado', '')
    query  = request.GET.get('q', '')

    incidencias = Incidencia.objects.filter(profesor=request.user)
    if estado:
        incidencias = incidencias.filter(estado=estado)
    if query:
        incidencias = incidencias.filter(
            Q(titulo__icontains=query) | Q(descripcion__icontains=query)
        )

    total     = incidencias.count()
    pendientes = incidencias.filter(estado='PENDIENTE').count()

    return render(request, 'incidencias/listar.html', {
        'incidencias':       incidencias.order_by('-fecha_reporte'),
        'total_incidencias': total,
        'pendientes':        pendientes,
        'estado_filtrado':   estado,
        'query':             query
    })


@login_required
@roles_permitidos(['DIRECTOR', 'ADMIN'])
def revisar_incidencias(request):
    """
    Panel para que el director o admin revise todas las incidencias de su escuela
    """
    estado      = request.GET.get('estado', '')
    profesor_id = request.GET.get('profesor', '')
    query       = request.GET.get('q', '')

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

    total     = incidencias.count()
    pendientes = incidencias.filter(estado='PENDIENTE').count()
    resueltas = incidencias.filter(estado='RESUELTA').count()

    profesores = User.objects.filter(
        escuela=request.user.escuela,
        role='DOCENTE'
    ).only('id', 'first_name', 'last_name')

    return render(request, 'incidencias/revisar.html', {
        'incidencias':       incidencias.order_by('-fecha_reporte'),
        'total_incidencias': total,
        'pendientes':        pendientes,
        'resueltas':         resueltas,
        'profesores':        profesores,
        'filtros': {
            'estado':   estado,
            'profesor': profesor_id,
            'query':    query
        }
    })


@login_required
@roles_permitidos(['DIRECTOR', 'ADMIN'])
def editar_incidencia(request, pk):
    """
    Permite al director o admin editar una incidencia y cambiar su estado
    """
    incidencia = get_object_or_404(Incidencia, pk=pk, escuela=request.user.escuela)

    if request.method == 'POST':
        form = IncidenciaForm(request.POST, instance=incidencia, escuela=request.user.escuela)
        if form.is_valid():
            incidencia = form.save()
            if 'estado' in form.changed_data:
                if incidencia.estado == 'RESUELTA':
                    messages.success(request, "Incidencia marcada como RESUELTA")
                else:
                    messages.info(request, f"Estado actualizado a {incidencia.get_estado_display()}")
            if 'respuesta_admin' in form.changed_data:
                messages.info(request, "Comentarios de dirección actualizados")
            return redirect('incidencias:revisar_incidencias')
    else:
        form = IncidenciaForm(instance=incidencia, escuela=request.user.escuela)

    return render(request, 'incidencias/form.html', {
        'form':      form,
        'titulo':    f'Editar Incidencia #{incidencia.id}',
        'modo':      'editar',
        'incidencia': incidencia
    })


@login_required
@roles_permitidos(['DIRECTOR', 'ADMIN'])
def resolver_incidencia(request, pk):
    """
    Vista para que el director o admin marque una incidencia como resuelta
    """
    incidencia = get_object_or_404(Incidencia, pk=pk, escuela=request.user.escuela)

    if request.method == 'POST':
        incidencia.estado          = 'RESUELTA'
        incidencia.respuesta_admin = request.POST.get('respuesta_admin', '')
        incidencia.save()
        messages.success(request, f"Incidencia #{incidencia.id} marcada como resuelta")
        return redirect('incidencias:revisar_incidencias')

    return render(request, 'incidencias/resolver.html', {
        'incidencia': incidencia
    })


@login_required
@roles_permitidos(['DIRECTOR', 'ADMIN'])
def eliminar_incidencia(request, pk):
    """
    Elimina una incidencia (solo director o admin)
    """
    incidencia = get_object_or_404(Incidencia, pk=pk, escuela=request.user.escuela)

    if request.method == 'POST':
        incidencia.delete()
        messages.success(request, f"Incidencia #{pk} eliminada correctamente")
        return redirect('incidencias:revisar_incidencias')

    return render(request, 'incidencias/confirmar_eliminar.html', {
        'incidencia': incidencia
    })
