import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import type { SagaStory, SagaStage } from '../types/api';
import { apiClient, ApiError } from '../services/apiClient';

export const SagaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [story, setStory] = useState<SagaStory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);

  // Referencias para cada bloque de etapa
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Cargar historia
  const fetchStory = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient<SagaStory>(`/sagas/${id}/story`);
      setStory(data);

      // Si la URL contiene una etapa activa al cargar, buscar su índice
      const stageParam = searchParams.get('stage');
      if (stageParam && data?.stages) {
        const foundIndex = data.stages.findIndex((s) => s.id === stageParam);
        if (foundIndex !== -1) {
          setActiveStageIndex(foundIndex);
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'No se pudo descifrar la historia del Poneglyph');
      } else {
        setError('Error al conectar con la memoria del Poneglyph');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  // Manejar el scroll y sincronizar con IntersectionObserver
  useEffect(() => {
    if (!story?.stages || story.stages.length === 0) return;

    const observers: IntersectionObserver[] = [];

    stageRefs.current.forEach((el, index) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveStageIndex(index);
              const currentStageId = story.stages[index].id;
              // Actualizar URL sin recrear historial excesivo
              setSearchParams({ stage: currentStageId }, { replace: true });
            }
          });
        },
        { threshold: 0.55 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [story, setSearchParams]);

  // Navegación por teclado entre etapas (Accesibilidad / Requisito CP5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!story?.stages) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'j') {
        if (activeStageIndex < story.stages.length - 1) {
          const nextIndex = activeStageIndex + 1;
          stageRefs.current[nextIndex]?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'k') {
        if (activeStageIndex > 0) {
          const prevIndex = activeStageIndex - 1;
          stageRefs.current[prevIndex]?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStageIndex, story]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-slate-400 font-mono text-sm">Descifrando las coordenadas del Poneglyph...</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center max-w-md mx-auto my-12">
        <div className="text-4xl mb-2">🗿</div>
        <h3 className="text-lg font-bold text-rose-400 mb-2">Historia no disponible</h3>
        <p className="text-sm text-slate-300 mb-6">{error || 'No se hallaron registros para esta saga.'}</p>
        <button
          onClick={() => navigate('/sagas')}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-sm transition"
        >
          Volver a Poneglyphs
        </button>
      </div>
    );
  }

  const { stages, saga } = story;
  const currentStage: SagaStage | undefined = stages[activeStageIndex];
  const progressPercent = Math.round(((activeStageIndex + 1) / stages.length) * 100);

  // Paleta dinámica de la etapa activa
  const stagePalette = currentStage?.palette || {
    primary: '#f59e0b',
    secondary: '#1e293b',
    accent: '#fbbf24',
    background: '#020617',
  };

  return (
    <div
      className="space-y-12 transition-colors duration-700 relative"
      style={{
        // Cambio sutil de ambientación basado en la paleta de la isla activa
        boxShadow: `inset 0 0 100px ${stagePalette.primary}15`,
      }}
    >
      {/* Barra de Progreso Fija Superior */}
      <div className="sticky top-16 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 py-3 px-4 -mx-4 sm:-mx-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sagas')}
              className="text-xs text-slate-400 hover:text-amber-400 transition"
            >
              ← Poneglyphs
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-slate-200 truncate">{saga.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400">
              Etapa {activeStageIndex + 1} de {stages.length} ({progressPercent}%)
            </span>
            <div className="w-24 sm:w-36 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: stagePalette.primary,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: Scrollytelling (Izquierda narrativa, Derecha Mapa persistente) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        {/* Columna Izquierda: Escenas y Narrativa por etapas */}
        <div className="lg:col-span-7 space-y-32 py-12">
          {stages.map((stg, idx) => (
            <div
              key={stg.id}
              ref={(el) => {
                stageRefs.current[idx] = el;
              }}
              className={`p-8 rounded-3xl border transition-all duration-500 min-h-[60vh] flex flex-col justify-center ${
                idx === activeStageIndex
                  ? 'bg-slate-900/90 border-amber-500/50 shadow-2xl scale-[1.01]'
                  : 'bg-slate-900/40 border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-4">
                <span
                  className="px-3 py-1 rounded-full font-bold uppercase"
                  style={{
                    backgroundColor: `${stg.palette.primary}25`,
                    color: stg.palette.primary,
                  }}
                >
                  Etapa {idx + 1}: {stg.island}
                </span>
                <span className="text-slate-500">Coord: [{stg.islandCoordinates.x}, {stg.islandCoordinates.y}]</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-4 tracking-tight">
                {stg.title}
              </h2>

              <p className="text-slate-300 leading-relaxed text-base sm:text-lg whitespace-pre-line mb-8">
                {stg.narrative}
              </p>

              {/* Métricas dinámicas de la etapa */}
              {stg.metrics && stg.metrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-800">
                  {stg.metrics.map((metric, mIdx) => (
                    <div key={mIdx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">
                        {metric.label}
                      </span>
                      <span
                        className="text-lg font-black font-mono mt-0.5 block"
                        style={{ color: stg.palette.accent }}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Columna Derecha: Mapa persistente del Grand Line con Barco */}
        <div className="lg:col-span-5 sticky top-36 z-20 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-amber-500">
                Carta Náutica • Grand Line
              </span>
              <span className="text-xs font-mono text-slate-400">
                Isla Actual: {currentStage?.island || 'Océano'}
              </span>
            </div>

            {/* Mapa Náutico SVG Persistente */}
            <div className="relative w-full aspect-square bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Cuadrícula náutica */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" />

                {/* Ruta trazada acumulada hasta la etapa activa */}
                {stages.length > 1 && (
                  <path
                    d={stages.slice(0, activeStageIndex + 1).reduce((acc, stage, i) => {
                      const prefix = i === 0 ? 'M' : 'L';
                      return `${acc} ${prefix} ${stage.islandCoordinates.x} ${stage.islandCoordinates.y}`;
                    }, '')}
                    fill="none"
                    stroke={stagePalette.primary}
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    className="transition-all duration-700"
                  />
                )}

                {/* Islas (Nodos) */}
                {stages.map((stg, i) => {
                  const isCurrent = i === activeStageIndex;
                  const isVisited = i <= activeStageIndex;
                  return (
                    <g key={stg.id} className="cursor-pointer" onClick={() => stageRefs.current[i]?.scrollIntoView({ behavior: 'smooth' })}>
                      <circle
                        cx={stg.islandCoordinates.x}
                        cy={stg.islandCoordinates.y}
                        r={isCurrent ? '4.5' : '2.5'}
                        fill={isCurrent ? stg.palette.accent : isVisited ? '#64748b' : '#334155'}
                        className="transition-all duration-500"
                      />
                      <text
                        x={stg.islandCoordinates.x}
                        y={stg.islandCoordinates.y - 4}
                        fontSize="3"
                        fill={isCurrent ? '#f8fafc' : '#94a3b8'}
                        textAnchor="middle"
                        fontWeight={isCurrent ? 'bold' : 'normal'}
                      >
                        {stg.island}
                      </text>
                    </g>
                  );
                })}

                {/* Barco en la posición actual de la etapa */}
                {currentStage && (
                  <g
                    transform={`translate(${currentStage.islandCoordinates.x}, ${currentStage.islandCoordinates.y})`}
                    className="transition-all duration-700"
                  >
                    <circle r="7" fill={stagePalette.primary} opacity="0.2" className="animate-ping" />
                    <text x="0" y="2.5" fontSize="6" textAnchor="middle">
                      ⛵
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Atajos de teclado para accesibilidad */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Usa las flechas ↑ / ↓ o J / K para navegar</span>
              <span>Reduced motion compatible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
