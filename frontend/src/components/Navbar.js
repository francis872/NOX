import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/noxlogo.png';

const ITEMS = [
  { icon: '📰', label: 'Feed',            path: '/feed' },
  { icon: '⚡', label: 'Actividad',       path: '/actividad' },
  { icon: '🔔', label: 'Notificaciones',  path: '/notificaciones' },
  { icon: '📊', label: 'Insights',        path: '/insights' },
  { icon: '⭐', label: 'Favoritos',       path: '/favoritos' },
  { icon: '🚫', label: 'Bloqueos',        path: '/bloqueos' },
  { icon: '💚', label: 'Mej. Amigos',     path: '/mejores-amigos' },
  { icon: '👤', label: 'Perfil',          path: 'PROFILE' },
  { icon: '🔭', label: 'Explorar',        path: '/explore' },
  { icon: '💬', label: 'Mensajes',        path: '/mylink' },
  { icon: '⏱️', label: 'Tiempo',          path: '/tiempo' },
  { icon: '🔗', label: 'Cuentas',         path: '/cuentas-silenciadas' },
  { icon: '🎛️', label: 'Preferencias',    path: '/preferencias-contenido' },
  { icon: '💎', label: 'Suscripciones',   path: '/suscripciones' },
  { icon: '♿', label: 'Accesibilidad',   path: '/accesibilidad' },
  { icon: '🚪', label: 'Cerrar Sesión',   path: null, action: 'logout' },
];

const RADIUS = 180;

function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const n = ITEMS.length;

  const go = (item) => {
    setOpen(false);
    if (item.action === 'logout') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.replace('/login');
      return;
    }
    const path = item.path === 'PROFILE' ? `/profile/${user?.id}` : item.path;
    navigate(path);
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        className={`nox-fab${open ? ' nox-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Menú"
      >
        <img src={logo} alt="NOX" className="nox-fab__logo" />
      </button>

      {/* Full-screen radial overlay */}
      {open && (
        <div className="nox-radial-overlay" onClick={() => setOpen(false)}>
          <div className="nox-radial-stage" onClick={e => e.stopPropagation()}>
            {/* Center logo */}
            <div className="nox-radial-hub">
              <img src={logo} alt="NOX" className="nox-radial-hub__logo" />
            </div>

            {/* Radial items */}
            {ITEMS.map((item, i) => {
              const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
              const x = Math.round(Math.cos(angle) * RADIUS);
              const y = Math.round(Math.sin(angle) * RADIUS);
              return (
                <button
                  key={i}
                  className="nox-radial-item"
                  style={{
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                    '--delay': `${i * 22}ms`,
                  }}
                  onClick={() => go(item)}
                >
                  <span className="nox-ri__icon">{item.icon}</span>
                  <span className="nox-ri__label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
