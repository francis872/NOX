import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import { MdOutlineImage, MdOutlineClose, MdOutlineAutorenew, MdOutlinePersonAdd } from 'react-icons/md';

const EMPTY_JOKES = [
  (u) => `${u}, el feed esta mas silencioso que tu mente antes del cafe. Escribe algo.`,
  (u) => `Nada aun, ${u}. Hasta los filosofos tuvieron que empezar con su primer pensamiento.`,
  (u) => `${u}... el universo espera tu AXIOM. No lo hagas esperar mucho.`,
  (u) => `Feed vacio. Pero las mejores ideas siempre llegan cuando menos se esperan, ${u}.`,
  (u) => `Silencio absoluto, ${u}. Perfecto para pensar. Luego lo cuentas aqui.`,
];

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Avatar({ name, url, size = 36 }) {
  const colors = ['#7f5af0','#2cb67d','#f72585','#38bdf8','#f59e0b'];
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg,${c},#1a1a2e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: size * 0.38, textTransform: 'uppercase' }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name?.[0] || '?')}
    </div>
  );
}

// ─── Inline Composer ─────────────────────────────────────────────────────────
function Composer({ user, onPublished }) {
  const [open,       setOpen]      = useState(false);
  const [content,    setContent]   = useState('');
  const [expanded,   setExpanded]  = useState(false);
  const [extra,      setExtra]     = useState({ argument: '', evidence: '', conclusion: '' });
  const [mediaImg,   setMediaImg]  = useState(null);
  const [showCam,    setShowCam]   = useState(false);
  const [posting,    setPosting]   = useState(false);
  const [error,      setError]     = useState('');
  const fileRef = useRef();
  const textRef = useRef();

  const handleOpen = () => { setOpen(true); setTimeout(() => textRef.current?.focus(), 50); };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3_000_000) { setError('Max 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setMediaImg(ev.target.result);
    reader.readAsDataURL(f);
  };

  const reset = () => {
    setContent(''); setExpanded(false); setExtra({ argument: '', evidence: '', conclusion: '' });
    setMediaImg(null); setError(''); setOpen(false);
  };

  const publish = async () => {
    if (!content.trim()) return;
    setPosting(true); setError('');
    try {
      const res = await axios.post('/api/ideas', {
        author_id:  user.id,
        premise:    content.trim(),
        argument:   extra.argument.trim() || undefined,
        evidence:   extra.evidence.trim()  || undefined,
        conclusion: extra.conclusion.trim()|| undefined,
        media_url:  mediaImg || undefined,
        media_type: mediaImg ? 'image' : 'text',
      });
      onPublished(res.data);
      reset();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al publicar');
    } finally { setPosting(false); }
  };

  const inp = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '9px 13px', color: '#f8fafc', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 };

  if (!open) {
    return (
      <div onClick={handleOpen} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'text', marginBottom: 20 }}>
        <Avatar name={user?.username} url={user?.avatar_url} size={36} />
        <span style={{ color: '#475569', fontSize: 15 }}>Publica un AXIOM, {user?.username?.split(' ')[0]}...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(127,90,240,0.25)', marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar name={user?.username} url={user?.avatar_url} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            ref={textRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="¿Qué piensas? Escribe tu AXIOM..."
            rows={3}
            maxLength={500}
            style={{ ...inp, marginBottom: 8 }}
          />

          {/* Expandable deep fields */}
          {expanded && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
              {[['argument','Argumento (opcional)'],['evidence','Evidencia (opcional)'],['conclusion','Conclusion (opcional)']].map(([k, ph]) => (
                <textarea key={k} rows={2} placeholder={ph} value={extra[k]} onChange={e => setExtra(x => ({ ...x, [k]: e.target.value }))} style={inp} />
              ))}
            </div>
          )}

          {/* Media preview */}
          {mediaImg && (
            <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
              <img src={mediaImg} alt="" style={{ maxHeight: 180, borderRadius: 12, display: 'block', objectFit: 'cover' }} />
              <button onClick={() => setMediaImg(null)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdOutlineClose size={14} /></button>
            </div>
          )}

          {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                <MdOutlineImage size={18} /> Foto
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
              <button onClick={() => setShowCam(true)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>📸 Cámara</button>
              <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: expanded ? '#7f5af0' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {expanded ? '− Menos' : '+ Profundizar'}
              </button>
              <span style={{ fontSize: 11, color: content.length > 420 ? '#ef4444' : '#334155' }}>{content.length}/500</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={reset} style={{ padding: '8px 14px', borderRadius: 12, background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={publish} disabled={posting || !content.trim()} style={{ padding: '8px 18px', borderRadius: 12, background: content.trim() ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : 'rgba(255,255,255,0.06)', border: 'none', color: content.trim() ? '#fff' : '#475569', fontWeight: 700, cursor: posting || !content.trim() ? 'not-allowed' : 'pointer', fontSize: 14 }}>
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCam && (
        <CameraCapture user={user} onClose={() => setShowCam(false)} onAttachToIdea={(b64) => { setMediaImg(b64); setShowCam(false); }} />
      )}
    </div>
  );
}

// ─── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post, user, onReact, onDelete }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const hasDetails = post.argument || post.evidence || post.conclusion;

  return (
    <article style={{ padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s' }}>
      {/* Author row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div onClick={() => navigate(`/profile/${post.author_id}`)} style={{ cursor: 'pointer' }}>
          <Avatar name={post.username} url={post.avatar_url} size={38} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14, cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.author_id}`)}>
            @{post.username || `user_${post.author_id}`}
          </div>
          <div style={{ fontSize: 12, color: '#334155' }}>{timeAgo(post.created_at)}</div>
        </div>
        {post.score > 180 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontWeight: 700 }}>★ Destacado</span>}
      </div>

      {/* Content */}
      <p style={{ margin: '0 0 12px', color: '#f1f5f9', fontSize: 15, lineHeight: 1.65, fontWeight: 500 }}>{post.premise}</p>

      {/* Expandable details */}
      {hasDetails && (
        <>
          <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {expanded ? '▾ Ocultar detalle' : '▸ Ver argumento completo'}
          </button>
          {expanded && (
            <div style={{ borderLeft: '2px solid rgba(127,90,240,0.3)', paddingLeft: 14, marginBottom: 12, display: 'grid', gap: 8 }}>
              {post.argument && <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}><span style={{ color: '#7f5af0', fontWeight: 700 }}>Argumento:</span> {post.argument}</div>}
              {post.evidence && <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}><span style={{ color: '#38bdf8', fontWeight: 700 }}>Evidencia:</span> {post.evidence}</div>}
              {post.conclusion && <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}><span style={{ color: '#2cb67d', fontWeight: 700 }}>Conclusion:</span> {post.conclusion}</div>}
              {post.counterargument && <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.5 }}><span style={{ color: '#fb7185', fontWeight: 700 }}>Contra:</span> {post.counterargument}</div>}
            </div>
          )}
        </>
      )}

      {/* Media */}
      {post.media_url && (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14, maxHeight: 360 }}>
          {post.media_url.startsWith('data:image') || post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            ? <img src={post.media_url} alt="" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            : <video src={post.media_url} controls style={{ width: '100%', display: 'block' }} />
          }
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {[['ignite','🔥', post.ignite_count || 0],['expand','🧠', post.expand_count || 0],['challenge','⚡', post.challenge_count || 0]].map(([type, icon, count]) => (
          <button key={type} onClick={() => onReact(post.id, type)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}>
            {icon} {count}
          </button>
        ))}
        {user?.id === post.author_id && (
          <button onClick={() => onDelete(post.id)} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 999, border: 'none', background: 'none', color: '#334155', cursor: 'pointer', fontSize: 13 }}>
            🗑
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Suggest users block ────────────────────────────────────────────────────
function SuggestUsers({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/explore').then(res => {
      const all = (res.data || []).filter(u => u.id !== currentUserId).slice(0, 5);
      setUsers(all);
    }).catch(() => {});
  }, [currentUserId]);

  if (users.length === 0) return null;

  const follow = async (id) => {
    try { await axios.post(`/api/follow/${id}/follow`, { follower_id: currentUserId }); } catch {}
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div style={{ padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>A quien seguir</div>
      <div style={{ display: 'grid', gap: 12 }}>
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div onClick={() => navigate(`/profile/${u.id}`)} style={{ cursor: 'pointer' }}>
              <Avatar name={u.username} url={u.avatar_url} size={36} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{u.username}</div>
              <div style={{ fontSize: 11, color: '#334155' }}>{u.followers_count > 0 ? `${u.followers_count} seguidores` : 'Nuevo en NOX'}</div>
            </div>
            <button onClick={() => follow(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(127,90,240,0.3)', background: 'rgba(127,90,240,0.1)', color: '#c4b5fd', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <MdOutlinePersonAdd size={14} /> Seguir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Feed ────────────────────────────────────────────────────────────────────
function Feed() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const [tab,    setTab]    = useState('explore');
  const [feed,   setFeed]   = useState([]);
  const [followed,setFollowed]=useState([]);
  const [loading,setLoading] = useState(true);
  const [error,  setError]  = useState('');
  const [cameraPhoto,  setCameraPhoto]  = useState(null);
  const [showCamera,   setShowCamera]   = useState(false);
  const jokeIdx = useRef(Math.floor(Math.random() * EMPTY_JOKES.length));

  const loadFeed = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/ideas').catch(() => ({ data: [] })),
      user?.id ? axios.get(`/api/ideas?following=true&user_id=${user.id}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ]).then(([exploreRes, followRes]) => {
      setFeed(exploreRes.data || []);
      setFollowed(followRes.data || []);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    if (location.state?.photoToAttach) {
      setCameraPhoto(location.state.photoToAttach);
      window.history.replaceState({}, '');
    }
  }, []); // eslint-disable-line

  const handlePublished = (newPost) => {
    const withUser = { ...newPost, username: user?.username, avatar_url: user?.avatar_url };
    setFeed(prev => [withUser, ...prev]);
    setFollowed(prev => [withUser, ...prev]);
  };

  const handleReact = async (id, type) => {
    try {
      await axios.post(`/api/ideas/${id}/react`, { user_id: user?.id, reaction: type });
      const update = (prev) => prev.map(p => {
        if (p.id !== id) return p;
        const col = type === 'ignite' ? 'ignite_count' : type === 'expand' ? 'expand_count' : 'challenge_count';
        return { ...p, [col]: (p[col] || 0) + 1 };
      });
      setFeed(update); setFollowed(update);
    } catch (err) {
      if (err.response?.status === 403) setError('No puedes reaccionar a tu propia idea');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este AXIOM?')) return;
    try {
      await axios.delete(`/api/ideas/${id}`);
      setFeed(p => p.filter(x => x.id !== id));
      setFollowed(p => p.filter(x => x.id !== id));
    } catch {}
  };

  const activeFeed = tab === 'following' ? followed : feed;
  const isEmpty    = !loading && activeFeed.length === 0;

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 90px' }}>

      {/* Composer */}
      <Composer user={user} onPublished={handlePublished} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {[['explore','Explorar'],['following','Siguiendo']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: tab === id ? '2px solid #7f5af0' : '2px solid transparent', color: tab === id ? '#e2e8f0' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'color 0.2s' }}>
            {label}
            {id === 'following' && followed.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', borderRadius: 999, background: 'rgba(127,90,240,0.2)', color: '#a78bfa' }}>{followed.length}</span>}
          </button>
        ))}
        <button onClick={loadFeed} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center' }}>
          <MdOutlineAutorenew size={18} />
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 14, fontSize: 13 }}>{error}</div>}

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#334155' }}>Cargando AXIOMS...</div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 42, marginBottom: 18 }}>💭</div>
          <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
            {EMPTY_JOKES[jokeIdx.current](user?.username || 'creador')}
          </p>
          {tab === 'following' && (
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 20 }}>
              Sigue a personas para ver sus AXIOMS aqui.
            </p>
          )}
          <SuggestUsers currentUserId={user?.id} />
        </div>
      )}

      {/* Suggestions sidebar (when explore has content but following is empty) */}
      {tab === 'explore' && !loading && followed.length === 0 && feed.length > 0 && (
        <SuggestUsers currentUserId={user?.id} />
      )}

      {/* Feed */}
      <div style={{ display: 'grid', gap: 14 }}>
        {activeFeed.map(post => (
          <PostCard key={post.id} post={post} user={user} onReact={handleReact} onDelete={handleDelete} />
        ))}
      </div>
    </main>
  );
}

export default Feed;
