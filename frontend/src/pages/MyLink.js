// MyLink.js - Mensajería directa estilo DM
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyLinkMessages from '../components/DirectMessages';

const AVATAR_COLORS = ['#7f5af0','#2cb67d','#f72585','#4cc9f0','#f4a261'];

function Avatar({ name, size = 46 }) {
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div style={{width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${color},#1a1a2e)`, border:`2px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, color:'#fff', flexShrink:0, textTransform:'uppercase'}}>
      {name?.[0] || '?'}
    </div>
  );
}

export default function MyLinkPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [users, setUsers] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [search, setSearch] = useState('');
  const [presence, setPresence] = useState(null);

  useEffect(() => {
    axios.get('/api/users').then(res => {
      setUsers((res.data || []).filter(u => u.id !== user?.id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPeer?.id || !user?.id) return;
    const loadPresence = async () => {
      try {
        await axios.post('/api/users/heartbeat', { user_id: user.id });
        const res = await axios.get(`/api/users/presence?ids=${selectedPeer.id}`);
        setPresence((res.data || [])[0] || null);
      } catch {}
    };
    loadPresence();
    const timer = setInterval(loadPresence, 10000);
    return () => clearInterval(timer);
  }, [selectedPeer?.id, user?.id]);

  const lastSeen = (d) => {
    if (!d) return 'sin actividad reciente';
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins <= 1) return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `hace ${h} h`;
    return `el ${new Date(d).toLocaleDateString()}`;
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{display:'flex', height:'100vh', paddingLeft:60, background:'#0e0e1a', color:'#e2e8f0', overflow:'hidden'}}>

      {/* Left panel - conversations */}
      <div style={{width:340, borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0}}>
        {/* Header */}
        <div style={{padding:'20px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <Avatar name={user?.username} size={32} />
            <span style={{fontWeight:700, fontSize:17}}>{user?.username}</span>
          </div>
          <span style={{fontSize:22, cursor:'pointer', color:'#64748b'}}>✏️</span>
        </div>

        {/* Search */}
        <div style={{padding:'12px 16px'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#475569'}}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar"
              style={{width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'9px 12px 9px 36px', color:'#e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none'}}
            />
          </div>
        </div>

        {/* Conversations label */}
        <div style={{padding:'4px 16px 8px', fontSize:13, fontWeight:700, color:'#64748b'}}>Mensajes</div>

        {/* List */}
        <div style={{flex:1, overflowY:'auto', scrollbarWidth:'none'}}>
          {filtered.length === 0 && (
            <div style={{textAlign:'center', padding:'40px 16px', color:'#334155', fontSize:14}}>
              {search ? 'Sin resultados.' : 'Aún no hay conversaciones.'}
            </div>
          )}
          {filtered.map(u => (
            <div key={u.id} onClick={() => setSelectedPeer(u)}
              style={{display:'flex', alignItems:'center', gap:14, padding:'10px 16px', cursor:'pointer', background: selectedPeer?.id === u.id ? 'rgba(127,90,240,0.12)' : 'transparent', transition:'background 0.15s', borderRadius:8, margin:'0 4px'}}
              onMouseOver={e => { if (selectedPeer?.id !== u.id) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
              onMouseOut={e => { if (selectedPeer?.id !== u.id) e.currentTarget.style.background='transparent'; }}
            >
              <Avatar name={u.username} size={52} />
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:600, fontSize:15, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{u.username}</div>
                <div style={{fontSize:12, color:'#475569', marginTop:2}}>Toca para enviar mensaje</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {selectedPeer ? (
          <>
            {/* Chat header */}
            <div style={{padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:14}}>
              <Avatar name={selectedPeer.username} size={40} />
              <div>
                <div style={{fontWeight:700, fontSize:16}}>{selectedPeer.username}</div>
                <div style={{fontSize:12, color:'#475569'}}>
                  {presence?.online ? 'NOX · en línea' : `NOX · última vez ${lastSeen(presence?.last_active_at)}`}
                </div>
              </div>
            </div>
            <div style={{flex:1, overflow:'hidden'}}>
              <MyLinkMessages user={user} peer={selectedPeer} />
            </div>
          </>
        ) : (
          <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16}}>
            <div style={{width:80, height:80, borderRadius:'50%', border:'2px solid rgba(127,90,240,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32}}>
              💬
            </div>
            <div style={{fontWeight:700, fontSize:20, color:'#e2e8f0'}}>Tus mensajes</div>
            <div style={{fontSize:14, color:'#475569', textAlign:'center', maxWidth:260, lineHeight:1.6}}>
              Envía mensajes privados a otros usuarios de NOX.
            </div>
            <button style={{padding:'11px 28px', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', border:'none', borderRadius:12, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer'}}>
              Enviar mensaje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
