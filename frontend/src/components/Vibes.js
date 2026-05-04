// Vibes.js — Horizontal strip of 24h ephemeral stories
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const GRADIENT_BG = [
  'linear-gradient(135deg,#7f5af0,#2cb67d)',
  'linear-gradient(135deg,#f72585,#7f5af0)',
  'linear-gradient(135deg,#4cc9f0,#2cb67d)',
  'linear-gradient(135deg,#f4a261,#f72585)',
  'linear-gradient(135deg,#2cb67d,#4cc9f0)',
];

/* ─── Full-screen viewer ────────────────────────── */
function VibeViewer({ vibe, onClose, onDelete, currentUser }) {
  const isImage = vibe.media_type === 'image' && vibe.media_data;
  const isVideo = vibe.media_type === 'video' && vibe.media_data;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', zIndex: 1 }}>✕</button>
      {currentUser && vibe.author_id === currentUser.id && (
        <button onClick={e => { e.stopPropagation(); onDelete(vibe.id); }} style={{ position: 'absolute', top: 18, left: 18, background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, padding: '6px 12px', cursor: 'pointer', zIndex: 1 }}>🗑 Eliminar</button>
      )}

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)' }}>
        <div style={{ height: '100%', background: '#7f5af0', animation: 'vibeProgress 5s linear forwards' }} />
      </div>

      {/* Author */}
      <div style={{ position: 'absolute', top: 22, left: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: GRADIENT_BG[vibe.id % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
          {vibe.username?.[0] || '?'}
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{vibe.username}</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>Vibe · expira pronto</div>
        </div>
      </div>

      {/* Media */}
      <div style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
        {isImage && (
          <img src={vibe.media_data} alt="vibe" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, objectFit: 'contain' }} />
        )}
        {isVideo && (
          <video src={vibe.media_data} controls autoPlay style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12 }} />
        )}
        {!isImage && !isVideo && (
          <div style={{ width: '100%', minHeight: 300, background: GRADIENT_BG[vibe.id % 5], borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>{vibe.caption || '✨'}</p>
          </div>
        )}
      </div>

      {vibe.caption && (isImage || isVideo) && (
        <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 15, padding: '0 24px', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
          {vibe.caption}
        </div>
      )}

      <style>{`@keyframes vibeProgress { from{width:0} to{width:100%} }`}</style>
    </div>
  );
}

