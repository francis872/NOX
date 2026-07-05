import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MdOutlineArrowBack, MdOutlineCheckCircle } from 'react-icons/md';

const PREFS_KEY = 'nox_settings_prefs';

// Photo Editor Component
function PhotoEditor({ user, onSaved }) {
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [preview, setPreview] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3_000_000) { setError('Máximo 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setPreview(ev.target.result);
      setAvatar(ev.target.result);
      setError('');
    };
    reader.readAsDataURL(f);
  };

  const save = async () => {
    setLoading(true);
    try {
      await axios.put(`/api/users/${user.id}`, { avatar_url: avatar }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const updated = { ...user, avatar_url: avatar };
      localStorage.setItem('user', JSON.stringify(updated));
      onSaved(updated);
      setError('');
    } catch (err) {
      setError('Error al guardar foto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', margin: '0 auto 16px', overflow: 'hidden', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.1)' }}>
          {preview ? <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 50, color: '#fff' }}>{user?.username?.[0]}</span>}
        </div>
        <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 18px', borderRadius: 12, background: 'rgba(127,90,240,0.15)', border: '1px solid rgba(127,90,240,0.3)', color: '#c4b5fd', fontWeight: 700, cursor: 'pointer', fontSize: 14, minHeight: 40 }}>
          📷 Cambiar foto
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>{error}</div>}
      {preview !== user?.avatar_url && (
        <button onClick={save} disabled={loading} style={{ padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15, minHeight: 48 }}>
          {loading ? 'Guardando...' : '✓ Guardar cambios'}
        </button>
      )}
    </div>
  );
}

