# avisos/serializers.py
from rest_framework import serializers
from .models import Anuncio

class AnuncioSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para mostrar información extra
    autor_nombre = serializers.ReadOnlyField(source='autor.get_full_name')
    es_activo = serializers.BooleanField(source='is_active', read_only=True)

    class Meta:
        model = Anuncio
        fields = [
            'id', 'titulo', 'contenido', 
            'fecha_publicacion', 'fecha_expiracion', 
            'autor', 'autor_nombre', 'es_activo'
        ]
        read_only_fields = ['autor'] # El autor se asigna automáticamente en la vista

    def validate(self, data):
        """
        Validación personalizada: Fecha expiración > Fecha publicación
        """
        inicio = data.get('fecha_publicacion')
        fin = data.get('fecha_expiracion')

        # Nota: Si es actualización parcial (PATCH), puede que alguno sea None, 
        # habría que manejarlo con self.instance si fuera estricto, 
        # pero para simplificar validamos si ambos están presentes.
        if inicio and fin and fin < inicio:
            raise serializers.ValidationError({
                "fecha_expiracion": "La fecha de expiración no puede ser anterior a la de publicación."
            })
        return data