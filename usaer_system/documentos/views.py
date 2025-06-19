from django.shortcuts     import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib       import messages
from django.urls          import reverse_lazy
from django.views.generic import ListView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

from .forms import ExpedienteForm, OtroArchivoFormSet, OtroArchivoFormSetEdit
from .models import Expediente

@login_required
def subir_expediente(request):
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

    # … lógica de permisos …

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

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ['ADMIN','SECRETARIO']:
            return Expediente.objects.all().order_by('-fecha_subida')
        return Expediente.objects.filter(profesor=user).order_by('-fecha_subida')

class ExpedienteDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Expediente
    template_name = 'documentos/expedientes/confirmar_eliminar.html'
    success_url = reverse_lazy('documentos:lista_expedientes')

    def test_func(self):
        exp = self.get_object()
        return (self.request.user == exp.profesor) or self.request.user.is_superuser
