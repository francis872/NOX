import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Archivo() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const KEY = `nox_archived_${user.id}`;
  const [archived, setArchived] = useState(() => JSON.parse(localStorage.getItem(KEY) || '[]'));
  const [ideas, setIdeas] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`/api/ideas?author_id=${user.id}`).then(r => setIdeas(r.data || [])).catch(() => {});
  }, []); // eslint-disable-line

  const toggle = (id) => {
    const next = archived.includes(id) ? archived.filter(x => x !== id) : [...archived, id];
    setArchived(next); localStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 80px', minHeight: '100vh', background: '#0e0e1a', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <div><h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Archivo</h2><p style={{ margin: 0, fontSize: 12, color: '#475569' }}>Ideas archivadas solo son visibles para ti</p></div>
      </div>
      {archived.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}><div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>Ninguna idea archivada aún</div>}
      {ideas.filter(i => archived.includes(i.id)).map(idea => (
        <div key={idea.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 15, color: '#e2e8f0', marginBottom: 6 }}>{idea.premise || idea.title}</div>
          <button onClick={() => toggle(idea.id)} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Quitar del archivo</button>
        </div>
      ))}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 12 }}>Archivar una idea</div>
        {ideas.filter(i => !archived.includes(i.id)).map(idea => (
          <div key={idea.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>{idea.premise || idea.title}</div>
            <button onClick={() => toggle(idea.id)} style={{ padding: '6px 14px', background: 'rgba(127,90,240,0.1)', border: '1px solid rgba(127,90,240,0.25)', borderRadius: 20, color: '#7f5af0', fontSize: 12, cursor: 'pointer' }}>Archivar</button>
          </div>
        ))}
      </div>
    </div>
  );
}