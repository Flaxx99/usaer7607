from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view

# --- IMPORTS PARA SWAGGER ---
from rest_framework import permissions

# Configuración de la info de tu API
schema_view = get_schema_view(
    openapi.Info(
        title="USAER 7607 API",
        default_version="v1",
        description="Documentación completa de la API para el Gestor Escolar",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="admin@usaer.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # --- DOCUMENTACIÓN SWAGGER ---
    path("swagger<format>/", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    # --- TUS ENDPOINTS ---
    path("api/usuarios/", include("usuarios.urls")),
    path("api/escuelas/", include("escuelas.urls")),
    path("api/alumnos/", include("alumnos.urls")),
    path("api/ciclos/", include("ciclos_escolares.urls")),
    path("api/avisos/", include("avisos.urls")),
    path("api/calendario/", include("calendario.urls")),
    path("api/documentos/", include("documentos.urls")),
    path("api/oficios/", include("oficios.urls")),
    path("api/notificaciones/", include("notificaciones.urls")),
    path("api/rac/", include("rac.urls")),
    path("api/rae/", include("rae.urls")),
    path("api/asistencias/", include("asistencias.urls")),
    path("api/incidencias/", include("incidencias.urls")),
    path("api/permisos/", include("permisos.urls")),
    # django-axes (brute-force protection): no requiere URLs propias en v8.x
    # Funciona vía middleware + panel de admin. Los intentos fallidos se
    # registran automáticamente.
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
