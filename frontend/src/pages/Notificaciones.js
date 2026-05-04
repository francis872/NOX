import React, { useState, useEffect } from 'react';
import axios from 'axios';

function timeLabel(date) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 60) return `${min || 1} min`;
  if (h < 24) return `${h} h`;
  return `${d} d`;
}

function groupNotifs(list) {
  const now = Date.now();
  const destacadas = [], ayer = [], semana = [], anteriores = [];
  list.forEach(n => {
    const diff = now - new Date(n.created_at).getTime();
    const h = diff / 3600000;
    if (!n.read && h < 6) destacadas.push(n);
    else if (h < 48) ayer.push(n);
    else if (h < 168) semana.push(n);
    else anteriores.push(n);
  });
  return { destacadas, ayer, semana, anteriores };
}

const AVATAR_COLORS = ['#7f5af0','#2cb67d','#f72585','#4cc9f0','#f4a261'];

function NotifItem({ n, onRead }) {
  const color = AVATAR_COLORS[n.id % AVATAR_COLORS.length];
  const icons = { follow:'👤', like:'🔥', comment:'💬', mention:'@', system:'🔔' };
  return (
    <div onClick={() => !n.read && onRead(n.id)}
      style={{display:'flex', alignItems:'center', gap:14, padding:'12px 16px', cursor: n.read ? 'default' : 'pointer', opacity: n.read ? 0.55 : 1, transition:'background 0.15s', borderRadius:8}}
      onMouseOver={e => { if (!n.read) e.currentTarget.style.background='rgba(127,90,240,0.07)'; }}
      onMouseOut={e => { e.currentTarget.style.background='transparent'; }}
    >
      {/* Avatar */}
      <div style={{position:'relative', flexShrink:0}}>
        <div style={{width:46, height:46, borderRadius:'50%', background:`linear-gradient(135deg,${color},#0e0e1a)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', border:`2px solid ${color}33`}}>
          {icons[n.type] || '🔔'}
        </div>
        {!n.read && (
          <div style={{position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%', background:'#7f5af0', border:'2px solid #0e0e1a'}} />
        )}
      </div>
      {/* Text */}
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:14, color:'#e2e8f0', lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {n.message || n.type}
        </div>
        <div style={{fontSize:12, color:'#475569', marginTop:2}}>{timeLabel(n.created_at)}</div>
      </div>
      {/* Action */}
      {n.type === 'follow' && !n.read && (
        <button style={{padding:'7px 16px', background:'linear-gradient(135deg,#7f5af0,#2cb67d)', border:'none', borderRadius:8, color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', flexShrink:0}}>
          Seguir
        </button>
      )}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{padding:'16px 16px 6px', fontSize:15, fontWeight:700, color:'#94a3b8', letterSpacing:'0.2px'}}>
      {title}
    </div>
  );
}

function Notificaciones() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`/api/notifications/${user.id}`)
      .then(res => setNotificaciones(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const marcarLeida = async (id) => {
    await axios.post(`/api/notifications/${id}/read`).catch(() => {});
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const { destacadas, ayer, semana, anteriores } = groupNotifs(notificaciones);

  return (
    <div style={{maxWidth: 600, margin: '0 auto', paddingLeft: 60, paddingTop: 12, paddingBottom: 48, color: '#e2e8f0'}}>
      {/* Header */}
      <div style={{padding:'8px 16px 16px', fontSize:22, fontWeight:700, letterSpacing:'-0.5px'}}>
        Notificaciones
      </div>

      {loading && (
        <div style={{textAlign:'center', padding:'40px 0', color:'#475569'}}>Cargando...</div>
      )}

      {!loading && notificaciones.length === 0 && (
        <div style={{textAlign:'center', padding:'60px 20px'}}>
          <div style={{fontSize:48, marginBottom:16}}>🔔</div>
          <div style={{fontSize:16, fontWeight:600, color:'#e2e8f0', marginBottom:8}}>Sin notificaciones</div>
          <div style={{fontSize:14, color:'#475569'}}>Cuando alguien interactúe con tus ideas, aparecerá aquí.</div>
        </div>
      )}

      {destacadas.length > 0 && (
        <>
          <SectionHeader title="Destacadas" />
          {destacadas.map(n => <NotifItem key={n.id} n={n} onRead={marcarLeida} />)}
        </>
      )}
      {ayer.length > 0 && (
        <>
          <SectionHeader title="Ayer" />
          {ayer.map(n => <NotifItem key={n.id} n={n} onRead={marcarLeida} />)}
        </>
      )}
      {semana.length > 0 && (
        <>
          <SectionHeader title="Últimos 7 días" />
          {semana.map(n => <NotifItem key={n.id} n={n} onRead={marcarLeida} />)}
        </>
      )}
      {anteriores.length > 0 && (
        <>
          <SectionHeader title="Anteriores" />
          {anteriores.map(n => <NotifItem key={n.id} n={n} onRead={marcarLeida} />)}
        </>
      )}
    </div>
  );
}

export default Notificaciones;
