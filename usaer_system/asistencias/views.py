from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone

from usuarios.models import Profesor
from .models import Asistencia
from .forms import AsistenciaEntradaForm, AsistenciaSalidaForm

def registrar_entrada(request):
    """
    Registra la entrada del día para un profesor sin necesidad de login.
    Si ya tenía una entrada, informa; si no, crea la asistencia con hora_entrada.
    """
    form = None
    if request.method == 'POST':
        numero = request.POST.get('numero_empleado')
        profesor = get_object_or_404(Profesor, numero_empleado=numero)

        form = AsistenciaEntradaForm(request.POST, profesor=profesor)
        if form.is_valid():
            escuela = form.cleaned_data['escuela']
            hoy = timezone.localdate()
            ahora = timezone.localtime().time()

            asistencia, created = Asistencia.objects.get_or_create(
                profesor=profesor,
                fecha=hoy,
                defaults={
                    'escuela': escuela,
                    'presente': True,
                    'hora_entrada': ahora,
                }
            )

            if created:
                messages.success(request, "Entrada registrada correctamente.")
            else:
                messages.info(request, "Ya habías registrado tu entrada hoy.")

            return redirect('asistencias:registrar_entrada')

    if form is None:
        form = AsistenciaEntradaForm()

    return render(request, 'asistencias/entrada.html', {'form': form})


def registrar_salida(request):
    """
    Registra la salida del día para un profesor sin necesidad de login.
    Si no había entrada, avisa; si ya tenía salida, informa; si no, guarda hora_salida.
    """
    form = AsistenciaSalidaForm(request.POST or None)

    if request.method == 'POST' and form.is_valid():
        numero = form.cleaned_data['numero_empleado']
        profesor = get_object_or_404(Profesor, numero_empleado=numero)

        hoy = timezone.localdate()
        ahora = timezone.localtime().time()

        try:
            asistencia = Asistencia.objects.get(profesor=profesor, fecha=hoy)
            if asistencia.hora_salida is None:
                asistencia.hora_salida = ahora
                asistencia.save(update_fields=['hora_salida'])
                messages.success(request, "Salida registrada correctamente.")
            else:
                messages.info(request, "Ya registraste tu salida hoy.")
        except Asistencia.DoesNotExist:
            messages.error(request, "Primero debes registrar tu entrada.")

        return redirect('asistencias:registrar_salida')

    return render(request, 'asistencias/salida.html', {'form': form})


@staff_member_required
def listar_asistencias(request):
    """
    Lista todas las asistencias del día, accesible solo para usuarios staff.
    """
    hoy = timezone.localdate()
    asistencias = Asistencia.objects.filter(fecha=hoy).order_by('hora_entrada')
    return render(request, 'asistencias/listado.html', {
        'asistencias': asistencias,
        'fecha': hoy
    })
