from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Escuela

class NivelFilter(admin.SimpleListFilter):
    title = _('Nivel Educativo')
    parameter_name = 'nivel'

    def lookups(self, request, model_admin):
        return Escuela.CLAVE_NIVELES

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(nivel=self.value())
        return queryset

@admin.register(Escuela)
class EscuelaAdmin(admin.ModelAdmin):
    list_display = (
        'clave_estatal', 'clave_federal', 'nombre', 'nivel',
        'telefono', 'zona'
    )

    list_filter = (NivelFilter, 'zona',)
    search_fields = ('clave_estatal', 'clave_federal', 'nombre', 'zona')
    ordering = ('nombre',)

    readonly_fields = ('clave_estatal', 'clave_federal')

    fieldsets = (
        (_('Información General'), {
            'fields': ('clave_estatal', 'clave_federal', 'nombre', 'nivel')
        }),
        (_('Ubicación y Contacto'), {
            'fields': ('domicilio', 'colonia', 'telefono', 'zona')
        }),
        (_('Datos de la Directora'), {
            'fields': ('directora', 'cel_directora', 'correo_directora')
        }),
        (_('Datos del Inspector'), {
            'fields': ('inspector', 'tel_inspector', 'correo_inspector')
        }),
    )
