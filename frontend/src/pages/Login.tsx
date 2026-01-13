import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Lock, Loader2, AlertCircle } from 'lucide-react';
import client from '../api/client';
// Asegúrate de tener este componente o usa uno simple
import Swal from 'sweetalert2'; 

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Petición al Backend
      const response = await client.post('/usuarios/auth/login/', data);
      
      // 2. EXTRAER DATOS
      // El backend devuelve: { token: "...", user: { ... } }
      const { token, user } = response.data;

      // 3. GUARDAR EN LOCALSTORAGE (¡Aquí estaba el detalle!)
      // Debe coincidir con lo que busca client.ts ('access_token')
      localStorage.setItem('access_token', token); 
      localStorage.setItem('user', JSON.stringify(user));

      // 4. Redirigir
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 400) {
        setErrorMsg('Credenciales incorrectas. Verifique su usuario y contraseña.');
      } else {
        setErrorMsg('Error de conexión. Intente más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        
        {/* Encabezado */}
        <div className="bg-primary p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">USAER 7607</h1>
          <p className="text-blue-100">Sistema de Gestión Escolar</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-text-main mb-6 text-center">Iniciar Sesión</h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Usuario */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary">Usuario o No. Empleado</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  {...register('username', { required: "El usuario es obligatorio" })}
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ingrese su usuario"
                />
              </div>
              {errors.username && <span className="text-xs text-red-500">{errors.username.message as string}</span>}
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-secondary">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  {...register('password', { required: "La contraseña es obligatoria" })}
                  type="password" 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <span className="text-xs text-red-500">{errors.password.message as string}</span>}
            </div>

            {/* Botón */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Entrando...
                </>
              ) : (
                'Acceder al Sistema'
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;