from django.urls import path
from . import views

app_name = 'permisos'
# urls.py
urlpatterns = [
    path('solicitar/', views.solicitar_permiso, name='solicitar'),
    path('mis-permisos/', views.mis_permisos, name='mis_permisos'),
    path('gestion/', views.gestionar_permisos, name='gestionar'),
    path('<int:pk>/', views.detalle_permiso, name='detalle'),
    path('<int:pk>/responder/', views.responder_permiso, name='responder'),
    path('<int:pk>/eliminar/', views.eliminar_permiso, name='eliminar'),
]
