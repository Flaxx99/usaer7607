import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { 
  Clock, UserCheck, LogIn, LogOut, ShieldCheck, 
  ArrowRight, CheckCircle, AlertCircle, WifiOff
} from 'lucide-react';
import { 
  Container, 
  Paper, 
  Title, 
  Text, 
  TextInput, 
  Button, 
  Group, 
  ThemeIcon, 
  Center, 
  Box, 
  Stack,
  Badge
} from '@mantine/core';
import { registrarAsistencia } from '../../api/asistencia';
import { attendanceBuffer } from '../../utils/attendanceBuffer';

const Kiosco = () => {
    const [horaActual, setHoraActual] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setHoraActual(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // --- LÓGICA DE SINCRONIZACIÓN AUTOMÁTICA ---
    useEffect(() => {
        const syncAttendance = async () => {
            const pending = attendanceBuffer.getAll();
            if (pending.length === 0) return;

            console.log(`Sincronizando ${pending.length} registros pendientes...`);
            
            for (const record of pending) {
                try {
                    await registrarAsistencia(record.numero_empleado);
                    attendanceBuffer.remove(record.id);
                } catch (e) {
                    // Si vuelve a fallar, detenemos la sincronización para no saturar
                    console.error(`Fallo al sincronizar registro ${record.id}`, e);
                    break; 
                }
            }

            if (attendanceBuffer.getAll().length === 0) {
                notifications.show({
                    title: 'Sincronización completa',
                    message: 'Todos los registros pendientes han sido enviados.',
                    color: 'blue',
                    icon: <CheckCircle size={18} />,
                    autoClose: 3000,
                });
            }
        };

        syncAttendance();
    }, []);

    const { register, handleSubmit, reset, setFocus, formState: { isSubmitting } } = useForm<{ numero_empleado: string }>();

    const mutation = useMutation({
        mutationFn: registrarAsistencia,
        onSuccess: (data) => {
            const isEntrada = data.tipo === 'ENTRADA';
            
            notifications.show({
                title: isEntrada ? '¡Bienvenido a la USAER 7607!' : '¡Hasta luego, buen descanso!',
                message: `${data.profesor} • ${data.hora}`,
                color: isEntrada ? 'teal' : 'blue',
                icon: isEntrada ? <CheckCircle size={18} /> : <LogOut size={18} />,
                autoClose: 4000,
                withCloseButton: false,
                styles: (theme) => ({
                    root: { backgroundColor: theme.colors.gray[0], borderColor: theme.colors.gray[2] },
                    title: { fontSize: theme.fontSizes.lg, fontWeight: 800 },
                    description: { fontSize: theme.fontSizes.md, color: theme.colors.gray[8] }
                })
            });

            reset();
            setTimeout(() => setFocus('numero_empleado'), 500); 
        },
        onError: (err: any) => {
            // DETERMINAR SI ES ERROR DE RED O ERROR DE DATOS
            const isNetworkError = !err.response; // Axios: no hay respuesta del servidor

            if (isNetworkError) {
                // ESCENARIO 1: SIN INTERNET -> Guardamos en buffer
                const numeroEmpleado = register('numero_empleado').name === 'numero_empleado' 
                    ? (document.querySelector('input[name="numero_empleado"]') as HTMLInputElement)?.value 
                    : '';

                if (numeroEmpleado) {
                    attendanceBuffer.save(numeroEmpleado);
                    notifications.show({
                        title: 'Modo Offline 📶',
                        message: 'Sin conexión. Tu checada se guardó localmente y se enviará automáticamente al recuperar la red.',
                        color: 'orange',
                        icon: <WifiOff size={18} />,
                        autoClose: 5000,
                    });
                }
            } else {
                // ESCENARIO 2: ERROR DE SERVIDOR (Ej. Empleado no existe)
                notifications.show({
                    title: 'No registrado',
                    message: err.response?.data?.detail || 'Error en el registro',
                    color: 'red',
                    icon: <AlertCircle size={18} />,
                    autoClose: 4000,
                });
            }
            
            reset();
            setTimeout(() => setFocus('numero_empleado'), 500);
        }
    });

    const onSubmit = (data: { numero_empleado: string }) => {
        mutation.mutate(data.numero_empleado);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <Box 
            style={{ 
                minHeight: '100vh', 
                background: 'linear-gradient(135deg, var(--mantine-color-blue-7) 0%, var(--mantine-color-indigo-9) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
                <Button 
                    component={Link} 
                    to="/login"
                    variant="white" 
                    color="gray"
                    leftSection={<ShieldCheck size={16} />}
                    radius="xl"
                    size="xs"
                    style={{ opacity: 0.8 }}
                >
                    Acceso Admin
                </Button>
            </Box>
            
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '40vw',
                height: '40vw',
                borderRadius: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-15%',
                right: '-10%',
                width: '50vw',
                height: '50vw',
                borderRadius: '100%',
                background: 'rgba(255, 255, 255, 0.02)',
                pointerEvents: 'none'
            }} />
            
            <Paper 
                radius="3xl" 
                shadow="xl" 
                p="xl" 
                w={{ base: '90%', sm: '500px' }}
                bg="white"
                style={{ zIndex: 1, textAlign: 'center' }}
            >
                <Stack gap="lg" align="center">
                    <Stack gap={2} align="center">
                        <Text size="xs" fw={700} c="blue" tt="uppercase" lts={2}>
                            Hora Oficial USAER 7607
                        </Text>
                        <Title 
                            order={1} 
                            fw={900} 
                            c="gray.9" 
                            style={{ 
                                fontSize: '4.5rem', 
                                lineHeight: 1, 
                                letterSpacing: '-2px',
                                fontVariantNumeric: 'tabular-nums'
                            }}
                        >
                            {formatTime(horaActual)}
                        </Title>
                        <Text size="lg" c="dimmed" fw={500} tt="capitalize" style={{ fontSize: '1.1rem' }}>
                            {formatDate(horaActual)}
                        </Text>
                    </Stack>
                    
                    <Box w="100%" h={1} bg="gray.1" mt="md" mb="md" />
                    
                    <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                        <Stack gap="md">
                            <TextInput 
                                label="Ingrese su N° de Empleado"
                                placeholder="Escriba y presione Enter"
                                size="xl"
                                leftSection={<UserCheck size={24} className="text-blue-500" />}
                                rightSection={
                                    mutation.isPending ? (
                                        <ThemeIcon variant="transparent" size="lg">
                                            <Clock className="animate-spin text-blue-500" />
                                        </ThemeIcon>
                                    ) : (
                                        <Button 
                                            type="submit" 
                                            variant="filled" 
                                            color="blue" 
                                            radius="xl" 
                                            size="lg"
                                            leftSection={<ArrowRight size={20} />}
                                            disabled={mutation.isPending}
                                        >
                                            CHECAR
                                        </Button>
                                    )
                                }
                                {...register('numero_empleado', { required: true })}
                                autoFocus
                                autoComplete="off"
                                styles={{
                                    input: { 
                                        textAlign: 'center', 
                                        fontSize: '1.5rem', 
                                        fontWeight: 700, 
                                        letterSpacing: '4px',
                                        fontFamily: 'monospace'
                                    }
                                }}
                            />
                        </Stack>
                    </form>
                    
                    <Group justify="center" gap="lg" mt="md">
                        <Badge size="lg" variant="light" color="teal" leftSection={<LogIn size={14} />}>
                            Entrada (1er Registro)
                        </Badge>
                        <Badge size="lg" variant="light" color="blue" leftSection={<LogOut size={14} />}>
                            Salida (2do Registro)
                        </Badge>
                    </Group>
                </Stack>
            </Paper>
            
            <Text size="xs" c="white" style={{ position: 'absolute', bottom: '20px', opacity: 0.5 }}>
                Sistema de Gestión Escolar USAER 7607 &copy; {new Date().getFullYear()}
            </Text>
        </Box>
    );
};

export default Kiosco;