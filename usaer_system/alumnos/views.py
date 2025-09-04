from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse
from django.contrib import messages
import csv

from .models import Alumno, Escuela
from .forms import AlumnoForm
from django.db.models import Q, ProtectedError
from django.contrib.auth import get_user_model

User = get_user_model()

def listar_alumnos(request):
    user = request.user
    query = request.GET.get("q", "").strip()

    # Base queryset por rol
    if user.role == User.Role.MAESTRO_APOYO.value:
        alumnos = Alumno.objects.filter(profesor=user, activo=True)
    elif user.role in [
        User.Role.PSICOLOGO.value,
        User.Role.TRABAJADOR_SOCIAL.value,
        User.Role.COMUNICACION.value,
        User.Role.PSICOMOTRICIDAD.value,
        User.Role.SECRETARIO.value,
        User.Role.ADMINISTRADOR.value,
    ]:
        alumnos = Alumno.objects.filter(activo=True)
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

    from django.urls import reverse_lazy
    return render(request, 'alumnos/listar.html', {
        'alumnos': alumnos,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ],
        'current_page_title': 'Gestión de Alumnos'
    })

def detalle_alumno(request, pk):
    from django.urls import reverse_lazy
    alumno = get_object_or_404(Alumno.objects.select_related('escuela'), pk=pk)
    return render(request, 'alumnos/detalle_alumno.html', {
        'alumno': alumno,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Alumnos', 'url': reverse_lazy('alumnos:listar_alumnos')}
        ],
        'current_page_title': f'Detalle de {alumno.get_full_name}'
    })

def crear_alumno(request):
    """
    Crea un nuevo alumno.
    """
    from django.urls import reverse_lazy
    escuelas = Escuela.objects.all()
    contexto = {
        'titulo':    'Nuevo Alumno',
        'form':      None,
        'escuelas':  escuelas,
        'nivel_ini': '',
        'esc_ini':   '',
        'grado_ini': '',
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Alumnos', 'url': reverse_lazy('alumnos:listar_alumnos')}
        ],
        'current_page_title': 'Nuevo Alumno'
    }

    if request.method == 'POST':
        form = AlumnoForm(request.POST)
        if form.is_valid():
            escuela_id = request.POST.get('escuela')
            if not escuela_id:
                messages.error(request, "Error: Debes seleccionar una escuela.")
                # Vuelve a renderizar el formulario con el error
                contexto['form'] = form
                return render(request, 'alumnos/form.html', contexto)

            obj = form.save(commit=False)
            obj.escuela_id = escuela_id
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
    from django.urls import reverse_lazy
    alumno   = get_object_or_404(Alumno.objects.select_related('escuela'), pk=pk)
    escuelas = Escuela.objects.all()

    contexto = {
        'titulo':    'Editar Alumno',
        'form':      None,
        'escuelas':  escuelas,
        'nivel_ini': alumno.escuela.nivel,
        'esc_ini':   alumno.escuela_id,
        'grado_ini': alumno.grado,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Alumnos', 'url': reverse_lazy('alumnos:listar_alumnos')},
            {'name': f'Detalle de {alumno.get_full_name()}', 'url': reverse_lazy('alumnos:detalle_alumno', kwargs={'pk': alumno.pk})}
        ],
        'current_page_title': f'Editar {alumno.get_full_name()}'
    }

    if request.method == 'POST':
        form = AlumnoForm(request.POST, instance=alumno)
        if form.is_valid():
            escuela_id = request.POST.get('escuela')
            if not escuela_id:
                messages.error(request, "Error: Debes seleccionar una escuela.")
                contexto['form'] = form
                return render(request, 'alumnos/form.html', contexto)

            obj = form.save(commit=False)
            obj.escuela_id = escuela_id
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
        except ProtectedError:
            messages.error(request, f"Error: El alumno ‘{alumno.nombres} {alumno.apellido_paterno}’ no puede ser eliminado porque tiene registros asociados (ej. expedientes, asistencias). Elimina primero esos registros.")
        except Exception as e:
            messages.error(request, f"Error inesperado al eliminar al alumno: {e}")
    return redirect('alumnos:listar_alumnos')

def promover_alumnos(request):
    from django.urls import reverse_lazy

    if request.method == 'POST':
        # Si el formulario de confirmación final fue enviado
        if 'confirmed' in request.POST:
            alumnos_activos = Alumno.objects.filter(activo=True)
            promovidos_count = 0
            graduados_count = 0

            for alumno in alumnos_activos:
                try:
                    # TODO: Asegurarse de que alumno.grado siempre sea un string numérico válido.
                    # Este try-except maneja casos donde grado no es convertible a int.
                    grado_actual = int(alumno.grado)
                    if grado_actual >= 6: # Graduados de 6to
                        alumno.activo = False
                        graduados_count += 1
                    else:
                        alumno.grado = str(grado_actual + 1)
                        promovidos_count += 1
                    
                    alumno.grupo = '' # Limpiar el grupo para el nuevo ciclo
                    alumno.save()
                except (ValueError, TypeError):
                    # Log the error or handle it more specifically if needed
                    messages.warning(request, f"El alumno '{alumno.get_full_name()}' fue omitido porque su grado ('{alumno.grado}') no es un número válido.")
                    continue
            
            messages.success(request, f'{promovidos_count} alumnos fueron promovidos. {graduados_count} alumnos fueron graduados y marcados como inactivos.')
            return redirect('alumnos:listar_alumnos')

        # Si es el primer POST (simulación)
        else:
            alumnos_activos = Alumno.objects.filter(activo=True)
            alumnos_a_promover = []
            alumnos_a_graduar = []

            for alumno in alumnos_activos:
                try:
                    grado_actual = int(alumno.grado)
                    if grado_actual >= 6:
                        alumnos_a_graduar.append(alumno)
                    else:
                        alumnos_a_promover.append(alumno)
                except (ValueError, TypeError):
                    # No se muestra mensaje en la simulación, solo en la ejecución real.
                    continue
            
            return render(request, 'alumnos/promover.html', {
                'simulation_mode': True,
                'alumnos_a_promover': alumnos_a_promover,
                'alumnos_a_graduar': alumnos_a_graduar,
                'breadcrumbs': [
                    {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
                    {'name': 'Gestión de Alumnos', 'url': reverse_lazy('alumnos:listar_alumnos')}
                ],
                'current_page_title': 'Confirmar Promoción de Alumnos'
            })

    # Si es GET (mostrar la advertencia inicial)
    return render(request, 'alumnos/promover.html', {
        'simulation_mode': False,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Gestión de Alumnos', 'url': reverse_lazy('alumnos:listar_alumnos')}
        ],
        'current_page_title': 'Promover Alumnos al Siguiente Ciclo'
    })
