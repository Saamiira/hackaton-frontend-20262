import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { WantedDetail } from '../types/api';
import { apiClient, ApiError } from '../services/apiClient';

export const WantedDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [wanted, setWanted] = useState<WantedDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient<WantedDetail>(`/wanted/${id}`);
      setWanted(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Error al obtener información del cartel');
      } else {
        setError('No se pudo conectar con el archivo naval');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-slate-400 font-mono text-sm">Consultando archivo clasificado...</p>
      </div>
    );
  }

  if (error || !wanted) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-bold text-rose-400 mb-2">Cartel no encontrado</h3>
        <p className="text-sm text-slate-300 mb-6">{error || 'El cartel no existe o fue retirado.'}</p>
        <button
          onClick={handleBack}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm transition"
        >
          Volver a Carteles
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition cursor-pointer"
      >
        <span>←</span> Volver a la lista de carteles
      </button>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Banner Superior tipo Se Busca */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-6 text-center">
          <span className="text-xs font-black tracking-[0.3em] uppercase text-amber-500">
            MARINE HEADQUARTERS BOUNTY NOTICE
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-100 tracking-wider mt-1 uppercase font-serif">
            DEAD OR ALIVE
          </h1>
        </div>

        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-800">
            <div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  wanted.status === 'ACTIVE'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : wanted.status === 'CAPTURED'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {wanted.status}
              </span>
              <h2 className="text-3xl font-black text-slate-100 mt-3">{wanted.name}</h2>
              <p className="text-lg text-amber-400 italic font-serif">"{wanted.epithet}"</p>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
                Recompensa Oficial
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-1">
                ฿ {wanted.bounty?.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                  Tripulación
                </h4>
                <p className="text-base text-slate-200 mt-1">
                  {wanted.crew ? wanted.crew.name : 'Independiente / No asignada'}
                </p>
              </div>

              {wanted.devilFruit && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                    Fruta del Diablo (Akuma no Mi)
                  </h4>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-purple-300 font-medium">{wanted.devilFruit.name}</span>
                    <span className="text-xs font-mono bg-purple-950 text-purple-400 px-2 py-0.5 rounded border border-purple-800">
                      Tipo: {wanted.devilFruit.type}
                    </span>
                    {wanted.devilFruit.awakened && (
                      <span className="text-xs font-mono bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800 font-bold">
                        DESPERTADA
                      </span>
                    )}
                  </div>
                </div>
              )}

              {wanted.lastKnownLocation && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                    Última Ubicación Conocida
                  </h4>
                  <p className="text-base text-slate-200 mt-1">{wanted.lastKnownLocation}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                Descripción & Antecedentes
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                {wanted.description || 'Sin antecedentes adicionales en la bitácora de la Marina.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
