import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ACTION_ICONS = {
  login:         { icon: '🔑', color: '#7f5af0', label: 'Inicio de sesión' },
  logout:        { icon: '🚪', color: '#475569', label: 'Cierre de sesión' },
  follow:        { icon: '➕', color: '#2cb67d', label: 'Seguiste a alguien' },
  unfollow:      { icon: '➖', color: '#f59e0b', label: 'Dejaste de seguir' },
  post:          { icon: '✍️', color: '#7f5af0', label: 'Publicaste una idea' },
  react:         { icon: '🔥', color: '#f72585', label: 'Reaccionaste' },
  vibe:          { icon: '✨', color: '#4cc9f0', label: 'Publicaste un vibe' },
  message:       { icon: '💬', color: '#2cb67d', label: 'Enviaste un mensaje' },
  profile_edit:  { icon: '✏️', color: '#94a3b8', label: 'Editaste tu perfil' },
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)  return 'Ahora mismo';
  if (s < 3600) return `Hace ${Math.floor(s/60)} min`;
  if (s < 86400) return `Hace ${Math.floor(s/3600)} h`;
  if (s < 604800) return `Hace ${Math.floor(s/86400)} días`;
  return new Date(d).toLocaleDateString('es', { day:'numeric', month:'short' });
}

export default function Actividad() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`/api/activitylog/${user.id}`)
      .then(res => setLogs(res.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  // Group by day
  const groups = {};
  logs.forEach(log => {
    const d = new Date(log.created_at);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    let label;
    if (d.toDateString() === today.toDateString()) label = 'Hoy';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Ayer';
    else label = d.toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  });

  return (
    <div style={{ background: '#0e0e1a', minHeight: '100vh', padding: '0 0 80px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ padding: '60px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg,rgba(127,90,240,0.07) 0%,transparent 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'#7f5af0', fontSize:22, cursor:'pointer', padding:0 }}>←</button>
          <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:'#e2e8f0' }}>⚡ Actividad</h1>
        </div>
        <p style={{ margin:'6px 0 0 34px', fontSize:13, color:'#475569' }}>Tu historial de acciones en NOX</p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading && (
          <div style={{ textAlign:'center', color:'#334155', padding:'60px 0' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>⚡</div>
            Cargando actividad...
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div style={{ textAlign:'center', color:'#334155', padding:'60px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#475569', marginBottom:6 }}>Sin actividad</div>
            <div style={{ fontSize:13, color:'#334155' }}>Tus acciones aparecerán aquí</div>
          </div>
        )}

        {!loading && Object.entries(groups).map(([label, items]) => (
          <div key={label} style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#475569', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:10, paddingLeft:4 }}>
              {label}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {items.map(log => {
                const meta = ACTION_ICONS[log.action] || { icon:'📌', color:'#475569', label: log.action };
                return (
                  <div key={log.id} style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'12px 16px' }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:`${meta.color}22`, border:`1.5px solid ${meta.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                      {meta.icon}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, color:'#e2e8f0', fontSize:14 }}>{meta.label}</div>
                      {log.details && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{log.details}</div>}
                    </div>
                    <div style={{ fontSize:11, color:'#334155', whiteSpace:'nowrap' }}>{timeAgo(log.created_at)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}