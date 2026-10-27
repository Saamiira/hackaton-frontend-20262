import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { WantedPage, WantedSummary, Crew, FruitType, WantedStatus } from '../types/api';
import { apiClient, ApiError } from '../services/apiClient';

const VALID_SIZES = [10, 20, 50];
const VALID_SORTS = ['bounty,desc', 'name,asc', 'updatedAt,desc'];
const VALID_STATUSES: WantedStatus[] = ['ACTIVE', 'CAPTURED', 'DECEASED'];
const VALID_FRUITS: FruitType[] = ['PARAMECIA', 'ZOAN', 'ANCIENT_ZOAN', 'MYTHICAL_ZOAN', 'LOGIA'];

export const WantedPageList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Validar y sanitizar parámetros desde la URL
  const rawPage = parseInt(searchParams.get('page') || '0', 10);
  const page = !isNaN(rawPage) && rawPage >= 0 ? rawPage : 0;

  const rawSize = parseInt(searchParams.get('size') || '10', 10);
  const size = VALID_SIZES.includes(rawSize) ? rawSize : 10;

  const rawSort = searchParams.get('sort') || 'bounty,desc';
  const sort = VALID_SORTS.includes(rawSort) ? rawSort : 'bounty,desc';

  const rawStatus = searchParams.get('status') || '';
  const status = VALID_STATUSES.includes(rawStatus as WantedStatus) ? rawStatus : '';

  const rawFruit = searchParams.get('fruit') || '';
  const fruit = VALID_FRUITS.includes(rawFruit as FruitType) ? rawFruit : '';

  const crewId = searchParams.get('crewId') || '';
  const q = searchParams.get('q') || '';

  // Input de búsqueda local con debounce
  const [searchInput, setSearchInput] = useState(q);

  // Estados de datos
  const [data, setData] = useState<WantedPage | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Protección anti-race-conditions: referenciar última request activa
  const latestRequestId = useRef(0);

  // Cargar tripulaciones para el filtro
  useEffect(() => {
    let isMounted = true;
    apiClient<Crew[]>('/crews')
      .then((res) => {
        if (isMounted) setCrews(res || []);
      })
      .catch(() => {
        // Silencioso o log
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sincronizar input de búsqueda si la URL cambia externamente (atrás/adelante)
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Actualizar parámetros en la URL asegurando reiniciar page=0 si cambian filtros
  const updateParam = (key: string, value: string | number | undefined, resetPage = true) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value !== undefined && value !== '' && value !== null) {
      nextParams.set(key, String(value));
    } else {
      nextParams.delete(key);
    }

    if (resetPage) {
      nextParams.set('page', '0');
    }

    setSearchParams(nextParams);
  };

  // Debounce del input de búsqueda (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        updateParam('q', searchInput.trim() || undefined, true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch de Carteles con protección de race conditions (Regla del Log Pose)
  const fetchWanted = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page,
        size,
        sort,
      };
      if (status) params.status = status;
      if (fruit) params.fruit = fruit;
      if (crewId) params.crewId = crewId;
      if (q) params.q = q;

      const response = await apiClient<WantedPage>('/wanted', { params });

      // Solo actualizar si es la respuesta más reciente
      if (requestId === latestRequestId.current) {
        setData(response);
      }
    } catch (err) {
      if (requestId === latestRequestId.current) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('No se pudo cargar la lista de fugitivos.');
        }
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
      }
    }
  }, [page, size, sort, status, fruit, crewId, q]);

  useEffect(() => {
    fetchWanted();
  }, [fetchWanted]);

  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Carteles de "Se Busca"
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Registro oficial del Gobierno Mundial y la Marina
          </p>
        </div>
      </div>

      {/* Filtros y Controles */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Buscar Pirata o Epíteto
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ej. Monkey D. Luffy, Mugiwara..."
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm cursor-pointer"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="CAPTURED">Capturado (Impel Down)</option>
              <option value="DECEASED">Fallecido</option>
            </select>
          </div>

          {/* Fruta */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Fruta del Diablo
            </label>
            <select
              value={fruit}
              onChange={(e) => updateParam('fruit', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm cursor-pointer"
            >
              <option value="">Cualquier Fruta</option>
              <option value="PARAMECIA">Paramecia</option>
              <option value="ZOAN">Zoan</option>
              <option value="ANCIENT_ZOAN">Ancient Zoan</option>
              <option value="MYTHICAL_ZOAN">Mythical Zoan</option>
              <option value="LOGIA">Logia</option>
            </select>
          </div>
        </div>

        {/* Fila secundaria de filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Tripulación
            </label>
            <select
              value={crewId}
              onChange={(e) => updateParam('crewId', e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm cursor-pointer"
            >
              <option value="">Todas las Tripulaciones</option>
              {crews.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Ordenar Por
            </label>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value, false)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm cursor-pointer"
            >
              <option value="bounty,desc">Mayor Recompensa</option>
              <option value="name,asc">Nombre (A-Z)</option>
              <option value="updatedAt,desc">Recientemente Actualizado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Por Página
            </label>
            <select
              value={size}
              onChange={(e) => updateParam('size', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm cursor-pointer"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenedor con altura mínima constante para evitar saltos de layout */}
      <div className="min-h-[400px]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-slate-400 text-sm">Consultando cuartel de la Marina...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-8">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-rose-400 font-semibold mb-4">{error}</p>
            <button
              onClick={fetchWanted}
              className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-sm hover:bg-amber-400 transition cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !error && data && data.content.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <span className="text-4xl block mb-2">🏴‍☠️</span>
            <h3 className="text-lg font-bold text-slate-300">No se encontraron carteles</h3>
            <p className="text-slate-500 text-sm mt-1">
              Prueba cambiando los filtros o el término de búsqueda.
            </p>
          </div>
        )}

        {!isLoading && !error && data && data.content.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.content.map((item: WantedSummary) => (
              <Link
                key={item.id}
                to={`/wanted/${item.id}`}
                className="group bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-5 transition duration-200 flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        item.status === 'ACTIVE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : item.status === 'CAPTURED'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.devilFruit && (
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-950/30 border border-purple-500/20 px-2 py-0.5 rounded">
                        {item.devilFruit.name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-100 group-hover:text-amber-400 transition tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 italic mb-4">
                    "{item.epithet || 'Sin epíteto conocido'}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    DEAD OR ALIVE
                  </span>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    ฿ {item.bounty?.toLocaleString()}
                  </div>
                  {item.crew && (
                    <p className="text-xs text-slate-400 mt-2 truncate">
                      Tripulación: <span className="text-slate-200 font-medium">{item.crew.name}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Paginación Real Servidor */}
      {!isLoading && !error && data && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-400 font-mono">
            Página <span className="font-bold text-slate-200">{page + 1}</span> de{' '}
            <span className="font-bold text-slate-200">{totalPages}</span> (Total:{' '}
            {data.totalElements} fugitivos)
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => updateParam('page', page - 1, false)}
              disabled={page <= 0}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Anterior
            </button>
            <button
              onClick={() => updateParam('page', page + 1, false)}
              disabled={page >= totalPages - 1}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
