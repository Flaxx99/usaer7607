from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Alumno
from django.urls import reverse

class SexoFilter(admin.SimpleListFilter):
    title = _('Sexo')
    parameter_name = 'sexo'

    def lookups(self, request, model_admin):
        return Alumno.SEXO_CHOICES

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(sexo=self.value())
        return queryset

class ClasificacionFilter(admin.SimpleListFilter):
    title = _('Clasificación')
    parameter_name = 'clasificacion'

    def lookups(self, request, model_admin):
        return Alumno.CLASIFICACION_CHOICES

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(clasificacion=self.value())
        return queryset

@admin.register(Alumno)
class AlumnoAdmin(admin.ModelAdmin):
    list_display = (
        'apellido_paterno', 'apellido_materno', 'nombres', 'curp',
        'sexo_display', 'edad', 'grado', 'grupo', 'escuela_link', 'profesor_link', 'clasificacion_display'
    )

    list_filter = (SexoFilter, ClasificacionFilter, 'grado', 'grupo', 'escuela')
    search_fields = ('apellido_paterno', 'apellido_materno', 'nombres', 'curp', 'escuela__nombre', 'profesor__username')
    ordering = ('apellido_paterno', 'apellido_materno', 'nombres')

    fieldsets = (
        (_('Datos personales'), {
            'fields': ('apellido_paterno', 'apellido_materno', 'nombres', 'curp', 'sexo', 'edad')
        }),
        (_('Información académica'), {
            'fields': ('grado', 'grupo', 'escuela', 'profesor')
        }),
        (_('Clasificación especial'), {
            'fields': ('clasificacion', 'clasificacion_otro')
        }),
    )

    def sexo_display(self, obj):
        color = 'blue' if obj.sexo == 'H' else 'purple'
        return format_html('<span style="color: {};">{}</span>', color, obj.get_sexo_display())

    sexo_display.short_description = _('Sexo')

    def clasificacion_display(self, obj):
        color_map = {
            'DISCAPACIDAD': 'red',
            'DIFICULTADES_SEVERAS': 'orange',
            'TRASTORNOS': 'yellow',
            'APTITUDES_SOBRESALIENTES': 'green',
            'NINGUNO': 'gray',
            'OTRO': 'blue',
        }
        color = color_map.get(obj.clasificacion, 'black')
        return format_html('<span style="color: {};">{}</span>', color, obj.get_clasificacion_display())

    clasificacion_display.short_description = _('Clasificación')

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
