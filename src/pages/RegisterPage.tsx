import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/apiClient';

interface FieldErrors {
  teamName?: string;
  email?: string;
  password?: string;
  general?: string;
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await register(teamName, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        const fieldErrors: FieldErrors = {};
        const data = err.data;

        if (typeof data.fields === 'object' && data.fields !== null) {
          const rawFields = data.fields as Record<string, string>;
          fieldErrors.teamName = rawFields.teamName;
          fieldErrors.email = rawFields.email;
          fieldErrors.password = rawFields.password;
        }

        fieldErrors.general = (data.message as string) || (data.error as string) || err.message;
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Error al registrar la tripulación' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span className="text-5xl">⚓</span>
        <h2 className="mt-4 text-3xl font-extrabold text-amber-500 tracking-tight">
          Registrar Tripulación
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Únete a la Guild de Cazarrecompensas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 py-8 px-6 shadow-xl border border-slate-800 rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
                {errors.general}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nombre de la Tripulación
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Piratas de Sombrero de Paja"
                className={`w-full px-4 py-2.5 rounded-lg bg-slate-800 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                  errors.teamName ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.teamName && (
                <p className="mt-1 text-xs text-rose-400">{errors.teamName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="capitan@grandline.sea"
                className={`w-full px-4 py-2.5 rounded-lg bg-slate-800 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                  errors.email ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={`w-full px-4 py-2.5 rounded-lg bg-slate-800 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition ${
                  errors.password ? 'border-rose-500' : 'border-slate-700'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold tracking-wide uppercase transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              {isSubmitting ? 'Registrando...' : 'Zarpar a la Aventura'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            ¿Ya tienes tripulación?{' '}
            <Link to="/login" className="font-semibold text-amber-500 hover:text-amber-400 underline">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
