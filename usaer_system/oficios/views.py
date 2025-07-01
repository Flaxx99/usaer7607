import os
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from .models import Oficio
from .forms import OficioForm

@login_required
def lista_oficios(request):
    oficios = Oficio.objects.all().order_by('-fecha_subida')
    return render(request, 'oficios/lista.html', {'oficios': oficios})

@login_required
def subir_oficio(request):
    if request.method == 'POST':
        form = OficioForm(request.POST, request.FILES)
        if form.is_valid():
            oficio = form.save(commit=False)
            oficio.subido_por = request.user
            oficio.save()
            return redirect('oficios:lista_oficios')
    else:
        form = OficioForm()
    return render(request, 'oficios/subir.html', {'form': form})

@login_required
@require_http_methods(["GET", "POST"])
def editar_oficio(request, pk):
    oficio = get_object_or_404(Oficio, pk=pk)
    archivo_anterior = oficio.archivo.name if oficio.archivo else None

    if request.method == 'POST':
        form = OficioForm(request.POST, request.FILES, instance=oficio)
        if form.is_valid():
            # Verificamos si se cargó un nuevo archivo
            nuevo_archivo = request.FILES.get('archivo')
            if nuevo_archivo and archivo_anterior:
                if oficio.archivo.storage.exists(archivo_anterior):
                    oficio.archivo.storage.delete(archivo_anterior)
            form.save()
            return redirect('oficios:lista_oficios')
    else:
        form = OficioForm(instance=oficio)
    return render(request, 'oficios/editar.html', {'form': form, 'oficio': oficio})

@login_required
@require_http_methods(["GET", "POST"])
def eliminar_oficio(request, pk):
    oficio = get_object_or_404(Oficio, pk=pk)
    if request.method == 'POST':
        oficio.delete()
        return redirect('oficios:lista_oficios')
    return render(request, 'oficios/confirmar_eliminacion.html', {'oficio': oficio})
