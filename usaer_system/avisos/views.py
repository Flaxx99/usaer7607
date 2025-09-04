from django.shortcuts import render, get_object_or_404
from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse_lazy
from django.utils import timezone
from django.db import models
from django.contrib import messages

from .models import Anuncio
from .forms import AnuncioForm

from django.views.decorators.cache import cache_page

# ... (resto de imports)


class AnuncioListView(LoginRequiredMixin, ListView):
    model = Anuncio
    template_name = 'avisos/lista_anuncios.html'
    context_object_name = 'anuncios'
    paginate_by = 10

    def get_queryset(self):
        # Solo mostrar anuncios activos (no expirados y ya publicados)
        return Anuncio.objects.filter(
            (models.Q(fecha_expiracion__gte=timezone.now()) | models.Q(fecha_expiracion__isnull=True)),
            fecha_publicacion__lte=timezone.now()
        ).order_by('-fecha_publicacion')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ]
        context['current_page_title'] = 'Tablón de Anuncios'
        return context

def anuncio_detail(request, pk):
    anuncio = get_object_or_404(Anuncio, pk=pk)
    return render(request, 'avisos/detalle_anuncio.html', {
        'anuncio': anuncio,
        'breadcrumbs': [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Tablón de Anuncios', 'url': reverse_lazy('avisos:lista_anuncios')}
        ],
        'current_page_title': anuncio.titulo
    })

class AnuncioCreateView(LoginRequiredMixin, CreateView):
    model = Anuncio
    form_class = AnuncioForm
    template_name = 'avisos/formulario_anuncio.html'
    success_url = reverse_lazy('avisos:lista_anuncios')

    def form_valid(self, form):
        form.instance.autor = self.request.user
        messages.success(self.request, "Anuncio creado exitosamente.")
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Tablón de Anuncios', 'url': reverse_lazy('avisos:lista_anuncios')}
        ]
        context['current_page_title'] = 'Crear Nuevo Anuncio'
        return context


class AnuncioUpdateView(LoginRequiredMixin, UpdateView):
    model = Anuncio
    form_class = AnuncioForm
    template_name = 'avisos/formulario_anuncio.html'
    success_url = reverse_lazy('avisos:lista_anuncios')

    def form_valid(self, form):
        messages.success(self.request, "Anuncio actualizado exitosamente.")
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Tablón de Anuncios', 'url': reverse_lazy('avisos:lista_anuncios')}
        ]
        context['current_page_title'] = 'Editar Anuncio'
        return context


class AnuncioDeleteView(LoginRequiredMixin, DeleteView):
    model = Anuncio
    template_name = 'avisos/confirm_delete_anuncio.html'
    success_url = reverse_lazy('avisos:lista_anuncios')

    def post(self, request, *args, **kwargs):
        return self.delete(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        messages.success(self.request, "Anuncio eliminado exitosamente.")
        return super().delete(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')},
            {'name': 'Tablón de Anuncios', 'url': reverse_lazy('avisos:lista_anuncios')}
        ]
        context['current_page_title'] = 'Eliminar Anuncio'
        return context