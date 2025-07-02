from pathlib import Path
from django.contrib.auth import get_user_model

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-!8659yl2gf6**0m*l05cuq1%maailzw$nu*x7wmt&+pix39evh'
DEBUG = True
ALLOWED_HOSTS = []

AUTH_USER_MODEL = 'usuarios.User'

AUTHENTICATION_BACKENDS = [
    'usuarios.backends.EmailOrEmpleadoBackend',
    'django.contrib.auth.backends.ModelBackend',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Apps propias
    'usuarios.apps.UsuariosConfig',
    'escuelas.apps.EscuelasConfig',
    'asistencias',
    'permisos',
    'incidencias',
    'documentos',
    'alumnos',
    'oficios',

    # Dependencias
    'crispy_forms',
    'crispy_bootstrap5',
]

CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
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

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/usuarios/redireccion/'
LOGOUT_REDIRECT_URL = '/'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ------------------- PERMISOS POR ROL -------------------

ROLE_PERMISSIONS = {
    'ADMIN': [
        'create_user', 'list_users', 'edit_user', 'delete_user',
        'create_escuela', 'list_escuelas', 'edit_escuela', 'delete_escuela',
        'create_alumno', 'list_alumnos', 'edit_alumno', 'delete_alumno',
        'export_rae_rac', 'capture_rae_rac',
        'create_expediente', 'list_expedientes', 'edit_expediente', 'delete_expediente',
        'download_official_docs',
        'create_incidencia', 'list_incidencias', 'edit_incidencia', 'delete_incidencia',
        'create_permiso', 'list_my_permisos', 'manage_permisos',
        'check_asistencia', 'list_asistencias',
        'upload_oficios', 'list_oficios',
    ],

    'SECRETARIO': [
        'create_user', 'list_users', 'edit_user', 'delete_user',
        'create_escuela', 'list_escuelas', 'edit_escuela', 'delete_escuela',
        'export_rae_rac',
        'create_expediente', 'list_expedientes', 'edit_expediente', 'delete_expediente',
        'download_official_docs',
        'create_permiso', 'list_my_permisos', 'manage_permisos',
        'check_asistencia', 'list_asistencias',
        'upload_oficios', 'list_oficios',
    ],

    'MAESTRO_APOYO': [
        'create_alumno', 'list_alumnos', 'edit_alumno',
        'export_rae_rac', 'capture_rae_rac',
        'create_expediente', 'list_expedientes', 'edit_expediente', 'delete_expediente',
        'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios',
    ],

    'TRAB_SOCIAL': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios',
    ],

    'PSICOLOGO': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios',
    ],

    'PSICOMOTRICIDAD': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios',
    ],

    'COMUNICACION': [
        'list_expedientes', 'edit_expediente', 'download_official_docs',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios',
    ],

    'TRAB_MANUAL': [
        'download_official_docs', 'list_expedientes',
        'create_permiso', 'list_my_permisos',
        'check_asistencia', 'list_asistencias',
        'list_oficios',
    ],

    'DIRECTOR': [
        'list_incidencias',
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
]

ROLES_EQUIPO_ITINERANTE = [
    'PSICOLOGO',
    'TRAB_SOCIAL',
    'PSICOMOTRICIDAD',
    'COMUNICACION',
    'SECRETARIO',
    'ADMIN'
]
