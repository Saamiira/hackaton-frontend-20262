import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <span className="text-6xl mb-4">🏴‍☠️</span>
      <h1 className="text-4xl font-black text-amber-500 font-mono">404 — Rumbo Perdido</h1>
      <p className="text-slate-400 mt-2 max-w-md text-sm">
        Las corrientes del Grand Line te han llevado a aguas inexploradas o la isla que buscas no existe en el mapa.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm transition"
      >
        Alinear Log Pose al Dashboard
      </Link>
    </div>
  );
};
