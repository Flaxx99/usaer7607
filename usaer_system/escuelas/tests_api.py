from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse

from .models import Escuela

User = get_user_model()


class EscuelaAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email='admin@escuela.com', numero_empleado='admin_esc', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_create_escuela(self):
        url = reverse('escuelas:escuelas-list')
        payload = {
            'clave_estatal': '12345',
            'cct': 'CCT999',
            'nombre': 'Escuela Nueva',
            'nivel': 'PRIMARIA',
            'domicilio': 'Calle 1',
            'colonia': 'Centro',
            'zona': '01',
        }
        response = self.client.post(url, data=payload, format='json')
        self.assertIn(response.status_code, [201, 200])
        assert Escuela.objects.filter(cct='CCT999').exists()

    def test_list_escuelas(self):
        Escuela.objects.create(clave_estatal='1', cct='CCT1', nombre='One', nivel='PRIMARIA', domicilio='x', colonia='y', zona='z')
        url = reverse('escuelas:escuelas-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        assert any(item.get('cct') == 'CCT1' for item in (data if isinstance(data, list) else data.get('results', [])))
