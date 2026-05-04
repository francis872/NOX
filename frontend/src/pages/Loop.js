// Loop.js — Vertical idea feed (like Reels but for thoughts)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';

const MOCK = [
  {
    id: 1,
    author: 'exploradora',
    premise: 'La IA no va a quitarnos el trabajo. Lo hará quien sepa usarla.',
    argument: 'Las herramientas amplifican capacidades. El que domine la IA multiplica su output 10x mientras el resto sigue igual.',
    ignite_count: 47, expand_count: 23, challenge_count: 11,
  },
  {
    id: 2,
    author: 'mindcrafter',
    premise: 'El silencio intencional produce más que cualquier reunión de 1 hora.',
    argument: 'Las reuniones interrumpen el estado de flujo. Un bloque de 90 min de deep work equivale a 3 h fragmentadas.',
    ignite_count: 91, expand_count: 45, challenge_count: 8,
  },
  {
    id: 3,
    author: 'logic.engine',
    premise: 'No consumimos información. La información nos consume a nosotros.',
    argument: 'El promedio de atención cayó de 12 a 8 segundos en una década. Somos el producto, no el usuario.',
    ignite_count: 134, expand_count: 67, challenge_count: 29,
  },
  {
    id: 4,
    author: 'nocturno_x',
    premise: 'La creatividad no es talento. Es tolerancia a la incomodidad.',
    argument: 'Las grandes ideas nacen en el momento en que dejas de buscar validación. El talento es la excusa del mediocre.',
    ignite_count: 78, expand_count: 34, challenge_count: 15,
  },
];

const BG_ACCENTS = [
  'radial-gradient(ellipse at 20% 20%, rgba(127,90,240,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(44,182,125,0.09) 0%, transparent 60%)',
  'radial-gradient(ellipse at 75% 15%, rgba(247,37,133,0.12) 0%, transparent 60%), radial-gradient(ellipse at 30% 75%, rgba(127,90,240,0.13) 0%, transparent 60%)',
  'radial-gradient(ellipse at 50% 10%, rgba(76,201,240,0.1) 0%, transparent 60%), radial-gradient(ellipse at 15% 80%, rgba(44,182,125,0.12) 0%, transparent 60%)',
  'radial-gradient(ellipse at 85% 50%, rgba(127,90,240,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 30%, rgba(244,162,97,0.08) 0%, transparent 60%)',
];

function LoopCard({ post, index }) {
  const [reacted, setReacted] = useState(null);
  const [counts, setCounts] = useState({
    ignite: post.ignite_count || 0,
    expand: post.expand_count || 0,
    challenge: post.challenge_count || 0,
  });

  const react = async (type) => {
    if (reacted === type) return;
    setReacted(type);
    setCounts(c => ({ ...c, [type]: c[type] + 1 }));
    try { await axios.post(`/api/ideas/${post.id}/react`, { type }); } catch {}
  };

  const reactions = [
    { type: 'ignite',    icon: '🔥', label: 'Encender' },
    { type: 'expand',    icon: '🧠', label: 'Expandir' },
    { type: 'challenge', icon: '⚡', label: 'Desafiar' },
  ];

  return (
    <div style={{
      height: '100%', width: '100%',
      background: BG_ACCENTS[index % BG_ACCENTS.length],
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      position: 'relative', padding: 0,
    }}>
      {/* Gradient overlay bottom */}
      <div style={{position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 35%, rgba(10,10,20,0.85) 80%, rgba(10,10,20,0.97) 100%)', pointerEvents:'none'}} />

      {/* Reactions - right side */}
      <div style={{
        position: 'absolute', right: 20, bottom: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
        zIndex: 10,
      }}>
        {reactions.map(r => (
          <button key={r.type} onClick={() => react(r.type)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            transform: reacted === r.type ? 'scale(1.3)' : 'scale(1)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            filter: reacted === r.type ? 'drop-shadow(0 0 10px rgba(127,90,240,0.9))' : 'none',
            padding: 0,
          }}>
            <span style={{ fontSize: 30 }}>{r.icon}</span>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: reacted === r.type ? '#7f5af0' : '#94a3b8',
            }}>{counts[r.type]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 20px 36px' }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', padding: 2,
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0e0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#7f5af0', textTransform: 'uppercase' }}>
              {post.author?.[0] || post.username?.[0] || '?'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{post.author || post.username || 'Anónimo'}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>LOOP · NOX</div>
          </div>
        </div>

        {/* Premise */}
        <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', marginBottom: 10, lineHeight: 1.35, letterSpacing: '-0.3px', paddingRight: 60 }}>
          {post.premise}
        </div>

        {/* Argument */}
        {post.argument && (
          <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, paddingRight: 60 }}>
            {post.argument}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Loop() {
  const [loops, setLoops] = useState([]);
  const [current, setCurrent] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    axios.get('/api/ideas')
      .then(res => setLoops(res.data?.length > 0 ? res.data : MOCK))
      .catch(() => setLoops(MOCK));
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setCurrent(idx);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0e0e1a', zIndex: 500,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* LOOP header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '14px 16px 8px',
        background: 'linear-gradient(180deg, rgba(10,10,20,0.85) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: 26, fontWeight: 900, letterSpacing: '3px',
          background: 'linear-gradient(135deg,#7f5af0,#2cb67d)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>LOOP</span>
      </div>

      {/* Scroll feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {loops.map((post, i) => (
          <div key={post.id || i} style={{
            height: '100vh', width: '100%',
            scrollSnapAlign: 'start',
            flexShrink: 0,
            background: '#0e0e1a',
          }}>
            <LoopCard post={post} index={i} />
          </div>
        ))}
        {loops.length === 0 && (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: 16 }}>
            No hay loops aún.
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 5, zIndex: 600,
      }}>
        {loops.slice(0, 10).map((_, i) => (
          <div key={i} style={{
            width: 3,
            height: i === current ? 22 : 7,
            borderRadius: 4,
            background: i === current ? '#7f5af0' : 'rgba(255,255,255,0.2)',
            transition: 'height 0.3s ease, background 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
}
