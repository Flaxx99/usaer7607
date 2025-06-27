from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
import csv

from .models import Alumno, Escuela
from .forms import AlumnoForm

def listar_alumnos(request):
    """
    Lista alumnos según el rol del usuario autenticado.
    """
    user = request.user

    # Si es maestro de apoyo, ve solo sus alumnos
    if user.role == 'MAESTRO_APOYO':
        alumnos = Alumno.objects.filter(profesor=user)

    # Roles que pueden ver todos los alumnos
    elif user.role in [
        'PSICÓLOGO',
        'TRABAJADOR_SOCIAL',
        'COMUNICACION',
        'PSICOMOTRICIDAD',
        'SECRETARIO',
        'ADMIN',
    ]:
        alumnos = Alumno.objects.all()

    # Otros no pueden ver nada
    else:
        alumnos = Alumno.objects.none()

    alumnos = alumnos.select_related('escuela').order_by('apellido_paterno', 'nombres')

    return render(request, 'alumnos/listar.html', {
        'alumnos': alumnos,
    })

def crear_alumno(request):
    """
    Crea un nuevo alumno.
    """
    escuelas = Escuela.objects.all()
    contexto = {
        'titulo':    'Nuevo Alumno',
        'form':      None,
        'escuelas':  escuelas,
        'nivel_ini': '',
        'esc_ini':   '',
        'grado_ini': '',
    }

    if request.method == 'POST':
        form = AlumnoForm(request.POST)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.escuela_id = request.POST.get('escuela')
            obj.grado      = request.POST.get('grado')
            obj.save()
            return redirect('alumnos:listar_alumnos')
    else:
        form = AlumnoForm()

    contexto['form'] = form
    return render(request, 'alumnos/form.html', contexto)

def editar_alumno(request, pk):
    """
    Edita un alumno existente.
    """
    alumno   = get_object_or_404(Alumno, pk=pk)
    escuelas = Escuela.objects.all()

    contexto = {
        'titulo':    'Editar Alumno',
        'form':      None,
        'escuelas':  escuelas,
        'nivel_ini': alumno.escuela.nivel,
        'esc_ini':   alumno.escuela_id,
        'grado_ini': alumno.grado,
    }

    if request.method == 'POST':
        form = AlumnoForm(request.POST, instance=alumno)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.escuela_id = request.POST.get('escuela')
            obj.grado      = request.POST.get('grado')
            obj.save()
            return redirect('alumnos:listar_alumnos')
    else:
        form = AlumnoForm(instance=alumno)

    contexto['form'] = form
    return render(request, 'alumnos/form.html', contexto)

def eliminar_alumno(request, pk):
    """
    Elimina un alumno tras confirmación.
    """
    alumno = get_object_or_404(Alumno, pk=pk)
    if request.method == 'POST':
        alumno.delete()
        return redirect('alumnos:listar_alumnos')
    return render(request, 'alumnos/confirmar_eliminar.html', {
        'alumno': alumno
    })

def exportar_rac(request):
    """
    Exporta todos los alumnos a un CSV descargable.
    """
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="alumnos.csv"'
    writer = csv.writer(response)
    # Cabecera
    writer.writerow([
        'Apellido Paterno', 'Apellido Materno', 'Nombres', 'CURP',
        'Sexo', 'Edad', 'Escuela', 'Grado', 'Grupo'
    ])
    # Filas
    for a in Alumno.objects.select_related('escuela').all():
        writer.writerow([
            a.apellido_paterno,
            a.apellido_materno,
            a.nombres,
            a.curp,
            a.get_sexo_display(),  # si usas choices
            a.edad,
            a.escuela.nombre,
            a.grado,
            a.grupo,
        ])
    return response
