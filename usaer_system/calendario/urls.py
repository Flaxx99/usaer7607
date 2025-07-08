from django.urls import path
from . import views

app_name = "calendario"

urlpatterns = [
    path('', views.CalendarioListView.as_view(), name='lista_eventos'),
    path('crear/', views.EventoCreateView.as_view(), name='crear_evento'),
    path('<int:pk>/', views.EventoDetailView.as_view(), name='detalle_evento'),
    path('<int:pk>/editar/', views.EventoUpdateView.as_view(), name='editar_evento'),
    path('<int:pk>/eliminar/', views.EventoDeleteView.as_view(), name='eliminar_evento'),
]