// Personal Data Editor
function PersonalDataEditor({ user, onSaved }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    origin: user?.origin || '',
    bio: user?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const save = async () => {
    if (!form.full_name.trim()) { setError('Nombre completo requerido'); return; }
    setLoading(true);
    try {
      await axios.put(`/api/users/${user.id}`, form, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const updated = { ...user, ...form };
      localStorage.setItem('user', JSON.stringify(updated));
      onSaved(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al guardar datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nombre completo</label>
        <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(127,90,240,0.2)', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email (no se puede cambiar)</label>
        <input type="email" value={form.email} disabled style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569', fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Ubicación</label>
        <input type="text" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="Madrid, España" style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(127,90,240,0.2)', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Biografía</label>
        <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Cuéntanos sobre ti..." rows={3} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(127,90,240,0.2)', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
      {success && <div style={{ color: '#22c55e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><MdOutlineCheckCircle size={16} /> Cambios guardados</div>}
      <button onClick={save} disabled={loading} style={{ padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15, minHeight: 48 }}>
        {loading ? 'Guardando...' : '✓ Guardar cambios'}
      </button>
    </div>
  );
}

// Password Changer
function PasswordChanger({ user }) {
  const [form, setForm] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const save = async () => {
    if (!form.current || !form.new) { setError('Faltan campos'); return; }
    if (form.new.length < 8) { setError('Nueva contraseña: mínimo 8 caracteres'); return; }
    if (form.new !== form.confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await axios.patch(`/api/users/${user.id}/password`, { current_password: form.current, new_password: form.new }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSuccess(true);
      setForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: 13 }}>
        ⚠️ Por seguridad, confirma tu contraseña actual para establecer una nueva
      </div>
      <div>
        <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Contraseña actual</label>
        <input type="password" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(127,90,240,0.2)', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Nueva contraseña (mín. 8 caracteres, número y mayúscula)</label>
        <input type="password" value={form.new} onChange={e => setForm(f => ({ ...f, new: e.target.value }))} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(127,90,240,0.2)', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      <div>
        <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>Confirmar nueva contraseña</label>
        <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(127,90,240,0.2)', color: '#f8fafc', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
      {success && <div style={{ color: '#22c55e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><MdOutlineCheckCircle size={16} /> Contraseña actualizada</div>}
      <button onClick={save} disabled={loading} style={{ padding: '12px 18px', borderRadius: 12, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 15, minHeight: 48 }}>
        {loading ? 'Actualizando...' : '✓ Cambiar contraseña'}
      </button>
    </div>
  );
}

// Privacy Settings
function PrivacySettings({ user, onSaved }) {
  const [isPrivate, setIsPrivate] = useState(user?.is_private ?? false);
  const [loading, setLoading] = useState(false);

  const togglePrivacy = async () => {
    setLoading(true);
    try {
      const res = await axios.patch(`/api/users/${user.id}/privacy`, { is_private: !isPrivate }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setIsPrivate(res.data.is_private);
      const updated = { ...user, is_private: res.data.is_private };
      localStorage.setItem('user', JSON.stringify(updated));
      onSaved(updated);
    } catch (err) {
      console.error('Error toggling privacy', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(127,90,240,0.08)', border: '1px solid rgba(127,90,240,0.2)', color: '#c4b5fd', fontSize: 13, lineHeight: 1.5 }}>
        {isPrivate
          ? '🔒 Cuenta privada: Solo tus seguidores aprobados pueden ver tus posts'
          : '🌍 Cuenta pública: Todos pueden ver tus posts y seguirte sin aprobación'
        }
      </div>
      <button onClick={togglePrivacy} disabled={loading} style={{ padding: '12px 18px', borderRadius: 12, background: isPrivate ? 'linear-gradient(135deg,#2cb67d,#10b981)' : 'rgba(127,90,240,0.15)', border: `1px solid ${isPrivate ? 'rgba(52,211,153,0.4)' : 'rgba(127,90,240,0.3)'}`, color: isPrivate ? '#ffffff' : '#c4b5fd', fontWeight: 700, cursor: 'pointer', fontSize: 15, minHeight: 48 }}>
        {loading ? '...' : (isPrivate ? '🔒 Hacerla pública' : '🔒 Hacerla privada')}
      </button>
    </div>
  );
}

// Main Settings Page
export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const tab = location.hash?.slice(1) || 'perfil';

  const [profile, setProfile] = useState(user);

  const handleProfileSaved = (updated) => {
    setProfile(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem(PREFS_KEY);
    window.location.replace('/login');
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: '👤' },
    { id: 'datos', label: 'Datos', icon: '📋' },
    { id: 'seguridad', label: 'Seguridad', icon: '🔐' },
    { id: 'privacidad', label: 'Privacidad', icon: '🔒' },
  ];

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 100, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: 'rgba(5,7,13,0.95)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', minHeight: 44, minWidth: 44, justifyContent: 'center' }}>
          <MdOutlineArrowBack size={22} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#e2e8f0', flex: 1 }}>Configuración</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', padding: '0 16px', overflow: 'auto', scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => navigate(`#${t.id}`)} style={{ padding: '12px 14px', background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #7f5af0' : '2px solid transparent', color: tab === t.id ? '#e2e8f0' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', transition: 'border-color 0.2s' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 16px' }}>
        {tab === 'perfil' && (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Foto de perfil</h2>
            <PhotoEditor user={profile} onSaved={handleProfileSaved} />
          </>
        )}

        {tab === 'datos' && (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Información personal</h2>
            <PersonalDataEditor user={profile} onSaved={handleProfileSaved} />
          </>
        )}

        {tab === 'seguridad' && (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Cambiar contraseña</h2>
            <PasswordChanger user={profile} />
          </>
        )}

        {tab === 'privacidad' && (
          <>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Privacidad de la cuenta</h2>
            <PrivacySettings user={profile} onSaved={handleProfileSaved} />
          </>
        )}
      </div>

      {/* Logout */}
      <div style={{ padding: '20px 16px' }}>
        <button onClick={logout} style={{ width: '100%', padding: '13px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: 15, minHeight: 48 }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
