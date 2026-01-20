import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <--- Importamos Link
import { useForm } from 'react-hook-form';
import { User, Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'; // <--- ArrowLeft opcional
import client from '../api/client';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Backend Request
      const response = await client.post('/usuarios/auth/login/', data);
      
      // 2. Extract Data
      const { token, user } = response.data;

      // 3. Save to LocalStorage
      localStorage.setItem('access_token', token); 
      localStorage.setItem('user', JSON.stringify(user));

      // 4. Redirect
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
        
        {/* Header */}
        <div className="bg-primary p-8 text-center relative">
          <h1 className="text-3xl font-bold text-white mb-2">USAER 7607</h1>
          <p className="text-blue-100">Sistema de Gestión Escolar</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-text-main mb-6 text-center">Iniciar Sesión</h2>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Username */}
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

            {/* Password */}
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

            {/* Submit Button */}
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

            {/* --- ENLACE DE VOLVER AL KIOSCO --- */}
            <div className="text-center pt-4 border-t border-slate-100 mt-6">
                <Link to="/" className="text-sm text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Volver al Checador de Asistencia
                </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;