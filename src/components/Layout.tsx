import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
      isActive
        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
        : 'text-slate-300 hover:text-amber-400 hover:bg-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-3">
              <span className="text-2xl">🧭</span>
              <span className="font-extrabold tracking-wider text-amber-500 text-lg uppercase">
                Log Pose Console
              </span>
            </NavLink>

            <nav className="hidden md:flex items-center gap-2">
              <NavLink to="/dashboard" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/wanted" className={navClass}>
                Se Busca
              </NavLink>
              <NavLink to="/news" className={navClass}>
                News Coo
              </NavLink>
              <NavLink to="/sagas" className={navClass}>
                Poneglyph
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  {user.teamName}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  [{user.teamCode}]
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-500/50 text-xs font-medium transition cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-800 flex justify-around p-2 bg-slate-900">
          <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>
          <NavLink to="/wanted" className={navClass}>Se Busca</NavLink>
          <NavLink to="/news" className={navClass}>News</NavLink>
          <NavLink to="/sagas" className={navClass}>Poneglyph</NavLink>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Log Pose Console © Grand Line Bounty Guild • La Gran Era de los Piratas</p>
      </footer>
    </div>
  );
};
