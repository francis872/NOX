import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Insights() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [ideas, setIdeas]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    axios.get('/api/ideas?author_id=' + user.id)
      .then(res => setIdeas(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const totalIdeas  = ideas.length;
  const totalLikes  = ideas.reduce((a,b) => a + (b.like_count || 0), 0);
  const totalComments = ideas.reduce((a,b) => a + (b.comment_count || 0), 0);
  const topIdea     = ideas.sort((a,b) => (b.like_count||0) - (a.like_count||0))[0];

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
            <Stat label="Ideas publicadas" value={totalIdeas}   color="#7f5af0" />
            <Stat label="Likes recibidos"  value={totalLikes}   color="#f72585" />
            <Stat label="Comentarios"      value={totalComments} color="#2cb67d" />
          </div>

          {topIdea && (
            <div style={{ background:'rgba(127,90,240,0.07)', border:'1px solid rgba(127,90,240,0.2)', borderRadius:16, padding:'16px 18px', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#7f5af0', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Tu idea mas popular</div>
              <div style={{ fontSize:15, color:'#e2e8f0', fontWeight:600, marginBottom:8 }}>{topIdea.title}</div>
              <div style={{ display:'flex', gap:16 }}>
                <span style={{ fontSize:13, color:'#f72585' }}>{topIdea.like_count || 0} likes</span>
                <span style={{ fontSize:13, color:'#2cb67d' }}>{topIdea.comment_count || 0} comentarios</span>
              </div>
            </div>
          )}

          {ideas.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:42, marginBottom:12 }}>&#128202;</div>
              <div style={{ color:'#475569' }}>Publica tu primera idea para ver estadisticas</div>
            </div>
          )}

          {ideas.length > 0 && (
            <>
              <div style={{ fontSize:14, fontWeight:700, color:'#94a3b8', marginBottom:10 }}>Todas tus ideas</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {ideas.map(idea => (
                  <div key={idea.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:14, color:'#e2e8f0', marginRight:12 }}>{idea.title}</div>
                    <div style={{ display:'flex', gap:12, flexShrink:0 }}>
                      <span style={{ fontSize:13, color:'#f72585' }}>&#10084; {idea.like_count || 0}</span>
                      <span style={{ fontSize:13, color:'#2cb67d' }}>&#128172; {idea.comment_count || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}