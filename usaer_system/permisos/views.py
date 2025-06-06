from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .models import Permiso
from .forms import SolicitudPermisoForm, GestionPermisoForm

@login_required
def solicitar_permiso(request):
    """
    Permite a los profesores crear nuevas solicitudes de permiso
    """
    if request.method == 'POST':
        form = SolicitudPermisoForm(request.POST)
        if form.is_valid():
            try:
                permiso = form.save(commit=False)
                permiso.profesor = request.user
                permiso.save()
                
                messages.success(
                    request, 
                    _("Solicitud de permiso registrada correctamente. N° {numero}").format(
                        numero=permiso.id
                    )
                )
                return redirect('permisos:mis_permisos')
            
            except ValidationError as e:
                messages.error(request, _(f"Error de validación: {e}"))
        else:
            messages.warning(
                request, 
                _("Por favor corrige los errores en el formulario")
            )
    else:
        # Inicializar con fechas por defecto (hoy)
        form = SolicitudPermisoForm(initial={
            'fecha_inicio': timezone.localdate(),
            'fecha_fin': timezone.localdate()
        })

    return render(request, 'permisos/solicitar.html', {
        'form': form,
        'titulo': _('Nueva Solicitud de Permiso'),
        'hoy': timezone.localdate().isoformat(),
        'max_date': (timezone.localdate() + timezone.timedelta(days=365)).isoformat()
    })

@login_required
def mis_permisos(request):
    """
    Muestra al profesor el listado de sus propias solicitudes
    con capacidad de filtrado
    """
    estado = request.GET.get('estado', '')
    busqueda = request.GET.get('q', '')
    año = request.GET.get('año', timezone.now().year)
    
    permisos = Permiso.objects.filter(profesor=request.user)
    
    # Aplicar filtros
    if estado:
        permisos = permisos.filter(estado=estado)
    if busqueda:
        permisos = permisos.filter(
            Q(motivo__icontains=busqueda) |
            Q(tipo__icontains=busqueda) |
            Q(respuesta_admin__icontains=busqueda)
        )
    if año:
        permisos = permisos.filter(fecha_solicitud__year=año)
    
    # Estadísticas
    total = permisos.count()
    estados_disponibles = Permiso.Estado.choices
    años_disponibles = Permiso.objects.dates('fecha_solicitud', 'year')
    
    return render(request, 'permisos/mis_permisos.html', {
        'permisos': permisos.order_by('-fecha_solicitud'),
        'estados': estados_disponibles,
        'estado_actual': estado,
        'busqueda': busqueda,
        'años': años_disponibles,
        'año_actual': año,
        'metricas': {
            'total': total,
            'pendientes': permisos.filter(estado=Permiso.Estado.PENDIENTE).count(),
            'aprobados': permisos.filter(estado=Permiso.Estado.APROBADO).count(),
            'rechazados': permisos.filter(estado=Permiso.Estado.RECHAZADO).count()
        }
    })

@login_required
@permission_required('permisos.gestionar_permisos')
def gestionar_permisos(request):
    """
    Panel de control para administradores con filtros avanzados
    """
    estado = request.GET.get('estado', Permiso.Estado.PENDIENTE)
    escuela_id = request.GET.get('escuela', '')
    fecha_desde = request.GET.get('fecha_desde', '')
    fecha_hasta = request.GET.get('fecha_hasta', '')
    profesor_id = request.GET.get('profesor', '')
    
    permisos = Permiso.objects.select_related(
        'profesor', 
        'escuela',
        'administrador'
    )
    
    # Filtros
    if estado:
        permisos = permisos.filter(estado=estado)
    if escuela_id:
        permisos = permisos.filter(escuela__id=escuela_id)
    if profesor_id:
        permisos = permisos.filter(profesor__id=profesor_id)
    if fecha_desde:
        permisos = permisos.filter(fecha_solicitud__gte=fecha_desde)
    if fecha_hasta:
        permisos = permisos.filter(fecha_solicitud__lte=fecha_hasta)
    
    # Datos para filtros
    escuelas = Permiso.objects.values_list(
        'escuela__id', 
        'escuela__nombre'
    ).distinct()
    
    profesores = Permiso.objects.filter(
        profesor__isnull=False
    ).values_list(
        'profesor__id',
        'profesor__first_name',
        'profesor__last_name'
    ).distinct()
    
    return render(request, 'permisos/gestionar.html', {
        'permisos': permisos.order_by('-fecha_solicitud'),
        'estados': Permiso.Estado.choices,
        'estado_actual': estado,
        'escuelas': escuelas,
        'escuela_actual': escuela_id,
        'profesores': profesores,
        'profesor_actual': profesor_id,
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta,
        'metricas': {
            'total': permisos.count(),
            'pendientes': Permiso.objects.filter(
                estado=Permiso.Estado.PENDIENTE
            ).count(),
            'ultima_semana': Permiso.objects.filter(
                fecha_solicitud__gte=timezone.now()-timezone.timedelta(days=7)
            ).count()
        }
    })

