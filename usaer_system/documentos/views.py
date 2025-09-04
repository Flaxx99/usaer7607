from django.shortcuts     import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib       import messages
from django.urls          import reverse_lazy
from django.views.generic import ListView, DeleteView
from django.contrib.auth  import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.db.models     import Q

from .forms import ExpedienteForm, OtroArchivoFormSet, OtroArchivoFormSetEdit
from .models import Expediente

User = get_user_model()

@login_required
def subir_expediente(request):
    if request.user.role not in [
        User.Role.MAESTRO_APOYO.value,
        User.Role.SECRETARIO.value,
        User.Role.ADMINISTRADOR.value,
    ]:
        messages.error(request, "🚫 No tienes permiso para subir expedientes.")
        return redirect('documentos:lista_expedientes')

    if request.method == 'POST':
        form    = ExpedienteForm(request.POST, request.FILES, user=request.user)
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
        form    = ExpedienteForm(user=request.user)
        formset = OtroArchivoFormSet()

    return render(request, 'documentos/expedientes/subir.html', {
        'form': form,
        'formset': formset,
    })

@login_required
def editar_expediente(request, pk):
    expediente = get_object_or_404(Expediente, pk=pk)
    user = request.user
    
    # --- AÑADIDO: Comprobación de permisos ---
    if not (user.is_superuser or user == expediente.profesor or user.role in [User.Role.ADMINISTRADOR.value]):
        messages.error(request, "🚫 No tienes permiso para editar este expediente.")
        return redirect('documentos:lista_expedientes')


    if request.method == 'POST':
        form    = ExpedienteForm(request.POST, request.FILES, instance=expediente, user=request.user)
        formset = OtroArchivoFormSetEdit(request.POST, request.FILES, instance=expediente)
        if form.is_valid() and formset.is_valid():
            form.save()
            formset.save()
            messages.success(request, "✅ Expediente actualizado correctamente.")
            return redirect('documentos:lista_expedientes')
        messages.error(request, "⚠️ Hay errores: revisa el formulario y los archivos.")
    else:
        form    = ExpedienteForm(instance=expediente, user=request.user)
        formset = OtroArchivoFormSetEdit(instance=expediente)

    return render(request, 'documentos/expedientes/editar.html', {
        'form': form,
        'formset': formset,
        'expediente': expediente,
    })

class ExpedienteListView(LoginRequiredMixin, ListView):
    model = Expediente
    template_name = 'documentos/expedientes/lista.html'
    context_object_name = 'expedientes'
    paginate_by = 10  # opcional: paginación

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # filtro por permisos
        if not (user.is_superuser or user.role in [User.Role.ADMINISTRADOR.value]):
            qs = qs.filter(profesor=user)

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
        ctx = super().get_context_data(**kwargs)
        ctx['q'] = self.request.GET.get('q','')
        return ctx
    
class ExpedienteDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Expediente
    template_name = 'documentos/expedientes/confirmar_eliminar.html'
    success_url = reverse_lazy('documentos:lista_expedientes')

    def test_func(self):
        exp = self.get_object()
        user = self.request.user
        return (user.is_superuser or user == exp.profesor or user.role in [User.Role.ADMINISTRADOR.value])
