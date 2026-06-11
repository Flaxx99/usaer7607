import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { 
  Clock, UserCheck, LogIn, LogOut, ShieldCheck, 
  ArrowRight, CheckCircle, XCircle, WifiOff
} from 'lucide-react';
import { registrarAsistencia } from '../../api/asistencia';
import { attendanceBuffer } from '../../utils/attendanceBuffer';
import { LoadingButton } from '../../components/LoadingButton';

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

            for (const record of pending) {
                try {
                    await registrarAsistencia(record.numero_empleado);
                    attendanceBuffer.remove(record.id);
                } catch (e) {
                    console.error(`Fallo al sincronizar registro ${record.id}`, e);
                    break; 
                }
            }

            if (attendanceBuffer.getAll().length === 0) {
                toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Sincronizado!</span>, { 
                    description: 'Todos los registros pendientes han sido enviados.',
                    duration: 3000 
                });
            }
        };

        syncAttendance();
    }, []);

    const { register, handleSubmit, reset, setFocus } = useForm<{ numero_empleado: string }>({
        resolver: undefined // Not needed if we don't use Zod here, but we want consistency
    });

    const mutation = useMutation({
        mutationFn: registrarAsistencia,
        onSuccess: (data) => {
            const isEntrada = data.tipo === 'ENTRADA';
            
            toast.success(
                <span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> {isEntrada ? '¡Registrado!' : '¡Registrada!'}</span>, 
                { 
                    description: `${data.profesor} • ${data.hora}`,
                    duration: 4000 
                }
            );

            reset();
            setTimeout(() => setFocus('numero_empleado'), 500); 
        },
        onError: (err) => {
            const axiosErr = isAxiosError(err) ? err : null;
            const isNetworkError = axiosErr ? !axiosErr.response : true;

            if (isNetworkError) {
                const numeroEmpleado = (document.querySelector('input[name="numero_empleado"]') as HTMLInputElement)?.value;

                if (numeroEmpleado) {
                    attendanceBuffer.save(numeroEmpleado);
                    toast.warning(<span className="inline-flex items-center gap-1.5"><WifiOff size={16} /> Modo Offline</span>, { 
                        description: 'Sin conexión. Tu checada se guardó localmente y se enviará automáticamente al recuperar la red.',
                        duration: 5000 
                    });
                }
            } else if (axiosErr) {
                toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { 
                    description: axiosErr.response?.data?.detail || 'Error en el registro de asistencia.',
                    duration: 4000 
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
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-indigo-900 text-white p-4">
            
            {/* Decoración de fondo */}
            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-white/5 pointer-events-none" />

            {/* Acceso Admin */}
            <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
                <Link 
                    to="/login"
                    className="btn btn-ghost btn-sm bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity text-xs sm:text-sm"
                >
                    <ShieldCheck size={14} />
                    Acceso Admin
                </Link>
            </div>
            
            {/* Card Principal — Diseño "Cartelera Escolar" */}
            <div className="card card-paper text-base-content w-full max-w-lg sm:max-w-xl z-10">
                <div className="card-body items-center text-center p-6 sm:p-12 space-y-8 sm:space-y-12">
                    
                    {/* ─── Sección del Reloj — estilo "salón de clases" ─── */}
                    <div className="space-y-3 sm:space-y-4 w-full">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
                            <Clock size={14} className="text-primary" />
                            <p className="text-xs sm:text-xs font-bold text-primary uppercase tracking-widest">
                                Hora Oficial USAER 7607
                            </p>
                        </div>
                        <h1 className="text-5xl sm:text-8xl font-black tracking-tighter tabular-nums text-base-content leading-none">
                            {formatTime(horaActual)}
                        </h1>
                        <p className="text-base sm:text-xl font-bold text-base-content/80 capitalize">
                            {formatDate(horaActual)}
                        </p>
                    </div>

                    {/* ─── Separador tipo "regla escolar" ─── */}
                    <div className="w-full flex items-center gap-3 text-base-content/20">
                        <div className="flex-1 h-px bg-base-300" />
                        <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary/30" />
                            <span className="w-2 h-2 rounded-full bg-secondary" />
                            <span className="w-2 h-2 rounded-full bg-accent/50" />
                        </div>
                        <div className="flex-1 h-px bg-base-300" />
                    </div>

                    {/* ─── Sección del Formulario ─── */}
                    <div className="w-full space-y-6 sm:space-y-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4 sm:space-y-6">
                            <div className="form-control w-full">
                                <label className="label justify-center" htmlFor="numero_empleado">
                                    <span className="label-text font-black text-base-content text-base sm:text-lg">Ingrese su N° de Empleado</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform">
                                        <UserCheck size={24} strokeWidth={3} />
                                    </div>
                                     <input 
                                         id="numero_empleado"
                                         {...register('numero_empleado')}
                                         autoFocus
                                         autoComplete="off"
                                         className="input input-bordered w-full pl-12 pr-32 text-center text-2xl sm:text-3xl font-black tracking-[0.15em] sm:tracking-[0.2em] font-mono h-16 sm:h-24 border-2 sm:border-4 focus:border-primary transition-all"
                                         placeholder="000000"
                                     />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                         <LoadingButton
                                              type="submit"
                                              className="btn btn-primary h-12 sm:h-16 px-4 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all text-base sm:text-xl font-black"
                                              loading={mutation.isPending}
                                              aria-label={mutation.isPending ? "Procesando registro..." : "Checar asistencia"}
                                          >
                                              {mutation.isPending ? (
                                                  <Clock className="animate-spin" size={24} />
                                              ) : (
                                                  <><span className="font-black">CHECAR</span> <ArrowRight size={20} className="hidden sm:inline" /></>
                                              )}
                                          </LoadingButton>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
                                <div className="badge badge-success badge-lg gap-2 py-3 sm:py-4 px-4 text-white font-bold shadow-md w-full sm:w-auto">
                                    <LogIn size={18} />
                                    Entrada (1ra vez)
                                </div>
                                <div className="badge badge-info badge-lg gap-2 py-3 sm:py-4 px-4 text-white font-bold shadow-md w-full sm:w-auto">
                                    <LogOut size={18} />
                                    Salida (2da vez)
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <footer className="absolute bottom-4 sm:bottom-6 text-white/60 text-xs sm:text-xs font-bold">
                Sistema de Gestión Escolar USAER 7607 &copy; {new Date().getFullYear()}
            </footer>
        </div>
    );
};

export default Kiosco;