import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';
import logo from '../assets/noxlogo.png';
import {
  MdOutlineArticle,
  MdOutlineChat,
  MdOutlineGridView,
  MdOutlineAutoStories,
  MdOutlineCameraAlt,
  MdOutlineAccountBalance,
  MdOutlineStorefront,
  MdOutlineBookmarks,
  MdOutlineSettings,
  MdOutlinePerson,
  MdOutlineLogout,
  MdOutlineApps,
  MdOutlineNotifications,
  MdOutlineAddCircle,
  MdOutlineHome,
  MdMenu,
} from 'react-icons/md';

// Virtual canvas size — planet positions are computed as percentages of this.
const VIRT = 700;

function toPercent(val) {
  return `${((val / VIRT) * 100 + 50).toFixed(3)}%`;
}

// Planets form the letter N:
// • Left vertical:  AXIOMS (-110,-160) • Bipper (-110,0) • Espacios (-110,160)
// • Diagonal:       Lockpost (-45,-80) → [sun] → Cámara (45,80)
// • Right vertical: TAIpay (110,-160) • Conecctec (110,160)
const ORBIT_PLANETS = [
  { Icon: MdOutlineArticle,        label: 'AXIOMS',    desc: 'Las ideas estructuradas de la comunidad. Opina, debate y construye con argumentos.', path: '/feed',     color: '#7f5af0', x: -110, y: -160 },
  { Icon: MdOutlineChat,           label: 'Bipper',    desc: 'Mensajes directos. Chatea con quien sigues o envia un BIP para conectar.',            path: '/mylink',   color: '#22c55e', x: -110, y:    0 },
  { Icon: MdOutlineGridView,       label: 'Espacios',  desc: 'Tus mundos creativos dentro de NOX. Organiza proyectos y comunidades.',               path: '/spaces',   color: '#f59e0b', x: -110, y:  160 },
  { Icon: MdOutlineAutoStories,    label: 'Lockpost',  desc: 'C\u00e1psulas ef\u00edmeras de 24h. Comparte momentos que desaparecen con quienes te siguen.',        path: '/stories',  color: '#fb7185', x:  -45, y:  -80 },
  { Icon: MdOutlineCameraAlt,      label: 'C\u00e1mara',    desc: 'Crea contenido visual. Fotos y videos para tus ideas y locks.',                       path: '/camara',   color: '#ec4899', x:   45, y:   80 },
  { Icon: MdOutlineAccountBalance, label: 'TAIpay',    desc: 'Tu econom\u00eda de tokens NX. Gana, guarda y mueve valor en la red.',                    path: '/neobank',  color: '#38bdf8', x:  110, y: -160 },
  { Icon: MdOutlineStorefront,     label: 'Conecctec', desc: 'Para creadores, emprendedores y marcas. Vende experiencias y servicios en NOX.',      path: '/commerce', color: '#10b981', x:  110, y:  160 },
];

const EXTRA = [
  { Icon: MdOutlineGridView,       label: 'Espacios',  path: '/spaces'   },
  { Icon: MdOutlineAutoStories,    label: 'Lockpost',  path: '/stories'  },
  { Icon: MdOutlineAccountBalance, label: 'TAIpay',    path: '/neobank'  },
  { Icon: MdOutlineStorefront,     label: 'Conecctec', path: '/commerce' },
];

const SECONDARY = [
  { Icon: MdOutlineBookmarks, label: 'Favoritos',    path: '/favoritos' },
  { Icon: MdOutlineSettings,  label: 'Ajustes',      path: '/settings'  },
  { Icon: MdOutlinePerson,    label: 'Perfil',        path: 'PROFILE'    },
  { Icon: MdOutlineLogout,    label: 'Cerrar sesión', action: 'logout'   },
];

