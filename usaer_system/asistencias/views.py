# asistencias/views.py

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
<<<<<<< HEAD
from usuarios.models import User
=======
from django.contrib.auth import get_user_model
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Q
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a

from .models import Asistencia
from .forms import AsistenciaCheckForm

<<<<<<< HEAD
User = User()

def checar_asistencia(request):
    """
    Con un solo campo (número o CURP) marca:
      - ENTRADA si no hay registro hoy
      - SALIDA si ya hay entrada pero no salida
      - informa si ya está completa la asistencia del día
    """
    status    = None
    timestamp = None

    if request.method == 'POST':
        form = AsistenciaCheckForm(request.POST)
        if form.is_valid():
            codigo = form.cleaned_data['numero_empleado'].strip()
            hoy    = timezone.localdate()
            ahora  = timezone.localtime()

            # 1) Buscar al profesor por número o CURP
            try:
                profesor = User.objects.get(
                    numero_empleado=codigo,
                    role='Profesor',
                    is_active=True
                )
            except User.DoesNotExist:
                try:
                    profesor = User.objects.get(
                        curp=codigo,
                        role='Profesor',
                        is_active=True
                    )
                except User.DoesNotExist:
                    messages.error(request, "Código o CURP no encontrado.")
                    return redirect('asistencias:checar_asistencia')

            # 2) Determinar si graba Entrada o Salida
            asi, created = Asistencia.objects.get_or_create(
                profesor=profesor,
                fecha=hoy,
                defaults={
                    'escuela': profesor.escuela,
                    'presente': True,
                    'hora_entrada': ahora.time(),
                }
            )

            if created:
                status    = 'ENTRADA'
                timestamp = asi.hora_entrada
                messages.success(
                    request,
                    f"Entrada registrada a las {timestamp.strftime('%H:%M')} en {profesor.escuela.nombre}"
                )
            else:
                if asi.hora_salida:
                    status = 'COMPLETO'
                    messages.info(request, "Ya registraste entrada y salida hoy.")
                else:
                    # grabar la salida
                    asi.hora_salida = ahora.time()
                    asi.save(update_fields=['hora_salida'])
                    status    = 'SALIDA'
                    timestamp = asi.hora_salida

                    # opcional: calcular duración
                    delta = (timezone.datetime.combine(hoy, asi.hora_salida) -
                             timezone.datetime.combine(hoy, asi.hora_entrada))
                    horas = delta.seconds // 3600
                    mins  = (delta.seconds % 3600) // 60

                    messages.success(
                        request,
                        f"Salida registrada a las {timestamp.strftime('%H:%M')} "
                        f"| Horas trabajadas: {horas}h {mins}m"
                    )

            return redirect('asistencias:checar_asistencia')
    else:
        form = AsistenciaCheckForm()
=======
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
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a

    return render(request, 'asistencias/checar.html', {
        'form': form,
    })
    

<<<<<<< HEAD
# asistencias/views.py

from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone
from django.db.models import Q
=======
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
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a

from .models import Asistencia

@staff_member_required
def listar_asistencias(request):
    """
<<<<<<< HEAD
    Lista todas las asistencias del día para el personal staff.
    Permite buscar por número de empleado o nombre.
    Muestra además totales, completadas y pendientes.
=======
    Vista para el staff que muestra todas las asistencias del día.
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    """
    # Fecha actual
    hoy = timezone.localdate()
<<<<<<< HEAD

    # Base queryset: todas las asistencias de hoy
    asistencias = Asistencia.objects.filter(
        fecha=hoy
    ).select_related(
        'profesor', 'escuela'
    ).order_by('hora_entrada')

    # Estadísticas
=======
    asistencias = Asistencia.objects.filter(fecha=hoy).select_related(
        'profesor','escuela'
    ).order_by('hora_entrada')

>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    total     = asistencias.count()
    completas = asistencias.exclude(hora_salida__isnull=True).count()
    pendientes= total - completas

<<<<<<< HEAD
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
        'fecha':        hoy,
        'total':        total,
        'completas':    completas,
        'pendientes':   pendientes,
        'query':        query,
=======
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
>>>>>>> 6dcfed68be085d912db309c92c84c71fabfd3e1a
    })

