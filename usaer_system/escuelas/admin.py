from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from usuarios.admin_site import admin_site

from .models import Escuela


class NivelFilter(admin.SimpleListFilter):
    title = _("Nivel Educativo")
    parameter_name = "nivel"

    def lookups(self, request, model_admin):
        return Escuela.CLAVE_NIVELES

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(nivel=self.value())
        return queryset


class EscuelaAdmin(admin.ModelAdmin):
    list_display = ("clave_estatal", "cct", "nombre", "nivel", "telefono", "zona")

    list_filter = (
        NivelFilter,
        "zona",
    )
    search_fields = ("clave_estatal", "cct", "nombre", "zona")
    ordering = ("nombre",)

    readonly_fields = ("clave_estatal", "cct")

    fieldsets = (
        (_("Información General"), {"fields": ("clave_estatal", "cct", "nombre", "nivel")}),
        (_("Ubicación y Contacto"), {"fields": ("domicilio", "colonia", "telefono", "zona")}),
        (
            _("Datos de la Directora"),
            {"fields": ("director", "celular_director", "correo_director")},
        ),
        (
            _("Datos del Inspector"),
            {"fields": ("inspector", "telefono_inspector", "correo_inspector")},
        ),
    )


admin_site.register(Escuela, EscuelaAdmin)
