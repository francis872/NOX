import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CambiarContrasena() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) { setMsg({ ok: false, text: 'Las contraseñas nuevas no coinciden' }); return; }
    if (next.length < 6) { setMsg({ ok: false, text: 'La contraseña debe tener al menos 6 caracteres' }); return; }
    setLoading(true);
    try {
      await axios.patch('/api/users/' + user.id + '/password', { currentPassword: current, newPassword: next }, { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } });
      setMsg({ ok: true, text: 'Contraseña actualizada correctamente' });
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'Error al actualizar la contraseña' });
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 12, color: '#7f5af0', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px 80px', background: '#0e0e1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>Contraseña y seguridad</h1>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Contraseña actual</label>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} style={inputStyle} required autoComplete="current-password" />
        </div>
        <div>
          <label style={labelStyle}>Nueva contraseña</label>
          <input type="password" value={next} onChange={e => setNext(e.target.value)} style={inputStyle} required autoComplete="new-password" />
        </div>
        <div>
          <label style={labelStyle}>Confirmar nueva contraseña</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} required autoComplete="new-password" />
        </div>

        {msg && <div style={{ padding: '12px 16px', borderRadius: 10, background: msg.ok ? 'rgba(44,182,125,0.12)' : 'rgba(239,68,68,0.12)', color: msg.ok ? '#2cb67d' : '#ef4444', fontSize: 14 }}>{msg.text}</div>}

        <button type="submit" disabled={loading} style={{ padding: 14, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>

      <div style={{ marginTop: 32, padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>&#128737;</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Autenticacion de 2 factores</div>
          <span style={{ fontSize: 11, background: 'rgba(127,90,240,0.15)', color: '#7f5af0', borderRadius: 6, padding: '3px 8px', fontWeight: 700 }}>PRONTO</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>Añade una capa extra de seguridad a tu cuenta con autenticacion en 2 pasos via SMS o app.</p>
      </div>
    </div>
  );
}
