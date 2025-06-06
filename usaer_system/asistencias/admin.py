from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Asistencia

class PresenteFilter(admin.SimpleListFilter):
    title = _('Presencia')
    parameter_name = 'presente'

    def lookups(self, request, model_admin):
        return [
            (True, _('Presente')),
            (False, _('Ausente'))
        ]

    def queryset(self, request, queryset):
        if self.value() is not None:
            return queryset.filter(presente=self.value())
        return queryset

@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = (
        'profesor_link', 'escuela_link', 'fecha', 'presente_display', 
        'hora_entrada', 'hora_salida', 'created_at'
    )

    list_filter = (PresenteFilter, 'fecha', 'escuela')
    search_fields = ('profesor__first_name', 'profesor__last_name', 'escuela__nombre')
    ordering = ('-fecha',)

    fieldsets = (
        (_('Información General'), {
            'fields': ('profesor', 'escuela', 'fecha', 'presente')
        }),
        (_('Horarios'), {
            'fields': ('hora_entrada', 'hora_salida')
        }),
        (_('Registro'), {
            'fields': ('created_at',)
        }),
    )

    readonly_fields = ('created_at',)

    def presente_display(self, obj):
        color = 'green' if obj.presente else 'red'
        texto = _('Presente') if obj.presente else _('Ausente')
        return format_html('<span style="color: {};">{}</span>', color, texto)

    presente_display.short_description = _('Presente')

    def profesor_link(self, obj):
        if obj.profesor:
            return format_html('<a href="{}">{}</a>', reverse('admin:usuarios_user_change', args=[obj.profesor.id]), obj.profesor.get_full_name())
        return _("Sin profesor asignado")

    profesor_link.short_description = _('Profesor')

    def escuela_link(self, obj):
        return format_html('<a href="{}">{}</a>', reverse('admin:escuelas_escuela_change', args=[obj.escuela.id]), obj.escuela.nombre)

    escuela_link.short_description = _('Escuela')
