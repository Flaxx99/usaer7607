from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse_lazy
from django.views.generic import ListView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db.models import Q

from .forms import ExpedienteForm, OtroArchivoFormSet, OtroArchivoFormSetEdit
from .models import Expediente
from documentos.utils import tiene_permiso
from alumnos.models import Alumno
from django.conf import settings


# Roles con permiso de edición total (sobre cualquier expediente)
ROLES_PUEDEN_EDITAR_TODO = [
    'PSICOMOTRICIDAD',
    'PSICOLOGO',
    'COMUNICACION',
    'TRABAJADOR_SOCIAL',
    'SECRETARIO',
    'ADMIN',
]

@login_required
def subir_expediente(request):
    if request.user.role not in ['MAESTRO_APOYO', 'SECRETARIO', 'ADMIN']:
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
    })


@login_required
def editar_expediente(request, pk):
    expediente = get_object_or_404(Expediente, pk=pk)
    user = request.user

    puede_editar = (
        user.is_superuser or
        expediente.profesor == user or
        user.role in settings.ROLES_EQUIPO_ITINERANTE or
        user.role == 'MAESTRO_APOYO'
    )

    if not puede_editar:
        messages.error(request, "⛔ No tienes permiso para editar este expediente.")
        return redirect('documentos:lista_expedientes')

    if request.method == 'POST':
        form = ExpedienteForm(request.POST, request.FILES, instance=expediente, user=user)
        formset = OtroArchivoFormSetEdit(request.POST, request.FILES, instance=expediente)

        if form.is_valid() and formset.is_valid():
            form.save()
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
        'expediente': expediente
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

        if user.role == 'MAESTRO_APOYO':
            alumnos_ids = Alumno.objects.filter(profesor=user).values_list('id', flat=True)
            qs = qs.filter(alumno__id__in=alumnos_ids)

        elif user.role in [
            'PSICOLOGO',
            'TRAB_SOCIAL',
            'COMUNICACION',
            'PSICOMOTRICIDAD',
            'SECRETARIO',
            'ADMIN',
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
                user.role in ['MAESTRO_APOYO', 'SECRETARIO', 'ADMIN']
            ),
            'puede_eliminar': (
                user.is_superuser or
                user.role in ['MAESTRO_APOYO', 'SECRETARIO', 'ADMIN']
            ),
            'expedientes_editables_ids': [
                e.id for e in expedientes
                if (
                    user == e.profesor
                    or user.is_superuser
                    or user.role in settings.ROLES_EQUIPO_ITINERANTE
                    or user.role == 'MAESTRO_APOYO'
                )
            ],
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
            user.role in ['ADMIN', 'SECRETARIO', 'MAESTRO_APOYO'] or
            (user.role in settings.ROLES_EQUIPO_ITINERANTE and user == expediente.profesor)
        )

    def dispatch(self, request, *args, **kwargs):
        if not self.test_func():
            messages.error(request, "⛔ No tienes permiso para eliminar este expediente.")
            return redirect('documentos:lista_expedientes')
        return super().dispatch(request, *args, **kwargs)