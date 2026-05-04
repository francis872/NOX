import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function Profile() {
  const { id } = useParams();
  const cur = JSON.parse(localStorage.getItem('user'));
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ bio: '', interests: '', age: '', origin: '', account_type: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ideas');
  const [following, setFollowing] = useState(false);
  const [viewingVibe, setViewingVibe] = useState(null);

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
    axios.get(`/api/vibes/user/${id}`)
      .then(res => setVibes(res.data))
      .catch(() => {});
    // Check if current user follows this profile
    if (cur?.id && cur.id !== Number(id)) {
      axios.get(`/api/users?follower_id=${cur.id}`)
        .then(res => {
          const target = res.data.find(u => u.id === Number(id));
          if (target) setFollowing(!!target.followed);
        })
        .catch(() => {});
    }
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
        interests: form.interests.split(',').map(i => i.trim()).filter(Boolean),
      };
      const res = await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(prev => ({ ...prev, ...res.data }));
      setEdit(false);
    } catch (err) {
      setError('Error al actualizar el perfil');
    }
  };

  const handleFollow = async () => {
    if (!cur?.id) return;
    try {
      if (following) {
        await axios.post(`/api/follow/${id}/unfollow`, { follower_id: cur.id });
        setFollowing(false);
        setProfile(prev => ({ ...prev, followers_count: (prev.followers_count || 1) - 1 }));
      } else {
        await axios.post(`/api/follow/${id}/follow`, { follower_id: cur.id });
        setFollowing(true);
        setProfile(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
      }
    } catch (err) {
      setError('Error al seguir/dejar de seguir');
    }
  };

  if (!profile) return <div>Cargando...</div>;

  // Ideas más potentes: top 3 ideas con más encendidos
  const ideasPotentes = [...posts]
    .sort((a, b) => (b.ignite_count || 0) - (a.ignite_count || 0))
    .slice(0, 3);
  // Historial de debates: ideas con más desafíos
  const debates = [...posts]
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
          {cur?.id === profile.id ? (
            <>
              <button onClick={() => setEdit(true)} style={{flex:1, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', fontWeight:600, cursor:'pointer', fontSize:14}}>Editar perfil</button>
              <button onClick={() => navigator.clipboard.writeText(window.location.origin + `/profile/${profile.id}`)} style={{flex:1, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', fontWeight:600, cursor:'pointer', fontSize:14}}>Compartir</button>
            </>
          ) : (
            <>
              <button
                onClick={handleFollow}
                style={{flex:1, padding:'9px 0', background: following ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: following ? '1px solid rgba(255,255,255,0.13)' : 'none', borderRadius:10, color:'#fff', fontWeight:600, cursor:'pointer', fontSize:14}}
              >
                {following ? 'Siguiendo ✓' : 'Seguir'}
              </button>
              <button style={{flex:1, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', fontWeight:600, cursor:'pointer', fontSize:14}}>Mensaje</button>
            </>
          )}
        </div>
      )}

      {/* Vibes highlights strip */}
      <div style={{display:'flex', gap:14, overflowX:'auto', padding:'4px 0 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', scrollbarWidth:'none', marginBottom:4}}>
        {/* Add vibe (own profile only) */}
        {cur?.id === profile.id && (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, cursor:'pointer'}} onClick={() => window.location.href='/camara'}>
            <div style={{width:62, height:62, borderRadius:'50%', border:'2px dashed rgba(127,90,240,0.4)', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(127,90,240,0.06)'}}>
              <span style={{fontSize:26, color:'#7f5af0', lineHeight:1}}>+</span>
            </div>
            <span style={{fontSize:10, color:'#475569'}}>Nuevo</span>
          </div>
        )}
        {/* User's vibes */}
        {vibes.map(vibe => (
          <div key={vibe.id} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0, cursor:'pointer'}} onClick={() => setViewingVibe(vibe)}>
            <div style={{width:62, height:62, borderRadius:'50%', padding:2, background:'linear-gradient(135deg,#7f5af0,#2cb67d,#f72585)'}}>
              <div style={{
                width:'100%', height:'100%', borderRadius:'50%', border:'2px solid #0e0e1a',
                background: vibe.media_type === 'image' && vibe.media_data ? `url(${vibe.media_data}) center/cover` : 'linear-gradient(135deg,#7f5af0,#2cb67d)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:700,
              }}>
                {!(vibe.media_type === 'image' && vibe.media_data) && (profile.username?.[0] || '?')}
              </div>
            </div>
            <span style={{fontSize:10, color:'#64748b', maxWidth:62, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {vibe.caption || 'Vibe'}
            </span>
          </div>
        ))}
        {vibes.length === 0 && cur?.id !== profile.id && (
          <div style={{color:'#334155', fontSize:12, padding:'18px 0'}}>Sin Vibes activos</div>
        )}
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
              <div key={post.id} style={{aspectRatio:'1', background:'rgba(127,90,240,0.07)', border:'1px solid rgba(127,90,240,0.1)', borderRadius:4, overflow:'hidden', cursor:'pointer', position:'relative'}}>
                {post.media_url
                  ? (post.media_url.startsWith('data:image') || post.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? <img src={post.media_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                    : <video src={post.media_url} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} muted />
                  )
                  : (
                    <div style={{width:'100%', height:'100%', padding:'10px 8px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                      <div style={{fontSize:11, color:'#cbd5e1', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', lineHeight:1.4}}>
                        {post.premise || '—'}
                      </div>
                      <div style={{display:'flex', gap:6, fontSize:10, color:'#64748b', marginTop:4}}>
                        <span>🔥{post.ignite_count||0}</span>
                        <span>⚡{post.challenge_count||0}</span>
                      </div>
                    </div>
                  )
                }
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

      {/* Vibe full-screen viewer */}
      {viewingVibe && (
        <div onClick={() => setViewingVibe(null)} style={{position:'fixed', inset:0, zIndex:9500, background:'#000', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <button onClick={() => setViewingVibe(null)} style={{position:'absolute', top:18, right:18, background:'none', border:'none', color:'#fff', fontSize:28, cursor:'pointer', zIndex:1}}>✕</button>
          <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'rgba(255,255,255,0.15)'}}>
            <div style={{height:'100%', background:'#7f5af0', animation:'vibeProgress 5s linear forwards'}} />
          </div>
          <div style={{position:'absolute', top:22, left:16, display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', textTransform:'uppercase'}}>
              {profile.username?.[0]}
            </div>
            <div>
              <div style={{color:'#fff', fontWeight:700, fontSize:14}}>{profile.username}</div>
              <div style={{color:'rgba(255,255,255,0.5)', fontSize:11}}>Vibe · expira pronto</div>
            </div>
          </div>
          <div style={{maxWidth:480, width:'100%', padding:'0 16px'}} onClick={e => e.stopPropagation()}>
            {viewingVibe.media_type === 'image' && viewingVibe.media_data
              ? <img src={viewingVibe.media_data} alt="" style={{maxWidth:'100%', maxHeight:'80vh', borderRadius:12, objectFit:'contain'}} />
              : viewingVibe.media_type === 'video' && viewingVibe.media_data
                ? <video src={viewingVibe.media_data} controls autoPlay style={{maxWidth:'100%', maxHeight:'80vh', borderRadius:12}} />
                : <div style={{minHeight:260, background:'linear-gradient(135deg,#7f5af0,#2cb67d)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', padding:32}}>
                    <p style={{fontSize:22, fontWeight:700, color:'#fff', textAlign:'center'}}>{viewingVibe.caption || '✨'}</p>
                  </div>
            }
            {viewingVibe.caption && <div style={{position:'absolute', bottom:28, left:0, right:0, textAlign:'center', color:'#fff', fontSize:15, padding:'0 24px', textShadow:'0 1px 6px rgba(0,0,0,0.8)'}}>{viewingVibe.caption}</div>}
          </div>
          <style>{`@keyframes vibeProgress{from{width:0}to{width:100%}}`}</style>
        </div>
      )}
    </div>
  );
}

export default Profile;
