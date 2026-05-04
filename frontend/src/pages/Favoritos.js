import React, { useEffect, useState } from 'react';
import axios from 'axios';

const KEY = 'nox_favorites';

function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 60000);
  if (d < 60) return d + ' min';
  if (d < 1440) return Math.floor(d/60) + ' h';
  return Math.floor(d/1440) + ' d';
}

export default function Favoritos() {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY + '_' + currentUser?.id)) || []; }
    catch { return []; }
  });
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('saved');

  useEffect(() => {
    setLoading(true);
    axios.get('/api/ideas').then(res => setIdeas(res.data || [])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const save   = (idea) => { const updated = [...saved, idea]; setSaved(updated); localStorage.setItem(KEY + '_' + currentUser?.id, JSON.stringify(updated)); };
  const unsave = (id)   => { const updated = saved.filter(f => f.id !== id); setSaved(updated); localStorage.setItem(KEY + '_' + currentUser?.id, JSON.stringify(updated)); };
  const isSaved = (id) => saved.some(f => f.id === id);

  const IdeaCard = ({ idea, showSave }) => (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px', transition:'border-color 0.2s' }}
      onMouseOver={e=>e.currentTarget.style.borderColor='rgba(127,90,240,0.3)'}
      onMouseOut ={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ fontSize:13, color:'#7f5af0', fontWeight:600 }}>@{idea.username || idea.author_id}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#334155' }}>{idea.created_at ? timeAgo(idea.created_at) : ''}</span>
          {showSave && !isSaved(idea.id) && (
            <button onClick={() => save(idea)} style={{ background:'rgba(127,90,240,0.12)', border:'1px solid rgba(127,90,240,0.3)', borderRadius:8, color:'#a78bfa', fontSize:11, padding:'3px 10px', cursor:'pointer', fontWeight:700 }}>Guardar</button>
          )}
          {isSaved(idea.id) && (
            <button onClick={() => unsave(idea.id)} style={{ background:'transparent', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#ef4444', fontSize:11, padding:'3px 10px', cursor:'pointer' }}>Quitar</button>
          )}
        </div>
      </div>
      <div style={{ fontSize:15, color:'#e2e8f0', lineHeight:1.5 }}>{idea.title}</div>
      {idea.argument && <div style={{ fontSize:13, color:'#64748b', marginTop:6, lineHeight:1.5 }}>{idea.argument?.substring(0,120)}{idea.argument?.length>120?'...':''}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'0 16px 80px' }}>
      <div style={{ padding:'24px 0 20px' }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Favoritos</h2>
        <p style={{ margin:'4px 0 0', fontSize:14, color:'#475569' }}>Ideas que guardaste para despues</p>
      </div>
      <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4, marginBottom:20 }}>
        {['saved','browse'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex:1, padding:'8px 0', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', background: tab===t ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : 'transparent', color: tab===t ? '#fff' : '#64748b' }}>
            {t === 'saved' ? '&#9733; Guardados (' + saved.length + ')' : 'Explorar ideas'}
          </button>
        ))}
      </div>
      {tab === 'saved' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {saved.length === 0 && <div style={{ textAlign:'center', padding:'60px 0' }}><div style={{ fontSize:36, marginBottom:12 }}>&#9733;</div><div style={{ color:'#475569' }}>Aun no tienes favoritos guardados.</div><div style={{ color:'#334155', fontSize:13, marginTop:6 }}>Explora ideas y guarda las que te interesen.</div></div>}
          {saved.map(idea => <IdeaCard key={idea.id} idea={idea} showSave={false} />)}
        </div>
      )}
      {tab === 'browse' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {loading && <div style={{ textAlign:'center', padding:'40px 0', color:'#334155' }}>Cargando ideas...</div>}
          {!loading && ideas.map(idea => <IdeaCard key={idea.id} idea={idea} showSave={true} />)}
        </div>
      )}
    </div>
  );
}