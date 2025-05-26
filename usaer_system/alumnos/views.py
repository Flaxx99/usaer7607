# alumnos/views.py

import os
import openpyxl
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import HttpResponse
from django.conf import settings
from usuarios.models import User
from django.contrib.auth.decorators import login_required, user_passes_test

from .models import Alumno
from .forms import AlumnoForm

User = User()

def es_profesor(user):
    return user.is_authenticated and user.role == 'Profesor'


@login_required
@user_passes_test(es_profesor)
def listar_alumnos(request):
    """
    Lista todos los alumnos asignados al profesor logueado.
    """
    alumnos = Alumno.objects.filter(profesor=request.user)
    return render(request, 'alumnos/listar.html', {
        'alumnos': alumnos
    })


@login_required
@user_passes_test(es_profesor)
def crear_alumno(request):
    """
    Permite al profesor crear un nuevo alumno.
    """
    form = AlumnoForm(request.POST or None, profesor=request.user)
    if form.is_valid():
        alumno = form.save(commit=False)
        alumno.profesor = request.user
        alumno.escuela  = request.user.escuela
        alumno.save()
        messages.success(request, "Alumno registrado correctamente.")
        return redirect('alumnos:listar_alumnos')

    return render(request, 'alumnos/form.html', {
        'form': form,
        'titulo': 'Nuevo Alumno'
    })


@login_required
@user_passes_test(es_profesor)
def editar_alumno(request, pk):
    """
    Permite al profesor editar los datos de uno de sus alumnos.
    """
    alumno = get_object_or_404(Alumno, pk=pk, profesor=request.user)
    form = AlumnoForm(request.POST or None, instance=alumno, profesor=request.user)
    if form.is_valid():
        form.save()
        messages.success(request, "Datos del alumno actualizados.")
        return redirect('alumnos:listar_alumnos')

    return render(request, 'alumnos/form.html', {
        'form': form,
        'titulo': 'Editar Alumno'
    })


@login_required
@user_passes_test(es_profesor)
def eliminar_alumno(request, pk):
    """
    Permite al profesor eliminar a uno de sus alumnos.
    """
    alumno = get_object_or_404(Alumno, pk=pk, profesor=request.user)
    if request.method == 'POST':
        alumno.delete()
        messages.success(request, "Alumno eliminado.")
        return redirect('alumnos:listar_alumnos')

    return render(request, 'alumnos/confirmar_eliminar.html', {
        'alumno': alumno
    })


@login_required
@user_passes_test(es_profesor)
def exportar_rac(request):
    """
    Exporta un archivo Excel con el formato RAC, usando plantilla
    ubicada en static/templates/template_rac.xlsx.
    """
    plantilla = os.path.join(settings.BASE_DIR,
                             'static', 'templates', 'template_rac.xlsx')
    wb = openpyxl.load_workbook(plantilla)
    ws = wb.active
    fila = 5  # fila de inicio en la plantilla

    for a in Alumno.objects.filter(profesor=request.user):
        ws[f'A{fila}'] = a.apellido_paterno
        ws[f'B{fila}'] = a.apellido_materno
        ws[f'C{fila}'] = a.nombres
        ws[f'D{fila}'] = a.curp
        ws[f'E{fila}'] = a.sexo
        ws[f'F{fila}'] = a.edad
        ws[f'G{fila}'] = a.grado
        ws[f'H{fila}'] = a.clasificacion
        ws[f'I{fila}'] = a.clasificacion_otro
        fila += 1

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = (
        f'attachment; filename=RAC_{request.user.username}.xlsx'
    )
    wb.save(response)
    return response
