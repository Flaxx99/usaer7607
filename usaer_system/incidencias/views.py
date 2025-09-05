from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from usuarios.decoradores import roles_permitidos
from django.contrib.auth import get_user_model

from .models import Incidencia
from .forms import IncidenciaForm

User = get_user_model()


from django.urls import reverse_lazy
@login_required
def crear_incidencia(request):
    """
    Permite al director o al administrador crear y asignar una incidencia a un profesor
    """
    if not request.user.escuela:
        messages.error(request, "No puedes crear incidencias porque no tienes una escuela asignada.")
        # Redirigir a una página segura, como el dashboard o la lista de incidencias
        return redirect('incidencias:revisar_incidencias')

    if request.method == 'POST':
        form = IncidenciaForm(request.POST, escuela=request.user.escuela)
        if form.is_valid():
            incidencia = form.save(commit=False)
            incidencia.escuela = request.user.escuela
            incidencia.reportado_por = request.user # Set the reporter
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
        'modo':   'crear',
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Revisar Incidencias', 'url': reverse_lazy('incidencias:revisar_incidencias')}
        ],
        'current_page_title': 'Nueva Incidencia',
        'referer_url': request.META.get('HTTP_REFERER'),
        'revisar_incidencias_url': reverse_lazy('incidencias:revisar_incidencias')
    })


@login_required
def listar_incidencias(request):
    """
    Muestra al docente, maestro de apoyo o admin solo sus incidencias
    """
    estado = request.GET.get('estado', '')
    query  = request.GET.get('q', '')

    from django.urls import reverse_lazy
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
        'query':             query,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ],
        'current_page_title': 'Mis Incidencias'
    })

@login_required
def detalle_incidencia(request, pk):
    from django.urls import reverse_lazy
    incidencia = get_object_or_404(Incidencia, pk=pk)
    return render(request, 'incidencias/detalle_incidencia.html', {
        'incidencia': incidencia,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Mis Incidencias', 'url': reverse_lazy('incidencias:listar_incidencias')}
        ],
        'current_page_title': f'Detalle Incidencia #{incidencia.id}'
    })

@login_required
def revisar_incidencias(request):
    """
    Panel para que el director o admin revise todas las incidencias de su escuela
    """
    # Un admin puede no tener escuela, pero debe poder ver todo.
    # Un director debe tener escuela para ver las incidencias.
    if request.user.role == User.Role.DIRECTOR.value and not request.user.escuela:
        messages.error(request, "No puedes revisar incidencias porque no tienes una escuela asignada.")
        return redirect('usuarios:dashboard')

    estado      = request.GET.get('estado', '')
    profesor_id = request.GET.get('profesor', '')
    query       = request.GET.get('q', '')

    from django.urls import reverse_lazy
    
    incidencias = Incidencia.objects.all()
    # Si el usuario no es admin, filtrar por su escuela.
    if not request.user.is_superuser and request.user.role != User.Role.ADMINISTRADOR.value:
        if request.user.escuela:
            incidencias = incidencias.filter(escuela=request.user.escuela)
        else:
            incidencias = Incidencia.objects.none()

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

    profesores_qs = User.objects.filter(role=User.Role.MAESTRO_APOYO.value)
    # Filtrar profesores por escuela solo si el usuario tiene una escuela asignada
    if request.user.escuela:
        profesores_qs = profesores_qs.filter(escuela=request.user.escuela)

    profesores = profesores_qs.only('id', 'first_name', 'last_name')


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
        },
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ],
        'current_page_title': 'Revisar Incidencias'
    })


@login_required
def editar_incidencia(request, pk):
    """
    Permite al director o admin editar una incidencia y cambiar su estado
    """
    from django.urls import reverse_lazy
    # Un admin puede editar incidencias de cualquier escuela. Un director solo de la suya.
    if request.user.role == User.Role.DIRECTOR.value and not request.user.escuela:
        messages.error(request, "No puedes editar incidencias porque no tienes una escuela asignada.")
        return redirect('incidencias:revisar_incidencias')
    
    qs = Incidencia.objects.all()
    if request.user.role == User.Role.DIRECTOR.value:
        qs = qs.filter(escuela=request.user.escuela)

    incidencia = get_object_or_404(qs, pk=pk)

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
            if not {'estado', 'respuesta_admin'} & set(form.changed_data):
                messages.success(request, "Incidencia actualizada correctamente.")
            return redirect('incidencias:revisar_incidencias')
    else:
        form = IncidenciaForm(instance=incidencia, escuela=request.user.escuela)

    return render(request, 'incidencias/form.html', {
        'form':      form,
        'titulo':    f'Editar Incidencia #{incidencia.id}',
        'modo':      'editar',
        'incidencia': incidencia,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Revisar Incidencias', 'url': reverse_lazy('incidencias:revisar_incidencias')}
        ],
        'current_page_title': f'Editar Incidencia #{incidencia.id}'
    })


@login_required
def resolver_incidencia(request, pk):
    """
    Vista para que el director o admin marque una incidencia como resuelta
    """
    from django.urls import reverse_lazy
    # Un admin puede resolver incidencias de cualquier escuela. Un director solo de la suya.
    if request.user.role == User.Role.DIRECTOR.value and not request.user.escuela:
        messages.error(request, "No puedes resolver incidencias porque no tienes una escuela asignada.")
        return redirect('incidencias:revisar_incidencias')
    
    qs = Incidencia.objects.all()
    if request.user.role == User.Role.DIRECTOR.value:
        qs = qs.filter(escuela=request.user.escuela)

    incidencia = get_object_or_404(qs, pk=pk)

    if request.method == 'POST':
        incidencia.estado          = 'RESUELTA'
        incidencia.respuesta_admin = request.POST.get('respuesta_admin', '')
        incidencia.save()
        messages.success(request, f"Incidencia #{incidencia.id} marcada como resuelta")
        return redirect('incidencias:revisar_incidencias')

    return render(request, 'incidencias/resolver.html', {
        'incidencia': incidencia,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Revisar Incidencias', 'url': reverse_lazy('incidencias:revisar_incidencias')},
            {'name': f'Editar Incidencia #{incidencia.id}', 'url': reverse_lazy('incidencias:editar_incidencia', kwargs={'pk': incidencia.pk})}
        ],
        'current_page_title': f'Resolver Incidencia #{incidencia.id}'
    })


@login_required
def eliminar_incidencia(request, pk):
    """
    Elimina una incidencia directamente desde la lista.
    """
    # Un admin puede eliminar incidencias de cualquier escuela. Un director solo de la suya.
    if request.user.role == User.Role.DIRECTOR.value and not request.user.escuela:
        messages.error(request, "No puedes eliminar incidencias porque no tienes una escuela asignada.")
        return redirect('incidencias:revisar_incidencias')
    
    qs = Incidencia.objects.all()
    if request.user.role == User.Role.DIRECTOR.value:
        qs = qs.filter(escuela=request.user.escuela)

    incidencia = get_object_or_404(qs, pk=pk)
    if request.method == 'POST':
        try:
            incidencia.delete()
            messages.success(request, f"Incidencia #{pk} eliminada correctamente.")
        except Exception as e:
            messages.error(request, f"Error al eliminar la incidencia: {e}")
    return redirect('incidencias:revisar_incidencias')