@login_required
@permission_required('permisos.gestionar_permisos')
def responder_permiso(request, pk):
    """
    Vista detallada para gestionar una solicitud específica
    """
    permiso = get_object_or_404(
        Permiso.objects.select_related('profesor', 'escuela'),
        pk=pk
    )
    permiso._current_user = request.user  # Para auditoría
    
    if request.method == 'POST':
        form = GestionPermisoForm(request.POST, instance=permiso)
        if form.is_valid():
            try:
                permiso = form.save()
                
                # Mensaje contextual
                if permiso.estado == Permiso.Estado.APROBADO:
                    msg = _("Permiso aprobado correctamente")
                    # enviar_notificacion_aprobacion(permiso)
                else:
                    msg = _("Permiso rechazado con éxito")
                    # enviar_notificacion_rechazo(permiso)
                
                messages.success(request, msg)
                return redirect('permisos:gestionar_permisos')
                
            except Exception as e:
                messages.error(request, _(f"Error al procesar: {e}"))
        else:
            messages.warning(request, _("Verifica los errores en el formulario"))
    else:
        form = GestionPermisoForm(instance=permiso)
    
    return render(request, 'permisos/responder.html', {
        'form': form,
        'permiso': permiso,
        'titulo': _('Gestionar Permiso N° {numero}').format(numero=permiso.id),
        'duracion': (permiso.fecha_fin - permiso.fecha_inicio).days + 1,
        'puede_editar': permiso.estado == Permiso.Estado.PENDIENTE
    })

@login_required
@permission_required('permisos.gestionar_permisos')
def eliminar_permiso(request, pk):
    """
    Eliminación segura con confirmación previa
    """
    permiso = get_object_or_404(Permiso, pk=pk)
    
    if request.method == 'POST':
        try:
            permiso.delete()
            messages.success(request, _("Solicitud eliminada permanentemente"))
            return redirect('permisos:gestionar_permisos')
        except Exception as e:
            messages.error(
                request, 
                _("Error al eliminar: {error}. Contacte al administrador").format(
                    error=e
                )
            )
            return redirect('permisos:responder_permiso', pk=pk)
    
    return render(request, 'permisos/confirmar_eliminar.html', {
        'permiso': permiso,
        'titulo': _('Confirmar Eliminación de Solicitud N° {numero}').format(
            numero=permiso.id
        )
    })

@login_required
def detalle_permiso(request, pk):
    """
    Vista pública para ver detalles completos de un permiso
    """
    permiso = get_object_or_404(
        Permiso.objects.select_related('profesor', 'escuela', 'administrador'),
        pk=pk
    )
    
    # Verificar permisos de visualización
    if not request.user.has_perm('permisos.gestionar_permisos') and permiso.profesor != request.user:
        messages.error(request, _("No tienes permiso para ver esta solicitud"))
        return redirect('inicio')
    
    return render(request, 'permisos/detalle.html', {
        'permiso': permiso,
        'titulo': _('Detalles del Permiso N° {numero}').format(numero=permiso.id),
        'duracion': (permiso.fecha_fin - permiso.fecha_inicio).days + 1,
        'es_administrador': request.user.has_perm('permisos.gestionar_permisos')
    })