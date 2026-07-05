import React, { useState } from 'react';

const CREATOR_TOOLS = [
  { icon: '🛍️', title: 'Tienda digital',    desc: 'Ofrece paquetes, suscripciones y accesos VIP directamente en tu perfil.',            color: '#7f5af0' },
  { icon: '🎥', title: 'Contenido UGC',     desc: 'Crea, comparte y monetiza contenido generado por usuarios sin salir de NOX.',       color: '#38bdf8' },
  { icon: '🤝', title: 'Alianzas',          desc: 'Activa colaboraciones con marcas, creadores y comunidades de la red.',               color: '#22c55e' },
  { icon: '📊', title: 'Panel creador',     desc: 'Metricas de alcance, ingresos y engagement para optimizar tu estrategia.',           color: '#f59e0b' },
  { icon: '💎', title: 'Experiencias VIP',  desc: 'Diseña accesos exclusivos, mentoring en vivo y contenido de pago para tu audiencia.',color: '#fb7185' },
  { icon: '🚀', title: 'Lanzamientos',      desc: 'Campanas de prelanzamiento, listas de espera y drops de producto dentro de NOX.',   color: '#ec4899' },
];

const WHY = [
  'Integracion directa con tus AXIOMS y Lockpost.',
  'Pagos internos con NX y recompensas sociales.',
  'Herramientas UGC para lanzar contenido monetizable.',
  'Segmenta ofertas para seguidores, comunidades y aliados.',
  'Panel de metricas de creador en tiempo real.',
  'Sin intermediarios — conectas directo con tu audiencia.',
];

export default function Commerce() {
  const [activeTab, setActiveTab] = useState('herramientas');
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 18px 90px' }}>
      <div style={{ marginBottom: 26 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12 }}>Conecctec</span>
        <h2 style={{ margin: '16px 0 10px', fontSize: 30, fontWeight: 800, color: '#f8fafc' }}>Plataforma de creadores</h2>
        <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>Para creadores, emprendedores y marcas que quieren vender experiencias, contenidos y servicios dentro de NOX.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 26, flexWrap: 'wrap' }}>
        {['herramientas','por que','empieza'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '9px 20px', borderRadius: 999, border: activeTab === tab ? 'none' : '1px solid rgba(255,255,255,0.08)', background: activeTab === tab ? 'linear-gradient(135deg,#10b981,#38bdf8)' : 'rgba(255,255,255,0.04)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'herramientas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {CREATOR_TOOLS.map(tool => (
            <div key={tool.title} style={{ padding: 22, borderRadius: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 28 }}>{tool.icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', marginBottom: 6 }}>{tool.title}</div>
                <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{tool.desc}</p>
              </div>
              <button style={{ marginTop: 'auto', padding: '9px 16px', borderRadius: 12, border: `1px solid ${tool.color}44`, background: `${tool.color}14`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Activar</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'por que' && (
        <div style={{ padding: 28, borderRadius: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>Por que Conecctec?</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {WHY.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>✔</span>
                <span style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'empieza' && (
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ padding: 28, borderRadius: 28, background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(56,189,248,0.08))', border: '1px solid rgba(16,185,129,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: '#f8fafc' }}>Perfil de creador</h3>
            <p style={{ margin: '0 0 20px', color: '#64748b', lineHeight: 1.7 }}>Activa tu perfil como creador para desbloquear herramientas de monetizacion, panel de analiticas y acceso a Conecctec completo.</p>
            <button style={{ padding: '13px 28px', borderRadius: 16, background: 'linear-gradient(135deg,#10b981,#38bdf8)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 15 }}>Activar perfil creador</button>
          </div>
          <div style={{ padding: 22, borderRadius: 24, background: 'rgba(15,18,28,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>Proximas funciones</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {['Marketplace de servicios digitales','Subscripciones de creador con NX','Colaboraciones y co-creacion de contenido','Drops y lanzamientos programados'].map(f => (
                <div key={f} style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: 13, display: 'flex', gap: 10 }}>
                  <span style={{ color: '#334155' }}>◦</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
