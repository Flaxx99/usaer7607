from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from .models import Asistencia
from .forms import AsistenciaCheckForm
from escuelas.models import Escuela


# Obtener usuario
User = get_user_model()


# ----------------------------
# Mostrar Checador (Público)
# ----------------------------
def mostrar_checador(request):
    form = AsistenciaCheckForm()
    return render(request, 'asistencias/checar.html', {'form': form})


# ----------------------------
# Checar Asistencia (Público)
# ----------------------------
from django.views.decorators.http import require_POST

def checar_asistencia(request):
    if request.method == 'POST':
        form = AsistenciaCheckForm(request.POST)
        if form.is_valid():
            codigo = form.cleaned_data['numero_empleado'].strip()
        hoy = timezone.localdate()
        ahora = timezone.localtime()

        try:
            profesor = User.objects.get(
                Q(numero_empleado=codigo) | Q(curp=codigo),
                is_active=True
            )
        except User.DoesNotExist:
            messages.error(request, "Código o CURP no encontrado.")
            return redirect('login')
        except User.MultipleObjectsReturned:
            messages.error(request, "Existen múltiples coincidencias. Contacte al administrador.")
            return redirect('login')

        if not profesor.escuela:
            messages.error(request, "Este usuario no tiene una escuela asignada.")
            return redirect('login')

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
            message = f"Entrada registrada a las {asistencia.hora_entrada.strftime('%H:%M')}"
            messages.success(request, message)
            request.session['last_check'] = message
        else:
            if asistencia.hora_salida:
                message = "Ya registraste entrada y salida hoy."
                messages.info(request, message)
                request.session['last_check'] = message
            else:
                asistencia.hora_salida = ahora.time()
                asistencia.save(update_fields=['hora_salida'])

                delta = (timezone.datetime.combine(hoy, asistencia.hora_salida) -
                         timezone.datetime.combine(hoy, asistencia.hora_entrada))
                horas = delta.seconds // 3600
                mins = (delta.seconds % 3600) // 60

                message = f"Salida registrada a las {asistencia.hora_salida.strftime('%H:%M')} | Horas trabajadas: {horas}h {mins}m"
                messages.success(request, message)
                request.session['last_check'] = message

        return redirect('login')
    else:
        error_message = "Por favor, corrige los errores en el formulario de checador."
        for field, errors in form.errors.items():
            for error in errors:
                error_message += f" {field}: {error}"
        messages.error(request, error_message)
        return redirect('login')


# ----------------------------
# Listar asistencias por rol
# ----------------------------
@login_required
def listar_asistencias(request):
    hoy = timezone.localdate()
    user = request.user

    # Mostrar todas si es ADMIN
    if user.role == User.Role.ADMINISTRADOR:
        asistencias = Asistencia.objects.filter(fecha=hoy).select_related('profesor', 'escuela')
    else:
        asistencias = Asistencia.objects.filter(fecha=hoy, profesor=user).select_related('profesor', 'escuela')

    query = request.GET.get('q', '').strip()
    if query:
        asistencias = asistencias.filter(
            Q(profesor__numero_empleado__icontains=query) |
            Q(profesor__nombre__icontains=query) |
            Q(profesor__apellido_paterno__icontains=query) |
            Q(profesor__apellido_materno__icontains=query)
        )

    total = asistencias.count()
    completas = asistencias.filter(hora_entrada__isnull=False, hora_salida__isnull=False).count()
    pendientes = asistencias.filter(hora_entrada__isnull=False, hora_salida__isnull=True).count()

    return render(request, 'asistencias/listado.html', {
        'asistencias': asistencias,
        'fecha': hoy,
        'total': total,
        'completas': completas,
        'pendientes': pendientes,
        'query': query,
    })
