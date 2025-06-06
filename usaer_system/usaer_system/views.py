from django.shortcuts import redirect

def index(request):
    return redirect('asistencias:checar_asistencia')