from django.shortcuts import redirect, render


def index(request):
    return redirect("usuarios:dashboard")


def react_app_view(request):
    return render(request, "react_app.html")
