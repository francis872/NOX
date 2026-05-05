import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  { id: 'basic', name: 'NOX Basic', price: '$2.99/mes', color: '#2cb67d', icon: '&#10003;', features: ['Insignia verificada basica', 'Soporte prioritario', 'Sin anuncios'] },
  { id: 'creator', name: 'NOX Creator', price: '$7.99/mes', color: '#7f5af0', icon: '&#9733;', features: ['Todo lo de Basic', 'Herramientas de creador', 'Analiticas avanzadas', 'Link en bio destacado', 'Acceso anticipado a funciones'] },
  { id: 'pro', name: 'NOX Pro', price: '$19.99/mes', color: '#f59e0b', icon: '&#128081;', features: ['Todo lo de Creator', 'Verificacion dorada', 'Colaboraciones exclusivas', 'Soporte dedicado 24/7', 'API de integracion'] },
];

export default function Verificacion() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [selected, setSelected] = useState(null);
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '60px 24px', background: '#0e0e1a', minHeight: '100vh', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>&#10003;</div>
      <h2 style={{ color: '#2cb67d', marginBottom: 12 }}>¡Verificacion activa!</h2>
      <p style={{ color: '#475569', marginBottom: 32 }}>Tu perfil ahora muestra la insignia de verificacion.</p>
      <button onClick={() => navigate(-1)} style={{ padding: '13px 32px', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Volver al perfil</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 16px 80px', background: '#0e0e1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>Verificar perfil</h1>
      </div>

      {user.verified ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#2cb67d' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>&#9989;</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Tu perfil ya esta verificado</div>
          <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>Tienes la insignia de verificacion activa en tu cuenta.</div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px' }}>Elige un plan para obtener la insignia de verificacion y acceder a funciones exclusivas.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PLANS.map(plan => (
              <div key={plan.id} onClick={() => setSelected(plan.id)} style={{ padding: 20, borderRadius: 16, background: selected === plan.id ? 'rgba(127,90,240,0.12)' : 'rgba(255,255,255,0.03)', border: `2px solid ${selected === plan.id ? plan.color : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22, color: plan.color }} dangerouslySetInnerHTML={{ __html: plan.icon }} />
                    <span style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>{plan.name}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: plan.color, fontSize: 15 }}>{plan.price}</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: plan.color }}>&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {selected && (
            <button onClick={() => setSubscribed(true)} style={{ width: '100%', marginTop: 24, padding: 15, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
              Suscribirme — {PLANS.find(p => p.id === selected)?.price}
            </button>
          )}
          <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 14 }}>Integracion de pagos proximamente. Proceso simulado.</p>
        </>
      )}
    </div>
  );
}
