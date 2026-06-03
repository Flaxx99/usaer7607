# debug_rae.py
# Guarda este archivo en la raíz de tu proyecto Django (al mismo nivel que manage.py)

import os
from datetime import (
    date,  # date se puede importar aquí o más abajo, no interactúa con Django settings
)

import django

# --- Configurar el entorno de Django ---
# Estas líneas DEBEN ir antes de CUALQUIER importación de modelos de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "usaer_system.settings")
django.setup()

# --- Ahora sí, importa tus modelos de Django ---
# Importaciones de modelos deben ir DESPUÉS de django.setup()
from alumnos.models import Alumno
from django.contrib.auth import get_user_model
from rae.models import CicloEscolar, RAEAlumno, RegistroRAE

User = get_user_model()

# --- 1. Verificar el usuario logueado (simulando request.user) ---
print("\n--- Verificación del Usuario Logueado ---")
try:
    # AJUSTA ESTA LÍNEA CON EL CORREO ELECTRÓNICO REAL DE LA MAESTRA ELIDA
    # Según la imagen, es 'elida.baeza.gar@chih.nuevaescuela.mx'
    maestra_logueada = User.objects.get(email="elida.baeza.gar@chih.nuevaescuela.mx")
    print(
        f"Usuario logueado simulado: {maestra_logueada.get_full_name()} (ID: {maestra_logueada.id}, Email: {maestra_logueada.email})"
    )
    if maestra_logueada.escuela:
        print(
            f"Escuela de la maestra: {maestra_logueada.escuela.nombre} (ID: {maestra_logueada.escuela.id})"
        )
    else:
        print("La maestra no tiene una escuela asignada en su perfil.")
except User.DoesNotExist:
    print("ERROR: No se pudo encontrar el usuario de Elida. Por favor, verifica el email.")
    maestra_logueada = None  # Para evitar errores posteriores

if not maestra_logueada:
    print("Saliendo de la depuración, usuario no encontrado.")
else:
    # --- 2. Verificar alumnos asociados al usuario ---
    print("\n--- Verificación de Alumnos Asociados ---")
    # Filtra por el campo 'profesor' del modelo Alumno, que debe apuntar al User
    alumnos_asociados = Alumno.objects.filter(profesor=maestra_logueada)
    if alumnos_asociados.exists():
        print(
            f"Se encontraron {alumnos_asociados.count()} alumnos asociados a {maestra_logueada.get_full_name()}:"
        )
        for alumno in alumnos_asociados:
            print(
                f"  - ID: {alumno.id}, Nombre: {alumno.nombres} {alumno.apellido_paterno}, Grado: {alumno.grado}, Grupo: {alumno.grupo}, Escuela: {alumno.escuela.nombre if alumno.escuela else 'N/A'}"
            )
    else:
        print(
            f"¡ADVERTENCIA! No se encontraron alumnos asociados a {maestra_logueada.get_full_name()} en la base de datos."
        )

    # --- 3. Verificar el ciclo escolar actual ---
    print("\n--- Verificación del Ciclo Escolar Actual ---")
    today = date.today()
    current_ciclo = None
    try:
        current_ciclo = (
            CicloEscolar.objects.filter(fecha_inicio__lte=today, fecha_fin__gte=today)
            .order_by("-fecha_inicio")
            .first()
        )
        if current_ciclo:
            print(
                f"Ciclo Escolar Actual detectado: ID {current_ciclo.id}, Nombre: '{current_ciclo.nombre}', Rango: {current_ciclo.fecha_inicio} a {current_ciclo.fecha_fin}"
            )
        else:
            print(
                f"¡ADVERTENCIA! No se encontró un Ciclo Escolar activo para la fecha actual ({today}). Esto podría ser el problema."
            )
            print("Verifica las fechas de tus CicloEscolar en el admin de Django.")
            next_ciclo = (
                CicloEscolar.objects.filter(fecha_inicio__gt=today).order_by("fecha_inicio").first()
            )
            if next_ciclo:
                print(
                    f"Próximo ciclo escolar encontrado: ID {next_ciclo.id}, Nombre: '{next_ciclo.nombre}' (Inicia: {next_ciclo.fecha_inicio})"
                )
            else:
                print("No se encontraron ciclos escolares futuros.")
    except Exception as e:
        print(f"ERROR al obtener el ciclo escolar: {e}")

    if current_ciclo:
        # --- 4. Verificar o crear RegistroRAE para la escuela y el ciclo actual ---
        print("\n--- Verificación de RegistroRAE ---")
        if hasattr(maestra_logueada, "escuela") and maestra_logueada.escuela:
            escuela_maestra = maestra_logueada.escuela

            registro_rae, created_registro = RegistroRAE.objects.get_or_create(
                escuela=escuela_maestra,
                ciclo_escolar=current_ciclo,
                defaults={
                    "creado_por": maestra_logueada
                },  # Asegúrate de que este 'creado_por' es correcto
            )
            if created_registro:
                print(
                    f"¡Nuevo RegistroRAE creado! ID: {registro_rae.id} para {escuela_maestra.nombre} en el ciclo '{current_ciclo.nombre}'. Creado por: {registro_rae.creado_por.get_full_name()}"
                )
            else:
                print(
                    f"RegistroRAE existente encontrado. ID: {registro_rae.id} para {escuela_maestra.nombre} en el ciclo '{current_ciclo.nombre}'. Creado por: {registro_rae.creado_por.get_full_name()}"
                )

            # --- 5. Verificar o crear RAEAlumno para el RegistroRAE y los alumnos asociados ---
            print("\n--- Verificación de RAEAlumno y su creación ---")

            # Esto simula la lógica de get_queryset en CapturaRAEView
            rae_alumnos_forms_data = []
            for alumno in alumnos_asociados:
                rae_alumno_instance, created_rae_alumno = RAEAlumno.objects.get_or_create(
                    registro=registro_rae,
                    alumno=alumno,
                    defaults={
                        "capturado_por": maestra_logueada,  # Este debe ser el usuario logueado
                        "curp": alumno.curp,
                        "genero": alumno.sexo,
                        "edad": alumno.edad,
                        "grado": f"{alumno.grado}°{alumno.grupo}",
                    },
                )
                if created_rae_alumno:
                    print(
                        f"  - CREADO: RAEAlumno ID {rae_alumno_instance.id} para {alumno.nombres} {alumno.apellido_paterno}."
                    )
                else:
                    print(
                        f"  - EXISTENTE: RAEAlumno ID {rae_alumno_instance.id} para {alumno.nombres} {alumno.apellido_paterno}. Grado: {rae_alumno_instance.grado}"
                    )

                # Aquí se añadirían a la lista que la vista pasa al formulario
                rae_alumnos_forms_data.append(rae_alumno_instance)

            print(
                f"Total de objetos RAEAlumno (nuevos o existentes) procesados: {len(rae_alumnos_forms_data)}"
            )
            if not rae_alumnos_forms_data:
                print(
                    "¡ADVERTENCIA! Ningún objeto RAEAlumno fue generado para mostrar en la vista."
                )

        else:
            print(
                "ERROR: El usuario de la maestra no tiene una escuela asociada. No se puede procesar RegistroRAE."
            )
    else:
        print("No se puede verificar RegistroRAE y RAEAlumno sin un Ciclo Escolar actual.")

print("\n--- Fin de la Depuración ---")
