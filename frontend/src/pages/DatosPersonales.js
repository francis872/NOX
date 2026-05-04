import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DatosPersonales() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ bio: '', interests: '', age: '', origin: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`/api/users/${user.id}`)
      .then(res => {
        setProfile(res.data);
        setForm({ bio: res.data.bio || '', interests: (res.data.interests || []).join(', '), age: res.data.age || '', origin: res.data.origin || '' });
      }).catch(() => {});
  }, []); // eslint-disable-line

  const save = async (e) => {
    e.preventDefault();
    setErr(''); setMsg(''); setSaving(true);
    try {
      const payload = { ...form, interests: form.interests.split(',').map(i => i.trim()).filter(Boolean) };
      await axios.put(`/api/users/${user.id}`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMsg('Datos actualizados correctamente.');
    } catch { setErr('Error al guardar. Inténtalo de nuevo.'); }
    finally { setSaving(false); }
  };

  const inp = (key, placeholder, type = 'text') => (
    <input type={type} placeholder={placeholder} value={form[key]}
      onChange={e => setForm({ ...form, [key]: e.target.value })}
      style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 12, color: '#e2e8f0', padding: '13px 14px', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 80px', minHeight: '100vh', background: '#0e0e1a', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Datos personales</h2>
      </div>

      {profile && (
        <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>Nombre de usuario</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>@{profile.username}</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 10, marginBottom: 4 }}>Correo electrónico</div>
          <div style={{ fontSize: 16 }}>{profile.email}</div>
        </div>
      )}

      <form onSubmit={save}>
        <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>Biografía</label>
        <textarea placeholder="Cuéntanos sobre ti..." value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })} rows={3}
          style={{ width: '100%', background: '#1a1a2e', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 12, color: '#e2e8f0', padding: '13px 14px', fontSize: 14, resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }} />
        <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>Intereses (separados por coma)</label>
        {inp('interests', 'ej: tecnología, arte, ciencia')}
        <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>Edad</label>
        {inp('age', 'Tu edad', 'number')}
        <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>Origen / Ciudad</label>
        {inp('origin', 'ej: Madrid, España')}
        {err && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{err}</div>}
        {msg && <div style={{ color: '#2cb67d', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
        <button type="submit" disabled={saving}
          style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}