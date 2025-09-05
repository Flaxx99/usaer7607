from django.apps import AppConfig


class PermisosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'permisos'

    def ready(self):
        import permisos.signals  # noqa
