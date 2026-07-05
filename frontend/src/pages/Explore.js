import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { assignExperiment, convertExperiment } from '../utils/analytics';

const AVATAR_COLORS = ['#7f5af0','#2cb67d','#f72585','#4cc9f0','#f4a261'];
function avatarColor(n){ return AVATAR_COLORS[(n?.charCodeAt(0)||0) % AVATAR_COLORS.length]; }

function UserCard({ u, onFollow, onUnfollow }) {
  const color = avatarColor(u.username);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    if (u.followed) await onUnfollow(u.id); else await onFollow(u.id);
    setBusy(false);
  };
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px 18px', display:'flex', alignItems:'center', gap:14, transition:'border-color 0.2s' }}
      onMouseOver={e=>e.currentTarget.style.borderColor='rgba(127,90,240,0.35)'}
      onMouseOut ={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
      <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,'+color+',#1a1a2e)', border:'2px solid '+color+'55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', textTransform:'uppercase', flexShrink:0 }}>
        {u.username?.[0] || '?'}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:15, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.username}</div>
        <div style={{ fontSize:12, color:'#475569', marginTop:2 }}>{u.followers_count > 0 ? u.followers_count + ' seguidores' : 'Nuevo en NOX'}</div>
        {u.bio && <div style={{ fontSize:12, color:'#64748b', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.bio}</div>}
      </div>
      <button onClick={toggle} disabled={busy}
        style={{ padding:'8px 18px', border: u.followed ? '1px solid rgba(127,90,240,0.5)' : 'none', borderRadius:20, background: u.followed ? 'transparent' : 'linear-gradient(135deg,#7f5af0,#2cb67d)', color: u.followed ? '#7f5af0' : '#fff', fontWeight:700, fontSize:13, cursor: busy ? 'default' : 'pointer', flexShrink:0, opacity: busy ? 0.6 : 1 }}>
        {busy ? '...' : u.followed ? 'Siguiendo' : 'Seguir'}
      </button>
    </div>
  );
}

export default function Explore() {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [users, setUsers]     = useState([]);
  const [ideas, setIdeas]     = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('personas');
  const [orderVariant, setOrderVariant] = useState('control_tendencias');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get('/api/users?follower_id=' + (currentUser?.id || 0)),
      axios.get('/api/ideas'),
    ])
      .then(([usersRes, ideasRes]) => {
        setUsers((usersRes.data || []).filter(u => u.id !== currentUser?.id));
        setIdeas(ideasRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    assignExperiment('EXP-002').then((v) => {
      if (!v) return;
      setOrderVariant(v);
      if (v === 'personas_first') setTab('personas');
      if (v === 'control_tendencias') setTab('tendencias');
    });
  }, []);

  const follow   = async id => { await axios.post('/api/follow/'+id+'/follow',   { follower_id: currentUser.id }).catch(()=>{}); setUsers(p=>p.map(u=>u.id===id?{...u,followed:true}:u)); convertExperiment('EXP-002', 'follow_created'); };
  const unfollow = async id => { await axios.post('/api/follow/'+id+'/unfollow', { follower_id: currentUser.id }).catch(()=>{}); setUsers(p=>p.map(u=>u.id===id?{...u,followed:false}:u)); };
  const filtered = users.filter(u => !search || u.username?.toLowerCase().includes(search.toLowerCase()));
  const trending = [...ideas]
    .sort((a,b) => ((b.ignite_count||0)+(b.expand_count||0)+(b.challenge_count||0)) - ((a.ignite_count||0)+(a.expand_count||0)+(a.challenge_count||0)))
    .slice(0, 10);

  const tabs = orderVariant === 'personas_first'
    ? ['personas', 'tendencias', 'ideas']
    : ['tendencias', 'personas', 'ideas'];

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'0 16px 80px' }}>
      <div style={{ padding:'24px 0 20px' }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Descubrir</h2>
        <p style={{ margin:'4px 0 0', fontSize:14, color:'#475569' }}>Conecta en tiempo real con creadores, historias y nuevas cuentas.</p>
      </div>
      <div style={{ position:'relative', marginBottom:20 }}>
        <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#475569' }}>&#128269;</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por usuario..."
          style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'11px 14px 11px 40px', color:'#e2e8f0', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }} />
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding:'8px 14px',
              borderRadius:16,
              border: tab === t ? '1px solid rgba(127,90,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
              background: tab === t ? 'rgba(127,90,240,0.15)' : 'rgba(255,255,255,0.03)',
              color: tab === t ? '#e2e8f0' : '#94a3b8',
              cursor:'pointer',
              textTransform:'capitalize',
              fontWeight:700,
              fontSize:12,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {loading && <div style={{ textAlign:'center', padding:'40px 0', color:'#334155' }}>Cargando usuarios...</div>}
      {!loading && tab === 'personas' && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 0' }}>
          <div style={{ fontSize:42, marginBottom:12 }}>&#128270;</div>
          <div style={{ color:'#475569', fontSize:15 }}>{search ? 'Sin resultados' : 'No hay usuarios todavia'}</div>
        </div>
      )}
      {tab === 'personas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(u => <UserCard key={u.id} u={u} onFollow={follow} onUnfollow={unfollow} />)}
        </div>
      )}
      {tab === 'tendencias' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {trending.map((idea) => (
            <div key={idea.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 14px' }}>
              <div style={{ fontSize:14, color:'#e2e8f0', marginBottom:6 }}>{idea.premise}</div>
              <div style={{ fontSize:12, color:'#64748b' }}>🔥{idea.ignite_count||0} · 🧠{idea.expand_count||0} · ⚡{idea.challenge_count||0}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'ideas' && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {ideas.slice(0, 20).map((idea) => (
            <div key={idea.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 14px' }}>
              <div style={{ fontSize:14, color:'#e2e8f0', marginBottom:6 }}>{idea.premise}</div>
              {idea.argument && <div style={{ fontSize:12, color:'#94a3b8' }}>{idea.argument}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}