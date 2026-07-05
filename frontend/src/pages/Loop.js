// Loop.js — Vertical idea feed (like Reels but for thoughts)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

/* ─── Create Loop Modal ─────────────────────── */
function CreateLoopModal({ user, onClose, onCreated, initialMedia, onOpenCamera }) {
  const [premise, setPremise] = useState('');
  const [argument, setArgument] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [mediaData, setMediaData] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!initialMedia?.media_url) return;
    setMediaData(initialMedia.media_url);
    setPreview(initialMedia.media_url);
    setMediaType(initialMedia.media_type || 'image');
  }, [initialMedia]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3_000_000) { setErr('Archivo demasiado grande (máx 3MB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMediaData(ev.target.result);
      setPreview(ev.target.result);
      setErr('');
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!premise.trim()) { setErr('La premisa es obligatoria'); return; }
    setLoading(true); setErr('');
    try {
      const res = await axios.post('/api/ideas', {
        author_id: user.id,
        premise: premise.trim(),
        argument: argument.trim() || null,
        evidence: null, conclusion: null, counterargument: null,
        media_url: mediaData || null,
        media_type: mediaType,
      });
      onCreated({ ...res.data, author: user.username, username: user.username });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al publicar Loop');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,14,0.92)', backdropFilter: 'blur(12px)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#13131f', border: '1px solid rgba(127,90,240,0.35)', borderRadius: 20, padding: '28px 22px', maxWidth: 440, width: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#475569', fontSize: 20, cursor: 'pointer' }}>✕</button>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '2px', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>NUEVO LOOP</div>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 20 }}>Comparte una idea que haga pensar</div>

        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {[
            { key:'text', label:'Texto' },
            { key:'image', label:'Foto' },
            { key:'video', label:'Video' },
            { key:'boomerang', label:'Boomerang' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setMediaType(t.key);
                if (t.key === 'text') {
                  setMediaData('');
                  setPreview('');
                  return;
                }
                onOpenCamera?.(t.key);
              }}
              style={{
                flex:1,
                padding:'8px 6px',
                borderRadius:10,
                border: mediaType === t.key ? '1px solid rgba(127,90,240,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: mediaType === t.key ? 'rgba(127,90,240,0.16)' : 'rgba(255,255,255,0.03)',
                color: mediaType === t.key ? '#e2e8f0' : '#94a3b8',
                cursor:'pointer',
                fontSize:12,
                fontWeight:700,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mediaType !== 'text' && (
          <div style={{ marginBottom: 14 }}>
            {mediaType === 'video' ? (
              <input
                value={mediaData}
                onChange={e => { setMediaData(e.target.value); setPreview(e.target.value); }}
                placeholder="URL del video/boomerang"
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 12px', color:'#e2e8f0', fontSize:14, boxSizing:'border-box' }}
              />
            ) : (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ width:'100%', padding:'11px 12px', borderRadius:10, border:'1px dashed rgba(127,90,240,0.5)', background:'rgba(127,90,240,0.08)', color:'#cbd5e1', cursor:'pointer', fontWeight:600 }}
                >
                  Subir archivo ({mediaType === 'image' ? 'foto/gif' : 'boomerang'})
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : 'image/*,video/*'}
                  onChange={handleFile}
                  style={{ display:'none' }}
                />
              </>
            )}
            {preview && (
              <div style={{ marginTop:10, borderRadius:10, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
                {preview.startsWith('data:video') || preview.includes('.mp4') ? (
                  <video src={preview} controls loop style={{ width:'100%', maxHeight:220, objectFit:'cover', display:'block' }} />
                ) : (
                  <img src={preview} alt="preview" style={{ width:'100%', maxHeight:220, objectFit:'cover', display:'block' }} />
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: '#7f5af0', fontWeight: 700, display: 'block', marginBottom: 6 }}>PREMISA *</label>
          <textarea
            value={premise}
            onChange={e => setPremise(e.target.value)}
            placeholder="Tu idea en una frase poderosa..."
            rows={3}
            style={{ width: '100%', background: 'rgba(127,90,240,0.07)', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 12, padding: '12px 14px', color: '#e2e8f0', fontSize: 15, fontWeight: 600, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, color: '#64748b', fontWeight: 700, display: 'block', marginBottom: 6 }}>ARGUMENTO (opcional)</label>
          <textarea
            value={argument}
            onChange={e => setArgument(e.target.value)}
            placeholder="Desarrolla tu razonamiento..."
            rows={4}
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12, padding: '12px 14px', color: '#cbd5e1', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {err && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={submit} disabled={loading} style={{ flex: 2, padding: '12px', background: loading ? '#334155' : 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Publicando...' : '⚡ Publicar Loop'}
          </button>
        </div>
      </div>
    </div>
  );
}

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

        {post.media_url && (
          <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 420 }}>
            {(post.media_type === 'video' || post.media_type === 'boomerang' || String(post.media_url).includes('.mp4') || String(post.media_url).startsWith('data:video')) ? (
              <video
                src={post.media_url}
                controls={post.media_type !== 'boomerang'}
                autoPlay={post.media_type === 'boomerang'}
                loop={post.media_type === 'boomerang'}
                muted={post.media_type === 'boomerang'}
                style={{ width:'100%', maxHeight:260, objectFit:'cover', display:'block' }}
              />
            ) : (
              <img src={post.media_url} alt="loop-media" style={{ width:'100%', maxHeight:260, objectFit:'cover', display:'block' }} />
            )}
          </div>
        )}

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
  const [showCreate, setShowCreate] = useState(false);
  const [initialMedia, setInitialMedia] = useState(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const loopMedia = location.state?.loopMediaToAttach;
    if (!loopMedia?.media_url) return;
    setInitialMedia(loopMedia);
    setShowCreate(true);
    window.history.replaceState({}, '');
  }, [location.state]);

  useEffect(() => {
    // Load ALL ideas (no user_id filter) to see everyone's loops
    axios.get('/api/ideas')
      .then(res => setLoops(res.data?.length > 0 ? res.data : MOCK))
      .catch(() => setLoops(MOCK));
  }, []);

  const handleCreated = (newLoop) => {
    setLoops(prev => [newLoop, ...prev]);
    setCurrent(0);
    // Scroll to top
    if (containerRef.current) containerRef.current.scrollTop = 0;
  };

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
      }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)} style={{ position:'absolute', left:70, top:12, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'6px 14px', color:'#94a3b8', fontSize:13, fontWeight:600, cursor:'pointer', pointerEvents:'auto' }}>
          ← Volver
        </button>
        <span style={{
          fontSize: 26, fontWeight: 900, letterSpacing: '3px',
          background: 'linear-gradient(135deg,#7f5af0,#2cb67d)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          pointerEvents: 'none',
        }}>LOOP</span>
        {/* Create Loop button */}
        <button
          onClick={() => {
            setInitialMedia(null);
            setShowCreate(true);
          }}
          style={{ position:'absolute', right:16, top:12, background:'linear-gradient(135deg,#7f5af0,#2cb67d)', border:'none', borderRadius:20, padding:'6px 16px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', pointerEvents:'auto', letterSpacing:'0.5px' }}
        >
          + Crear
        </button>
        <button
          onClick={() => navigate('/camara', { state: { target: 'loop', preferredMode: 'boomerang' } })}
          style={{ position:'absolute', right:108, top:12, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.16)', borderRadius:20, padding:'6px 14px', color:'#e2e8f0', fontSize:13, fontWeight:700, cursor:'pointer', pointerEvents:'auto' }}
        >
          📸 Cámara
        </button>
      </div>

      {showCreate && user && (
        <CreateLoopModal
          user={user}
          onClose={() => {
            setShowCreate(false);
            setInitialMedia(null);
          }}
          onCreated={handleCreated}
          initialMedia={initialMedia}
          onOpenCamera={(mode) => navigate('/camara', { state: { target: 'loop', preferredMode: mode } })}
        />
      )}

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
