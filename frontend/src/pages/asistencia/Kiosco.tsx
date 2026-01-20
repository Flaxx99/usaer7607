import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom'; // Import Link for navigation
import Swal from 'sweetalert2';
import { Clock, UserCheck, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { registrarAsistencia } from '../../api/asistencia';

const Kiosco = () => {
    // Real-time clock state
    const [horaActual, setHoraActual] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setHoraActual(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { register, handleSubmit, reset, setFocus } = useForm<{ numero_empleado: string }>();

    // Mutation to send attendance data
    const mutation = useMutation({
        mutationFn: registrarAsistencia,
        onSuccess: (data) => {
            // Success Feedback (SweetAlert)
            Swal.fire({
                title: data.tipo === 'ENTRADA' ? '¡Bienvenido!' : '¡Hasta luego!',
                html: `
                    <div class="text-center">
                        <p class="text-xl font-bold text-slate-700">${data.profesor}</p>
                        <p class="text-4xl font-black mt-2 ${data.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-blue-600'}">
                            ${data.hora}
                        </p>
                        ${data.detalle ? `<p class="mt-2 text-sm text-slate-500">${data.detalle}</p>` : ''}
                    </div>
                `,
                icon: data.tipo === 'ENTRADA' ? 'success' : 'info',
                timer: 4000,
                showConfirmButton: false,
                backdrop: `rgba(0,0,123,0.4)`
            });
            reset();
            // Refocus input for the next person
            setTimeout(() => setFocus('numero_empleado'), 500); 
        },
        onError: (err: any) => {
            Swal.fire({
                title: 'No registrado',
                text: err.response?.data?.detail || 'Error al conectar con el servidor',
                icon: 'error',
                timer: 3000,
                showConfirmButton: false
            });
            reset();
            setTimeout(() => setFocus('numero_empleado'), 500);
        }
    });

    const onSubmit = (data: { numero_empleado: string }) => {
        mutation.mutate(data.numero_empleado);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* --- ADMIN LOGIN BUTTON (Top Right) --- */}
            <div className="absolute top-6 right-6 z-10">
                <Link 
                    to="/login" 
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur text-slate-500 rounded-full text-sm font-medium hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm border border-slate-200"
                >
                    <ShieldCheck size={16} />
                    <span>Iniciar Sesión</span>
                </Link>
            </div>

            {/* --- DECORATIVE BACKGROUND --- */}
            <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 rounded-b-[50%] scale-x-150 -translate-y-20 z-0 opacity-90" />

            {/* --- MAIN CARD --- */}
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 mx-4">
                
                {/* Header with Clock */}
                <div className="bg-white pt-10 pb-6 text-center">
                    <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">Sistema de Asistencia USAER</p>
                    <h1 className="text-7xl font-black text-slate-800 tabular-nums tracking-tight">
                        {horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </h1>
                    <p className="text-slate-400 font-medium text-lg mt-1 capitalize">
                        {horaActual.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                {/* Input Area */}
                <div className="p-8 pb-12">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="text-center relative group">
                            <label className="block text-sm font-bold text-slate-400 mb-2">
                                Ingrese su N° de Empleado
                            </label>
                            
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                    <UserCheck className="text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
                                </div>
                                <input 
                                    {...register('numero_empleado', { required: true })}
                                    type="text" 
                                    autoFocus
                                    autoComplete="off"
                                    className="w-full pl-14 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-3xl font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder-slate-200"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>

                        <button 
                            disabled={mutation.isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            {mutation.isPending ? 'Procesando...' : (
                                <>
                                    <Clock size={24} /> CHECAR
                                </>
                            )}
                        </button>
                    </form>

                    {/* Legends */}
                    <div className="mt-10 grid grid-cols-2 gap-4 text-center border-t border-slate-100 pt-6">
                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-700">
                            <div className="flex items-center gap-1 font-bold text-sm">
                                <LogIn size={16}/> ENTRADA
                            </div>
                            <span className="text-[10px] opacity-70 uppercase">Primer Registro</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-700">
                            <div className="flex items-center gap-1 font-bold text-sm">
                                <LogOut size={16}/> SALIDA
                            </div>
                            <span className="text-[10px] opacity-70 uppercase">Segundo Registro</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 text-center w-full text-slate-400 text-xs">
                <p>USAER 7607 &copy; {new Date().getFullYear()}</p>
            </div>
        </div>
    );
};

export default Kiosco;