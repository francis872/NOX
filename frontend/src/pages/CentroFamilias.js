import React from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '&#9200;', title: 'Limites de tiempo', desc: 'Establece cuanto tiempo pueden pasar tus hijos en la aplicacion cada dia.' },
  { icon: '&#128065;', title: 'Supervision de contenido', desc: 'Revisa que tipo de contenido ven y con quienes interactuan.' },
  { icon: '&#128737;', title: 'Filtros de seguridad', desc: 'Bloquea contenido inapropiado automaticamente para cuentas de menores.' },
  { icon: '&#128202;', title: 'Informes semanales', desc: 'Recibe un resumen semanal de la actividad en las cuentas supervisadas.' },
];

export default function CentroFamilias() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px 80px', background: '#0e0e1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>Centro para familias</h1>
      </div>

      <div style={{ textAlign: 'center', padding: '32px 0 28px' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>&#128106;</div>
        <h2 style={{ color: '#e2e8f0', margin: '0 0 8px' }}>Supervision familiar</h2>
        <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>Herramientas de control parental para mantener a los mas jovenes seguros en NOX.</p>
        <span style={{ display: 'inline-block', marginTop: 14, fontSize: 11, background: 'rgba(127,90,240,0.15)', color: '#7f5af0', borderRadius: 8, padding: '5px 12px', fontWeight: 800, letterSpacing: '0.8px' }}>PROXIMAMENTE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 16, alignItems: 'flex-start', opacity: 0.7 }}>
            <span style={{ fontSize: 28 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
            <div>
              <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#475569' }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
