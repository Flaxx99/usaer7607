import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginForm } from '../schemas/auth';
import { User, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import client from '../api/client';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);

    try {
      const response = await client.post<{ token: string; user: { first_name: string; email: string } }>('/usuarios/auth/login/', data);
      const { token, user } = response.data;

      localStorage.setItem('access_token', token); 
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('¡Bienvenido! ✅', {
        description: `Hola ${user.first_name}, has ingresado correctamente.`,
      });

      navigate('/dashboard');
      
    } catch (error: unknown) {
      const message = isAxiosError(error) && error.response?.status === 400
        ? 'Credenciales incorrectas. Verifique su usuario y contraseña.' 
        : 'Error de conexión. Intente más tarde.';

      toast.error('Error ❌', {
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
                    aria-label="Usuario o No. Empleado"
                    {...register('username')}
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
                    aria-label="Contraseña"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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

