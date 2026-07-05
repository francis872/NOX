import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { assignExperiment, convertExperiment } from '../utils/analytics';

const BANNER_PRESETS = [
  'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  'linear-gradient(135deg,#7f5af0,#2cb67d)',
  'linear-gradient(135deg,#f72585,#7209b7)',
  'linear-gradient(135deg,#0ea5e9,#0f766e)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#1e293b,#334155)',
];

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cur = JSON.parse(localStorage.getItem('user'));
  const avatarFileRef = useRef();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ bio: '', interests: '', age: '', origin: '', account_type: 'normal', avatar_url: '', banner: '' });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ideas');
  const [following, setFollowing] = useState(false);
  const [viewingVibe, setViewingVibe] = useState(null);
  const [messageCtaCopy, setMessageCtaCopy] = useState('Mensaje');

  useEffect(() => {
    axios.get(`/api/users/${id}`)
      .then(res => {
        setProfile(res.data);
        setForm({
          bio: res.data.bio || '',
          interests: (res.data.interests || []).join(', '),
          age: res.data.age || '',
          origin: res.data.origin || '',
          account_type: res.data.account_type || 'normal',
          avatar_url: res.data.avatar_url || '',
          banner: res.data.banner || '',
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

  useEffect(() => {
    const avatarFromCamera = location.state?.profileAvatarToAttach;
    if (!avatarFromCamera || String(cur?.id) !== String(id)) return;
    setForm((prev) => ({ ...prev, avatar_url: avatarFromCamera }));
    setProfile((prev) => ({ ...(prev || {}), avatar_url: avatarFromCamera }));
    axios.put(`/api/users/${id}`, { avatar_url: avatarFromCamera })
      .then((res) => {
        if (String(cur?.id) === String(id)) {
          const updatedUser = { ...cur, avatar_url: res.data.avatar_url || avatarFromCamera };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      })
      .catch(() => {});
    window.history.replaceState({}, '');
  }, [location.state, id, cur?.id]);

  useEffect(() => {
    assignExperiment('EXP-003').then((v) => {
      if (v === 'hablar_ahora') setMessageCtaCopy('Hablar ahora');
      else setMessageCtaCopy('Mensaje');
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3_000_000) { alert('Imagen demasiado grande (max 3 MB)'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, avatar_url: ev.target.result }));
    reader.readAsDataURL(file);
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
      setProfile(prev => ({ ...prev, ...res.data, banner: form.banner }));
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
    <div className="profile-shell" style={{paddingTop: 16, paddingLeft: 60, paddingRight: 16, paddingBottom: 48, color: '#e2e8f0'}}>

      {/* Banner */}
      <div style={{
        height: 120,
        borderRadius: 20,
        marginBottom: 16,
        background: profile.banner || (form.banner) || BANNER_PRESETS[0],
        position: 'relative',
        overflow: 'hidden',
      }}>
        {edit && (
          <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BANNER_PRESETS.map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setForm(f => ({ ...f, banner: preset }))}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: preset,
                  border: form.banner === preset ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="profile-header" style={{marginBottom: 20}}>
        <span style={{fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px'}}>
          {profile.username}
          {profile.verified && <span style={{color:'#7f5af0', marginLeft:6, fontSize:15}}>✓</span>}
        </span>
        {cur?.id === profile.id && (
          <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8, color: '#94a3b8', fontSize: 22, lineHeight: 1 }}>
            ☰
          </button>
        )}
      </div>

      {/* Avatar + stats */}
      <div className="profile-avatar-block" style={{marginBottom: 16}}>
        <div
          className="profile-avatar"
          onClick={() => edit && avatarFileRef.current?.click()}
          style={{ cursor: edit ? 'pointer' : 'default', position: 'relative' }}
        >
          {profile.avatar_url || form.avatar_url
            ? <img src={form.avatar_url || profile.avatar_url} alt="avatar" className="profile-avatar-image" />
            : (profile.username?.[0] || 'N')
          }
          {edit && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>📷</div>
          )}
        </div>
        <div className="profile-meta">
          <div className="profile-name-row">
            <span className="profile-name">{profile.username}</span>
            {profile.verified && <span className="profile-verified">✓</span>}
          </div>
          <div className="profile-stats">
            {[
              { val: profile.posts_count || posts.length || 0, label: 'Posts' },
              { val: profile.followers_count || 0, label: 'Seguidores' },
              { val: profile.following_count || 0, label: 'Siguiendo' },
            ].map(({ val, label }) => (
              <div key={label} className="profile-stat-item">
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="profile-bio" style={{marginBottom: 16}}>
        {profile.thought_level && <div className="profile-badge">Nivel: {profile.thought_level}</div>}
        {profile.bio && <p style={{marginTop: 10}}>{profile.bio}</p>}
        <div className="profile-bio-meta">
          {profile.origin && <span>📍 {profile.origin}</span>}
          {profile.account_type === 'privada' && <span className="profile-private-badge">Cuenta privada</span>}
        </div>
        {(profile.interests || []).length > 0 && (
          <div className="profile-tags">
            {(profile.interests || []).map((tag, i) => (
              <span key={i}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {edit ? (
        <form onSubmit={handleEdit} style={{marginBottom: 20}}>
          {/* Hidden file input for avatar — tapping the avatar circle above triggers this */}
          <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarFile} style={{display:'none'}} capture="user" />

          <div style={{display:'flex', gap:8, marginBottom:10, flexWrap:'wrap'}}>
            <button type="button" onClick={() => avatarFileRef.current?.click()} style={{flex:'1 1 140px', padding:'10px', background:'rgba(127,90,240,0.15)', border:'1px solid rgba(127,90,240,0.3)', borderRadius:12, color:'#c4b5fd', cursor:'pointer', fontSize:13, fontWeight:700, minHeight:44}}>
              📷 Cambiar foto
            </button>
            <button type="button" onClick={() => navigate('/camara', { state: { target: 'profile', profileId: id } })} style={{flex:'1 1 140px', padding:'10px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#e2e8f0', cursor:'pointer', fontSize:13, minHeight:44}}>
              📸 Tomar foto
            </button>
          </div>
          <textarea name="bio" placeholder="Biografía" value={form.bio} onChange={handleChange} rows={3}
            style={{width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(127,90,240,0.25)', borderRadius:14, color:'#e2e8f0', padding:'12px 14px', fontSize:16, resize:'vertical', marginBottom:10, boxSizing:'border-box', fontFamily:'inherit'}} />
          <input name="interests" placeholder="Intereses (separados por coma)" value={form.interests} onChange={handleChange}
            style={{width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(127,90,240,0.25)', borderRadius:14, color:'#e2e8f0', padding:'12px 14px', fontSize:16, marginBottom:10, boxSizing:'border-box'}} />
          <input name="origin" placeholder="Origen / Ciudad" value={form.origin} onChange={handleChange}
            style={{width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(127,90,240,0.25)', borderRadius:14, color:'#e2e8f0', padding:'12px 14px', fontSize:16, marginBottom:10, boxSizing:'border-box'}} />
          <select name="account_type" value={form.account_type} onChange={handleChange}
            style={{width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(127,90,240,0.25)', borderRadius:14, color:'#e2e8f0', padding:'12px 14px', fontSize:16, marginBottom:14, boxSizing:'border-box'}}>
            <option value="normal">Cuenta pública</option>
            <option value="privada">Cuenta privada</option>
          </select>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <button type="submit" style={{padding:'13px', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', border:'none', borderRadius:14, color:'#fff', fontWeight:700, cursor:'pointer', fontSize:15, minHeight:48}}>Guardar</button>
            <button type="button" onClick={() => setEdit(false)} style={{padding:'13px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, color:'#e2e8f0', cursor:'pointer', fontSize:15, minHeight:48}}>Cancelar</button>
          </div>
          {error && <div style={{color:'#ff6b6b', marginTop:10, fontSize:13}}>{error}</div>}
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
              <button
                onClick={() => {
                  convertExperiment('EXP-003', 'message_sent');
                  navigate('/mylink');
                }}
                style={{flex:1, padding:'9px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:10, color:'#e2e8f0', fontWeight:600, cursor:'pointer', fontSize:14}}
              >
                {messageCtaCopy}
              </button>
            </>
          )}
        </div>
      )}

      {/* Vibes highlights strip */}
      <div className="profile-highlights" style={{display:'flex', gap:14, overflowX:'auto', padding:'4px 0 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', scrollbarWidth:'none', marginBottom:4}}>
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
      <div className="profile-tabs" style={{display:'flex', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:3}}>
        {[
          { key:'ideas', label:'Publicaciones' },
          { key:'destacados', label:'Destacados' },
          { key:'vibes', label:'Historias' },
          { key:'top', label:'Top' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{flex:1, padding:'13px 0', background:'none', border:'none', borderBottom: activeTab === tab.key ? '2px solid #7f5af0' : '2px solid transparent', color: activeTab === tab.key ? '#e2e8f0' : '#475569', cursor:'pointer', fontSize:14, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', transition:'color 0.2s, border-color 0.2s'}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {(() => {
        const items = activeTab === 'ideas' ? posts : activeTab === 'destacados' ? destacados : activeTab === 'vibes' ? vibes : ideasPotentes;
        return (
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
            {items.map(item => {
              const hasMedia = item.media_url || item.media_type;
              const caption = item.premise || item.caption || item.title || 'Contenido NOX';
              return (
                <div key={item.id} style={{aspectRatio:'1', background:'rgba(127,90,240,0.07)', border:'1px solid rgba(127,90,240,0.1)', borderRadius:16, overflow:'hidden', cursor:'pointer', position:'relative', display:'flex', flexDirection:'column'}}>
                  {hasMedia ? (
                    item.media_url ? (
                      item.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                        ? <img src={item.media_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
                        : <video src={item.media_url} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} muted />
                    ) : item.media_type ? (
                      item.media_type === 'image' ? <div style={{width:'100%', height:'100%', background:`url(${item.media_data}) center/cover no-repeat`}} />
                        : <video src={item.media_data} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} muted />
                    ) : null
                  ) : (
                    <div style={{width:'100%', height:'100%', padding:'16px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                      <div style={{fontSize:12, color:'#cbd5e1', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:6, WebkitBoxOrient:'vertical', lineHeight:1.4}}>{caption}</div>
                    </div>
                  )}
                  <div style={{position:'absolute', left:12, right:12, bottom:12, color:'#fff', textShadow:'0 1px 8px rgba(0,0,0,0.55)', fontSize:12, fontWeight:700, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                    {caption}
                  </div>
                </div>
              );
            })}
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
