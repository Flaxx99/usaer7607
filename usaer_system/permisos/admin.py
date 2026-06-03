from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from usuarios.admin_site import admin_site

from .models import Permiso


class EstadoFilter(admin.SimpleListFilter):
    title = _("Estado")
    parameter_name = "estado"

    def lookups(self, request, model_admin):
        return Permiso.Estado.choices

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(estado=self.value())
        return queryset


class TipoFilter(admin.SimpleListFilter):
    title = _("Tipo de permiso")
    parameter_name = "tipo"

    def lookups(self, request, model_admin):
        return Permiso.Tipo.choices

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(tipo=self.value())
        return queryset


class PermisoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "profesor_link",
        "escuela_link",
        "tipo_display",
        "fecha_inicio",
        "fecha_fin",
        "duracion_dias_display",
        "estado_display",
        "fecha_solicitud",
    )
    list_filter = (
        EstadoFilter,
        TipoFilter,
        "fecha_solicitud",
        "escuela",
    )
    search_fields = (
        "profesor__first_name",
        "profesor__last_name",
        "profesor__username",
        "escuela__nombre",
        "motivo",
    )
    readonly_fields = (
        "fecha_solicitud",
        "fecha_respuesta",
        "administrador",
        "escuela",
        "duracion_dias_display",
    )

    fieldsets = (
        (_("Información básica"), {"fields": ("profesor", "escuela", "tipo", "estado")}),
        (
            _("Fechas"),
            {
                "fields": (
                    "fecha_solicitud",
                    "fecha_inicio",
                    "fecha_fin",
                    "duracion_dias_display",
                    "fecha_respuesta",
                )
            },
        ),
        (_("Detalles"), {"fields": ("motivo", "respuesta_admin", "administrador")}),
    )

    def duracion_dias_display(self, obj):
        return f"{obj.duracion_dias} días"

    duracion_dias_display.short_description = _("Duración")

    def tipo_display(self, obj):
        return obj.get_tipo_display()

    tipo_display.short_description = _("Tipo")

    def estado_display(self, obj):
        color = {
            Permiso.Estado.PENDIENTE: "orange",
            Permiso.Estado.APROBADO: "green",
            Permiso.Estado.RECHAZADO: "red",
        }.get(obj.estado, "black")
        return format_html(
            '<strong style="color: {};">{}</strong>', color, obj.get_estado_display()
        )

    estado_display.short_description = _("Estado")

    def profesor_link(self, obj):
        if obj.profesor:
            url = reverse("admin:usuarios_user_change", args=[obj.profesor.id])
            return format_html('<a href="{}">{}</a>', url, obj.profesor.get_full_name())
        return _("Sin profesor asignado")

    profesor_link.short_description = _("Profesor")

    def escuela_link(self, obj):
        if obj.escuela:
            url = reverse("admin:escuelas_escuela_change", args=[obj.escuela.id])
            return format_html('<a href="{}">{}</a>', url, obj.escuela.nombre)
        return _("Sin escuela asignada")

    escuela_link.short_description = _("Escuela")


admin_site.register(Permiso, PermisoAdmin)
