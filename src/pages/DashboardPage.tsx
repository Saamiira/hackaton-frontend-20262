import React, { useEffect, useState, useCallback } from 'react';
import type { DashboardSummary } from '../types/api';
import { apiClient, ApiError } from '../services/apiClient';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient<DashboardSummary>('/dashboard/summary');
      setSummary(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Error al obtener indicadores del dashboard');
      } else {
        setError('Error de conexión con la Guild');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-slate-400 font-mono text-sm">Consultando bitácora naval...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-rose-400 mb-2">Fallo en la comunicación</h3>
        <p className="text-sm text-slate-300 mb-6">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition shadow cursor-pointer text-sm"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-16 text-slate-500">
        No se encontraron registros de navegación disponibles.
      </div>
    );
  }

  const { logPose } = summary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Bitácora de la Tripulación
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Estado actual de la Guild y orientación del Grand Line
        </p>
      </div>

      {/* Log Pose Status Banner */}
      <div className={`p-6 rounded-2xl border transition-all ${
        logPose?.unlocked
          ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl p-3 bg-slate-800 rounded-xl border border-slate-700">
              🧭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Estado del Log Pose</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                    logPose?.unlocked
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {logPose?.unlocked ? 'Desbloqueado (Grand Line)' : 'East Blue (Bloqueado)'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Rumbo fijado hacia:{' '}
                <span className="font-semibold text-slate-200">
                  {logPose?.nextIsland || 'Reverse Mountain'}
                </span>{' '}
                • Aguja: {logPose?.currentBearing || 'Sur-Sureste'}
              </p>
            </div>
          </div>

          <div className="w-full md:w-48 bg-slate-800 rounded-lg p-3 border border-slate-700/50">
            <div className="flex justify-between text-xs mb-1.5 font-mono">
              <span className="text-slate-400">Carga Magnética</span>
              <span className="text-amber-400 font-bold">{logPose?.chargePercentage ?? 0}%</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, logPose?.chargePercentage ?? 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Recompensa Total Rastreando
          </span>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
            ฿ {summary.totalBountyTracked?.toLocaleString() ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cárteles en circulación</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Carteles Activos
          </span>
          <div className="text-2xl font-black text-slate-100 mt-2 font-mono">
            {summary.activeWantedCount ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Piratas buscando captura</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Noticias Verificadas
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {summary.verifiedNewsCount ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Reportes confirmados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Rumores no Resueltos
          </span>
          <div className="text-2xl font-black text-rose-400 mt-2 font-mono">
            {summary.unresolvedRumorsCount ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Requieren confirmación</p>
        </div>
      </div>
    </div>
  );
};
