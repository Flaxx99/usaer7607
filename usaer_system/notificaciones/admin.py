from django.contrib import admin

from .models import Notificacion


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ("usuario", "mensaje", "leida", "fecha_creacion", "url")
    list_filter = ("leida", "fecha_creacion", "usuario")
    search_fields = ("usuario__email", "mensaje")
    raw_id_fields = ("usuario",)
    date_hierarchy = "fecha_creacion"
