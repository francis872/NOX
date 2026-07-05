import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { MdOutlineClose, MdOutlineChevronLeft, MdOutlineChevronRight, MdOutlineAdd } from 'react-icons/md';

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - Date.now();
  if (diff <= 0) return 'Expirado';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Story Viewer (fullscreen carousel) ─────────────────────────────────────
function StoryViewer({ stories, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx ?? 0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef();

  const story = stories[idx];
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => { if (idx < stories.length - 1) setIdx(i => i + 1); else onClose(); };

  useEffect(() => {
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(timerRef.current); next(); return 100; }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [idx]); // eslint-disable-line

  if (!story) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 14, left: 14, right: 50, display: 'flex', gap: 4, zIndex: 2 }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#fff', width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%', transition: i === idx ? 'none' : 'none' }} />
          </div>
        ))}
      </div>

      {/* Close */}
      <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MdOutlineClose size={20} />
      </button>

      {/* Author bar */}
      <div style={{ position: 'absolute', top: 32, left: 14, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#fb7185,#7f5af0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }}>
          {story.username?.[0]?.toUpperCase() || '?'}
        </div>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>@{story.username || 'anonimo'}</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{timeLeft(story.expires_at)}</span>
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: 420, height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {story.media_type === 'image' && story.media_data ? (
          <img src={story.media_data} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ padding: '60px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.6 }}>{story.caption || '—'}</p>
          </div>
        )}
      </div>

      {/* Nav tap zones */}
      <div onClick={prev} style={{ position: 'absolute', left: 0, top: 0, width: '35%', height: '100%', zIndex: 1, cursor: idx > 0 ? 'pointer' : 'default' }} />
      <div onClick={next} style={{ position: 'absolute', right: 0, top: 0, width: '35%', height: '100%', zIndex: 1, cursor: 'pointer' }} />

      {/* Arrow hints */}
      {idx > 0 && <MdOutlineChevronLeft size={32} style={{ position: 'absolute', left: 10, color: 'rgba(255,255,255,0.6)', zIndex: 2, pointerEvents: 'none' }} />}
      {idx < stories.length - 1 && <MdOutlineChevronRight size={32} style={{ position: 'absolute', right: 10, color: 'rgba(255,255,255,0.6)', zIndex: 2, pointerEvents: 'none' }} />}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function Stories() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [stories,  setStories]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [caption,  setCaption]  = useState('');
  const [posting,  setPosting]  = useState(false);
  const [viewer,   setViewer]   = useState(null); // index to open viewer at

  useEffect(() => {
    axios.get('/api/stories')
      .then(res => setStories(res.data || []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!caption.trim()) return;
    setPosting(true);
    try {
      const res = await axios.post('/api/stories', { author_id: user.id, media_type: 'text', caption: caption.trim() });
      setStories(prev => [{ ...res.data, username: user.username }, ...prev]);
      setCaption(''); setCreating(false);
    } catch {}
    finally { setPosting(false); }
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto', padding: '24px 18px 90px' }}>
      {/* Header */}
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, background: 'rgba(251,113,133,0.1)', color: '#fb7185', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, marginBottom: 10 }}>Lockpost</span>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#f8fafc' }}>Capsulas efimeras</h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>Momentos que desaparecen en 24h.</p>
        </div>
        <button onClick={() => setCreating(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 16, background: creating ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#fb7185,#f97316)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
          <MdOutlineAdd size={18} />{creating ? 'Cancelar' : 'Nuevo lock'}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <form onSubmit={handlePost} style={{ padding: 20, borderRadius: 20, background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.18)', marginBottom: 24 }}>
          <textarea
            placeholder="Que quieres compartir hoy? Desaparece en 24h..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            maxLength={280}
            autoFocus
            style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: 15, resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>{caption.length}/280</span>
            <button type="submit" disabled={posting || !caption.trim()} style={{ padding: '10px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#fb7185,#f97316)', border: 'none', color: '#fff', fontWeight: 800, cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.7 : 1 }}>
              {posting ? 'Publicando...' : 'Publicar lock'}
            </button>
          </div>
        </form>
      )}

      {/* Stories carousel strip */}
      {!loading && stories.length > 0 && (
        <div style={{ marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Activos ahora</div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }}>
            {stories.map((story, i) => (
              <div key={story.id} onClick={() => setViewer(i)} style={{ flexShrink: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg,#fb7185,#f97316,#7f5af0)', flexShrink: 0 }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2.5px solid #0a0c14', background: story.media_type === 'image' && story.media_data ? `url(${story.media_data}) center/cover` : 'linear-gradient(135deg,#fb7185,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20 }}>
                    {!(story.media_type === 'image' && story.media_data) && (story.username?.[0]?.toUpperCase() || '?')}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#64748b', maxWidth: 68, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{story.username || 'lock'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* States */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 48 }}>Cargando locks...</div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Sin locks activos.</p>
          <p style={{ fontSize: 14, color: '#475569', marginTop: 6, marginBottom: 24 }}>Publica el primero — desaparece en 24 horas.</p>
          <button onClick={() => setCreating(true)} style={{ padding: '12px 28px', borderRadius: 14, background: 'linear-gradient(135deg,#fb7185,#f97316)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <MdOutlineAdd size={18} /> Crear primer lock
          </button>
        </div>
      ) : (
        /* Grid view */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
          {stories.map((story, i) => (
            <div key={story.id} onClick={() => setViewer(i)} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: 18, minHeight: 160, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.2s' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>
                  {story.media_type === 'image' ? 'Foto' : 'Lock'}
                </div>
                {story.media_type === 'image' && story.media_data && (
                  <img src={story.media_data} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 10, objectFit: 'cover', maxHeight: 120 }} />
                )}
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>{story.caption || '—'}</p>
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#475569' }}>@{story.username || 'anonimo'}</span>
                <span style={{ fontSize: 11, color: '#fb718566', fontWeight: 600 }}>{timeLeft(story.expires_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Story viewer */}
      {viewer !== null && (
        <StoryViewer stories={stories} startIdx={viewer} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
