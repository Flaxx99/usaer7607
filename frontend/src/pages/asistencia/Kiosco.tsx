import { useState, useEffect, useCallback } from 'react';
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
    const [announcement, setAnnouncement] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setHoraActual(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const announce = (message: string) => {
        setAnnouncement(''); 
        setTimeout(() => setAnnouncement(message), 50);
    };

    const syncAttendance = useCallback(async () => {
        if (isSyncing) return; // Evitar múltiples sincronizaciones paralelas (Flapping)
        
        const pending = attendanceBuffer.getAll();
        if (pending.length === 0) return;

        setIsSyncing(true);
        try {
            // Pequeño delay para asegurar que el cambio de red (WiFi -> Datos) se haya estabilizado
            await new Promise(resolve => setTimeout(resolve, 1000));

            const codigos = pending.map(r => r.numero_empleado);
            const response = await fetch('/api/asistencias/bulk-register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(codigos),
            });

            if (!response.ok) throw new Error('Error en el servidor');
            
            const results = await response.json();

            results.forEach((res: { success: boolean; codigo: string }) => {
                if (res.success) {
                    const record = pending.find(p => p.numero_empleado === res.codigo);
                    if (record) attendanceBuffer.remove(record.id);
                }
            });

            if (attendanceBuffer.getAll().length === 0) {
                const msg = 'Todos los registros pendientes han sido enviados. Sincronización completa.';
                toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Sincronizado!</span>, { 
                    description: msg,
                    duration: 3000 
                });
                announce(msg);
            }
        } catch (e) {
            console.error(`Fallo al sincronizar registros:`, e);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- setIsSyncing is deferred by async/await
        syncAttendance();
        window.addEventListener('online', syncAttendance);
        return () => window.removeEventListener('online', syncAttendance);
    }, [syncAttendance]);

    const { register, handleSubmit, reset, setFocus } = useForm<{ numero_empleado: string }>({
        resolver: undefined
    });

    const mutation = useMutation({
        mutationFn: registrarAsistencia,
        onSuccess: (data) => {
            const isEntrada = data.tipo === 'ENTRADA';
            const msg = `${isEntrada ? 'Asistencia de entrada registrada' : 'Asistencia de salida registrada'} para ${data.profesor} a las ${data.hora}`;
            
            toast.success(
                <span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> {isEntrada ? '¡Registrado!' : '¡Registrada!'}</span>, 
                { 
                    description: `${data.profesor} • ${data.hora}`,
                    duration: 4000 
                }
            );
            announce(msg);
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
                    const msg = 'Sin conexión. Tu checada se guardó localmente y se enviará automáticamente al recuperar la red.';
                    toast.warning(<span className="inline-flex items-center gap-1.5"><WifiOff size={16} /> Modo Offline</span>, { 
                        description: msg,
                        duration: 5000 
                    });
                    announce(msg);
                }
            } else if (axiosErr) {
                const msg = axiosErr.response?.data?.detail || 'Error en el registro de asistencia.';
                toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, { 
                    description: msg,
                    duration: 4000 
                });
                announce(`Error: ${msg}`);
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
            
            {/* Aria-Live Region for screen readers */}
            <div 
                className="sr-only" 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
            >
                {announcement}
            </div>

            <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-white/5 pointer-events-none" />

            <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
                <Link 
                    to="/login"
                    className="btn btn-ghost btn-sm bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity text-xs sm:text-sm"
                >
                    <ShieldCheck size={14} />
                    Acceso Admin
                </Link>
            </div>
            
            <div className="card card-paper text-base-content w-full max-w-lg sm:max-w-xl z-10">
                <div className="card-body items-center text-center p-6 sm:p-12 space-y-8 sm:space-y-12">
                    
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

                    <div className="w-full flex items-center gap-3 text-base-content/20">
                        <div className="flex-1 h-px bg-base-300" />
                        <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary/30" />
                            <span className="w-2 h-2 rounded-full bg-secondary" />
                            <span className="w-2 h-2 rounded-full bg-accent/50" />
                        </div>
                        <div className="flex-1 h-px bg-base-300" />
                    </div>

                    <div className="w-full space-y-6 sm:space-y-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
                            <div className="form-control w-full">
                                <label className="label justify-center" htmlFor="numero_empleado">
                                    <span className="label-text font-black text-base-content text-base sm:text-lg">Ingrese su N° de Empleado</span>
                                </label>
                                <div className="relative group w-full">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform">
                                        <UserCheck size={24} strokeWidth={3} />
                                    </div>
                                    <input 
                                        id="numero_empleado"
                                        {...register('numero_empleado')}
                                        autoFocus
                                        autoComplete="off"
                                        inputMode="numeric"
                                        className="input input-bordered w-full pl-12 pr-4 text-center text-2xl sm:text-3xl font-black tracking-[0.15em] sm:tracking-[0.2em] font-mono h-16 sm:h-24 border-2 sm:border-4 focus:border-primary transition-all"
                                        placeholder="000000"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:block">
                                        <LoadingButton
                                            type="submit"
                                            className="btn btn-primary h-12 sm:h-16 px-4 sm:px-8 rounded-xl sm:rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all text-base sm:text-xl font-black"
                                            loading={mutation.isPending}
                                            aria-label={mutation.isPending ? "Procesando registro..." : "Checar asistencia"}
                                        >
                                            {mutation.isPending ? (
                                                <Clock className="animate-spin" size={24} />
                                            ) : (
                                                <><span className="font-black">CHECAR</span> <ArrowRight size={20} /></>
                                            )}
                                        </LoadingButton>
                                    </div>
                                </div>
                                <div className="mt-4 sm:hidden">
                                    <LoadingButton
                                        type="submit"
                                        className="btn btn-primary w-full h-16 px-8 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xl font-black"
                                        loading={mutation.isPending}
                                    >
                                        {mutation.isPending ? (
                                            <Clock className="animate-spin" size={24} />
                                        ) : (
                                            <><span className="font-black">CHECAR ASISTENCIA</span> <ArrowRight size={24} /></>
                                        )}
                                    </LoadingButton>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full mt-6 sm:mt-0">
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
