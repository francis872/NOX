import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import StructuredIdeaForm from '../components/StructuredIdeaForm';
import Vibes from '../components/Vibes';
import CameraCapture from '../components/CameraCapture';

function Feed() {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(0);
  const [pendingPost, setPendingPost] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPhoto, setCameraPhoto] = useState(null);

  // Open idea modal pre-filled if coming from Camera page
  useEffect(() => {
    if (location.state?.photoToAttach) {
      setCameraPhoto(location.state.photoToAttach);
      setShowIdeaModal(true);
      // Clear state so back navigation doesn't re-trigger
      window.history.replaceState({}, '');
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    axios.get('/api/ideas')
      .then(res => setFeed(res.data))
      .catch(() => {});
    if (user?.id) {
      axios.get(`/api/users/${user.id}`)
        .then(res => setUserProfile(res.data))
        .catch(() => {});
    }
  }, []);


  // Nuevo handler para StructuredIdeaForm
  const handleStructuredIdea = async (fields) => {
    setError('');
    try {
      const res = await axios.post('/api/ideas', {
        author_id: user.id,
        ...fields
      });
      setFeed([res.data, ...feed]);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al publicar idea');
    }
  };

  useEffect(() => {
    if (!showConfirm || confirmCountdown === 0) return;
    const timer = setTimeout(() => setConfirmCountdown(confirmCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [showConfirm, confirmCountdown]);

  const confirmAndSend = async () => {
    if (!pendingPost) return;
    try {
      const res = await axios.post('/api/ideas', { user_id: user.id, ...pendingPost });
      setFeed([res.data, ...feed]);
      setTitle('');
      setBody('');
      setShowConfirm(false);
      setPendingPost(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al publicar idea');
      setShowConfirm(false);
      setPendingPost(null);
    }
  };

  const handleReact = async (id, type) => {
    try {
      await axios.post(`/api/ideas/${id}/react`, { user_id: user?.id, reaction: type });
      // Update counts locally — backend returns { success: true }, not the post
      setFeed(prev => prev.map(post => {
        if (post.id !== id) return post;
        const col = type === 'ignite' ? 'ignite_count' : type === 'expand' ? 'expand_count' : 'challenge_count';
        const updated = { ...post, [col]: (post[col] || 0) + 1 };
        updated.score = (updated.ignite_count || 0) * 3 + (updated.expand_count || 0) * 2 + (updated.challenge_count || 0);
        return updated;
      }));
    } catch (err) {
      if (err.response?.status === 403) setError('No puedes reaccionar a tu propia idea');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta idea?')) return;
    try {
      await axios.delete(`/api/ideas/${id}`);
      setFeed(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  const handleIdeaSubmit = async (fields) => {
    await handleStructuredIdea(fields);
    setShowIdeaModal(false);
    setCameraPhoto(null);
  };

  const handleAttachToIdea = (base64) => {
    setCameraPhoto(base64);
    setShowIdeaModal(true);
  };

  return (
    <div style={{maxWidth: 680, margin: '0 auto', paddingTop: 24, paddingLeft: 60}}>
      {/* Vibes strip */}
      {user && <Vibes user={user} />}
      {/* Header */}
      <div style={{textAlign:'center', marginBottom: 28, paddingTop: 12}}>
        <h2 style={{marginBottom: 8, fontSize: 26, letterSpacing: '-0.5px'}}>Aquí no vienes a mirar. Vienes a pensar.</h2>
        {userProfile && (
          <div style={{fontSize:13, color:'#7fd7ff', marginBottom:10, fontWeight:'bold'}}>
            Nivel de pensamiento: {userProfile.thought_level}
          </div>
        )}
        <p style={{fontSize:14, color:'#94a3b8', margin:'0 auto', maxWidth:480, lineHeight:1.6}}>
          🧨 La verdad cruda: No eres espectador, eres chispa. Si tu idea enciende, creces. Si solo haces ruido, el sistema te apaga.
        </p>
      </div>

      {/* Action buttons */}
      <div style={{display:'flex', justifyContent:'center', gap: 12, marginBottom: 24, flexWrap: 'wrap'}}>
        <button
          onClick={() => setShowIdeaModal(true)}
          style={{
            background: 'linear-gradient(135deg, #7f5af0 0%, #2cb67d 100%)',
            border: 'none', borderRadius: 28, padding: '12px 28px',
            fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(127,90,240,0.4)', transition: 'transform 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.transform='scale(1.04)'}
          onMouseOut={e => e.currentTarget.style.transform='scale(1)'}
        >
          + Nueva Idea
        </button>
        <button
          onClick={() => setShowCamera(true)}
          style={{
            background: 'linear-gradient(135deg, #f72585 0%, #7f5af0 100%)',
            border: 'none', borderRadius: 28, padding: '12px 28px',
            fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(247,37,133,0.3)', transition: 'transform 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.transform='scale(1.04)'}
          onMouseOut={e => e.currentTarget.style.transform='scale(1)'}
        >
          📸 Cámara
        </button>
      </div>

      {/* Idea modal */}
      {showIdeaModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(4,4,14,0.88)',
            backdropFilter: 'blur(10px)',
            zIndex: 8000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 16px',
          }}
          onClick={() => { setShowIdeaModal(false); setCameraPhoto(null); }}
        >
          <div
            style={{
              background: '#13131f',
              border: '1px solid rgba(127,90,240,0.3)',
              borderRadius: 16,
              padding: '28px 24px',
              maxWidth: 560,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 0 40px rgba(127,90,240,0.3)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setShowIdeaModal(false); setCameraPhoto(null); }}
              style={{
                position: 'absolute', top: 14, right: 16,
                background: 'none', border: 'none',
                color: '#64748b', fontSize: 22, cursor: 'pointer', lineHeight: 1,
              }}
            >✕</button>
            <h3 style={{marginBottom: 20, fontSize: 18, color: '#e2e8f0'}}>💡 Nueva Idea</h3>
            <StructuredIdeaForm onSubmit={handleIdeaSubmit} initialData={cameraPhoto ? { premise:'',argument:'',evidence:'',conclusion:'',counterargument:'',media_url: cameraPhoto } : undefined} />
            {error && <div style={{color:'#ff6b6b', marginTop:10, fontSize:13}}>{error}</div>}
            <div style={{fontSize:11, color:'#475569', marginTop:8}}>Límite: 3 ideas/día.</div>
          </div>
        </div>
      )}
      {showCamera && (
        <CameraCapture
          user={user}
          onClose={() => setShowCamera(false)}
          onAttachToIdea={handleAttachToIdea}
        />
      )}
      {showConfirm && (
        <div style={{background:'#fffbe6',border:'1px solid #ffe58f',borderRadius:6,padding:16,marginBottom:16}}>
          <div style={{fontWeight:'bold',marginBottom:8}}>¿Esto aporta algo?</div>
          <div style={{fontSize:13,marginBottom:8}}>Piensa antes de publicar. ¿Esta idea eleva la conversación?</div>
          <button onClick={confirmAndSend} disabled={confirmCountdown > 0} style={{marginRight:8}}>
            {confirmCountdown > 0 ? `Espera ${confirmCountdown}s...` : 'Sí, publicar'}
          </button>
          <button onClick={() => { setShowConfirm(false); setPendingPost(null); }}>Cancelar</button>
        </div>
      )}
      <div>
        {feed.map(post => {
          const highScore = post.score && post.score > 180;
          return (
            <div key={post.id} style={{
              border: highScore ? '1px solid #2cb67d' : '1px solid rgba(127,90,240,0.2)',
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 14,
              background: highScore
                ? 'linear-gradient(135deg, rgba(44,182,125,0.08) 0%, rgba(19,19,31,0.95) 100%)'
                : 'rgba(19,19,31,0.85)',
              boxShadow: highScore ? '0 0 14px rgba(44,182,125,0.25)' : '0 2px 8px rgba(0,0,0,0.3)',
              color: '#e2e8f0',
            }}>
              <b style={{color:'#e2e8f0', fontSize:15}}>{post.premise}</b>
              {highScore && <span style={{marginLeft:8, color:'#2cb67d', fontWeight:'bold'}}>★ Idea destacada</span>}
              <div style={{margin:'10px 0', color:'#94a3b8', fontSize:13}}>
                <div><span style={{color:'#7f5af0',fontWeight:600}}>Argumento:</span> {post.argument}</div>
                <div><span style={{color:'#7f5af0',fontWeight:600}}>Evidencia:</span> {post.evidence}</div>
                <div><span style={{color:'#7f5af0',fontWeight:600}}>Conclusión:</span> {post.conclusion}</div>
                  {post.counterargument && <div><span style={{color:'#7f5af0',fontWeight:600}}>Contraargumento:</span> {post.counterargument}</div>}
              </div>
              {post.media_url && (
                post.media_url.startsWith('data:image') || post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                  ? <img src={post.media_url} alt="media" style={{maxWidth:'100%', maxHeight:280, borderRadius:10, objectFit:'cover', marginBottom:10}} />
                  : <video src={post.media_url} controls style={{maxWidth:'100%', maxHeight:280, borderRadius:10, marginBottom:10}} />
              )}
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                <button onClick={() => handleReact(post.id, 'ignite')} title="Encender" style={{background:'rgba(247,37,133,0.12)',border:'1px solid rgba(247,37,133,0.25)',borderRadius:8,color:'#f72585',padding:'5px 10px',cursor:'pointer',fontSize:12,fontWeight:600}}>🔥 {post.ignite_count||0}</button>
                <button onClick={() => handleReact(post.id, 'expand')} title="Expandir" style={{background:'rgba(127,90,240,0.12)',border:'1px solid rgba(127,90,240,0.25)',borderRadius:8,color:'#7f5af0',padding:'5px 10px',cursor:'pointer',fontSize:12,fontWeight:600}}>🧠 {post.expand_count||0}</button>
                <button onClick={() => handleReact(post.id, 'challenge')} title="Desafiar" style={{background:'rgba(44,182,125,0.12)',border:'1px solid rgba(44,182,125,0.25)',borderRadius:8,color:'#2cb67d',padding:'5px 10px',cursor:'pointer',fontSize:12,fontWeight:600}}>⚡ {post.challenge_count||0}</button>
                {(() => { const s = (post.ignite_count||0)*3+(post.expand_count||0)*2+(post.challenge_count||0); return s > 0 ? <span style={{marginLeft:6,fontSize:11,color:'#64748b',fontWeight:600}}>Score: {s}</span> : null; })()}
                {user && post.author_id === user.id && (
                  <button onClick={() => handleDelete(post.id)} title="Eliminar" style={{marginLeft:'auto',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,color:'#ef4444',padding:'5px 8px',cursor:'pointer',fontSize:12}}>🗑</button>
                )}
              </div>
              <div style={{fontSize: 10, color: '#475569', marginTop:6}}>{new Date(post.created_at).toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Feed;
