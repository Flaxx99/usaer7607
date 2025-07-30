from django.urls import path
from . import views

app_name = 'notificaciones'

urlpatterns = [
    path('api/unread/', views.get_unread_notifications, name='api_unread_notifications'),
    path('api/mark_read/<int:pk>/', views.mark_notification_as_read, name='api_mark_read'),
]