import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Insights() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [dashboard, setDashboard] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([
      axios.get('/api/insights/dashboard'),
      axios.get(`/api/insights/user/${user.id}`),
    ])
      .then(([globalRes, userRes]) => {
        setDashboard(globalRes.data || null);
        setUserData(userRes.data || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const k = dashboard?.kpis || {};
  const me = userData?.metrics || {};
  const topIdeas = userData?.top_ideas || [];

  const Stat = ({ label, value, color }) => (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'18px 14px', textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:12, color:'#475569', marginTop:5 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'0 16px 80px' }}>
      <div style={{ padding:'24px 0 20px' }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Insights</h2>
        <p style={{ margin:'4px 0 0', fontSize:14, color:'#475569' }}>Estadisticas de tu actividad en NOX</p>
      </div>

      {loading && <div style={{ textAlign:'center', padding:'40px 0', color:'#334155' }}>Cargando datos...</div>}

      {!loading && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
            <Stat label="DAU" value={k.dau || 0} color="#7f5af0" />
            <Stat label="WAU" value={k.wau || 0} color="#f72585" />
            <Stat label="MAU" value={k.mau || 0} color="#2cb67d" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            <Stat label="Activation 24h" value={`${k.activation_rate_24h || 0}%`} color="#7f5af0" />
            <Stat label="D1 Retention" value={`${k.d1_retention || 0}%`} color="#2cb67d" />
            <Stat label="DAU/MAU" value={`${k.dau_mau_ratio || 0}%`} color="#f72585" />
            <Stat label="Sesión prom. 7d" value={`${k.avg_session_minutes_7d || 0}m`} color="#94a3b8" />
          </div>

          <div style={{ background:'rgba(127,90,240,0.07)', border:'1px solid rgba(127,90,240,0.2)', borderRadius:16, padding:'16px 18px', marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#7f5af0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Tu actividad semanal</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
              <span style={{ fontSize:13, color:'#e2e8f0' }}>Interacciones significativas: <b>{me.meaningful_7d || 0}</b></span>
              <span style={{ fontSize:13, color:'#e2e8f0' }}>Sesiones: <b>{me.sessions_7d || 0}</b></span>
              <span style={{ fontSize:13, color:'#e2e8f0' }}>Minutos: <b>{me.minutes_7d || 0}</b></span>
              <span style={{ fontSize:13, color:'#2cb67d' }}>Segmento: <b>{me.segment || 'new'}</b></span>
            </div>
          </div>

          {topIdeas.length > 0 && (
            <div style={{ background:'rgba(127,90,240,0.07)', border:'1px solid rgba(127,90,240,0.2)', borderRadius:16, padding:'16px 18px', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#7f5af0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Top ideas</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {topIdeas.map((idea) => (
                  <div key={idea.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'10px 12px' }}>
                    <div style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:14, color:'#e2e8f0', marginRight:12 }}>{idea.premise}</div>
                    <span style={{ fontSize:13, color:'#f72585' }}>Score {idea.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topIdeas.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:42, marginBottom:12 }}>&#128202;</div>
              <div style={{ color:'#475569' }}>Publica y reacciona para desbloquear mas insights</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}