from django.views.generic import ListView, CreateView, UpdateView, DeleteView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.http import HttpResponseForbidden, JsonResponse
from django.core import serializers
from django.contrib import messages
from django.contrib.auth.decorators import login_required, permission_required
from .models import EventoCalendario
from .forms import EventoForm
from django.db import models
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

# ✅ API para eventos de calendario
@login_required
def api_eventos_calendario(request):
    logger.info("API Calendario: Request received.")
    user = request.user
    eventos = EventoCalendario.objects.filter(
        models.Q(tipo='INSTITUCIONAL') |
        models.Q(tipo='PERSONAL', creado_por=user)
    ).select_related('creado_por')

    eventos_data = []
    for evento in eventos:
        eventos_data.append({
            'id': evento.id,
            'title': evento.titulo,
            'start': evento.fecha_inicio.isoformat(),
            'end': (evento.fecha_fin + timezone.timedelta(days=1)).isoformat() if evento.fecha_fin.time() == timezone.datetime.min.time() and evento.fecha_inicio.time() == timezone.datetime.min.time() else evento.fecha_fin.isoformat(),
            'allDay': evento.fecha_fin.time() == timezone.datetime.min.time() and evento.fecha_inicio.time() == timezone.datetime.min.time(), # Keep this for now, as allDay was removed
            'tipo': evento.tipo,
            'url': reverse_lazy('calendario:detalle_evento', args=[evento.id]),
            'description': evento.descripcion,
        })
    logger.info(f"API Calendario: Returning {len(eventos_data)} events.")
    logger.debug(f"API Calendario: Data: {eventos_data}") # Use debug for potentially large data
    return JsonResponse(eventos_data, safe=False)

# ✅ 1. Vista para listar eventos visibles según reglas de rol
class CalendarioListView(LoginRequiredMixin, ListView):
    model = EventoCalendario
    template_name = "calendario/lista_eventos.html"
    context_object_name = "eventos"

    def get_queryset(self):
        user = self.request.user
        queryset = EventoCalendario.objects.filter(
            models.Q(tipo='INSTITUCIONAL') |
            models.Q(tipo='PERSONAL', creado_por=user)
        )

        query = self.request.GET.get('q', '').strip()
        event_type = self.request.GET.get('tipo', '')

        if query:
            queryset = queryset.filter(
                models.Q(titulo__icontains=query) |
                models.Q(descripcion__icontains=query)
            )
        if event_type:
            queryset = queryset.filter(tipo=event_type)

        return queryset.select_related('creado_por').order_by('-fecha_inicio')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['query'] = self.request.GET.get('q', '')
        context['tipo_filtrado'] = self.request.GET.get('tipo', '')
        context['breadcrumbs'] = [
            {'name': 'Inicio', 'url': reverse_lazy('usuarios:dashboard')}
        ]
        context['current_page_title'] = 'Calendario y Eventos'
        return context

# ✅ 2. Crear un nuevo evento
class EventoCreateView(LoginRequiredMixin, CreateView):
    model = EventoCalendario
    form_class = EventoForm
    template_name = "calendario/evento_form.html"
    success_url = reverse_lazy("calendario:lista_eventos")

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["user"] = self.request.user  # Pasamos el usuario al form
        return kwargs

    def form_valid(self, form):
        form.instance.creado_por = self.request.user
        # Si no es admin o secretario, forzar tipo PERSONAL
        if not (self.request.user.is_staff or getattr(self.request.user, 'rol', '') == 'SECRETARIO'):
            form.instance.tipo = 'PERSONAL'
        messages.success(self.request, "Evento creado correctamente.")
        return super().form_valid(form)

# ✅ 3. Editar evento (solo si el usuario lo creó o es institucional con permiso)
class EventoUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = EventoCalendario
    form_class = EventoForm
    template_name = "calendario/evento_form.html"
    success_url = reverse_lazy("calendario:lista_eventos")

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["user"] = self.request.user
        return kwargs

    def form_valid(self, form):
        messages.success(self.request, "Evento actualizado correctamente.")
        return super().form_valid(form)

    def test_func(self):
        evento = self.get_object()
        # Optimización: precargar 'creado_por' para evitar N+1 en test_func
        if not hasattr(evento, '_prefetched_objects_cache') or 'creado_por' not in evento._prefetched_objects_cache:
            evento = EventoCalendario.objects.select_related('creado_por').get(pk=evento.pk)

        user = self.request.user
        # Solo puede editar si lo creó o si es admin/secretario y el evento es institucional
        return evento.creado_por == user or (
            evento.tipo == 'INSTITUCIONAL' and (user.is_staff or getattr(user, 'rol', '') == 'SECRETARIO')
        )

# ✅ 4. Eliminar evento (con mismas reglas que edición)
class EventoDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = EventoCalendario
    success_url = reverse_lazy("calendario:lista_eventos")

    def test_func(self):
        evento = self.get_object()
        # Optimización: precargar 'creado_por' para evitar N+1 en test_func
        if not hasattr(evento, '_prefetched_objects_cache') or 'creado_por' not in evento._prefetched_objects_cache:
            evento = EventoCalendario.objects.select_related('creado_por').get(pk=evento.pk)

        user = self.request.user
        return evento.creado_por == user or (
            evento.tipo == 'INSTITUCIONAL' and (user.is_staff or user.role == User.Role.SECRETARIO)
        )

    def post(self, request, *args, **kwargs):
        return self.delete(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        messages.success(request, "Evento eliminado correctamente.")
        return super().delete(request, *args, **kwargs)

# ✅ 5. Detalle del evento
class EventoDetailView(LoginRequiredMixin, DetailView):
    model = EventoCalendario
    template_name = "calendario/evento_detail.html"
    context_object_name = "evento"

    def get_queryset(self):
        return super().get_queryset().select_related('creado_por')

    def dispatch(self, request, *args, **kwargs):
        evento = self.get_object()
        # Proteger eventos personales ajenos
        if evento.tipo == 'PERSONAL' and evento.creado_por != request.user:
            return HttpResponseForbidden("No tienes permiso para ver este evento.")
        return super().dispatch(request, *args, **kwargs)
