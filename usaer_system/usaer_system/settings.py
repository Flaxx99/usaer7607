from pathlib import Path
from django.contrib.auth import get_user_model
import os
import dj_database_url
from dotenv import load_dotenv

load_dotenv() # Carga las variables de entorno desde .env

BASE_DIR = Path(__file__).resolve().parent.parent

# Asegurarse de que el directorio de logs exista
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Retrieve secret key from environment for production. A fallback key is
# provided for development environments.
SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-!8659yl2gf6**0m*l05cuq1%maailzw$nu*x7wmt&+pix39evh",
)
# En producción, DEBUG debe ser False. Se lee de una variable de entorno.
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# Configuraciones de seguridad para producción
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Lee los hosts permitidos de una variable de entorno.
# En producción, debes poner aquí tu dominio, ej: 'www.misitio.com'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')


AUTH_USER_MODEL = 'usuarios.User'

AUTHENTICATION_BACKENDS = [
    'usuarios.backends.EmailOrEmpleadoBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Merged INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # 3rd Party
    'crispy_forms',
    'crispy_bootstrap5',
    
    # Mis Apps
    'usuarios',
    'alumnos',
    'escuelas',
    'asistencias',
    'incidencias',
    'permisos',
    'documentos',
    'oficios',
    'rac',
    'rae',
    'calendario',
    'avisos',
    'notificaciones',
    'ciclos_escolares',

    #API
    'rest_framework',
    'corsheaders',
    'drf_yasg'
]

ADMIN_FOR_MODELS = False 
SILENCED_SYSTEM_CHECKS = [
    'admin.E039', # Silencia el error sobre autocomplete_fields que no encuentra un admin registrado
]

CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Middleware de Whitenoise
    'django.middleware.gzip.GZipMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'usaer_system.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.debug',
                'usuarios.context_processors.permisos_usuario',
            ],
        },
    },
]

WSGI_APPLICATION = 'usaer_system.wsgi.application'

# Configuración de base de datos usando dj-database-url
# En producción, se usará la variable de entorno DATABASE_URL
# ej: postgres://user:password@host:port/dbname
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'usaer_system.validators.CustomPasswordValidator',
    },
]

LANGUAGE_CODE = 'es-mx'
TIME_ZONE = 'America/Chihuahua'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Almacenamiento de estáticos mejorado por Whitenoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/usuarios/redireccion/'
LOGOUT_REDIRECT_URL = '/'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]

REST_FRAMEWORK = {
    # Usaremos autenticación por Sesión (útil para el admin navegable) 
    # y Basic (para pruebas rápidas). 
    # Más adelante podemos agregar Tokens (JWT) para tu frontend en React/Vue.
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    # Por defecto, todo requiere estar logueado. 
    # Nosotros abriremos endpoints específicos manualmente si es necesario.
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # Configuración de paginación (clave para tablas grandes de alumnos/asistencias)
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    
    # Formato de fecha (opcional, pero recomendado para estandarizar)
    'DATETIME_FORMAT': "%Y-%m-%d %H:%M:%S",
}

# ------------------- PERMISOS POR ROL -------------------

ROLE_PERMISSIONS = {
    'ADMIN': [
        'create_user', 'list_users', 'edit_user', 'delete_user',
        'create_escuela', 'list_escuelas', 'edit_escuela', 'delete_escuela',
        'create_alumno', 'list_alumnos', 'edit_alumno', 'delete_alumno',
        'list_ciclos_escolares', 'promover_alumnos',
        # RAE/RAC
        'ver_rac',
        'nuevo_rac',
        'ver_rae',
        'nuevo_rae',
        'ver_rae_registros',
        'exportar_rae',
        # Expedientes CRUD + descarga oficial
        'create_expediente', 'list_expedientes', 'edit_expediente', 'delete_expediente',
        'download_official_docs',
        'create_incidencia', 'list_incidencias', 'edit_incidencia', 'delete_incidencia',
        'create_permiso', 'list_my_permisos', 'manage_permisos',
        'check_asistencia', 'list_asistencias',
        'upload_oficios', 'list_oficios', 'view_calendario',
        'list_avisos', 'create_aviso',
    ],

    'SECRETARIO': [
        'create_user', 'list_users', 'edit_user', 'delete_user',
        'create_escuela', 'list_escuelas', 'edit_escuela', 'delete_escuela',
        'list_ciclos_escolares', 'promover_alumnos',
        # RAE/RAC
        'ver_rac',
        'nuevo_rac',
        'ver_rae',
        'nuevo_rae',
        'ver_rae_registros',
        'exportar_rae',
        # Expedientes CRUD + descarga oficial
        'create_expediente', 'list_expedientes', 'edit_expediente', 'delete_expediente',
        'download_official_docs',
        'create_permiso', 'list_my_permisos', 'manage_permisos',
        'check_asistencia', 'list_asistencias',
        'upload_oficios', 'list_oficios', 'view_calendario',
        'list_avisos', 'create_aviso',
    ],

    'MAESTRO_APOYO': [
        'create_alumno', 'list_alumnos', 'edit_alumno',
        # RAE/RAC
        'ver_rac',
        'nuevo_rac',
        'ver_rae',
        'nuevo_rae',
        'ver_rae_registros',
        #'exportar_rae',
        # Expedientes CRUD + descarga oficial
        'create_expediente', 'list_expedientes', 'edit_expediente', 'delete_expediente',
        'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios', 'view_calendario',
        'list_avisos',
    ],

    'TRAB_SOCIAL': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios', 'view_calendario',
        'list_avisos',
    ],

    'PSICOLOGO': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios', 'view_calendario',
        'list_avisos',
    ],

    'PSICOMOTRICIDAD': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios', 'view_calendario',
        'list_avisos',
    ],

    'COMUNICACION': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios', 'view_calendario',
        'list_avisos',
    ],

    'TRAB_MANUAL': [
        'download_official_docs', 'list_expedientes',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios', 'view_calendario',
        'list_avisos',
    ],

    'DIRECTOR': [
        'list_incidencias', 'view_calendario',
        'list_avisos',
    ],
}

