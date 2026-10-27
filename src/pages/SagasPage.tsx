import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { SagaSummary } from '../types/api';
import { apiClient, ApiError } from '../services/apiClient';

export const SagasPage: React.FC = () => {
  const [sagas, setSagas] = useState<SagaSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogPoseLocked, setIsLogPoseLocked] = useState<boolean>(false);

  const fetchSagas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient<SagaSummary[]>('/sagas');
      setSagas(data || []);
      setIsLogPoseLocked(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 423) {
          setIsLogPoseLocked(true);
          setError('El Poneglyph está sellado: Requiere Log Pose (Supera CP3 en Reverse Mountain).');
        } else {
          setError(err.message || 'Error al descifrar los Poneglyphs.');
        }
      } else {
        setError('No se pudo establecer contacto con las inscripciones antiguas.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSagas();
  }, [fetchSagas]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-slate-400 font-mono text-sm">Descifrando texto antiguo del Poneglyph...</p>
      </div>
    );
  }

  if (isLogPoseLocked) {
    return (
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
        <div className="text-5xl mb-3">🗿</div>
        <h3 className="text-xl font-bold text-amber-400 mb-2">Poneglyph Bloqueado (423)</h3>
        <p className="text-sm text-slate-300 mb-4">
          Nadie sin un Log Pose auténtico puede descifrar la ruta ni las sagas del Grand Line.
          Acude a la inspección en Reverse Mountain para desbloquear este tramo.
        </p>
        <a
          href="https://logpose-api-jg7f.onrender.com/reverse-mountain"
          target="_blank"
          rel="noreferrer"
          className="inline-block px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm hover:bg-amber-400 transition"
        >
          Cola de Reverse Mountain →
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <div className="text-3xl mb-2">⚠️</div>
        <p className="text-rose-400 font-semibold mb-4">{error}</p>
        <button
          onClick={fetchSagas}
          className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm hover:bg-amber-400 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗿</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Poneglyphs • Las Grandes Sagas
          </h1>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          La crónica inmutable del Siglo Vacío y la travesía por los mares
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sagas.map((saga) => (
          <Link
            key={saga.id}
            to={`/sagas/${saga.id}`}
            className="group bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-6 transition duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-amber-500 mb-3">
                <span>SAGA #{saga.order}</span>
                <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
                  {saga.stageCount} Etapas
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-100 group-hover:text-amber-400 transition mb-3">
                {saga.title}
              </h3>
              <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                {saga.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-500">
              <span>Recorrer Scrollytelling</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
