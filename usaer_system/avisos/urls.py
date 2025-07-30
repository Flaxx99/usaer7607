from django.urls import path
from django.views.decorators.cache import cache_page
from . import views

app_name = 'avisos'

urlpatterns = [
    path('', cache_page(60 * 5)(views.AnuncioListView.as_view()), name='lista_anuncios'),
    path('<int:pk>/', views.anuncio_detail, name='detalle_anuncio'),
    path('nuevo/', views.AnuncioCreateView.as_view(), name='nuevo_anuncio'),
    path('<int:pk>/editar/', views.AnuncioUpdateView.as_view(), name='editar_anuncio'),
    path('<int:pk>/eliminar/', views.AnuncioDeleteView.as_view(), name='eliminar_anuncio'),
]