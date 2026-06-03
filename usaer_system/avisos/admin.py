from django.contrib import admin

from .models import Anuncio


@admin.register(Anuncio)
class AnuncioAdmin(admin.ModelAdmin):
    list_display = ("titulo", "autor", "fecha_publicacion", "fecha_expiracion", "is_active")
    list_filter = ("fecha_publicacion", "fecha_expiracion", "autor")
    search_fields = ("titulo", "contenido")
    date_hierarchy = "fecha_publicacion"
    readonly_fields = ("autor",)

    def save_model(self, request, obj, form, change):
        if not obj.pk:  # Solo al crear el objeto
            obj.autor = request.user
        super().save_model(request, obj, form, change)
