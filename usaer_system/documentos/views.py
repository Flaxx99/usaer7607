from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse_lazy
from django.views.generic import ListView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db.models import Q
from django.contrib.auth import get_user_model

from .forms import ExpedienteForm, OtroArchivoFormSet, OtroArchivoFormSetEdit
from .models import Expediente
from documentos.utils import tiene_permiso
from alumnos.models import Alumno
from django.conf import settings
import os
import glob
from django.conf import settings
from pathlib import Path

User = get_user_model()

# Roles con permiso de edición total (sobre cualquier expediente)
ROLES_PUEDEN_EDITAR_TODO = [
    User.Role.PSICOMOTRICIDAD,
    User.Role.PSICOLOGO,
    User.Role.COMUNICACION,
    User.Role.TRABAJADOR_SOCIAL,
    User.Role.SECRETARIO,
    User.Role.ADMINISTRADOR,
]

@login_required
def subir_expediente(request):
    from django.urls import reverse_lazy
    if request.user.role not in [
        User.Role.MAESTRO_APOYO,
        User.Role.SECRETARIO,
        User.Role.ADMINISTRADOR,
    ]:
        messages.error(request, "🚫 No tienes permiso para subir expedientes.")
        return redirect('documentos:lista_expedientes')

    if request.method == 'POST':
        form = ExpedienteForm(request.POST, request.FILES, user=request.user)
        formset = OtroArchivoFormSet(request.POST, request.FILES)
        if form.is_valid() and formset.is_valid():
            expediente = form.save(commit=False)
            expediente.profesor = request.user
            expediente.save()
            formset.instance = expediente
            formset.save()
            messages.success(request, "✅ Expediente y archivos adicionales guardados.")
            return redirect('documentos:lista_expedientes')
        messages.error(request, "⚠️ Hubo errores. Revisa todo.")
    else:
        form = ExpedienteForm(user=request.user)
        formset = OtroArchivoFormSet()

    return render(request, 'documentos/expedientes/subir.html', {
        'form': form,
        'formset': formset,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Expedientes', 'url': reverse_lazy('documentos:lista_expedientes')}
        ],
        'current_page_title': 'Subir Expediente'
    })


@login_required
def editar_expediente(request, pk):
    from django.urls import reverse_lazy
    expediente = get_object_or_404(Expediente, pk=pk)
    user = request.user

    puede_editar = (
        user.is_superuser or
        expediente.profesor == user or
        user.role in settings.ROLES_EQUIPO_ITINERANTE or
        user.role == User.Role.MAESTRO_APOYO
    )

    if not puede_editar:
        messages.error(request, "⛔ No tienes permiso para editar este expediente.")
        return redirect('documentos:lista_expedientes')

    if request.method == 'POST':
        form = ExpedienteForm(request.POST, request.FILES, instance=expediente, user=user)
        formset = OtroArchivoFormSetEdit(request.POST, request.FILES, instance=expediente)

        if form.is_valid() and formset.is_valid():
            expediente_actualizado = form.save(commit=False)

            # Eliminar archivos viejos si se sube uno nuevo
            for field in ['informe_deteccion', 'informe_psicopedagogico', 'plan_intervencion']:
                nuevo_archivo = form.cleaned_data.get(field)
                if nuevo_archivo:
                    # Detectar el tipo base (ej: deteccion, psico, plan)
                    tipo = field.split('_')[1]
                    carpeta = Path(settings.MEDIA_ROOT) / f"expedientes/alumno_{expediente.alumno.id}"
                    patron = str(carpeta / f"{tipo}.*")
                    archivos_anteriores = glob.glob(patron)

                    for archivo_path in archivos_anteriores:
                        try:
                            os.remove(archivo_path)
                        except FileNotFoundError:
                            pass  # ya no existía

                    # Se asigna el nuevo archivo al campo correspondiente
                    setattr(expediente_actualizado, field, nuevo_archivo)

            expediente_actualizado.save()
            formset.save()

            messages.success(request, "✅ Expediente y archivos adicionales actualizados.")
            return redirect('documentos:lista_expedientes')
        else:
            messages.error(request, "⚠️ Corrige los errores antes de continuar.")
    else:
        form = ExpedienteForm(instance=expediente, user=user)
        formset = OtroArchivoFormSetEdit(instance=expediente)

    return render(request, 'documentos/expedientes/editar.html', {
        'form': form,
        'formset': formset,
        'expediente': expediente,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Expedientes', 'url': reverse_lazy('documentos:lista_expedientes')}
        ],
        'current_page_title': f'Editar Expediente de {expediente.alumno.get_full_name}'
    })


