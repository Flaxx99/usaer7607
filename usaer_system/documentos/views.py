from django.shortcuts import render

def listar_rae(request):
    """Vista para listar Registros de Acompañamiento Educativo"""
    context = {
        'titulo': 'Registros de Acompañamiento Educativo'
    }
    return render(request, 'documentos/listar_rae.html', context)