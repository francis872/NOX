import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PREFS_KEY = 'nox_settings_prefs';
function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } }
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

function SectionHeader({ title }) {
  return <div style={{ padding: '22px 16px 6px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{title}</div>;
}

function NavItem({ label, sub, icon, path, danger, onClick }) {
  const navigate = useNavigate();
  const handle = () => { if (onClick) onClick(); else if (path) navigate(path); };
  return (
    <button onClick={handle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {icon && <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: danger ? '#ef4444' : '#e2e8f0', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{sub}</div>}
      </div>
      {!danger && <span style={{ color: '#334155', fontSize: 18 }}>&#8250;</span>}
    </button>
  );
}

function ToggleItem({ label, sub, icon, prefKey, prefs, setPrefs }) {
  const val = !!prefs[prefKey];
  const toggle = () => { const next = { ...prefs, [prefKey]: !val }; setPrefs(next); savePrefs(next); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {icon && <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: '#e2e8f0', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={toggle} style={{ width: 46, height: 26, borderRadius: 13, background: val ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: val ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
      </div>
    </div>
  );
}

function SelectItem({ label, icon, prefKey, options, prefs, setPrefs }) {
  const val = prefs[prefKey] || options[0].value;
  const change = (e) => { const next = { ...prefs, [prefKey]: e.target.value }; setPrefs(next); savePrefs(next); };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {icon && <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{icon}</span>}
      <div style={{ flex: 1, fontSize: 15, color: '#e2e8f0', fontWeight: 500 }}>{label}</div>
      <select value={val} onChange={change} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', padding: '5px 10px', fontSize: 13, cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [prefs, setPrefs] = useState(loadPrefs);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    axios.get('/api/users/' + user.id + '/settings').then(res => setIsPrivate(!!res.data.is_private)).catch(() => {});
  }, []); // eslint-disable-line

  const logout = () => { localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.replace('/login'); };

  const WHO_CAN = [{ value: 'everyone', label: 'Todos' }, { value: 'following', label: 'Solo a quienes sigo' }, { value: 'nobody', label: 'Nadie' }];
  const LANG_OPTIONS = [{ value: 'es', label: 'Espanol' }, { value: 'en', label: 'English' }, { value: 'pt', label: 'Portugues' }, { value: 'fr', label: 'Francais' }];
  const ACCOUNT_TYPES = [{ value: 'normal', label: 'Personal' }, { value: 'creator', label: 'Creador' }, { value: 'business', label: 'Negocio' }];

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', paddingBottom: 80, background: '#0e0e1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>Configuracion</h1>
      </div>

      <SectionHeader title="Centro de cuentas" />
      <NavItem icon="&#128100;" label="Datos personales" sub="Nombre, usuario, correo, edad, origen" path="/settings/datos-personales" />
      <NavItem icon="&#128274;" label="Contrasena y seguridad" sub="Cambiar contrasena, 2FA" path="/settings/contrasena" />
      <NavItem icon="&#128279;" label="Experiencias conectadas" sub="Apps y sitios vinculados" path="/settings/experiencias" />
      <NavItem icon="&#128226;" label="Preferencias de anuncios" sub="Intereses publicitarios" path="/settings/anuncios" />

      <SectionHeader title="Notas" />
      <NavItem icon="&#11088;" label="Guardados" path="/favoritos" />
      <NavItem icon="&#128230;" label="Archivo" sub="Ideas y vibes archivados" path="/settings/archivo" />
      <NavItem icon="&#9889;" label="Actividad" path="/actividad" />
      <NavItem icon="&#128276;" label="Notificaciones" path="/notificaciones" />
      <NavItem icon="&#8987;" label="Administracion del tiempo" path="/tiempo" />

      <SectionHeader title="Quien puede ver tu contenido" />
      <NavItem icon={isPrivate ? '&#128274;' : '&#127760;'} label="Privacidad de la cuenta" sub={isPrivate ? 'Cuenta privada — solo seguidores aprobados' : 'Cuenta publica — visible para todos'} path="/settings/privacidad-cuenta" />
      <NavItem icon="&#128154;" label="Mejores amigos" sub="Gestiona tu lista de mejores amigos" path="/mejores-amigos" />
      <ToggleItem icon="&#128260;" label="Publicaciones cruzadas" sub="Compartir automaticamente en otras redes" prefKey="cross_post" prefs={prefs} setPrefs={setPrefs} />
      <NavItem icon="&#128683;" label="Cuentas bloqueadas" path="/bloqueos" />
      <ToggleItem icon="&#128065;" label="Ocultar historias y videos en directo" sub="No apareceraas en historias activas" prefKey="hide_stories" prefs={prefs} setPrefs={setPrefs} />
      <ToggleItem icon="&#128065;&#65039;" label="Actividades en la pestana" sub="Mostrar cuando estas activo" prefKey="show_activity" prefs={prefs} setPrefs={setPrefs} />
      <NavItem icon="&#128101;" label="Amigos y sugerencias" path="/explore" />

      <SectionHeader title="Como pueden interactuar contigo" />
      <SelectItem icon="&#128172;" label="Mensajes y respuestas" prefKey="who_messages" options={WHO_CAN} prefs={prefs} setPrefs={setPrefs} />
      <SelectItem icon="&#127991;" label="Etiquetas y menciones" prefKey="who_tags" options={WHO_CAN} prefs={prefs} setPrefs={setPrefs} />
      <SelectItem icon="&#128173;" label="Comentarios" prefKey="who_comments" options={WHO_CAN} prefs={prefs} setPrefs={setPrefs} />
      <NavItem icon="&#9888;&#65039;" label="Cuentas restringidas" sub="Limita sin bloquear" path="/settings/restringidas" />
      <ToggleItem icon="&#128228;" label="Compartir y reutilizar" sub="Permitir que otros compartan tus ideas" prefKey="allow_share" prefs={prefs} setPrefs={setPrefs} />
      <ToggleItem icon="&#128737;" label="Limitar interacciones" sub="Solo seguidores pueden reaccionar" prefKey="limit_interactions" prefs={prefs} setPrefs={setPrefs} />
      <NavItem icon="&#128292;" label="Palabras filtradas" path="/palabras-filtradas" />
      <NavItem icon="&#10133;" label="Seguir e invitar amigos" path="/explore" />

      <SectionHeader title="Lo que tu ves" />
      <NavItem icon="&#11088;" label="Favoritos" path="/favoritos" />
      <NavItem icon="&#128277;" label="Cuentas silenciadas" path="/cuentas-silenciadas" />
      <NavItem icon="&#127765;" label="Preferencias de contenido" path="/preferencias-contenido" />
      <ToggleItem icon="&#10084;&#65039;" label="Ocultar recuentos de me gusta" sub="No veras cuantos likes tienen las publicaciones" prefKey="hide_likes" prefs={prefs} setPrefs={setPrefs} />
      <NavItem icon="&#128142;" label="Suscripciones del creador" path="/suscripciones" />

      <SectionHeader title="Tu aplicacion y contenido multimedia" />
      <NavItem icon="&#128247;" label="Permisos del dispositivo" sub="Camara, microfono, localizacion" path="/permisos" />
      <NavItem icon="&#128193;" label="Archivos y descargas" sub="Gestion de contenido descargado" path="/settings/archivos" />
      <NavItem icon="&#9855;" label="Accesibilidad" path="/accesibilidad" />
      <SelectItem icon="&#127760;" label="Idioma" prefKey="language" options={LANG_OPTIONS} prefs={prefs} setPrefs={setPrefs} />
      <NavItem icon="&#128202;" label="Uso de datos y calidad" path="/uso-datos" />
      <NavItem icon="&#128272;" label="Permisos de aplicaciones y sitios web" path="/permisos" />

      <SectionHeader title="Centro para familias" />
      <NavItem icon="&#128106;" label="Supervision" sub="Control parental para cuentas de adolescentes" path="/settings/centro-familias" />

      <SectionHeader title="Tus insights y herramientas" />
      <NavItem icon="&#128202;" label="Tu panel" path="/insights" />
      <SelectItem icon="&#127991;" label="Tipo de cuenta" prefKey="account_type_ui" options={ACCOUNT_TYPES} prefs={prefs} setPrefs={setPrefs} />
      <NavItem icon="&#9989;" label="Verificar perfil" sub={user.verified ? 'Perfil verificado' : 'Obtena la insignia de verificacion'} path="/settings/verificacion" />

      <SectionHeader title="Pedidos y recaudaciones de fondos" />
      <NavItem icon="&#128722;" label="Pedidos y pagos" path="/settings/pedidos" />

      <SectionHeader title="Mas informacion y ayuda" />
      <NavItem icon="&#10067;" label="Ayuda" path="/ayuda" />
      <NavItem icon="&#128737;" label="Centro de privacidad" path="/centro-privacidad" />
      <NavItem icon="&#8505;&#65039;" label="Estado de la cuenta" path="/settings/estado-cuenta" />
      <NavItem icon="&#128196;" label="Informacion" path="/settings/informacion" />

      <div style={{ margin: '24px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => alert('Funcion de multiples cuentas proximamente')}
          style={{ width: '100%', padding: 14, background: 'rgba(127,90,240,0.1)', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 14, color: '#7f5af0', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          + Anadir cuenta
        </button>
        <button onClick={logout}
          style={{ width: '100%', padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, color: '#ef4444', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
