from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from .models import Notificacion

@login_required
def get_unread_notifications(request):
    notifications = Notificacion.objects.filter(usuario=request.user, leida=False).order_by('-fecha_creacion')
    data = []
    for notification in notifications:
        data.append({
            'id': notification.id,
            'mensaje': notification.mensaje,
            'url': notification.url,
            'fecha_creacion': notification.fecha_creacion.strftime("%Y-%m-%d %H:%M:%S"),
        })
    return JsonResponse(data, safe=False)

@login_required
def mark_notification_as_read(request, pk):
    if request.method == 'POST':
        notification = get_object_or_404(Notificacion, pk=pk, usuario=request.user)
        notification.leida = True
        notification.save()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'fail', 'message': 'Invalid request method'}, status=400)