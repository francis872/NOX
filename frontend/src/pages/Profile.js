import React, { useEffect, useState } from 'react';
import MyLinkMessages from '../components/DirectMessages';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [storyInput, setStoryInput] = useState('');
  const [reels, setReels] = useState([]);
  const [reelInput, setReelInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [destacados, setDestacados] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ bio: '', interests: '', age: '', origin: '', account_type: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ideas');

  useEffect(() => {
    axios.get(`/api/users/${id}`)
      .then(res => {
        setProfile(res.data);
        setForm({
          bio: res.data.bio || '',
          interests: (res.data.interests || []).join(', '),
          age: res.data.age || '',
          origin: res.data.origin || '',
          account_type: res.data.account_type || 'normal'
        });
      })
      .catch(() => setError('No se pudo cargar el perfil'));
    axios.get(`/api/users/${id}/posts`)
      .then(res => setPosts(res.data))
      .catch(() => {});
    // Simulación de datos para stories, reels y mensajes
    setStories([
      { id: 1, content: 'Story 1' },
      { id: 2, content: 'Story 2' },
      { id: 3, content: 'Story 3' }
    ]);
    setReels([
      { id: 1, title: 'Reel 1', created_at: new Date() },
      { id: 2, title: 'Reel 2', created_at: new Date() }
    ]);
    setMessages([
      { id: 1, sender: 'UsuarioA', content: '¡Hola!', created_at: new Date() },
      { id: 2, sender: 'UsuarioB', content: '¿Cómo estás?', created_at: new Date() }
    ]);
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        interests: form.interests.split(',').map(i => i.trim()),
        principios: form.principios.split(',').map(p => p.trim())
      };
      const res = await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(res.data);
      setEdit(false);
    } catch (err) {
      setError('Error al actualizar el perfil');
    }
  };

  const handleAccountType = async (type) => {
    setError('');
    try {
      const payload = { ...form, account_type: type, interests: form.interests.split(',').map(i => i.trim()) };
      const res = await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(res.data);
      setForm(f => ({ ...f, account_type: type }));
    } catch (err) {
      setError('Error al cambiar tipo de cuenta');
    }
  };

  if (!profile) return <div>Cargando...</div>;

  // Principios (puedes editar en el perfil)
  const principios = profile.principios || [
    'Pensamiento crítico',
    'Colaboración',
    'Respeto a la diversidad',
  ];
  // Ideas más potentes: top 3 ideas con más encendidos
  const ideasPotentes = posts
    .sort((a, b) => (b.ignite_count || 0) - (a.ignite_count || 0))
    .slice(0, 3);
  // Historial de debates: ideas con más desafíos
  const debates = posts
    .filter(p => (p.challenge_count || 0) > 0)
    .sort((a, b) => (b.challenge_count || 0) - (a.challenge_count || 0));

  return (
    <div style={{maxWidth: 640, margin: '0 auto', paddingTop: 16, paddingLeft: 60, paddingRight: 16, paddingBottom: 48, color: '#e2e8f0'}}>

      {/* Header */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 20}}>
        <span style={{fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px'}}>
          {profile.username}
          {profile.verified && <span style={{color:'#7f5af0', marginLeft:6, fontSize:15}}>✓</span>}
        </span>
        <span style={{fontSize: 24, color: '#475569', cursor:'pointer'}}>☰</span>
      </div>

      {/* Avatar + stats */}
      <div style={{display:'flex', alignItems:'center', gap: 24, marginBottom: 16}}>
        <div style={{width:90, height:90, borderRadius:'50%', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', padding:3, flexShrink:0}}>
          <div style={{width:'100%', height:'100%', borderRadius:'50%', background:'#0e0e1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, fontWeight:700, color:'#7f5af0', textTransform:'uppercase'}}>
            {profile.username?.[0]}
          </div>
        </div>
        <div style={{display:'flex', gap:20, flex:1, justifyContent:'space-around'}}>
          {[
            { val: profile.posts_count || posts.length || 0, label: 'publicaciones' },
            { val: profile.followers_count || 0, label: 'seguidores' },
            { val: profile.following_count || 0, label: 'siguiendo' },
          ].map(({ val, label }) => (
            <div key={label} style={{textAlign:'center'}}>
              <div style={{fontWeight:700, fontSize:20, color:'#e2e8f0'}}>{val}</div>
              <div style={{fontSize:12, color:'#64748b', marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div style={{marginBottom: 16}}>
        <div style={{fontWeight:600, fontSize:15}}>{profile.username}</div>
        {profile.thought_level && <div style={{fontSize:12, color:'#7f5af0', marginTop:2}}>Nivel: {profile.thought_level}</div>}
        {profile.bio && <div style={{fontSize:14, color:'#cbd5e1', marginTop:4, lineHeight:1.5}}>{profile.bio}</div>}
        {profile.origin && <div style={{fontSize:13, color:'#64748b', marginTop:3}}>📍 {profile.origin}</div>}
        {(profile.interests || []).length > 0 && (
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:8}}>
            {(profile.interests || []).map((tag, i) => (
              <span key={i} style={{background:'rgba(127,90,240,0.15)', color:'#7f5af0', borderRadius:20, padding:'2px 10px', fontSize:11}}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {edit ? (
        <form onSubmit={handleEdit} style={{marginBottom: 20}}>
          <textarea name="bio" placeholder="Biografía" value={form.bio} onChange={handleChange} rows={3}
            style={{width:'100%', background:'#1a1a2e', border:'1px solid rgba(127,90,240,0.3)', borderRadius:10, color:'#e2e8f0', padding:'10px 12px', fontSize:14, resize:'vertical', marginBottom:8, boxSizing:'border-box'}} />
          <input name="interests" placeholder="Intereses (separados por coma)" value={form.interests} onChange={handleChange}
            style={{width:'100%', background:'#1a1a2e', border:'1px solid rgba(127,90,240,0.3)', borderRadius:10, color:'#e2e8f0', padding:'10px 12px', fontSize:14, marginBottom:8, boxSizing:'border-box'}} />
          <input name="origin" placeholder="Origen" value={form.origin} onChange={handleChange}
            style={{width:'100%', background:'#1a1a2e', border:'1px solid rgba(127,90,240,0.3)', borderRadius:10, color:'#e2e8f0', padding:'10px 12px', fontSize:14, marginBottom:12, boxSizing:'border-box'}} />
          <div style={{display:'flex', gap:8}}>
            <button type="submit" style={{flex:1, padding:'10px', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', border:'none', borderRadius:10, color:'#fff', fontWeight:600, cursor:'pointer', fontSize:14}}>Guardar</button>
            <button type="button" onClick={() => setEdit(false)} style={{flex:1, padding:'10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#e2e8f0', cursor:'pointer', fontSize:14}}>Cancelar</button>
          </div>
          {error && <div style={{color:'#ff6b6b', marginTop:8, fontSize:13}}>{error}</div>}
        </form>
      ) : (
        <div style={{display:'flex', gap:8, marginBottom:20}}>
          {(() => {
            const cur = JSON.parse(localStorage.getItem('user'));
            const isOwn = cur?.id === profile.id;
            if (isOwn) return (
              <>
                <button onClick={() => setEdit(true)} style={{flex:1, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', fontWeight:600, cursor:'pointer', fontSize:14}}>Editar perfil</button>
                <button onClick={() => navigator.clipboard.writeText(window.location.origin + `/profile/${profile.id}`)} style={{flex:1, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', fontWeight:600, cursor:'pointer', fontSize:14}}>Compartir</button>
                <button style={{width:42, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', cursor:'pointer', fontSize:18}}>👤</button>
              </>
            );
            return (
              <>
                <button style={{flex:1, padding:'9px 0', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', border:'none', borderRadius:10, color:'#fff', fontWeight:600, cursor:'pointer', fontSize:14}}>Seguir</button>
                <button style={{flex:1, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', fontWeight:600, cursor:'pointer', fontSize:14}}>Mensaje</button>
              </>
            );
          })()}
        </div>
      )}

      {/* Highlights row */}
      <div style={{display:'flex', gap:16, overflowX:'auto', padding:'4px 0 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', scrollbarWidth:'none', marginBottom:2}}>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, cursor:'pointer'}}>
          <div style={{width:64, height:64, borderRadius:'50%', border:'1.5px dashed rgba(127,90,240,0.4)', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(127,90,240,0.06)'}}>
            <span style={{fontSize:28, color:'#7f5af0', lineHeight:1}}>+</span>
          </div>
          <span style={{fontSize:11, color:'#475569'}}>Nuevo</span>
        </div>
        {principios.slice(0, 5).map((p, i) => (
          <div key={i} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, cursor:'pointer'}}>
            <div style={{width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', padding:2}}>
              <div style={{width:'100%', height:'100%', borderRadius:'50%', background:'#0e0e1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22}}>
                {['💡','⚡','🔥','🧠','🌍'][i]}
              </div>
            </div>
            <span style={{fontSize:11, color:'#94a3b8', maxWidth:64, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{p.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:3}}>
        {[
          { key:'ideas', icon:'⊞' },
          { key:'debates', icon:'⚡' },
          { key:'top', icon:'★' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{flex:1, padding:'13px 0', background:'none', border:'none', borderBottom: activeTab === tab.key ? '2px solid #7f5af0' : '2px solid transparent', color: activeTab === tab.key ? '#e2e8f0' : '#475569', cursor:'pointer', fontSize:20, transition:'color 0.2s, border-color 0.2s'}}>
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {(() => {
        const items = activeTab === 'ideas' ? posts : activeTab === 'debates' ? debates : ideasPotentes;
        return (
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:3}}>
            {items.map(post => (
              <div key={post.id} style={{aspectRatio:'1', background:'rgba(127,90,240,0.07)', border:'1px solid rgba(127,90,240,0.1)', borderRadius:4, padding:'10px 8px', display:'flex', flexDirection:'column', justifyContent:'space-between', cursor:'pointer', overflow:'hidden'}}>
                <div style={{fontSize:11, color:'#cbd5e1', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', lineHeight:1.4}}>
                  {post.premise || post.content || post.title || '—'}
                </div>
                <div style={{display:'flex', gap:6, fontSize:10, color:'#64748b', marginTop:4}}>
                  <span>🔥{post.ignite_count||0}</span>
                  <span>⚡{post.challenge_count||0}</span>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div style={{gridColumn:'1/-1', textAlign:'center', padding:'48px 0', color:'#334155', fontSize:14}}>
                Nada aquí aún.
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default Profile;
