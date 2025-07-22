from django.urls import path
from . import views

app_name = 'avisos'

urlpatterns = [
    path('', views.AnuncioListView.as_view(), name='lista_anuncios'),
    path('<int:pk>/', views.anuncio_detail, name='detalle_anuncio'),
    path('nuevo/', views.AnuncioCreateView.as_view(), name='nuevo_anuncio'),
]