# rac/admin.py

from django.contrib import admin
from .models import RegistroRAC
from usuarios.admin_site import admin_site

class RegistroRACAdmin(admin.ModelAdmin):
    # Los campos que se mostrarán en la vista de lista del administrador.
    # Estos son los datos más importantes que quieres ver de un vistazo.
    list_display = (
        'alumno',
        'escuela_regular',
        'service_type',
        'maestro_apoyo',
        'clasificacion',
        'subclasificacion',
        'fecha_registro',
    )

    # Campos por los que podrás buscar usando la barra de búsqueda del administrador.
    # Puedes buscar en campos directos o "navegar" a través de relaciones (ej. 'alumno__nombres').
    search_fields = (
        'alumno__nombres',
        'alumno__apellido_paterno',
        'alumno__curp', # Agregamos CURP para búsqueda directa
        'escuela_regular__nombre',
        'maestro_apoyo__email',
        'maestro_apoyo__nombre',
    )

    # Filtros que aparecerán en el lateral derecho de la vista de lista,
    # permitiendo a los usuarios filtrar rápidamente los registros.
    list_filter = (
        'service_type',
        'clasificacion',
        'subclasificacion',
        'escuela_regular',
        'maestro_apoyo',
        'fecha_registro',
    )

    # Define cómo se agrupan y organizan los campos en la página de edición/creación de un RegistroRAC.
    # Mejora significativamente la usabilidad del formulario.
    fieldsets = (
        ('Datos Principales del Registro', {
            'fields': (
                'alumno',
                ('escuela_regular', 'zona_regular'), # Agrupados para una mejor visualización
                'maestro_apoyo',
                ('clasificacion', 'subclasificacion'),
            )
        }),
        ('Información del Alumno', {
            'fields': (
                ('curp', 'sexo', 'edad', 'grado'),
            ),
            'classes': ('collapse',), # Hace que esta sección sea colapsable
            'description': 'Estos campos se rellenan automáticamente al seleccionar un alumno.'
        }),
        ('Configuración del Servicio y Centro', {
            'fields': (
                'service_type',
                ('sup_especial_cct', 'sup_especial_zona'),
                ('centro_cct', 'centro_nombre'),
                'escuela_basica',
            )
        }),
        ('Observaciones Adicionales', {
            'fields': ('observaciones',),
        }),
    )

    # Campos que serán de solo lectura en el formulario de administración.
    # Esto es crucial para campos autocompletados o que se establecen automáticamente.
    readonly_fields = (
        'fecha_registro',
        'curp',
        'sexo',
        'edad',
        'grado',
        'zona_regular',
    )

    # Habilita el autocompletado para campos ForeignKey.
    # Esto mejora la experiencia de usuario cuando hay muchos objetos relacionados.
    # ¡Importante!: Para que esto funcione, el Admin del modelo relacionado (Alumno, User, Escuela)
    # debe tener definido un 'search_fields'.
    autocomplete_fields = [
        'alumno',
        'maestro_apoyo',
        'escuela_regular',
        'escuela_basica'
    ]

    # Sobrescribe el método save_model para autocompletar la información del alumno
    # cuando se crea un nuevo registro RAC.
    def save_model(self, request, obj, form, change):
        # 'change' es True si es una edición existente, False si es un nuevo objeto
        if not change:
            # Si se selecciona un alumno, rellena automáticamente sus datos
            if obj.alumno:
                obj.curp = obj.alumno.curp
                obj.sexo = obj.alumno.sexo
                # Asumiendo que `edad` y `grado_actual` son atributos o métodos en tu modelo Alumno
                obj.edad = obj.alumno.edad
                obj.grado = obj.alumno.grado_actual # Asegúrate que tu modelo Alumno tenga 'grado_actual'
                
                # Autocompleta la escuela regular y su zona desde el alumno
                if obj.alumno.escuela:
                    obj.escuela_regular = obj.alumno.escuela
                    # Asumiendo que tu modelo Escuela tiene un campo 'zona'
                    if hasattr(obj.alumno.escuela, 'zona'):
                        obj.zona_regular = obj.alumno.escuela.zona
        super().save_model(request, obj, form, change)

    # Puedes agregar otras opciones como:
    # list_per_page = 20 # Número de elementos por página en la vista de lista
    # raw_id_fields = ('alumno',) # Si prefieres un campo de texto con ID en lugar de autocomplete_fields

admin_site.register(RegistroRAC, RegistroRACAdmin)
