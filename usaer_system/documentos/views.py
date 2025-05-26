from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import ExpedienteForm
from django.contrib.auth.decorators import login_required

@login_required
def subir_expediente(request):
    if request.method == 'POST':
        form = ExpedienteForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            messages.success(request, "✅ Expediente guardado correctamente.")
            return redirect('subir_expediente')  # Puedes cambiar a 'listar_expedientes' si lo prefieres
        else:
            messages.error(request, "⚠️ Hubo errores en el formulario.")
    else:
        form = ExpedienteForm()

    return render(request, 'documentos/expedientes/subir.html', {'form': form})

def expediente_subido(request):
    return render(request, 'documentos/expedientes/subido.html')