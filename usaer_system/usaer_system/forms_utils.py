# forms_utils.py

def convertir_mayusculas(cleaned_data, excluir=None):
    """
    Convierte todos los campos de texto a mayúsculas,
    excepto los que estén en la lista `excluir`.
    """
    excluir = excluir or []
    datos_normalizados = cleaned_data.copy()
    
    for campo, valor in cleaned_data.items():
        if campo not in excluir and isinstance(valor, str):
            datos_normalizados[campo] = valor.upper()
    
    return datos_normalizados
