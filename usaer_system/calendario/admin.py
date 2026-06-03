from django.contrib import admin

from .models import EventoCalendario


@admin.register(EventoCalendario)
class EventoCalendarioAdmin(admin.ModelAdmin):
    list_display = ("titulo", "tipo", "fecha_inicio", "fecha_fin", "creado_por")
    list_filter = ("tipo", "fecha_inicio")
    search_fields = ("titulo", "descripcion")
    readonly_fields = ("creado_por",)
    date_hierarchy = "fecha_inicio"

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.creado_por = request.user
        super().save_model(request, obj, form, change)
