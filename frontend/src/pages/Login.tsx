import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  TextInput, 
  PasswordInput, 
  Button, 
  Stack, 
  Box, 
  Center,
  Anchor
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import client from '../api/client';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      const response = await client.post('/usuarios/auth/login/', data);
      const { token, user } = response.data;

      localStorage.setItem('access_token', token); 
      localStorage.setItem('user', JSON.stringify(user));

      notifications.show({
        title: 'Bienvenido',
        message: `Hola ${user.first_name}, has ingresado correctamente.`,
        color: 'green',
      });

      navigate('/dashboard');
      
    } catch (error: any) {
      console.error(error);
      const message = error.response?.status === 400 
        ? 'Credenciales incorrectas. Verifique su usuario y contraseña.' 
        : 'Error de conexión. Intente más tarde.';

      notifications.show({
        title: 'Error de acceso',
        message: message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center style={{ height: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <Container size={420} w="100%">
        <Paper radius="md" withBorder shadow="xl" p={0} overflow="hidden">
          
          {/* Header con color primario */}
          <Box 
            p="xl" 
            style={{ 
              backgroundColor: 'var(--mantine-color-blue-filled)', 
              color: 'white', 
              textAlign: 'center' 
            }}
          >
            <Title order={2} fw={800} style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
              USAER 7607
            </Title>
            <Text size="sm" opacity={0.9}>
              Sistema de Gestión Escolar
            </Text>
          </Box>

          {/* Formulario */}
          <Box p="xl">
            <Title order={3} ta="center" mb="lg" fw={600}>
              Iniciar Sesión
            </Title>

            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="md">
                
                <TextInput
                  label="Usuario o No. Empleado"
                  placeholder="Ingrese su usuario"
                  leftSection={<User size={16} />}
                  {...register('username', { required: "El usuario es obligatorio" })}
                  error={errors.username?.message as string}
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="••••••••"
                  leftSection={<Lock size={16} />}
                  {...register('password', { required: "La contraseña es obligatoria" })}
                  error={errors.password?.message as string}
                />

                <Button 
                  type="submit" 
                  loading={loading}
                  fullWidth 
                  size="md" 
                  radius="md"
                  leftSection={loading ? <Loader2 className="animate-spin" size={18} /> : null}
                >
                  Acceder al Sistema
                </Button>

                <Box ta="center" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                  <Anchor 
                    component={Link} 
                    to="/" 
                    size="sm" 
                    color="gray" 
                    fw={500}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <ArrowLeft size={14} /> Volver al Checador de Asistencia
                  </Anchor>
                </Box>
              </Stack>
            </form>
          </Box>
        </Paper>
      </Container>
    </Center>
  );
};

export default Login;