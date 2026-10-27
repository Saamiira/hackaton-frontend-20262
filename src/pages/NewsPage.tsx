import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { NewsFeed, NewsItem, NewsType, NewsPriority, NewsStatus } from '../types/api';
import { apiClient, ApiError } from '../services/apiClient';

const VALID_TYPES: NewsType[] = ['WORLD_GOVERNMENT', 'PIRATE_INCIDENT', 'REVOLUTIONARY', 'MARINE_MOVEMENT', 'GENERAL'];
const VALID_PRIORITIES: NewsPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES: NewsStatus[] = ['RUMOR', 'CONFIRMED', 'DEBUNKED'];

export const NewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtros desde URL
  const rawType = searchParams.get('type') || '';
  const type = VALID_TYPES.includes(rawType as NewsType) ? rawType : '';

  const rawPriority = searchParams.get('priority') || '';
  const priority = VALID_PRIORITIES.includes(rawPriority as NewsPriority) ? rawPriority : '';

  const rawStatus = searchParams.get('status') || '';
  const status = VALID_STATUSES.includes(rawStatus as NewsStatus) ? rawStatus : '';

  // Estado del Feed con deduplicación estricta (Regla de Nami)
  const [items, setItems] = useState<NewsItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogPoseLocked, setIsLogPoseLocked] = useState<boolean>(false);

  // Candado para evitar más de una carga en vuelo ("una sola carga adicional en vuelo")
  const isLoadingRef = useRef(false);
  isLoadingRef.current = isLoading;

  const currentFiltersRef = useRef({ type, priority, status });
  currentFiltersRef.current = { type, priority, status };

  // Sensor para Infinite Scroll
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  const updateFilter = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  // Carga de página/cursor
  const loadNews = useCallback(
    async (cursor: string | null = null, isInitial = false) => {
      if (isLoadingRef.current) return;
      if (!isInitial && !hasMore) return;

      setIsLoading(true);
      setError(null);

      const requestFilters = { ...currentFiltersRef.current };

      try {
        const params: Record<string, string | number> = {
          limit: 20,
        };
        if (cursor) params.cursor = cursor;
        if (requestFilters.type) params.type = requestFilters.type;
        if (requestFilters.priority) params.priority = requestFilters.priority;
        if (requestFilters.status) params.status = requestFilters.status;

        const response = await apiClient<NewsFeed>('/news/feed', { params });

        // Si los filtros cambiaron mientras la petición estaba en vuelo, descartar (anti-mezcla)
        if (
          requestFilters.type !== currentFiltersRef.current.type ||
          requestFilters.priority !== currentFiltersRef.current.priority ||
          requestFilters.status !== currentFiltersRef.current.status
        ) {
          return;
        }

        // Regla de Nami: nada se cuenta dos veces (deduplicar por ID)
        setItems((prevItems) => {
          if (isInitial) {
            return response.items;
          }
          const existingIds = new Set(prevItems.map((i) => i.id));
          const newItems = response.items.filter((i) => !existingIds.has(i.id));
          return [...prevItems, ...newItems];
        });

        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setIsLogPoseLocked(false);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 423) {
            setIsLogPoseLocked(true);
            setError('Requiere Log Pose: Pasa la inspección de Reverse Mountain (CP3) para acceder.');
          } else {
            setError(err.message || 'Error al descargar noticias del News Coo.');
          }
        } else {
          setError('Fallo de conexión al interceptar gaviotas mensajeras.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [hasMore]
  );

  // Reiniciar feed cada vez que cambien los filtros
  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
    loadNews(null, true);
  }, [type, priority, status]);

  // Observer nativo para Infinite Scroll
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current && !error && !isLogPoseLocked) {
          if (nextCursor) {
            loadNews(nextCursor, false);
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(trigger);
    return () => {
      observer.disconnect();
    };
  }, [hasMore, nextCursor, error, isLogPoseLocked, loadNews]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕊️</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              News Coo • Noticias del Mundo
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Gaceta informativa distribuida por el Diario de Economía Mundial (Morgans)
          </p>
        </div>
      </div>

      {/* Bloqueo 423 Log Pose */}
      {isLogPoseLocked && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-8 text-center max-w-xl mx-auto my-6">
          <div className="text-5xl mb-3">🧭</div>
          <h3 className="text-xl font-bold text-amber-400 mb-2">Grand Line Bloqueado (423)</h3>
          <p className="text-sm text-slate-300 mb-4">
            El News Coo no vuela hacia tripulaciones sin Log Pose validado. Completa la inspección en
            Reverse Mountain para acceder a este canal.
          </p>
          <a
            href="https://logpose-api-jg7f.onrender.com/reverse-mountain"
            target="_blank"
            rel="noreferrer"
            className="inline-block px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm hover:bg-amber-400 transition"
          >
            Ir a la cola de Reverse Mountain →
          </a>
        </div>
      )}

      {/* Filtros */}
      {!isLogPoseLocked && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Tipo de Noticia
            </label>
            <select
              value={type}
              onChange={(e) => updateFilter('type', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">Todos los Tipos</option>
              <option value="WORLD_GOVERNMENT">Gobierno Mundial</option>
              <option value="PIRATE_INCIDENT">Incidente Pirata</option>
              <option value="REVOLUTIONARY">Ejército Revolucionario</option>
              <option value="MARINE_MOVEMENT">Movimiento de la Marina</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => updateFilter('priority', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">Cualquier Prioridad</option>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica / Noticia de Última Hora</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Estado de Veracidad
            </label>
            <select
              value={status}
              onChange={(e) => updateFilter('status', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">Cualquier Estado</option>
              <option value="RUMOR">Rumor (Requiere Verificar)</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="DEBUNKED">Desmentido</option>
            </select>
          </div>
        </div>
      )}

      {/* Lista del Feed */}
      <div className="space-y-4">
        {items.map((news) => (
          <Link
            key={news.id}
            to={`/news/${news.id}`}
            className="block bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-6 rounded-2xl transition duration-150 hover:shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    news.status === 'CONFIRMED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : news.status === 'DEBUNKED'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                  }`}
                >
                  {news.status}
                </span>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {news.type}
                </span>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {new Date(news.publishedAt).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 hover:text-amber-400 transition mb-2">
              {news.title}
            </h3>

            <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{news.summary}</p>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>Por: {news.author || 'Morgans'}</span>
              <span className="text-amber-500 hover:underline">Leer despacho completo →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Error con recuperación sin borrar el feed */}
      {error && !isLogPoseLocked && (
        <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl text-center">
          <p className="text-sm text-rose-400 mb-2">{error}</p>
          <button
            onClick={() => loadNews(nextCursor, false)}
            className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded text-xs hover:bg-amber-400 transition cursor-pointer"
          >
            Reintentar carga
          </button>
        </div>
      )}

      {/* Sensor de scroll y Loader */}
      <div ref={loadMoreTriggerRef} className="py-6 flex justify-center items-center">
        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span>Esperando más despachos del News Coo...</span>
          </div>
        )}

        {!hasMore && items.length > 0 && !isLoading && (
          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
            —— Fin de las noticias del mundo ——
          </p>
        )}
      </div>
    </div>
  );
};
