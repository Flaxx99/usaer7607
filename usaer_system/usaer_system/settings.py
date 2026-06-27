import logging
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

from usaer_system.config import settings as config

logger = logging.getLogger(__name__)

load_dotenv()  # Carga las variables de entorno desde .env (necesario para DATABASE_URL, etc.)

# ─────────────────────────────────────────────
# Sentry: Monitoreo de errores en producción
# ─────────────────────────────────────────────
SENTRY_DSN = config.sentry_dsn
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.05,
        send_default_pii=False,  # No enviar PII por defecto
        environment=config.sentry_environment,
    )

BASE_DIR = Path(__file__).resolve().parent.parent

# Asegurarse de que el directorio de logs exista
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

# En producción, DEBUG debe ser False. Validado via pydantic-settings.
DEBUG = config.debug

# Retrieve secret key from environment for production.
# Validado via pydantic-settings — fallback solo en modo DEBUG.
SECRET_KEY = config.secret_key
if not SECRET_KEY and DEBUG:
    SECRET_KEY = "django-insecure-fallback-for-dev-only"
elif not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required in production!")

# Configuraciones de seguridad para producción
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 año
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ─────────────────────────────────────────────
# Security headers (siempre activos)
# ─────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "same-origin"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False  # True rompe el frontend React que lee CSRF token
CSRF_COOKIE_SAMESITE = "Lax"

# ─────────────────────────────────────────────
# Content-Security-Policy (CSP)
# django-csp 4.x usa formato CONTENT_SECURITY_POLICY (no CSP_*)
# ─────────────────────────────────────────────
CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": ("'self'",),
        "style-src": (
            "'self'",
            "'unsafe-inline'",  # Necesario para Django Admin + swagger UI
            "https://fonts.googleapis.com",
        ),
        "script-src": (
            "'self'",
            "'unsafe-inline'",  # Necesario para Django Admin inline JS
        ),
        "font-src": ("'self'", "https://fonts.gstatic.com"),
        "img-src": ("'self'", "data:"),
        "connect-src": ("'self'",),
        "form-action": ("'self'",),
    },
}

# ─────────────────────────────────────────────
# django-axes: Brute-force protection
# ─────────────────────────────────────────────
AXES_ENABLED = True
AXES_FAILURE_LIMIT = 5  # 5 intentos fallidos
AXES_COOLOFF_TIME = 1  # 1 hora de bloqueo
AXES_RESET_ON_SUCCESS = True  # Resetear contador al loguearse
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]

# ─────────────────────────────────────────────
# Proxy / Upload / Cross-Origin settings
# ─────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB

# Lee los hosts permitidos de una variable de entorno.
# En producción, debes poner aquí tu dominio, ej: 'www.misitio.com'
ALLOWED_HOSTS = config.allowed_hosts_list


# ─────────────────────────────────────────────
# Password Hashing: Argon2 como prioridad
# ─────────────────────────────────────────────
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]

AUTH_USER_MODEL = "usuarios.User"

AUTHENTICATION_BACKENDS = [
    "axes.backends.AxesStandaloneBackend",  # Debe ir primero para bloqueo
    "usuarios.backends.EmailOrEmpleadoBackend",
    "django.contrib.auth.backends.ModelBackend",
]

# Merged INSTALLED_APPS
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # 3rd Party
    "crispy_forms",
    "crispy_bootstrap5",
    # Mis Apps
    "usuarios",
    "alumnos",
    "escuelas",
    "asistencias",
    "incidencias",
    "permisos",
    "documentos",
    "oficios",
    "rac",
    "rae",
    "calendario",
    "avisos",
    "notificaciones",
    "ciclos_escolares",
    # API
    "rest_framework",
    "rest_framework.authtoken",
    "axes",
    "corsheaders",
    "drf_yasg",
]

# Silencia deprecation warning de drf-yasg en Django 6
SWAGGER_USE_COMPAT_RENDERERS = False

CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Middleware de Whitenoise
    "django.middleware.gzip.GZipMiddleware",
    "csp.middleware.CSPMiddleware",  # Content-Security-Policy
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "axes.middleware.AxesMiddleware",  # Brute-force protection
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "usaer_system.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.debug",
                "usuarios.context_processors.permisos_usuario",
            ],
        },
    },
]