class ExpedienteListView(LoginRequiredMixin, ListView):
    model = Expediente
    template_name = 'documentos/expedientes/lista.html'
    context_object_name = 'expedientes'
    paginate_by = 10

    def get_queryset(self):
        user = self.request.user

        if not tiene_permiso(user, 'list_expedientes'):
            return Expediente.objects.none()

        qs = Expediente.objects.select_related('alumno', 'profesor')

        if user.role == User.Role.MAESTRO_APOYO:
            alumnos_ids = Alumno.objects.filter(profesor=user).values_list('id', flat=True)
            qs = qs.filter(alumno__id__in=alumnos_ids)

        elif user.role in [
            User.Role.PSICOLOGO,
            User.Role.TRABAJADOR_SOCIAL,
            User.Role.COMUNICACION,
            User.Role.PSICOMOTRICIDAD,
            User.Role.SECRETARIO,
            User.Role.ADMINISTRADOR,
        ]:
            pass  # Puede ver todos
        else:
            qs = qs.none()

        q = self.request.GET.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(alumno__curp__icontains=q) |
                Q(alumno__nombres__icontains=q) |
                Q(alumno__apellido_paterno__icontains=q) |
                Q(alumno__apellido_materno__icontains=q)
            )
        return qs.order_by('-fecha_subida')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        expedientes = context['expedientes']

        puede_editar_todo = (
            user.is_superuser or
            user.role in settings.ROLES_EQUIPO_ITINERANTE or
            tiene_permiso(user, 'editar_expediente')
        )

        context.update({
            'q': self.request.GET.get('q', ''),
            'puede_subir': (
                user.is_superuser or
                user.role in settings.ROLES_EQUIPO_ITINERANTE or
                user.role in [
                    User.Role.MAESTRO_APOYO,
                    User.Role.SECRETARIO,
                    User.Role.ADMINISTRADOR,
                ]
            ),
            'puede_eliminar': (
                user.is_superuser or
                user.role in [
                    User.Role.MAESTRO_APOYO,
                    User.Role.SECRETARIO,
                    User.Role.ADMINISTRADOR,
                ]
            ),
            'expedientes_editables_ids': [
                e.id for e in expedientes
                if (
                    user == e.profesor
                    or user.is_superuser
                    or user.role in settings.ROLES_EQUIPO_ITINERANTE
                    or user.role == User.Role.MAESTRO_APOYO
                )
            ],
            'breadcrumbs': [
                {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
            ],
            'current_page_title': 'Expedientes'
        })
        return context


class ExpedienteDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Expediente
    template_name = 'documentos/expedientes/confirmar_eliminar.html'
    success_url = reverse_lazy('documentos:lista_expedientes')

    def test_func(self):
        user = self.request.user
        expediente = self.get_object()
        return (
            user.is_superuser or
            user == expediente.profesor or
            (user.role in [
                User.Role.MAESTRO_APOYO,
                User.Role.SECRETARIO,
                User.Role.ADMINISTRADOR,
            ]) or
            (user.role in settings.ROLES_EQUIPO_ITINERANTE and user == expediente.profesor)
        )

    def dispatch(self, request, *args, **kwargs):
        expediente = self.get_object()
        user = request.user

        puede_eliminar = (
            user.is_superuser or
            expediente.profesor == user or
            user.role in settings.ROLES_EQUIPO_ITINERANTE
        )

        if not puede_eliminar:
            messages.error(request, "⛔ No tienes permiso para eliminar este expediente.")
            return redirect('documentos:lista_expedientes')

        return super().dispatch(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        messages.success(request, "Expediente eliminado correctamente.")
        return super().delete(request, *args, **kwargs)
