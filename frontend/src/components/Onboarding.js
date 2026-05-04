// Onboarding.js — Multi-step guide for new users
import React, { useState } from 'react';

const STEPS = [
  {
    emoji: '🌑',
    title: 'Bienvenido a NOX',
    desc: 'NOX es una plataforma oscura para ideas brillantes. Aqui publicas pensamientos, debates y creaciones — sin el ruido de las redes tradicionales.',
  },
  {
    emoji: '💡',
    title: 'Ideas',
    desc: 'El corazon de NOX. Publica cualquier idea — una opinion, reflexion, propuesta o teoria. Recibe reacciones (Fuego, Mente, Reto) y comentarios.',
  },
  {
    emoji: '✨',
    title: 'Vibes',
    desc: 'Momentos efimeros de 24 horas. Comparte fotos, videos o texto que desaparecen solos. Toca el circulo "+" para crear tu primer Vibe.',
  },
  {
    emoji: '⚡',
    title: 'Actions',
    desc: 'Micro-publicaciones de hasta 280 caracteres. Pensamientos rapidos, actualizaciones o reflexiones instantaneas. Aparecen justo debajo de los Vibes.',
  },
  {
    emoji: '🔁',
    title: 'Loop',
    desc: 'El feed de ideas en formato vertical inmersivo — como Reels pero para el pensamiento. Desliza para descubrir ideas de toda la comunidad.',
  },
  {
    emoji: '📸',
    title: 'Camara',
    desc: 'Captura el mundo con 4 modos: Foto, Video, Boomerang y Galeria. Publica directamente como Vibe o adjunta a una Idea.',
  },
  {
    emoji: '💬',
    title: 'MyLink',
    desc: 'Mensajes privados directos. Busca a cualquier usuario de NOX y empieza una conversacion en tiempo real.',
  },
  {
    emoji: '🚀',
    title: 'Listo para empezar',
    desc: 'Eso es todo lo que necesitas saber. Explora, crea, conecta. El resto lo descubres tu mismo. Bienvenido al lado oscuro.',
  },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const next = () => {
    if (isLast) { onDone(); }
    else setStep(s => s + 1);
  };

  const skip = () => { onDone(); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(4,4,14,0.96)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#13131f', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 24, padding: '40px 32px', maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative' }}>

        {/* Skip */}
        {!isLast && (
          <button onClick={skip} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: '#334155', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            Saltar
          </button>
        )}

        {/* Emoji */}
        <div style={{ fontSize: 68, marginBottom: 20, lineHeight: 1 }}>{current.emoji}</div>

        {/* Title */}
        <h2 style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.2 }}>{current.title}</h2>

        {/* Description */}
        <p style={{ margin: '0 0 32px', fontSize: 15, color: '#64748b', lineHeight: 1.65 }}>{current.desc}</p>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, background: i === step ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : i < step ? 'rgba(127,90,240,0.4)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.25s' }} />
          ))}
        </div>

        {/* Button */}
        <button onClick={next}
          style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'transform 0.15s' }}
          onMouseOver={e => e.currentTarget.style.transform='scale(1.02)'}
          onMouseOut ={e => e.currentTarget.style.transform='scale(1)'}>
          {isLast ? '¡Empezar en NOX!' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
}
