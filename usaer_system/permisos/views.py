from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth.decorators import login_required, permission_required
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from .models import Permiso
from .forms import SolicitudPermisoForm, GestionPermisoForm


@login_required
def solicitar_permiso(request):
    if request.method == 'POST':
        form = SolicitudPermisoForm(request.POST)
        if form.is_valid():
            permiso = form.save(commit=False)
            permiso.profesor = request.user
            permiso.save()
            messages.success(request, _("Solicitud registrada correctamente (N° {0})").format(permiso.id))
            return redirect('permisos:mis_permisos')
        messages.warning(request, _("Corrige los errores en el formulario"))
    else:
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
    estado = request.GET.get('estado', '')
    busqueda = request.GET.get('q', '')
    año = request.GET.get('año', timezone.now().year)

    permisos = Permiso.objects.filter(profesor=request.user)

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

    metricas = {
        'total': permisos.count(),
        'pendientes': permisos.filter(estado=Permiso.Estado.PENDIENTE).count(),
        'aprobados': permisos.filter(estado=Permiso.Estado.APROBADO).count(),
        'rechazados': permisos.filter(estado=Permiso.Estado.RECHAZADO).count()
    }

    return render(request, 'permisos/mis_permisos.html', {
        'permisos': permisos.order_by('-fecha_solicitud'),
        'estados': Permiso.Estado.choices,
        'estado_actual': estado,
        'busqueda': busqueda,
        'años': Permiso.objects.dates('fecha_solicitud', 'year'),
        'año_actual': año,
        'metricas': metricas
    })


@login_required
@permission_required('permisos.gestionar_permisos')
def gestionar_permisos(request):
    estado = request.GET.get('estado', Permiso.Estado.PENDIENTE)
    escuela_id = request.GET.get('escuela', '')
    profesor_id = request.GET.get('profesor', '')
    fecha_desde = request.GET.get('fecha_desde', '')
    fecha_hasta = request.GET.get('fecha_hasta', '')

    permisos = Permiso.objects.select_related('profesor', 'escuela', 'administrador')

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

    metricas = {
        'total': permisos.count(),
        'pendientes': permisos.filter(estado=Permiso.Estado.PENDIENTE).count(),
        'ultima_semana': permisos.filter(
            fecha_solicitud__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
    }

    escuelas = permisos.values_list('escuela__id', 'escuela__nombre').distinct()
    profesores = permisos.values_list(
        'profesor__id', 'profesor__first_name', 'profesor__last_name'
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
        'metricas': metricas
    })


@login_required
@permission_required('permisos.gestionar_permisos')
def responder_permiso(request, pk):
    permiso = get_object_or_404(Permiso.objects.select_related('profesor', 'escuela'), pk=pk)
    permiso._current_user = request.user

    form = GestionPermisoForm(request.POST or None, instance=permiso)
    if request.method == 'POST':
        if form.is_valid():
            permiso = form.save()
            mensaje = _("Permiso aprobado correctamente") if permiso.estado == Permiso.Estado.APROBADO \
                else _("Permiso rechazado con éxito")
            messages.success(request, mensaje)
            return redirect('permisos:gestionar')
        messages.warning(request, _("Verifica los errores en el formulario"))

    return render(request, 'permisos/responder.html', {
        'form': form,
        'permiso': permiso,
        'titulo': _('Gestionar Permiso N° {numero}').format(numero=permiso.id),
        'duracion': permiso.duracion_dias,
        'puede_editar': permiso.puede_aprobar
    })


@login_required
@permission_required('permisos.gestionar_permisos')
def eliminar_permiso(request, pk):
    permiso = get_object_or_404(Permiso, pk=pk)

    if request.method == 'POST':
        try:
            permiso.delete()
            messages.success(request, _("Solicitud eliminada permanentemente"))
            return redirect('permisos:gestionar')
        except Exception as e:
            messages.error(request, _("Error al eliminar: {0}").format(e))
            return redirect('permisos:responder_permiso', pk=pk)

    return render(request, 'permisos/confirmar_eliminar.html', {
        'permiso': permiso,
        'titulo': _('Confirmar Eliminación de Solicitud N° {numero}').format(numero=permiso.id)
    })


@login_required
def detalle_permiso(request, pk):
    permiso = get_object_or_404(
        Permiso.objects.select_related('profesor', 'escuela', 'administrador'),
        pk=pk
    )

    if not request.user.has_perm('permisos.gestionar_permisos') and permiso.profesor_id != request.user.id:
        messages.error(request, _("No tienes permiso para ver esta solicitud"))
        return redirect('inicio')

    return render(request, 'permisos/detalle.html', {
        'permiso': permiso,
        'titulo': _('Detalles del Permiso N° {numero}').format(numero=permiso.id),
        'duracion': permiso.duracion_dias,
        'es_administrador': request.user.has_perm('permisos.gestionar_permisos'),
    })