WSGI_APPLICATION = "usaer_system.wsgi.application"

# Configuración de base de datos usando dj-database-url
# En producción, se usará la variable de entorno DATABASE_URL
# ej: postgres://user:password@host:port/dbname
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}", conn_max_age=600
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 8,
        },
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
    {
        "NAME": "usaer_system.validators.CustomPasswordValidator",
    },
]

LANGUAGE_CODE = "es-mx"
TIME_ZONE = "America/Chihuahua"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Almacenamiento de estáticos mejorado por Whitenoise
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REDIS_URL = config.redis_url
if REDIS_URL:
    try:
        import django_redis  # noqa: F401 — verifica que el paquete esté instalado

        CACHES = {
            "default": {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": REDIS_URL,
                "OPTIONS": {
                    "CLIENT_CLASS": "django_redis.client.DefaultClient",
                },
                "KEY_PREFIX": "usaer",
            }
        }
    except ImportError:
        logger.warning(
            "REDIS_URL está definida pero django-redis no está instalado. "
            "Usando LocMemCache como fallback. "
            "Instala django-redis con: pip install django-redis"
        )
        CACHES = {
            "default": {
                "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                "LOCATION": "unique-snowflake",
            }
        }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unique-snowflake",
        }
    }

LOGIN_URL = "/accounts/login/"
LOGIN_REDIRECT_URL = "/usuarios/redireccion/"
LOGOUT_REDIRECT_URL = "/"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

CORS_ALLOWED_ORIGINS = config.cors_allowed_origins_list

CSRF_TRUSTED_ORIGINS = config.csrf_trusted_origins_list

REST_FRAMEWORK = {
    # PRIORIDAD DE AUTENTICACIÓN:
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # 1. Primero busca Token (Para React/Axios)
        "rest_framework.authentication.TokenAuthentication",
        # 2. Si no hay token, busca Sesión (Para que TÚ uses el Admin/Swagger)
        "rest_framework.authentication.SessionAuthentication",
        # 3. Basic (Opcional, para pruebas rápidas en navegador)
        "rest_framework.authentication.BasicAuthentication",
    ],
    # PERMISOS POR DEFECTO:
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "usaer_system.pagination.FlexiblePageNumberPagination",
    "PAGE_SIZE": 10,
    "DATETIME_FORMAT": "%Y-%m-%d %H:%M:%S",
    "EXCEPTION_HANDLER": "usaer_system.exceptions.custom_exception_handler",
    # ─────────────────────────────────────────────
    # Rate Limiting (Throttling)
    # ─────────────────────────────────────────────
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
        "usaer_system.throttling.WriteRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/hour",  # Anónimos: ~1/min promedio
        "user": "1000/hour",  # Autenticados lecturas: ~16/min
        "user_write": "200/hour",  # Escrituras autenticadas: ~3/min
        "login": "5/minute",  # Login más restrictivo
        "change_password": "3/minute",  # Cambio de contraseña
        "sensitive_action": "10/minute",  # Acciones admin sensibles
        "bulk_write": "2/minute",  # Operaciones masivas
    },
}

# ------------------- PERMISOS POR ROL -------------------

