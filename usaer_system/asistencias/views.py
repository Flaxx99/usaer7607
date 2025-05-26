# asistencias/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Q

from .models import Asistencia
from .forms import AsistenciaEntradaForm, AsistenciaSalidaForm

User = get_user_model()


def registrar_entrada(request):
    """
    El profesor solo ingresa su código y se registra su asistencia
    con la escuela que ya tiene asignada.
    """
    if request.method == 'POST':
        form = AsistenciaEntradaForm(request.POST)
        if form.is_valid():
            codigo = form.cleaned_data['numero_empleado'].strip()

            try:
                profesor = User.objects.get(
                    Q(numero_empleado=codigo) | Q(curp=codigo),
                    role='Profesor',
                    activo=True
                )
            except User.DoesNotExist:
                messages.error(request, "Número de empleado no encontrado.")
                return redirect('asistencias:registrar_entrada')

            escuela = profesor.escuela
            if not escuela:
                messages.error(request, "No tienes escuela asignada. Contacta al administrador.")
                return redirect('asistencias:registrar_entrada')

            hoy   = timezone.localdate()
            ahora = timezone.localtime()

            # ¿Ya registró entrada hoy?
            asistencia, created = Asistencia.objects.get_or_create(
                profesor=profesor,
                fecha=hoy,
                defaults={
                    'escuela': escuela,
                    'hora_entrada': ahora.time(),
                    'presente': True
                }
            )

            if not created:
                messages.info(request, f"Ya registraste tu entrada hoy a las {asistencia.hora_entrada.strftime('%H:%M')}.")
            else:
                messages.success(request,
                    f"Entrada registrada: {ahora.strftime('%d/%m/%Y %H:%M')} | Escuela: {escuela.nombre}"
                )

            return redirect('asistencias:registrar_entrada')
    else:
        form = AsistenciaEntradaForm()

    return render(request, 'asistencias/entrada.html', {
        'form': form,
        'hoy': timezone.localdate().strftime('%A %d/%m/%Y')
    })


def registrar_salida(request):
    """
    El profesor solo ingresa su código y se registra su salida
    usando la hora actual.
    """
    if request.method == 'POST':
        form = AsistenciaSalidaForm(request.POST)
        if form.is_valid():
            codigo = form.cleaned_data['numero_empleado'].strip()

            try:
                profesor = User.objects.get(
                    Q(numero_empleado=codigo) | Q(curp=codigo),
                    role='Profesor',
                    activo=True
                )
            except User.DoesNotExist:
                messages.error(request, "Número de empleado no encontrado.")
                return redirect('asistencias:registrar_salida')

            hoy   = timezone.localdate()
            ahora = timezone.localtime()

            asistencia = Asistencia.objects.filter(
                profesor=profesor,
                fecha=hoy
            ).first()

            if not asistencia:
                messages.error(request, "Primero debes registrar tu entrada.")
                return redirect('asistencias:registrar_salida')

            if asistencia.hora_salida:
                messages.info(request,
                    f"Ya registraste tu salida hoy a las {asistencia.hora_salida.strftime('%H:%M')}."
                )
            else:
                asistencia.hora_salida = ahora.time()
                asistencia.save(update_fields=['hora_salida'])
                diff = datetime.datetime.combine(hoy, ahora.time()) - \
                       datetime.datetime.combine(hoy, asistencia.hora_entrada)
                horas = diff.seconds // 3600
                minutos = (diff.seconds % 3600) // 60
                messages.success(request,
                    f"Salida registrada: {ahora.strftime('%H:%M')} | Horas trabajadas: {horas}h {minutos}m"
                )

            return redirect('asistencias:registrar_salida')
    else:
        form = AsistenciaSalidaForm()

    return render(request, 'asistencias/salida.html', {
        'form': form,
        'hoy': timezone.localdate().strftime('%A %d/%m/%Y')
    })


@staff_member_required
def listar_asistencias(request):
    """
    Vista para el staff que muestra todas las asistencias del día.
    """
    hoy = timezone.localdate()
    asistencias = Asistencia.objects.filter(fecha=hoy).select_related(
        'profesor','escuela'
    ).order_by('hora_entrada')

    total     = asistencias.count()
    completas = asistencias.exclude(hora_salida__isnull=True).count()
    pendientes= total - completas

    query = request.GET.get('q','').strip()
    if query:
        asistencias = asistencias.filter(
            Q(profesor__numero_empleado__icontains=query) |
            Q(profesor__nombres__icontains=query) |
            Q(profesor__apellido_paterno__icontains=query)
        )

    return render(request, 'asistencias/listado.html',{
        'asistencias': asistencias,
        'fecha': hoy,
        'total': total,
        'completas': completas,
        'pendientes': pendientes,
        'query': query
    })
