import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import client from '../api/client';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      const response = await client.post('/usuarios/auth/login/', data);
      const { token, user } = response.data;

      localStorage.setItem('access_token', token); 
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Bienvenido', {
        description: `Hola ${user.first_name}, has ingresado correctamente.`,
      });

      navigate('/dashboard');
      
    } catch (error: any) {
      const message = error.response?.status === 400 
        ? 'Credenciales incorrectas. Verifique su usuario y contraseña.' 
        : 'Error de conexión. Intente más tarde.';

      toast.error('Error de acceso', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl overflow-hidden">
          {/* Header con color primario */}
          <div className="bg-primary text-primary-content p-8 text-center">
            <h2 className="text-2xl font-extrabold mb-1">
              USAER 7607
            </h2>
            <p className="text-sm opacity-90">
              Sistema de Gesti&oacute;n Escolar
            </p>
          </div>

          {/* Formulario */}
          <div className="card-body">
            <h3 className="card-title justify-center text-xl mb-4">
              Iniciar Sesi&oacute;n
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Usuario o No. Empleado</legend>
                <div className="input validator w-full">
                  <User className="w-4 h-4 opacity-60" />
                  <input
                    type="text"
                    placeholder="Ingrese su usuario"
                    {...register('username', { required: "El usuario es obligatorio" })}
                  />
                </div>
                {errors.username && (
                  <span className="fieldset-label text-error text-xs">{errors.username.message as string}</span>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Contrase&ntilde;a</legend>
                <div className="input validator w-full">
                  <Lock className="w-4 h-4 opacity-60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password', { required: "La contraseña es obligatoria" })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="fieldset-label text-error text-xs">{errors.password.message as string}</span>
                )}
              </fieldset>

              <button
                type="submit"
                className="btn btn-primary mt-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Ingresando...' : 'Acceder al Sistema'}
              </button>

              <div className="divider" />

              <Link
                to="/"
                className="link link-hover text-sm flex items-center justify-center gap-2 text-base-content/60"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al Checador de Asistencia
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