ROLE_PERMISSIONS = {
    "ADMIN": [
        "create_user",
        "list_users",
        "edit_user",
        "delete_user",
        "create_escuela",
        "list_escuelas",
        "edit_escuela",
        "delete_escuela",
        "create_alumno",
        "list_alumnos",
        "edit_alumno",
        "delete_alumno",
        "list_ciclos_escolares",
        "promover_alumnos",
        # RAE/RAC
        "ver_rac",
        "nuevo_rac",
        "ver_rae",
        "nuevo_rae",
        "ver_rae_registros",
        "exportar_rae",
        # Expedientes CRUD + descarga oficial
        "create_expediente",
        "list_expedientes",
        "edit_expediente",
        "delete_expediente",
        "download_official_docs",
        "create_incidencia",
        "list_incidencias",
        "edit_incidencia",
        "delete_incidencia",
        "create_permiso",
        "list_my_permisos",
        "manage_permisos",
        "check_asistencia",
        "list_asistencias",
        "upload_oficios",
        "list_oficios",
        "view_calendario",
        "list_avisos",
        "create_aviso",
    ],
    "SECRETARIO": [
        "create_user",
        "list_users",
        "edit_user",
        "delete_user",
        "create_escuela",
        "list_escuelas",
        "edit_escuela",
        "delete_escuela",
        "list_ciclos_escolares",
        "promover_alumnos",
        # RAE/RAC
        "ver_rac",
        "nuevo_rac",
        "ver_rae",
        "nuevo_rae",
        "ver_rae_registros",
        "exportar_rae",
        # Expedientes CRUD + descarga oficial
        "create_expediente",
        "list_expedientes",
        "edit_expediente",
        "delete_expediente",
        "download_official_docs",
        "create_permiso",
        "list_my_permisos",
        "manage_permisos",
        "check_asistencia",
        "list_asistencias",
        "upload_oficios",
        "list_oficios",
        "view_calendario",
        "list_avisos",
        "create_aviso",
    ],
    "MAESTRO_APOYO": [
        "create_alumno",
        "list_alumnos",
        "edit_alumno",
        # RAE/RAC
        "ver_rac",
        "nuevo_rac",
        "ver_rae",
        "nuevo_rae",
        "ver_rae_registros",
        #'exportar_rae',
        # Expedientes CRUD + descarga oficial
        "create_expediente",
        "list_expedientes",
        "edit_expediente",
        "delete_expediente",
        "download_official_docs",
        "create_permiso",
        "list_my_permisos",
        "check_asistencia",
        "list_asistencias",
        "list_oficios",
        "view_calendario",
        "list_avisos",
    ],
    "TRAB_SOCIAL": [
        "list_expedientes",
        "edit_expediente",
        "download_official_docs",
        "create_permiso",
        "list_my_permisos",
        "check_asistencia",
        "list_asistencias",
        "list_oficios",
        "view_calendario",
        "list_avisos",
    ],
    "PSICOLOGO": [
        "list_expedientes",
        "edit_expediente",
        "download_official_docs",
        "create_permiso",
        "list_my_permisos",
        "check_asistencia",
        "list_asistencias",
        "list_oficios",
        "view_calendario",
        "list_avisos",
    ],
    "PSICOMOTRICIDAD": [
        "list_expedientes",
        "edit_expediente",
        "download_official_docs",
        "create_permiso",
        "list_my_permisos",
        "check_asistencia",
        "list_asistencias",
        "list_oficios",
        "view_calendario",
        "list_avisos",
    ],
    "COMUNICACION": [
        "list_expedientes",
        "edit_expediente",
        "download_official_docs",
        "create_permiso",
        "list_my_permisos",
        "check_asistencia",
        "list_asistencias",
        "list_oficios",
        "view_calendario",
        "list_avisos",
    ],
    "TRAB_MANUAL": [
        "download_official_docs",
        "list_expedientes",
        "create_permiso",
        "list_my_permisos",
        "check_asistencia",
        "list_asistencias",
        "list_oficios",
        "view_calendario",
        "list_avisos",
    ],
    "DIRECTOR": [
        "list_incidencias",
        "view_calendario",
        "list_avisos",
    ],
}

# ------------------- DASHBOARD -------------------

