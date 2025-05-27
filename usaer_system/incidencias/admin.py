from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Incidencia

class EstadoFilter(admin.SimpleListFilter):
    title = _('Estado')
    parameter_name = 'estado'

    def lookups(self, request, model_admin):
        return Incidencia.ESTADOS

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(estado=self.value())
        return queryset

@admin.register(Incidencia)
class IncidenciaAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'titulo', 'escuela_link', 'profesor_link', 'estado_display',
        'fecha_reporte', 'acciones'
    )

    list_filter = (EstadoFilter, 'fecha_reporte', 'escuela')
    search_fields = ('titulo', 'descripcion', 'profesor__username', 'escuela__nombre')

    readonly_fields = ('fecha_reporte',)

    fieldsets = (
        (_('Información básica'), {'fields': ('titulo', 'descripcion', 'estado')}),
        (_('Reportante'), {'fields': ('profesor', 'escuela')}),
        (_('Seguimiento'), {'fields': ('respuesta_admin',)}),
    )

    def get_queryset(self, request):
        self.request = request  # Guarda el request en la instancia
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            qs = qs.filter(escuela=request.user.escuela)
        return qs

    def estado_display(self, obj):
        color = {
            'PENDIENTE': 'orange',
            'RESUELTA': 'green',
        }.get(obj.estado, 'black')
        return format_html('<span style="color: {};">{}</span>', color, obj.get_estado_display())

    estado_display.short_description = _('Estado')

    def profesor_link(self, obj):
        if obj.profesor:
            url = reverse('admin:usuarios_user_change', args=[obj.profesor.id])
            return format_html('<a href="{}">{}</a>', url, obj.profesor.get_full_name())
        return _("Sin profesor asignado")

    profesor_link.short_description = _('Profesor')

    def escuela_link(self, obj):
        url = reverse('admin:escuelas_escuela_change', args=[obj.escuela.id])
        return format_html('<a href="{}">{}</a>', url, obj.escuela.nombre)

    escuela_link.short_description = _('Escuela')

    def acciones(self, obj):
        if obj.estado == 'PENDIENTE' and self.request.user.has_perm('incidencias.can_resolve_incidence'):
            resolver_url = reverse('admin:incidencia_resolver', args=[obj.id])
            return format_html(
                '<a class="button" href="{}" style="color: white; background-color: green; padding: 5px 10px;">{}</a>',
                resolver_url, _('Resolver')
            )
        return ''

    acciones.short_description = _('Acciones')
