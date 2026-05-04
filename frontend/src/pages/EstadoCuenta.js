import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EstadoCuenta() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const joined = user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Desconocido';
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 80px', minHeight: '100vh', background: '#0e0e1a', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Estado de la cuenta</h2>
      </div>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Usuario', val: `@${user.username || '—'}` },
          { label: 'Correo', val: user.email || '—' },
          { label: 'Tipo de cuenta', val: user.account_type || 'Normal' },
          { label: 'Verificado', val: user.verified ? '✅ Sí' : '❌ No' },
          { label: 'Miembro desde', val: joined },
          { label: 'Estado', val: '🟢 Activa' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
            <span style={{ color: '#475569', fontSize: 14 }}>{item.label}</span>
            <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>{item.val}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: '16px 18px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>🗑️ Desactivar o eliminar cuenta</div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 12 }}>Si deseas desactivar temporalmente o eliminar permanentemente tu cuenta, contacta con soporte.</div>
        <a href="mailto:support@noxapp.com" style={{ fontSize: 13, color: '#ef4444', textDecoration: 'none' }}>support@noxapp.com</a>
      </div>
    </div>
  );
}