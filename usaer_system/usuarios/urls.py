from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    path('', views.UserListView.as_view(), name='list'),
    path('nuevo/', views.UserCreateView.as_view(), name='create'),
    path('<int:pk>/', views.UserDetailView.as_view(), name='detail'),
    path('<int:pk>/editar/', views.UserUpdateView.as_view(), name='update'),
    path('<int:pk>/eliminar/', views.UserDeleteView.as_view(), name='delete'),
    path('<int:pk>/toggle-active/', views.toggle_user_active, name='toggle_active'),
    path('perfil/', views.profile, name='profile'),
    path('cambiar-contrasena/', views.change_password, name='change_password'),
]