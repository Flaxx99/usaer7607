import traceback

from alumnos.models import Alumno
from django.db import transaction
from rest_framework import permissions, views, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

# Modelos
from .models import CicloEscolar

# Serializers
from .serializers import CicloEscolarSerializer, PromocionPreviewSerializer


class IsAdminOrSecretario(permissions.BasePermission):
    """Administradores y Secretarios pueden gestionar ciclos (coincide con el frontend)."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", "") in [
            "ADMIN",
            "SECRETARIO",
        ]


class CicloEscolarViewSet(viewsets.ModelViewSet):
    queryset = CicloEscolar.objects.all().order_by("-fecha_inicio")
    serializer_class = CicloEscolarSerializer
    permission_classes = [IsAdminOrSecretario]

    @action(detail=False, methods=["get"])
    def activo(self, request):
        """Endpoint para obtener el ciclo activo."""
        try:
            ciclo = CicloEscolar.objects.get(activo=True)
            serializer = self.get_serializer(ciclo)
            return Response(serializer.data)
        except CicloEscolar.DoesNotExist:
            return Response({"detail": "No hay ciclo activo configurado."}, status=404)


class PromocionAlumnosView(views.APIView):
    """
    Gestiona la promoción masiva.
    GET: Simulación (Preview)
    POST: Ejecución Real (Commit)
    """

    permission_classes = [IsAdminOrSecretario]

    def initial(self, request, *args, **kwargs):
        """bulk_write solo aplica al POST (commit), no al GET (preview)."""
        if request.method == "POST":
            self.throttle_scope = "bulk_write"
        super().initial(request, *args, **kwargs)

    def get_nivel_alumno(self, alumno):
        """
        Busca el nivel educativo.
        Como el modelo Alumno no tiene 'nivel', lo buscamos en su Escuela.
        """
        try:
            # Validamos que tenga escuela asignada y que la escuela tenga el campo nivel
            if alumno.escuela and hasattr(alumno.escuela, "nivel"):
                return str(alumno.escuela.nivel).upper()
        except Exception:
            pass

        return "PRIMARIA"  # Default seguro si algo falla

    def get_max_grado(self, nivel_str):
        """Devuelve el grado máximo según el nivel detectado."""
        n = str(nivel_str).upper()
        if "PREESCOLAR" in n:
            return 3
        if "SECUNDARIA" in n:
            return 3
        if "TELESECUNDARIA" in n:
            return 3
        return 6  # Primaria y default

    def get_alumnos_data(self):
        """Calcula la lógica de promoción sin guardar."""
        # Filtramos alumnos activos.
        # Nota: Tu modelo tiene activo=True por default, así que esto es correcto.
        alumnos_activos = Alumno.objects.filter(activo=True)

        resultado = {"promover": [], "graduar": [], "errores": []}

        for alumno in alumnos_activos:
            # 1. CORRECCIÓN NOMBRE: Usamos tu método del modelo o el campo 'nombres' (plural)
            nombre_str = alumno.get_full_name()  # Tu modelo ya tiene este método, ¡usémoslo!

            try:
                # 2. Validación de grado
                if not alumno.grado:
                    continue

                # Limpieza de grado (tu modelo usa choices '1', '2', etc, pero prevenimos basura)
                numeros = "".join(filter(str.isdigit, str(alumno.grado)))
                if not numeros:
                    raise ValueError(f"Grado inválido: {alumno.grado}")

                grado_actual = int(numeros)

                # 3. CORRECCIÓN NIVEL: Buscamos el nivel en la ESCUELA
                nivel_detectado = self.get_nivel_alumno(alumno)
                tope_grado = self.get_max_grado(nivel_detectado)

                if grado_actual >= tope_grado:
                    resultado["graduar"].append(
                        f"{nombre_str} ({nivel_detectado} {grado_actual}° -> Egresado)"
                    )
                else:
                    resultado["promover"].append(
                        f"{nombre_str} ({nivel_detectado} {grado_actual}° -> {grado_actual + 1}°)"
                    )

            except Exception as e:
                print(f"Error procesando alumno {alumno.id}: {e}")
                resultado["errores"].append(f"{nombre_str}: {str(e)}")

        return resultado

    def get(self, request):
        """Simulación (Preview)"""
        try:
            data = self.get_alumnos_data()

            response_data = {
                "total_activos": Alumno.objects.activos().count(),
                "a_promover_count": len(data["promover"]),
                "a_graduar_count": len(data["graduar"]),
                "errores_count": len(data["errores"]),
                "detalles_promover": data["promover"],
                "detalles_graduar": data["graduar"],
                "detalles_errores": data["errores"],
            }

            serializer = PromocionPreviewSerializer(response_data)
            return Response(serializer.data)
        except Exception as e:
            print("!!! ERROR CRITICO EN PROMOCION (GET) !!!")
            traceback.print_exc()
            return Response({"detail": f"Error interno: {str(e)}"}, status=500)

    def post(self, request):
        """Ejecución Real"""
        if not request.data.get("confirmed"):
            return Response({"detail": "Se requiere confirmar la acción."}, status=400)

        with transaction.atomic():
            alumnos_activos = Alumno.objects.activos()
            promovidos = 0
            graduados = 0

            for alumno in alumnos_activos:
                try:
                    if not alumno.grado:
                        continue
                    numeros = "".join(filter(str.isdigit, str(alumno.grado)))
                    if not numeros:
                        continue

                    grado_actual = int(numeros)

                    # Detectar nivel
                    nivel_detectado = self.get_nivel_alumno(alumno)
                    tope_grado = self.get_max_grado(nivel_detectado)

                    if grado_actual >= tope_grado:
                        # Graduación (Baja lógica)
                        alumno.activo = False
                        # Tu modelo no tiene campo 'situacion', así que solo lo desactivamos.
                        graduados += 1
                    else:
                        # Promoción
                        alumno.grado = str(grado_actual + 1)
                        # Tu modelo tiene campo 'grupo', lo limpiamos al cambiar de grado
                        alumno.grupo = ""
                        promovidos += 1

                    alumno.save()
                except Exception:
                    continue

            # Desactivar ciclo actual
            CicloEscolar.objects.filter(activo=True).update(activo=False)

            return Response(
                {
                    "status": "success",
                    "detail": f"Proceso finalizado. {promovidos} promovidos, {graduados} graduados.",
                    "promovidos": promovidos,
                    "graduados": graduados,
                }
            )