DASHBOARD_MODULES = [
    {
        "key": "create_user",
        "title": "Crear Usuario",
        "url_name": "usuarios:create",
        "icon": "fas fa-user-plus text-primary",
    },
    {
        "key": "list_users",
        "title": "Listar Usuarios",
        "url_name": "usuarios:list",
        "icon": "fas fa-users text-primary",
    },
    {
        "key": "create_escuela",
        "title": "Crear Escuela",
        "url_name": "escuelas:crear_escuela",
        "icon": "fas fa-school text-success",
    },
    {
        "key": "list_escuelas",
        "title": "Listar Escuelas",
        "url_name": "escuelas:listar_escuelas",
        "icon": "fas fa-school text-success",
    },
    {
        "key": "create_alumno",
        "title": "Crear Alumno",
        "url_name": "alumnos:crear_alumno",
        "icon": "fas fa-user-graduate text-info",
    },
    {
        "key": "list_alumnos",
        "title": "Listar Alumnos",
        "url_name": "alumnos:listar_alumnos",
        "icon": "fas fa-users text-info",
    },
    {
        "key": "create_expediente",
        "title": "Crear Expediente",
        "url_name": "documentos:subir_expediente",
        "icon": "fas fa-file-upload text-primary",
    },
    {
        "key": "list_expedientes",
        "title": "Listar Expedientes",
        "url_name": "documentos:lista_expedientes",
        "icon": "fas fa-file-alt text-secondary",
    },
    {
        "key": "create_incidencia",
        "title": "Crear Incidencia",
        "url_name": "incidencias:crear_incidencia",
        "icon": "fas fa-exclamation-circle text-warning",
    },
    {
        "key": "list_incidencias",
        "title": "Listar Incidencias",
        "url_name": "incidencias:listar_incidencias",
        "icon": "fas fa-list-alt text-danger",
    },
    {
        "key": "create_permiso",
        "title": "Solicitar Permiso",
        "url_name": "permisos:solicitar",
        "icon": "fas fa-calendar-plus text-primary",
    },
    {
        "key": "list_my_permisos",
        "title": "Mis Permisos",
        "url_name": "permisos:mis_permisos",
        "icon": "fas fa-user-clock text-info",
    },
    {
        "key": "manage_permisos",
        "title": "Gestionar Permisos",
        "url_name": "permisos:gestionar",
        "icon": "fas fa-check-circle text-success",
    },
    {
        "key": "check_asistencia",
        "title": "Checar Asistencia",
        "url_name": "asistencias:checar_asistencia",
        "icon": "fas fa-sign-in-alt text-primary",
    },
    {
        "key": "list_asistencias",
        "title": "Listar Asistencias",
        "url_name": "asistencias:listar_asistencias",
        "icon": "fas fa-calendar-alt text-primary",
    },
    {
        "key": "upload_oficios",
        "title": "Subir Oficios",
        "url_name": "oficios:subir_oficio",
        "icon": "fas fa-upload text-success",
    },
    {
        "key": "list_oficios",
        "title": "Ver Oficios",
        "url_name": "oficios:lista_oficios",
        "icon": "fas fa-download text-secondary",
    },
    # ---RAC --- #
    {
        "key": "ver_rac",
        "title": "Ver Registros RAC",
        "icon": "fas fa-list",
        "url_name": "rac:registro_list",
    },
    {
        "key": "nuevo_rac",
        "title": "Nuevo Registro RAC",
        "icon": "fas fa-plus",
        "url_name": "rac:registro_create",
    },
    {
        "key": "view_calendario",
        "title": "Calendario",
        "url_name": "calendario:lista_eventos",
        "icon": "fas fa-calendar-alt text-primary",
    },
    {
        "key": "list_avisos",
        "title": "Tablón de Anuncios",
        "url_name": "avisos:lista_anuncios",
        "icon": "fas fa-bullhorn text-info",
    },
    {
        "key": "create_aviso",
        "title": "Crear Anuncio",
        "url_name": "avisos:nuevo_anuncio",
        "icon": "fas fa-plus-circle text-info",
    },
    # --- RAE ---
    {
        "key": "ver_rae_registros",
        "title": "Mis Registros RAE",
        "icon": "fas fa-file-export",
        "url_name": "rae:mis_registros_rae",
    },
    {
        "key": "nuevo_rae",
        "title": "Captura RAE",
        "icon": "fas fa-clipboard-check",
        "url_name": "rae:captura_rae",
    },
]

ROLES_EQUIPO_ITINERANTE = [
    "PSICOLOGO",
    "TRAB_SOCIAL",
    "PSICOMOTRICIDAD",
    "COMUNICACION",
    "SECRETARIO",
    "ADMIN",
]

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
        "security": {
            "format": "[SECURITY] {levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "django.log",
            "maxBytes": 5 * 1024 * 1024,  # 5 MB
            "backupCount": 5,
            "formatter": "verbose",
        },
        "security_file": {
            "level": "WARNING",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": BASE_DIR / "logs" / "security.log",
            "maxBytes": 5 * 1024 * 1024,  # 5 MB
            "backupCount": 10,
            "formatter": "security",
        },
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "handlers": ["file", "security_file"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.security": {
            "handlers": ["security_file"],
            "level": "WARNING",
            "propagate": False,
        },
        "axes": {
            "handlers": ["security_file", "console"],
            "level": "INFO",
            "propagate": False,
        },
        "usaer_system": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["file", "console"],
        "level": "INFO",
    },
}