# ------------------- DASHBOARD -------------------

DASHBOARD_MODULES = [
    {
        'key': 'create_user',
        'title': 'Crear Usuario',
        'url_name': 'usuarios:create',
        'icon': 'fas fa-user-plus text-primary',
    },
    {
        'key': 'list_users',
        'title': 'Listar Usuarios',
        'url_name': 'usuarios:list',
        'icon': 'fas fa-users text-primary',
    },
    {
        'key': 'create_escuela',
        'title': 'Crear Escuela',
        'url_name': 'escuelas:crear_escuela',
        'icon': 'fas fa-school text-success',
    },
    {
        'key': 'list_escuelas',
        'title': 'Listar Escuelas',
        'url_name': 'escuelas:listar_escuelas',
        'icon': 'fas fa-school text-success',
    },
    {
        'key': 'create_alumno',
        'title': 'Crear Alumno',
        'url_name': 'alumnos:crear_alumno',
        'icon': 'fas fa-user-graduate text-info',
    },
    {
        'key': 'list_alumnos',
        'title': 'Listar Alumnos',
        'url_name': 'alumnos:listar_alumnos',
        'icon': 'fas fa-users text-info',
    },
    {
        'key': 'create_expediente',
        'title': 'Crear Expediente',
        'url_name': 'documentos:subir_expediente',
        'icon': 'fas fa-file-upload text-primary',
    },
    {
        'key': 'list_expedientes',
        'title': 'Listar Expedientes',
        'url_name': 'documentos:lista_expedientes',
        'icon': 'fas fa-file-alt text-secondary',
    },
    {
        'key': 'create_incidencia',
        'title': 'Crear Incidencia',
        'url_name': 'incidencias:crear_incidencia',
        'icon': 'fas fa-exclamation-circle text-warning',
    },
    {
        'key': 'list_incidencias',
        'title': 'Listar Incidencias',
        'url_name': 'incidencias:listar_incidencias',
        'icon': 'fas fa-list-alt text-danger',
    },
    {
        'key': 'create_permiso',
        'title': 'Solicitar Permiso',
        'url_name': 'permisos:solicitar',
        'icon': 'fas fa-calendar-plus text-primary',
    },
    {
        'key': 'list_my_permisos',
        'title': 'Mis Permisos',
        'url_name': 'permisos:mis_permisos',
        'icon': 'fas fa-user-clock text-info',
    },
    {
        'key': 'manage_permisos',
        'title': 'Gestionar Permisos',
        'url_name': 'permisos:gestionar',
        'icon': 'fas fa-check-circle text-success',
    },
    {
        'key': 'check_asistencia',
        'title': 'Checar Asistencia',
        'url_name': 'asistencias:checar_asistencia',
        'icon': 'fas fa-sign-in-alt text-primary',
    },
    {
        'key': 'list_asistencias',
        'title': 'Listar Asistencias',
        'url_name': 'asistencias:listar_asistencias',
        'icon': 'fas fa-calendar-alt text-primary',
    },
    {
        'key': 'upload_oficios',
        'title': 'Subir Oficios',
        'url_name': 'oficios:subir_oficio',
        'icon': 'fas fa-upload text-success',
    },
    {
        'key': 'list_oficios',
        'title': 'Ver Oficios',
        'url_name': 'oficios:lista_oficios',
         'icon': 'fas fa-download text-secondary',
    },  
    # ---RAC --- #
    {
        'key': 'ver_rac',
        'title': 'Ver Registros RAC',
        'icon':  'fas fa-list',
        'url_name': 'rac:registro_list',
    },
    {
        'key': 'nuevo_rac',
        'title': 'Nuevo Registro RAC',
        'icon':  'fas fa-plus',
        'url_name': 'rac:registro_create',
    },
    {
        'key': 'view_calendario',
        'title': 'Calendario',
        'url_name': 'calendario:lista_eventos',
        'icon': 'fas fa-calendar-alt text-primary',
    },
    {
        'key': 'list_avisos',
        'title': 'Tablón de Anuncios',
        'url_name': 'avisos:lista_anuncios',
        'icon': 'fas fa-bullhorn text-info',
    },
    {
        'key': 'create_aviso',
        'title': 'Crear Anuncio',
        'url_name': 'avisos:nuevo_anuncio',
        'icon': 'fas fa-plus-circle text-info',
    },
    # --- RAE ---
    {
        'key': 'ver_rae_registros',
        'title': 'Mis Registros RAE',
        'icon': 'fas fa-file-export',
        'url_name': 'rae:mis_registros_rae',
    },
    {
        'key': 'nuevo_rae',
        'title': 'Captura RAE',
        'icon': 'fas fa-clipboard-check',
        'url_name': 'rae:captura_rae',
    }
    
]

ROLES_EQUIPO_ITINERANTE = [
    'PSICOLOGO',
    'TRAB_SOCIAL',
    'PSICOMOTRICIDAD',
    'COMUNICACION',
    'SECRETARIO',
    'ADMIN'
]

# Configuración de Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 5 * 1024 * 1024,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'usaer_system': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'INFO',
    },
}
