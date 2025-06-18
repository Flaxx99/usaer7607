from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.generic import ListView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.core.serializers.json import DjangoJSONEncoder
import json

from .forms import ExpedienteForm
from .models import Expediente
from alumnos.models import Alumno

# Vista para subir expediente
@login_required
def subir_expediente(request):
    if request.method == 'POST':
        form = ExpedienteForm(request.POST, request.FILES, user=request.user)
        if form.is_valid():
            expediente = form.save(commit=False)
            expediente.profesor = request.user
            expediente.save()
            messages.success(request, "✅ Expediente guardado correctamente.")
            return redirect('documentos:lista_expedientes')
        else:
            messages.error(request, "⚠️ Hubo errores en el formulario.")
    else:
        form = ExpedienteForm(user=request.user)

    alumnos = form.fields['alumno'].queryset
    alumnos_json = {
        str(alumno.pk): {
            'grado': alumno.grado,
            'grupo': alumno.grupo,
            'escuela': str(alumno.escuela),
        } for alumno in alumnos
    }

    return render(request, 'documentos/expedientes/subir.html', {
        'form': form,
        'alumnos_data': json.dumps(alumnos_json, cls=DjangoJSONEncoder),
    })


# Vista para editar expediente
@login_required
def editar_expediente(request, pk):
    expediente = get_object_or_404(Expediente, pk=pk)

    if not (request.user == expediente.profesor or request.user.is_superuser):
        messages.error(request, "❌ No tienes permiso para editar este expediente.")
        return redirect('documentos:lista_expedientes')

    if request.method == 'POST':
        form = ExpedienteForm(request.POST, request.FILES, instance=expediente, user=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, "✅ Expediente actualizado correctamente.")
            return redirect('documentos:lista_expedientes')
        else:
            messages.error(request, "⚠️ Hubo errores al actualizar el expediente.")
    else:
        form = ExpedienteForm(instance=expediente, user=request.user)

    return render(request, 'documentos/expedientes/editar.html', {
        'form': form,
        'expediente': expediente
    })


# Vista para listar expedientes del usuario actual
class ExpedienteListView(LoginRequiredMixin, ListView):
    model = Expediente
    template_name = 'documentos/expedientes/lista.html'
    context_object_name = 'expedientes'

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in ['ADMIN', 'SECRETARIO']:
            return Expediente.objects.all().order_by('-fecha_subida')
        return Expediente.objects.filter(profesor=user).order_by('-fecha_subida')


# Vista para eliminar expediente
class ExpedienteDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Expediente
    template_name = 'documentos/expedientes/confirmar_eliminar.html'
    success_url = reverse_lazy('documentos:lista_expedientes')

    def test_func(self):
        expediente = self.get_object()
        return self.request.user == expediente.profesor or self.request.user.is_superuser