/* ─── Create Vibe modal ─────────────────────────── */
function CreateVibeModal({ user, onClose, onCreated }) {
  const [mediaType, setMediaType] = useState('text');
  const [mediaData, setMediaData] = useState('');
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_500_000) { setErr('Imagen demasiado grande (máx 2.5 MB)'); return; }
    setErr('');
    const reader = new FileReader();
    reader.onload = ev => {
      setMediaData(ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUrl = (e) => {
    setMediaData(e.target.value);
    setPreview(e.target.value);
  };

  const submit = async () => {
    if (mediaType !== 'text' && !mediaData.trim()) { setErr('Agrega contenido'); return; }
    if (mediaType === 'text' && !caption.trim()) { setErr('Escribe algo para tu Vibe'); return; }
    setLoading(true);
    try {
      const res = await axios.post('/api/vibes', {
        author_id: user.id,
        media_type: mediaType,
        media_data: mediaData || null,
        caption: caption || null,
      });
      onCreated(res.data);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || 'Error al crear Vibe');
    } finally { setLoading(false); }
  };

  const tabStyle = (t) => ({
    flex: 1, padding: '9px 0', background: 'none', border: 'none',
    borderBottom: mediaType === t ? '2px solid #7f5af0' : '2px solid transparent',
    color: mediaType === t ? '#e2e8f0' : '#475569',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,14,0.9)', backdropFilter: 'blur(10px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#13131f', border: '1px solid rgba(127,90,240,0.3)', borderRadius: 18, padding: '24px 20px', maxWidth: 420, width: '100%', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#475569', fontSize: 20, cursor: 'pointer' }}>✕</button>
        <h3 style={{ marginBottom: 18, fontSize: 18, color: '#e2e8f0', marginTop: 0 }}>✨ Nuevo Vibe</h3>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Desaparece en 24 horas</div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 18 }}>
          <button style={tabStyle('text')} onClick={() => { setMediaType('text'); setMediaData(''); setPreview(null); }}>✍️ Texto</button>
          <button style={tabStyle('image')} onClick={() => { setMediaType('image'); setMediaData(''); setPreview(null); }}>📷 Foto</button>
          <button style={tabStyle('video')} onClick={() => { setMediaType('video'); setMediaData(''); setPreview(null); }}>🎥 Video</button>
        </div>

        {/* Inputs */}
        {mediaType === 'text' && (
          <div style={{ background: GRADIENT_BG[user?.id % 5 || 0], borderRadius: 12, padding: '20px 16px', marginBottom: 14, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="¿Qué vibra hoy?"
              rows={4}
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>
        )}

        {mediaType === 'image' && (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed rgba(127,90,240,0.4)', borderRadius: 12, padding: '20px', marginBottom: 14, textAlign: 'center', cursor: 'pointer', background: preview ? 'transparent' : 'rgba(127,90,240,0.04)', overflow: 'hidden' }}
            >
              {preview
                ? <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }} />
                : <div style={{ color: '#475569' }}><div style={{ fontSize: 36, marginBottom: 8 }}>📷</div><div style={{ fontSize: 13 }}>Toca para subir foto (máx 2.5 MB)</div></div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (opcional)" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, marginBottom: 14, boxSizing: 'border-box', outline: 'none' }} />
          </>
        )}

        {mediaType === 'video' && (
          <>
            <input
              value={mediaData}
              onChange={handleVideoUrl}
              placeholder="URL del video (mp4, YouTube...)"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
            />
            {preview && (
              <video src={preview} controls style={{ width: '100%', borderRadius: 10, maxHeight: 180, marginBottom: 12 }} />
            )}
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (opcional)" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#e2e8f0', fontSize: 14, marginBottom: 14, boxSizing: 'border-box', outline: 'none' }} />
          </>
        )}

        {err && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <button
          onClick={submit} disabled={loading}
          style={{ width: '100%', padding: '12px', background: loading ? '#334155' : 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' }}
        >{loading ? 'Publicando...' : '+ Publicar Vibe'}</button>
      </div>
    </div>
  );
}

/* ─── Main Vibes strip ──────────────────────────── */
export default function Vibes({ user }) {
  const [vibes, setVibes] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    axios.get('/api/vibes').then(res => setVibes(res.data)).catch(() => {});
  }, []);

  const onCreated = (vibe) => {
    setVibes(prev => [{ ...vibe, username: user.username }, ...prev]);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/vibes/${id}`);
      setVibes(prev => prev.filter(v => v.id !== id));
      setViewing(null);
    } catch {}
  };

  // Group: own vibe first, then others (unique authors)
  const seen = new Set();
  const ordered = [
    ...(vibes.filter(v => v.author_id === user?.id)),
    ...(vibes.filter(v => v.author_id !== user?.id)),
  ].filter(v => {
    if (seen.has(v.author_id)) return false;
    seen.add(v.author_id);
    return true;
  });

  return (
    <>
      <div style={{
        display: 'flex', gap: 14, overflowX: 'auto', padding: '8px 0 16px',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20,
      }}>
        {/* Add vibe button */}
        <button onClick={() => setShowCreate(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, padding: 0 }}>
          <div style={{ position: 'relative', width: 62, height: 62 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(127,90,240,0.1)', border: '2px dashed rgba(127,90,240,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 26, color: '#7f5af0', lineHeight: 1, fontWeight: 300 }}>+</span>
            </div>
            {user && (
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: '2px solid #0e0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, textTransform: 'uppercase' }}>
                {user.username?.[0]}
              </div>
            )}
          </div>
          <span style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>Tu vibe</span>
        </button>

        {/* Vibe circles */}
        {ordered.map(vibe => (
          <button key={vibe.author_id} onClick={() => setViewing(vibe)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, padding: 0 }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg,#7f5af0,#2cb67d,#f72585)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: vibe.media_type === 'image' && vibe.media_data ? `url(${vibe.media_data}) center/cover` : GRADIENT_BG[vibe.id % 5], border: '2px solid #0e0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                {!(vibe.media_type === 'image' && vibe.media_data) && (vibe.username?.[0] || '?')}
              </div>
            </div>
            <span style={{ fontSize: 10, color: '#94a3b8', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{vibe.username}</span>
          </button>
        ))}

        {ordered.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', color: '#334155', fontSize: 13, padding: '10px 0' }}>
            Sé el primero en publicar un Vibe
          </div>
        )}
      </div>

      {viewing && <VibeViewer vibe={viewing} onClose={() => setViewing(null)} onDelete={handleDelete} currentUser={user} />}
      {showCreate && <CreateVibeModal user={user} onClose={() => setShowCreate(false)} onCreated={onCreated} />}
    </>
  );
}
