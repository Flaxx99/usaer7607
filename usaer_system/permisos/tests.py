from django.test import SimpleTestCase
from .forms import GestionPermisoForm
from .models import Permiso


class GestionPermisoFormTests(SimpleTestCase):

    def test_requiere_respuesta_si_rechazado(self):
        form = GestionPermisoForm(data={
            'estado': Permiso.Estado.RECHAZADO,
            'respuesta_admin': ''
        })
        self.assertFalse(form.is_valid())
        self.assertIn('respuesta_admin', form.errors)

    def test_convierte_respuesta_a_mayusculas(self):
        form = GestionPermisoForm(data={
            'estado': Permiso.Estado.APROBADO,
            'respuesta_admin': 'aprobado'
        })
        self.assertTrue(form.is_valid())
        self.assertEqual(form.cleaned_data['respuesta_admin'], 'APROBADO')