function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orbitOpen,  setOrbitOpen]  = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hoveredPlanet, setHoveredPlanet] = useState(null);
  const navigate    = useNavigate();
  const location    = useLocation();
  const user        = JSON.parse(localStorage.getItem('user'));
  const profilePath = `/profile/${user?.id}`;

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`/api/notifications/${user.id}`)
      .then(res => setUnreadCount((res.data || []).filter(n => !n.read).length))
      .catch(() => {});
  }, [user?.id]);

  const go = (item) => {
    setDrawerOpen(false);
    setOrbitOpen(false);
    if (item.action === 'logout') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.replace('/login');
      return;
    }
    const path = item.path === 'PROFILE' ? profilePath : item.path;
    if (path) navigate(path);
  };

  return (
    <>
      {/* ── App bar ── */}
      <header className="nox-appbar">
        <div className="nox-brand">
          <img src={logo} alt="NOX" className="nox-brand__logo" />
          <div>
            <div className="nox-brand__title">NOX</div>
            <div className="nox-brand__subtitle">AXIOMS · Lockpost · Conecctec</div>
          </div>
        </div>

        <div className="nox-appbar-actions">
          <button
            className="nox-orbit-button"
            onClick={() => setOrbitOpen(true)}
            aria-label="Discover"
          >
            <MdOutlineApps size={19} />
            <span className="nox-orbit-label">Discover</span>
          </button>
          <button            className="nox-notif-button"
            onClick={() => { setUnreadCount(0); navigate('/notificaciones'); }}
            aria-label="Notificaciones"
          >
            <MdOutlineNotifications size={22} />
            {unreadCount > 0 && (
              <span className="nox-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          <button            className="nox-menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menú"
          >
            <MdMenu size={22} />
          </button>
        </div>
      </header>

      {/* ── Drawer (no navigation section — that lives in Discover) ── */}
      {drawerOpen && (
        <div className="nox-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside className="nox-drawer" onClick={(e) => e.stopPropagation()}>

            <div className="nox-drawer__top">
              <div className="nox-drawer__brand">
                <img src={logo} alt="NOX" className="nox-drawer__logo" />
                <div>
                  <div className="nox-drawer__title">NOX</div>
                  <div className="nox-drawer__caption">Tu espacio personal</div>
                </div>
              </div>
              <button className="nox-drawer__close" onClick={() => setDrawerOpen(false)}>✕</button>
            </div>

            <div className="nox-drawer__profile">
              <div className="nox-drawer__avatar">
                {user?.username?.[0]?.toUpperCase() || 'N'}
              </div>
              <div>
                <div className="nox-drawer__user-name">{user?.username || 'Invitado'}</div>
                <div className="nox-drawer__user-handle">@{user?.username || 'nox'}</div>
              </div>
            </div>

            <div className="nox-drawer__stats">
              <div><div>{user?.posts_count ?? '—'}</div><span>Posts</span></div>
              <div><div>{user?.followers_count ?? '—'}</div><span>Seguidores</span></div>
              <div><div>{user?.following_count ?? '—'}</div><span>Siguiendo</span></div>
            </div>

            <div className="nox-drawer__section-title">Mis espacios</div>
            <div className="nox-drawer__section">
              {EXTRA.map((item) => (
                <button key={item.label} className="nox-drawer__item" onClick={() => go(item)}>
                  <span className="nox-drawer__icon"><item.Icon size={20} /></span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="nox-drawer__section-title">Cuenta</div>
            <div className="nox-drawer__section">
              {SECONDARY.map((item) => (
                <button key={item.label} className="nox-drawer__item" onClick={() => go(item)}>
                  <span className="nox-drawer__icon"><item.Icon size={20} /></span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

          </aside>
        </div>
      )}

      {/* ── Orbital map ── */}
      {orbitOpen && (
        <div className="nox-orbit-backdrop" onClick={() => setOrbitOpen(false)}>
          <div className="nox-orbit-shell" onClick={(e) => e.stopPropagation()}>

            <button className="nox-orbit-close" onClick={() => setOrbitOpen(false)}>✕</button>

            {/* Static decorative rings */}
            <div className="nox-ring nox-ring--1" />
            <div className="nox-ring nox-ring--2" />
            <div className="nox-ring nox-ring--3" />

            {/* Sun — profile + balance */}
            <div className="nox-orbit-sun">
              <div className="nox-orbit-sun-avatar">
                {user?.username?.[0]?.toUpperCase() || 'N'}
              </div>
              <div className="nox-orbit-sun-label">
                <strong>{user?.fullName || user?.username || 'Perfil'}</strong>
                <span>{user?.balance != null ? `${user.balance} NX` : '0 NX'}</span>
              </div>
            </div>

            {/* Planets — N-shape positions on VIRT=700 virtual canvas */}
            {ORBIT_PLANETS.map((planet, i) => (
              <button
                key={planet.label}
                className="nox-orbit-planet"
                style={{
                  background: planet.color,
                  left: toPercent(planet.x),
                  top:  toPercent(planet.y),
                  animationDelay: `${i * 0.07 + 0.08}s`,
                }}
                onMouseEnter={() => setHoveredPlanet(planet.label)}
                onMouseLeave={() => setHoveredPlanet(null)}
                onClick={() => go(planet)}
                aria-label={planet.label}
              >
                <planet.Icon size={22} color="#fff" />
                <small>{planet.label}</small>
                {hoveredPlanet === planet.label && (
                  <div className="nox-orbit-tooltip">
                    <strong>{planet.label}</strong>
                    <span>{planet.desc}</span>
                  </div>
                )}
              </button>
            ))}

          </div>
        </div>
      )}
      {/* ── Bottom navigation (mobile only) ── */}
      <nav className="nox-bottom-nav">
        {[
          { Icon: MdOutlineHome,         path: '/feed',           label: 'AXIOMS'   },
          { Icon: MdOutlineAutoStories,  path: '/stories',        label: 'Lockpost' },
          { Icon: MdOutlineAddCircle,    path: null,              label: 'Crear',   center: true },
          { Icon: MdOutlineNotifications,path: '/notificaciones', label: 'Alerts',  badge: unreadCount > 0 ? unreadCount : null },
          { Icon: MdOutlinePerson,       path: profilePath,       label: 'Perfil'   },
        ].map(({ Icon, path, label, center, badge }) => {
          const active = path && location.pathname === path;
          return (
            <button
              key={label}
              className={`nox-bot-item${active ? ' active' : ''}${center ? ' center' : ''}`}
              onClick={() => {
                if (!path) { setOrbitOpen(true); return; }
                if (path === '/notificaciones') setUnreadCount(0);
                navigate(path);
              }}
              aria-label={label}
            >
              <div className="nox-bot-icon">
                <Icon size={center ? 28 : 22} />
                {badge && <span className="nox-notif-badge" style={{ top: 0, right: 0 }}>{badge > 9 ? '9+' : badge}</span>}
              </div>
              {!center && <span className="nox-bot-label">{label}</span>}
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default Navbar;
