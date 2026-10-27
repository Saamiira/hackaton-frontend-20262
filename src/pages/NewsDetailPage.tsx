import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { NewsDetail, NewsStatus } from '../types/api';
import { apiClient, ApiError } from '../services/apiClient';

export const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de verificación de rumor
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient<NewsDetail>(`/news/${id}`);
      setNews(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'No se pudo cargar la noticia.');
      } else {
        setError('Error al recibir la noticia del News Coo.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUpdateStatus = async (newStatus: 'CONFIRMED' | 'DEBUNKED') => {
    if (!id || !news) return;

    setIsVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);

    const previousStatus = news.status;

    try {
      const updated = await apiClient<NewsDetail>(`/news/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setNews(updated);
      setVerifySuccess(
        `El rumor ha sido marcado exitosamente como ${newStatus === 'CONFIRMED' ? 'CONFIRMADO' : 'DESMENTIDO'}.`
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setVerifyError(err.message || 'No se pudo actualizar el estado del rumor.');
      } else {
        setVerifyError('Error de conexión al emitir la verificación.');
      }
      // Conservar el estado anterior en caso de fallo
      setNews((prev) => (prev ? { ...prev, status: previousStatus } : null));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-slate-400 font-mono text-sm">Descifrando gaviota mensajera...</p>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="text-lg font-bold text-rose-400 mb-2">Noticia no disponible</h3>
        <p className="text-sm text-slate-300 mb-6">{error || 'La noticia solicitada no existe o fue censurada.'}</p>
        <button
          onClick={handleBack}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm transition"
        >
          Volver a News Coo
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition cursor-pointer"
      >
        <span>←</span> Volver al feed de noticias
      </button>

      <article className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                news.status === 'CONFIRMED'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : news.status === 'DEBUNKED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {news.status}
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded">
              {news.priority}
            </span>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {new Date(news.publishedAt).toLocaleString()}
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight mb-3">
            {news.title}
          </h1>
          <p className="text-base text-amber-400/90 font-medium leading-relaxed">
            {news.summary}
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed border-t border-slate-800 pt-6">
          <p className="whitespace-pre-line">{news.body}</p>
        </div>

        {/* Verificación de Rumor (Si el estado es RUMOR) */}
        {news.status === ('RUMOR' as NewsStatus) && (
          <div className="mt-8 p-6 bg-slate-950 border border-amber-500/30 rounded-xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                Verificación de Inteligencia
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Como tripulación con Log Pose, puedes contrastar los hechos y autenticar este rumor.
              </p>
            </div>

            {verifySuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-400">
                {verifySuccess}
              </div>
            )}

            {verifyError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-xs text-rose-400">
                {verifyError}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleUpdateStatus('CONFIRMED')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow"
              >
                {isVerifying ? 'Verificando...' : 'Confirmar como Verdadero (CONFIRMED)'}
              </button>

              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleUpdateStatus('DEBUNKED')}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow"
              >
                {isVerifying ? 'Verificando...' : 'Desmentir Rumor (DEBUNKED)'}
              </button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
