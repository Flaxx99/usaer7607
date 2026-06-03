from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Manejador global de excepciones para estandarizar todas las respuestas de error.
    """
    # Obtiene la respuesta estándar de DRF
    response = exception_handler(exc, context)

    if response is not None:
        # Extraemos la información del error
        original_data = response.data
        message = "Ha ocurrido un error inesperado."
        errors = None
        code = "SERVER_ERROR"

        # Si el error es de validación (400), el formato es un diccionario de campos
        if isinstance(original_data, dict):
            # Verificamos si hay una llave 'detail' (error general)
            if "detail" in original_data:
                message = original_data["detail"]
                # Si hay otros campos aparte de 'detail', son errores de validación
                if len(original_data) > 1:
                    errors = {k: v for k, v in original_data.items() if k != "detail"}
            else:
                # Es un error de validación pura (campos)
                message = "Error de validación en los datos enviados."
                errors = original_data

            # Intentamos generar un código de error basado en el status
            code = f"ERROR_{response.status_code}"
        else:
            # Si es una lista o un string simple
            message = str(original_data)

        # Construimos la respuesta estandarizada
        custom_data = {
            "status": "error",
            "message": message,
            "code": code,
        }
        if errors:
            custom_data["errors"] = errors

        response.data = custom_data

    return response
