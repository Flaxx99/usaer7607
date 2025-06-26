# alumnos/views.py

import os
import openpyxl
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import get_user_model

from escuelas.models import Escuela
from .models import Alumno
from .forms import AlumnoForm

User = get_user_model()

def puede_gestionar_alumnos(user):
    return user.is_authenticated and user.role in ['DOCENTE', 'MAESTRO_APOYO', 'ADMIN']

@login_required
@user_passes_test(puede_gestionar_alumnos)
def listar_alumnos(request):
    """Lista todos los alumnos accesibles según el rol."""
    if request.user.role == 'ADMIN':
        alumnos = Alumno.objects.all()
    elif request.user.role == 'MAESTRO_APOYO':
        alumnos = Alumno.objects.filter(escuela=request.user.escuela)
    else:
        alumnos = Alumno.objects.filter(profesor=request.user)

    alumnos = alumnos.order_by('apellido_paterno', 'apellido_materno', 'nombres')
    return render(request, 'alumnos/listar.html', {
        'alumnos': alumnos
    })

@login_required
@user_passes_test(puede_gestionar_alumnos)
def crear_alumno(request):
    """
    Permite crear un nuevo alumno según el rol,
    con recarga GET para el select de grados.
    """
    escuela_id = request.GET.get('escuela')
    # cargamos todas las escuelas para el select
    escuelas = Escuela.objects.all()

    if request.method == 'POST':
        form = AlumnoForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Alumno registrado correctamente.")
            return redirect('alumnos:listar_alumnos')
    else:
        initial = {}
        if escuela_id:
            initial['escuela'] = escuela_id
        form = AlumnoForm(initial=initial)

    return render(request, 'alumnos/form.html', {
        'form': form,
        'titulo': 'Nuevo Alumno',
        'escuelas': escuelas,
        'escuela_seleccionada': escuela_id,
    })

@login_required
@user_passes_test(puede_gestionar_alumnos)
def editar_alumno(request, pk):
    """
    Edita datos de un alumno si el usuario tiene permisos,
    con recarga GET para el select de grados.
    """
    alumno = get_object_or_404(Alumno, pk=pk)
    if request.user.role != 'ADMIN' and alumno.profesor != request.user:
        messages.error(request, "No tienes permiso para editar este alumno.")
        return redirect('alumnos:listar_alumnos')

    escuela_id = request.GET.get('escuela')
    escuelas = Escuela.objects.all()

    if request.method == 'POST':
        form = AlumnoForm(request.POST, instance=alumno)
        if form.is_valid():
            form.save()
            messages.success(request, "Datos del alumno actualizados.")
            return redirect('alumnos:listar_alumnos')
    else:
        if escuela_id:
            form = AlumnoForm(instance=alumno, initial={'escuela': escuela_id})
        else:
            form = AlumnoForm(instance=alumno)

    return render(request, 'alumnos/form.html', {
        'form': form,
        'titulo': 'Editar Alumno',
        'escuelas': escuelas,
        'escuela_seleccionada': escuela_id,
    })

@login_required
@user_passes_test(puede_gestionar_alumnos)
def eliminar_alumno(request, pk):
    """Elimina un alumno con confirmación previa si tiene permisos."""
    alumno = get_object_or_404(Alumno, pk=pk)
    if request.user.role != 'ADMIN' and alumno.profesor != request.user:
        messages.error(request, "No tienes permiso para eliminar este alumno.")
        return redirect('alumnos:listar_alumnos')

    if request.method == 'POST':
        try:
            nombre_completo = f"{alumno.apellido_paterno} {alumno.apellido_materno}, {alumno.nombres}"
            alumno.delete()
            messages.success(request, f"Alumno {nombre_completo} eliminado correctamente.")
            return redirect('alumnos:listar_alumnos')
        except Exception as e:
            messages.error(request, f"Error al eliminar alumno: {e}")
            return redirect('alumnos:listar_alumnos')

    return render(request, 'alumnos/confirmar_eliminar.html', {
        'alumno': alumno,
        'titulo': 'Confirmar eliminación'
    })

@login_required
@user_passes_test(puede_gestionar_alumnos)
def exportar_rac(request):
    """Exporta RAC en formato Excel usando plantilla predefinida."""
    try:
        plantilla = os.path.join(settings.BASE_DIR, 'static', 'templates', 'template_rac.xlsx')
        wb = openpyxl.load_workbook(plantilla)
        ws = wb.active
        fila = 5

        if request.user.role == 'ADMIN':
            alumnos = Alumno.objects.all()
        elif request.user.role == 'MAESTRO_APOYO':
            alumnos = Alumno.objects.filter(escuela=request.user.escuela)
        else:
            alumnos = Alumno.objects.filter(profesor=request.user)

        for alumno in alumnos:
            ws[f'A{fila}'] = alumno.apellido_paterno or ''
            ws[f'B{fila}'] = alumno.apellido_materno or ''
            ws[f'C{fila}'] = alumno.nombres or ''
            ws[f'D{fila}'] = alumno.curp or ''
            ws[f'E{fila}'] = alumno.sexo or ''
            ws[f'F{fila}'] = alumno.edad or ''
            ws[f'G{fila}'] = alumno.grado or ''
            ws[f'H{fila}'] = alumno.clasificacion or ''
            ws[f'I{fila}'] = alumno.clasificacion_otro or ''
            fila += 1

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename=RAC_{request.user.email}.xlsx'
        wb.save(response)
        return response

    except Exception as e:
        messages.error(request, f"Error al generar el archivo: {e}")
        return redirect('alumnos:listar_alumnos')
