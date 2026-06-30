import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { loginSchema, type LoginForm } from '../schemas/auth';
import { User, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import client from '../api/client';
import { LoadingButton } from '../components/LoadingButton';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) =>
      client.post<{ token: string; user: { first_name: string; email: string } }>(
        '/usuarios/auth/login/', data
      ),
    onSuccess: (response) => {
      const { token, user } = response.data;

      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(<span className="inline-flex items-center gap-1.5"><CheckCircle size={16} /> ¡Bienvenido!</span>, {
        description: `Hola ${user.first_name}, has ingresado correctamente.`,
      });

      navigate('/dashboard');
    },
    onError: (error: unknown) => {
      const message = isAxiosError(error) && error.response?.status === 400
        ? 'Credenciales incorrectas. Verifique su usuario y contraseña.'
        : 'Error de conexión. Intente más tarde.';

      toast.error(<span className="inline-flex items-center gap-1.5"><XCircle size={16} /> Error</span>, {
        description: message,
      });
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary/5 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="card bg-base-100 shadow-2xl overflow-hidden border border-base-200">
          {/* Header con gradiente */}
          <div className="relative bg-gradient-to-br from-primary to-indigo-700 text-primary-content px-8 pt-10 pb-12 text-center overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -left-4 bottom-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
            
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner backdrop-blur-sm">
              <GraduationCap size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              USAER <span className="text-white/80">7607</span>
            </h2>
            <p className="text-sm font-medium opacity-85 mt-1 max-w-[220px] mx-auto">
              Sistema de Gestión Escolar
            </p>
          </div>

          {/* Formulario */}
          <div className="card-body px-8 pt-8 pb-8">
            <div className="mb-6">
              <h1 className="text-xl font-black text-base-content">
                Iniciar Sesión
              </h1>
              <p className="text-sm text-base-content/50 mt-0.5">
                Ingresá tus credenciales para acceder al panel
              </p>
            </div>

            <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="flex flex-col gap-5">
              <div className="form-control w-full">
                <label className="label pb-1.5" htmlFor="login-username">
                  <span className="label-text font-bold text-sm">Usuario o No. Empleado</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 group-focus-within:text-primary transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    id="login-username"
                    type="text"
                    placeholder="Tu usuario o número de empleado"
                    aria-label="Usuario o No. Empleado"
                    className={`input input-bordered w-full pl-10 transition-all focus:input-primary ${errors.username ? 'input-error' : ''}`}
                    {...register('username')}
                  />
                </div>
                {errors.username && (
                  <span className="text-error text-xs font-medium mt-1.5 flex items-center gap-1">
                    <XCircle size={12} />
                    {errors.username.message as string}
                  </span>
                )}
              </div>

              <div className="form-control w-full">
                <label className="label pb-1.5" htmlFor="login-password">
                  <span className="label-text font-bold text-sm">Contraseña</span>
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    aria-label="Contraseña"
                    className={`input input-bordered w-full pl-10 pr-12 transition-all focus:input-primary ${errors.password ? 'input-error' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs text-base-content/40 hover:text-base-content"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-error text-xs font-medium mt-1.5 flex items-center gap-1">
                    <XCircle size={12} />
                    {errors.password.message as string}
                  </span>
                )}
              </div>

              <LoadingButton
                type="submit"
                className="btn btn-primary mt-2 h-12 text-base font-bold gap-2"
                loading={loginMutation.isPending}
                icon={User}
              >
                {loginMutation.isPending ? 'Ingresando...' : 'Acceder al Sistema'}
              </LoadingButton>

              <div className="divider text-xs text-base-content/30">OPCIÓN DE ACCESO</div>

              <Link
                to="/"
                className="btn btn-ghost btn-sm gap-2 text-base-content/50 hover:text-base-content hover:bg-base-200 transition-all"
              >
                <ArrowLeft size={14} />
                Volver al Checador de Asistencia
              </Link>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/30 font-medium mt-6">
          &copy; {new Date().getFullYear()} USAER 7607 &mdash; Todos los derechos reservados
        </p>
      </div>
    </div>
  );
};

export default Login;

