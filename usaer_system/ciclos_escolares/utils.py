import logging

from .models import CicloEscolar

logger = logging.getLogger(__name__)


def get_current_ciclo_escolar_instance():
    """
    Intenta obtener el CicloEscolar activo para la fecha actual.
    Si no encuentra uno activo, busca el próximo ciclo y levanta una excepción
    con un mensaje informativo.
    """
    try:
        # First, try to get the cycle marked as 'active'
        active_cycle = CicloEscolar.objects.filter(activo=True).first()
        if active_cycle:
            return active_cycle

        # If no cycle is marked as active, fallback to date-based logic
        return CicloEscolar.get_current_or_next_cycle()
    except CicloEscolar.DoesNotExist as e:
        # Re-lanzamos la excepción para que la vista pueda manejarla y mostrar un mensaje de error.
        raise e
    except Exception as e:
        logger.error(f"Error inesperado en get_current_ciclo_escolar_instance: {e}")
        raise Exception("Error interno al determinar el ciclo escolar actual.")
