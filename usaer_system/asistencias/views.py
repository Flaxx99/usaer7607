from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from asistencias.models import Asistencia

# Create your views here.
import datetime
from django.shortcuts import render, redirect
from django.contrib import messages
from usuarios.models import Profesor
from asistencias.models import Asistencia
from asistencias.forms import AsistenciaEntradaForm

def registrar_entrada(request):
    profesor = None

    if request.method == 'POST':
        numero = request.POST.get('numero_empleado')

        try:
            profesor = Profesor.objects.get(numero_empleado=numero)
        except Profesor.DoesNotExist:
            messages.error(request, "Número de empleado no encontrado.")
            form = AsistenciaEntradaForm(request.POST)
        else:
            form = AsistenciaEntradaForm(request.POST, profesor=profesor)

        if form.is_valid() and profesor:
            escuela = form.cleaned_data['escuela']
            fecha_hoy = datetime.date.today()

            asistencia, created = Asistencia.objects.get_or_create(
                profesor=profesor,
                fecha=fecha_hoy,
                defaults={
                    'escuela': escuela,
                    'presente': True,
                    'hora_entrada': datetime.datetime.now().time()
                }
            )

            if not created:
                messages.info(request, "Ya habías registrado tu entrada hoy.")
            else:
                messages.success(request, "Entrada registrada correctamente.")
            return redirect('registrar_entrada')

    else:
        form = AsistenciaEntradaForm()

    return render(request, 'asistencias/entrada.html', {'form': form})

from asistencias.forms import AsistenciaSalidaForm

def registrar_salida(request):
    if request.method == 'POST':
        form = AsistenciaSalidaForm(request.POST)
        if form.is_valid():
            numero = form.cleaned_data['numero_empleado']
            try:
                profesor = Profesor.objects.get(numero_empleado=numero)
                asistencia = Asistencia.objects.get(profesor=profesor, fecha=datetime.date.today())
                asistencia.hora_salida = datetime.datetime.now().time()
                asistencia.save()
                messages.success(request, "Salida registrada correctamente.")
            except Profesor.DoesNotExist:
                messages.error(request, "Número de empleado no encontrado.")
            except Asistencia.DoesNotExist:
                messages.error(request, "Primero debes registrar tu entrada.")
            return redirect('registrar_salida')
    else:
        form = AsistenciaSalidaForm()

    return render(request, 'asistencias/salida.html', {'form': form})

@staff_member_required
def listar_asistencias(request):
    hoy = datetime.date.today()
    asistencias = Asistencia.objects.filter(fecha=hoy).order_by('hora_entrada')
    return render(request, 'asistencias/listado.html', {
        'asistencias': asistencias,
        'fecha': hoy
    })
