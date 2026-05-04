import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StructuredIdeaForm from '../components/StructuredIdeaForm';

function Feed() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(0);
  const [pendingPost, setPendingPost] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

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
      const res = await axios.post(`/api/ideas/${id}/react`, { type });
      setFeed(feed.map(post => post.id === id ? res.data : post));
    } catch {}
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2 style={{marginBottom:4}}>Aquí no vienes a mirar. Vienes a pensar.</h2>
      {userProfile && (
        <div style={{fontSize:14, color:'#7fd7ff', marginBottom:8, fontWeight:'bold', textAlign:'center'}}>
          Tu nivel de pensamiento: {userProfile.thought_level}
        </div>
      )}
      <div style={{fontSize:15, color:'#bfc4c9', marginBottom:16, fontFamily:'inherit', textAlign:'center'}}>
        🧨 La verdad cruda: No eres espectador, eres chispa. Si tu idea enciende, creces. Si solo haces ruido, el sistema te apaga.
      </div>
      <div style={{marginBottom: 16}}>
        <StructuredIdeaForm onSubmit={handleStructuredIdea} />
        {error && <div style={{color:'red', marginTop:8}}>{error}</div>}
        <div style={{fontSize:11, color:'#888', marginTop:4}}>Límite: 3 ideas/día.</div>
      </div>
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
              border: '1px solid #eee',
              borderRadius: 4,
              padding: 8,
              marginBottom: 8,
              background: highScore ? 'linear-gradient(90deg,#e0ffe0 60%,#fff 100%)' : '#fff',
              boxShadow: highScore ? '0 0 8px #b6fcb6' : undefined
            }}>
              <b>{post.premise}</b>
              {highScore && <span style={{marginLeft:8, color:'#1a7f1a', fontWeight:'bold'}}>★ Idea destacada</span>}
              <div style={{margin:'8px 0'}}>
                <div><b>Argumento:</b> {post.argument}</div>
                <div><b>Evidencia:</b> {post.evidence}</div>
                <div><b>Conclusión:</b> {post.conclusion}</div>
                {post.counterargument && <div><b>Contraargumento:</b> {post.counterargument}</div>}
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <button onClick={() => handleReact(post.id, 'ignite')} title="Encender (aporta valor)">🔥 Encender</button>
                <button onClick={() => handleReact(post.id, 'expand')} title="Expandir (desarrolla la idea)">🧠 Expandir</button>
                <button onClick={() => handleReact(post.id, 'challenge')} title="Desafiar (debate)">⚡ Desafiar</button>
                <span style={{marginLeft:8}}>
                  🔥 {post.ignite_count || 0}  🧠 {post.expand_count || 0}  ⚡ {post.challenge_count || 0}
                </span>
                <span style={{marginLeft:16, fontSize:11, color:'#888'}}>Score: {post.score && post.score.toFixed(0)}</span>
              </div>
              <div style={{fontSize: 10, color: '#888'}}>{new Date(post.created_at).toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Feed;
