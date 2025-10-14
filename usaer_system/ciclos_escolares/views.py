from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.urls import reverse_lazy
from .models import CicloEscolar
from .forms import CicloEscolarForm
from alumnos.models import Alumno
from django.db import transaction

def lista_ciclos(request):
    ciclos = CicloEscolar.objects.all()
    return render(request, 'ciclos_escolares/lista_ciclos.html', {
        'ciclos': ciclos,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
        ],
        'current_page_title': 'Gestión de Ciclos Escolares'
    })

def crear_ciclo(request):
    if request.method == 'POST':
        form = CicloEscolarForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Ciclo escolar creado correctamente.")
            return redirect('ciclos_escolares:lista_ciclos')
    else:
        form = CicloEscolarForm()
    return render(request, 'ciclos_escolares/form_ciclo.html', {
        'form': form,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Ciclos Escolares', 'url': reverse_lazy('ciclos_escolares:lista_ciclos')},
        ],
        'current_page_title': 'Nuevo Ciclo Escolar'
    })

def editar_ciclo(request, pk):
    ciclo = get_object_or_404(CicloEscolar, pk=pk)
    if request.method == 'POST':
        form = CicloEscolarForm(request.POST, instance=ciclo)
        if form.is_valid():
            form.save()
            messages.success(request, "Ciclo escolar actualizado correctamente.")
            return redirect('ciclos_escolares:lista_ciclos')
    else:
        form = CicloEscolarForm(instance=ciclo)
    return render(request, 'ciclos_escolares/form_ciclo.html', {
        'form': form,
        'ciclo': ciclo,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Ciclos Escolares', 'url': reverse_lazy('ciclos_escolares:lista_ciclos')},
        ],
        'current_page_title': f'Editar Ciclo: {ciclo.nombre}'
    })

def eliminar_ciclo(request, pk):
    ciclo = get_object_or_404(CicloEscolar, pk=pk)
    if request.method == 'POST':
        try:
            ciclo.delete()
            messages.success(request, "Ciclo escolar eliminado correctamente.")
        except Exception as e:
            messages.error(request, f"No se puede eliminar el ciclo escolar: {e}")
    return redirect('ciclos_escolares:lista_ciclos')

def promover_alumnos(request):
    if request.method == 'POST':
        # Final confirmation submitted
        if 'confirmed' in request.POST:
            try:
                with transaction.atomic():
                    alumnos_activos = Alumno.objects.filter(activo=True)
                    if not alumnos_activos.exists():
                        messages.warning(request, "No hay alumnos activos para procesar.")
                        return redirect('ciclos_escolares:lista_ciclos')

                    promovidos_count = 0
                    graduados_count = 0
                    errors = []

                    for alumno in alumnos_activos:
                        try:
                            grado_actual = int(alumno.grado)

                            if grado_actual >= 6:
                                alumno.activo = False
                                alumno.save(update_fields=['activo'])
                                graduados_count += 1
                            else:
                                nuevo_grado = str(grado_actual + 1)
                                alumno.grado = nuevo_grado
                                alumno.grupo = ''
                                alumno.save(update_fields=['grado', 'grupo'])
                                promovidos_count += 1
                        except (ValueError, TypeError):
                            errors.append(f"El alumno '{alumno.get_full_name()}' fue omitido porque su grado ('{alumno.grado}') no es un número válido.")

                    if errors:
                        for error in errors:
                            messages.warning(request, error)

                    # Deactivate the active cycle
                    ciclo_activo = CicloEscolar.objects.filter(activo=True).first()
                    if ciclo_activo:
                        ciclo_activo.activo = False
                        ciclo_activo.save(update_fields=['activo'])
                        messages.info(request, f"El ciclo escolar '{ciclo_activo.nombre}' ha sido cerrado.")

                    success_message = f'{promovidos_count} alumnos fueron promovidos. {graduados_count} alumnos fueron graduados y marcados como inactivos.'
                    messages.success(request, success_message)

            except Exception as e:
                messages.error(request, f"Ocurrió un error inesperado durante el proceso de promoción: {e}")

            return redirect('ciclos_escolares:lista_ciclos')

        # Simulation step
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
                    continue
            
            return render(request, 'ciclos_escolares/promover_alumnos.html', {
                'simulation_mode': True,
                'alumnos_a_promover': alumnos_a_promover,
                'alumnos_a_graduar': alumnos_a_graduar,
                'breadcrumbs': [
                    {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
                    {'name': 'Ciclos Escolares', 'url': reverse_lazy('ciclos_escolares:lista_ciclos')}
                ],
                'current_page_title': 'Confirmar Promoción de Alumnos'
            })

    # GET request
    return render(request, 'ciclos_escolares/promover_alumnos.html', {
        'simulation_mode': False,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Ciclos Escolares', 'url': reverse_lazy('ciclos_escolares:lista_ciclos')}
        ],
        'current_page_title': 'Promover Alumnos al Siguiente Ciclo'
    })
