from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.contrib import messages
import csv

from .models import Alumno, Escuela
from .forms import AlumnoForm
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()

def listar_alumnos(request):
    user = request.user
    query = request.GET.get("q", "").strip()

    # Base queryset por rol
    if user.role == User.Role.MAESTRO_APOYO:
        alumnos = Alumno.objects.filter(profesor=user)
    elif user.role in [
        User.Role.PSICOLOGO,
        User.Role.TRABAJADOR_SOCIAL,
        User.Role.COMUNICACION,
        User.Role.PSICOMOTRICIDAD,
        User.Role.SECRETARIO,
        User.Role.ADMINISTRADOR,
    ]:
        alumnos = Alumno.objects.all()
    else:
        alumnos = Alumno.objects.none()

    # Filtro de búsqueda
    if query:
        alumnos = alumnos.filter(
            Q(nombres__icontains=query) |
            Q(apellido_paterno__icontains=query) |
            Q(apellido_materno__icontains=query) |
            Q(curp__icontains=query)
        )

    alumnos = alumnos.select_related('escuela').order_by('apellido_paterno', 'nombres')

    return render(request, 'alumnos/listar.html', {
        'alumnos': alumnos,
    })

def detalle_alumno(request, pk):
    alumno = get_object_or_404(Alumno, pk=pk)
    return render(request, 'alumnos/detalle_alumno.html', {'alumno': alumno})

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
            messages.success(request, "Alumno creado correctamente.")
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
            messages.success(request, "Alumno actualizado correctamente.")
            return redirect('alumnos:listar_alumnos')
    else:
        form = AlumnoForm(instance=alumno)

    contexto['form'] = form
    return render(request, 'alumnos/form.html', contexto)

def eliminar_alumno(request, pk):
    """
    Elimina un alumno directamente desde la lista.
    """
    alumno = get_object_or_404(Alumno, pk=pk)
    if request.method == 'POST':
        try:
            alumno.delete()
            messages.success(request, f"Alumno ‘{alumno.nombres} {alumno.apellido_paterno}’ eliminado correctamente.")
        except Exception as e:
            messages.error(request, f"Error al eliminar al alumno: {e}")
    return redirect('alumnos:listar_alumnos')

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
