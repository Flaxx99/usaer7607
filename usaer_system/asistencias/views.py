# asistencias/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Q
from .models import Asistencia
from .forms import AsistenciaCheckForm

# Obtenemos el modelo de usuario personalizado
User = get_user_model()

def checar_asistencia(request):
    """
    Con un solo campo (número o CURP) marca:
      - ENTRADA si no hay registro hoy
      - SALIDA si ya hay entrada pero no salida
      - informa si ya está completa la asistencia del día
    """
    status = None
    timestamp = None

    if request.method == 'POST':
        form = AsistenciaCheckForm(request.POST)
        if form.is_valid():
            codigo = form.cleaned_data['numero_empleado'].strip()
            hoy = timezone.localdate()
            ahora = timezone.localtime()

            # 1) Buscar al profesor por número o CURP
            try:
                profesor = User.objects.get(
                    Q(numero_empleado=codigo) | Q(curp=codigo),
                    is_active=True
                )
            except User.DoesNotExist:
                messages.error(request, "Código o CURP no encontrado.")
                return redirect('asistencias:checar_asistencia')
            except User.MultipleObjectsReturned:
                messages.error(request, "Existen múltiples coincidencias. Contacte al administrador.")
                return redirect('asistencias:checar_asistencia')

            # 2) Determinar si graba Entrada o Salida
            if not profesor.escuela:
                messages.error(request, "Este usuario no tiene una escuela asignada. Contacte al administrador.")
                return redirect('asistencias:checar_asistencia')

            asistencia, created = Asistencia.objects.get_or_create(
                profesor=profesor,
                fecha=hoy,
                defaults={
                    'escuela': profesor.escuela,
                    'presente': True,
                    'hora_entrada': ahora.time(),
                }
            )


            if created:
                status = 'ENTRADA'
                timestamp = asistencia.hora_entrada
                messages.success(
                    request,
                    f"Entrada registrada a las {timestamp.strftime('%H:%M')} en {profesor.escuela.nombre}"
                )
            else:
                if asistencia.hora_salida:
                    status = 'COMPLETO'
                    messages.info(request, "Ya registraste entrada y salida hoy.")
                else:
                    # Registrar la salida
                    asistencia.hora_salida = ahora.time()
                    asistencia.save(update_fields=['hora_salida'])
                    status = 'SALIDA'
                    timestamp = asistencia.hora_salida

                    # Calcular duración
                    delta = (timezone.datetime.combine(hoy, asistencia.hora_salida) -
                            timezone.datetime.combine(hoy, asistencia.hora_entrada))
                    horas = delta.seconds // 3600
                    mins = (delta.seconds % 3600) // 60

                    messages.success(
                        request,
                        f"Salida registrada a las {timestamp.strftime('%H:%M')} "
                        f"| Horas trabajadas: {horas}h {mins}m"
                    )

            return redirect('asistencias:checar_asistencia')
    else:
        form = AsistenciaCheckForm()

    return render(request, 'asistencias/checar.html', {
        'form': form,
    })

@staff_member_required
def listar_asistencias(request):
    """
    Lista todas las asistencias del día para el personal staff.
    Permite buscar por número de empleado o nombre.
    Muestra además totales, completadas y pendientes.
    """
    hoy = timezone.localdate()

    asistencias = Asistencia.objects.filter(
        fecha=hoy
    ).select_related(
        'profesor', 'escuela'
    ).order_by('hora_entrada')

    # Estadísticas
    total = asistencias.count()
    completas = asistencias.exclude(hora_salida__isnull=True).count()
    pendientes = total - completas

    # Filtro de búsqueda
    query = request.GET.get('q', '').strip()
    if query:
        asistencias = asistencias.filter(
            Q(profesor__numero_empleado__icontains=query) |
            Q(profesor__nombre__icontains=query) |
            Q(profesor__apellido_paterno__icontains=query) |
            Q(profesor__apellido_materno__icontains=query)
        )

    return render(request, 'asistencias/listado.html', {
        'asistencias': asistencias,
        'fecha': hoy,
        'total': total,
        'completas': completas,
        'pendientes': pendientes,
        'query': query,
    })