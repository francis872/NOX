import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Informacion() {
  const navigate = useNavigate();
  const links = [
    { label: 'Terminos de uso', icon: '&#128196;' },
    { label: 'Politica de privacidad', icon: '&#128274;' },
    { label: 'Politica de cookies', icon: '&#127850;' },
    { label: 'Creditos y licencias', icon: '&#128218;' },
    { label: 'Reportar un problema', icon: '&#128681;' },
  ];
  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px 80px', background: '#0e0e1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>Informacion</h1>
      </div>
      <div style={{ textAlign: 'center', padding: '24px 0 32px' }}>
        <div style={{ fontSize: 56, marginBottom: 10 }}>&#9889;</div>
        <div style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>NOX</div>
        <div style={{ fontSize: 13, color: '#475569' }}>Version 1.0.0</div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
        {links.map((l, i) => (
          <button key={l.label} onClick={() => alert('Proximamente')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'none', border: 'none', borderBottom: i < links.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 20 }} dangerouslySetInnerHTML={{ __html: l.icon }} />
            <span style={{ flex: 1, color: '#e2e8f0', fontSize: 15 }}>{l.label}</span>
            <span style={{ color: '#334155' }}>&#8250;</span>
          </button>
        ))}
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#1e1e2e', marginTop: 32 }}>© 2024 NOX Platform. Todos los derechos reservados.</p>
    </div>
  );
}
