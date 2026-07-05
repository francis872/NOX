// MyLink.js - Bipper — Mensajeria directa NOX
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MyLinkMessages from '../components/DirectMessages';
import { MdOutlineEdit, MdOutlineSearch, MdOutlineForum } from 'react-icons/md';

const AVATAR_COLORS = ['#7f5af0','#2cb67d','#f72585','#4cc9f0','#f4a261'];

function Avatar({ name, size = 46, avatarUrl }) {
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return (
    <div style={{width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${color},#1a1a2e)`, border:`2px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, color:'#fff', flexShrink:0, textTransform:'uppercase', overflow:'hidden'}}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name || 'avatar'} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      ) : (name?.[0] || '?')}
    </div>
  );
}

export default function MyLinkPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [users, setUsers] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [search, setSearch] = useState('');
  const [presence, setPresence] = useState(null);
  const [dmRequests, setDmRequests] = useState([]);

  useEffect(() => {
    axios.get('/api/users').then(res => {
      setUsers((res.data || []).filter(u => u.id !== user?.id));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const loadRequests = async () => {
      try {
        const res = await axios.get(`/api/messages/requests/${user.id}`);
        setDmRequests(res.data || []);
      } catch {}
    };
    loadRequests();
    const timer = setInterval(loadRequests, 8000);
    return () => clearInterval(timer);
  }, [user?.id]);

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

  const respondDmRequest = async (id, action) => {
    try {
      await axios.post(`/api/messages/requests/${id}/respond`, { action });
      setDmRequests(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  return (
    <main className="page-shell">
      <div className="dm-grid">

        {/* Left panel - conversations */}
        <aside className="dm-sidebar">
        {/* Header */}
          <div style={{padding:'20px 16px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <Avatar name={user?.username} avatarUrl={user?.avatar_url} size={32} />
            <div>
              <div style={{fontWeight:800, fontSize:16, color:'#f8fafc'}}>Bipper</div>
              <div style={{fontSize:11, color:'#475569', letterSpacing:'0.06em'}}>@{user?.username}</div>
            </div>
          </div>
          <MdOutlineEdit size={20} style={{cursor:'pointer', color:'#64748b'}} />
        </div>

        {/* Search */}
        <div style={{padding:'12px 16px'}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#475569'}}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar en Bipper"
              style={{width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'9px 12px 9px 36px', color:'#e2e8f0', fontSize:14, boxSizing:'border-box', outline:'none'}}
            />
          </div>
        </div>

        {/* Conversations label */}
        <div style={{padding:'4px 16px 8px', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em'}}>Chats</div>

        {dmRequests.length > 0 && (
          <div style={{ padding:'0 12px 8px' }}>
            <div style={{ fontSize:12, color:'#a78bfa', fontWeight:700, margin:'2px 4px 8px' }}>Solicitudes ({dmRequests.length})</div>
            {dmRequests.slice(0, 3).map((r) => (
              <div key={r.id} style={{ background:'rgba(127,90,240,0.08)', border:'1px solid rgba(127,90,240,0.25)', borderRadius:10, padding:8, marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <Avatar name={r.username} avatarUrl={r.avatar_url} size={28} />
                  <div style={{ fontSize:12, color:'#cbd5e1', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    @{r.username} quiere enviarte DM
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => respondDmRequest(r.id, 'accepted')} style={{ flex:1, padding:'6px 8px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer' }}>Aceptar</button>
                  <button onClick={() => respondDmRequest(r.id, 'rejected')} style={{ flex:1, padding:'6px 8px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'transparent', color:'#cbd5e1', fontSize:11, fontWeight:700, cursor:'pointer' }}>Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        )}

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
              <Avatar name={u.username} avatarUrl={u.avatar_url} size={52} />
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:600, fontSize:15, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{u.username}</div>
                <div style={{fontSize:12, color:'#475569', marginTop:2}}>Bipper · toca para chatear</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Right panel */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {selectedPeer ? (
          <>
            {/* Chat header */}
            <div style={{padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:14}}>
              <Avatar name={selectedPeer.username} avatarUrl={selectedPeer.avatar_url} size={40} />
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
            <div style={{width:80, height:80, borderRadius:'50%', border:'2px solid rgba(34,197,94,0.4)', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(34,197,94,0.06)'}}>
              <MdOutlineForum size={34} style={{color:'#22c55e'}} />
            </div>
            <div style={{fontWeight:800, fontSize:20, color:'#e2e8f0'}}>Bipper</div>
            <div style={{fontSize:14, color:'#475569', textAlign:'center', maxWidth:260, lineHeight:1.6}}>
              Envia mensajes a personas que sigues. Para contactar a alguien nuevo, envia un BIP primero.
            </div>
            <button style={{padding:'11px 28px', background:'linear-gradient(135deg,#22c55e,#10b981)', border:'none', borderRadius:12, color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer'}}>
              Enviar BIP
            </button>
          </div>
        )}
      </div>
    </div>
  </main>
  );
}
