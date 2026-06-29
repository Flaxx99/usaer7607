"""
base.py — Datos compartidos para tests de integración.

Provee una clase base `BaseIntegrationTest` con setUpClass que crea:
- CicloEscolar activo
- Escuela
- Usuarios para cada rol (ADMIN, DIRECTOR, SECRETARIO, MAESTRO_APOYO,
  PSICOLOGO, TRAB_SOCIAL)
- Alumno base
- Token JWT de autenticación para cada usuario
"""

from datetime import date, timedelta

from alumnos.models import Alumno
from ciclos_escolares.models import CicloEscolar
from django.contrib.auth import get_user_model
from django.test import override_settings
from escuelas.models import Escuela
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APITestCase

User = get_user_model()


@override_settings(SECURE_SSL_REDIRECT=False)
class BaseIntegrationTest(APITestCase):
    """Clase base con datos compartidos para todos los tests de integración."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._create_shared_data()

    @classmethod
    def _create_shared_data(cls):
        """Crea los datos compartidos una sola vez por clase hija."""
        cls.ciclo = CicloEscolar.objects.create(
            nombre=f"{date.today().year}-{date.today().year + 1}",
            fecha_inicio=date.today() - timedelta(days=30),
            fecha_fin=date.today() + timedelta(days=335),
            activo=True,
        )
        cls.escuela = Escuela.objects.create(
            clave_estatal="INT01",
            cct="CCTINT001",
            nombre="Escuela Integración",
            nivel="Primaria",
            domicilio="Av. Central 123",
            colonia="Centro",
            zona="Z01",
        )
        cls.escuela_2 = Escuela.objects.create(
            clave_estatal="INT02",
            cct="CCTINT002",
            nombre="Escuela Integración 2",
            nivel="Primaria",
            domicilio="Av. Secundaria 456",
            colonia="Norte",
            zona="Z02",
        )

        cls.admin = User.objects.create_user(
            email="admin@test.com",
            numero_empleado="ADMINT",
            password="pass123",
            role=User.Role.ADMINISTRADOR,
            escuela=cls.escuela,
        )
        cls.director = User.objects.create_user(
            email="director@test.com",
            numero_empleado="DIRINT",
            password="pass123",
            role=User.Role.DIRECTOR,
            escuela=cls.escuela,
        )
        cls.secretario = User.objects.create_user(
            email="secretario@test.com",
            numero_empleado="SECINT",
            password="pass123",
            role=User.Role.SECRETARIO,
            escuela=cls.escuela,
        )
        cls.maestro = User.objects.create_user(
            email="maestro@test.com",
            numero_empleado="MAEINT",
            password="pass123",
            role=User.Role.MAESTRO_APOYO,
            escuela=cls.escuela,
        )
        cls.maestro_otra_esc = User.objects.create_user(
            email="maestro2@test.com",
            numero_empleado="MAE2INT",
            password="pass123",
            role=User.Role.MAESTRO_APOYO,
            escuela=cls.escuela_2,
        )
        cls.psicologo = User.objects.create_user(
            email="psicologo@test.com",
            numero_empleado="PSIINT",
            password="pass123",
            role=User.Role.PSICOLOGO,
            escuela=cls.escuela,
        )
        cls.trab_social = User.objects.create_user(
            email="trabajo@test.com",
            numero_empleado="TRAINT",
            password="pass123",
            role=User.Role.TRABAJADOR_SOCIAL,
            escuela=cls.escuela,
        )

        cls.alumno = Alumno.objects.create(
            profesor=cls.maestro,
            escuela=cls.escuela,
            apellido_paterno="López",
            apellido_materno="Martínez",
            nombres="Juan Carlos",
            curp="LOMJUC123456HOMBXX",
            sexo="H",
            edad=9,
            grado="3",
            grupo="A",
            clasificacion="DISCAPACIDAD",
        )
        cls.alumno_2 = Alumno.objects.create(
            profesor=cls.maestro,
            escuela=cls.escuela,
            apellido_paterno="García",
            apellido_materno="Hernández",
            nombres="María",
            curp="GAHMAR123456MOMXX",
            sexo="M",
            edad=8,
            grado="2",
            grupo="B",
            clasificacion="DIFICULTADES_SEVERAS",
        )

        # Crear tokens de autenticación para usuarios que lo requieran
        cls.admin_token, _ = Token.objects.get_or_create(user=cls.admin)
        cls.director_token, _ = Token.objects.get_or_create(user=cls.director)
        cls.secretario_token, _ = Token.objects.get_or_create(user=cls.secretario)
        cls.maestro_token, _ = Token.objects.get_or_create(user=cls.maestro)

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def _auth(self, user):
        """Autentica el cliente como un usuario específico."""
        self.client.force_authenticate(user=user)
        return self.client

    def _auth_token(self, token_key):
        """Autentica vía header HTTP Authorization: Token <key>."""
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token_key}")
        return self.client

    def _clear_auth(self):
        """Limpia la autenticación."""
        self.client.force_authenticate(user=None)
        self.client.credentials()
