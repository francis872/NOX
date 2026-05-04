// Actions.js — Tweet-like micro-posts strip
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const MAX = 280;

export default function Actions({ user }) {
  const [actions, setActions] = useState([]);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    axios.get('/api/actions')
      .then(res => { if (Array.isArray(res.data)) setActions(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true); setError('');
    try {
      const res = await axios.post('/api/actions', { author_id: user.id, content: text.trim() });
      setActions(prev => [res.data, ...prev]);
      setText(''); setShowForm(false);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al publicar');
    } finally { setPosting(false); }
  };

  const like = async (id) => {
    await axios.post(`/api/actions/${id}/like`).catch(() => {});
    setActions(prev => prev.map(a => a.id === id ? { ...a, like_count: (a.like_count || 0) + 1 } : a));
  };

  const repost = async (id) => {
    await axios.post(`/api/actions/${id}/repost`).catch(() => {});
    setActions(prev => prev.map(a => a.id === id ? { ...a, repost_count: (a.repost_count || 0) + 1 } : a));
  };

  const del = async (id) => {
    if (!window.confirm('¿Eliminar este action?')) return;
    await axios.delete(`/api/actions/${id}`, { data: { author_id: user?.id } }).catch(() => {});
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const remaining = MAX - text.length;
  const ringColor = remaining < 20 ? '#ef4444' : remaining < 60 ? '#f59e0b' : '#2cb67d';

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: '#7f5af0', fontWeight: 700, fontSize: 15 }}>⚡ Actions</span>
        {user && (
          <button
            onClick={() => setShowForm(f => !f)}
            style={{
              background: showForm ? 'rgba(127,90,240,0.2)' : 'linear-gradient(135deg,#7f5af0,#2cb67d)',
              border: 'none', borderRadius: 20, padding: '6px 16px',
              color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}
          >
            {showForm ? '✕ Cerrar' : '+ Nuevo Action'}
          </button>
        )}
      </div>

      {/* Compose box */}
      {showForm && user && (
        <div style={{
          background: 'rgba(19,19,31,0.9)', border: '1px solid rgba(127,90,240,0.3)',
          borderRadius: 14, padding: '14px 16px', marginBottom: 14,
        }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={MAX}
            rows={3}
            placeholder="¿Qué estás pensando? (máx 280 caracteres)"
            style={{
              width: '100%', background: 'transparent', border: 'none', resize: 'none',
              color: '#e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Ring counter */}
              <svg width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle cx="14" cy="14" r="11" fill="none" stroke={ringColor} strokeWidth="3"
                  strokeDasharray={`${(text.length / MAX) * 69.1} 69.1`}
                  strokeLinecap="round"
                  transform="rotate(-90 14 14)"
                  style={{ transition: 'stroke-dasharray 0.1s, stroke 0.2s' }} />
              </svg>
              <span style={{ color: remaining < 20 ? '#ef4444' : '#64748b', fontSize: 11 }}>
                {remaining < 50 ? remaining : ''}
              </span>
            </div>
            {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
            <button
              onClick={post}
              disabled={!text.trim() || posting || text.length > MAX}
              style={{
                background: text.trim() && !posting ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : '#334155',
                border: 'none', borderRadius: 20, padding: '8px 20px',
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: text.trim() && !posting ? 'pointer' : 'not-allowed',
              }}
            >
              {posting ? '⏳' : 'Publicar'}
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#334155', fontSize: 13, padding: '16px 0' }}>
            Sé el primero en publicar un Action
          </div>
        )}
        {actions.map(action => (
          <div key={action.id} style={{
            background: 'rgba(19,19,31,0.85)', border: '1px solid rgba(127,90,240,0.15)',
            borderRadius: 12, padding: '12px 14px',
          }}>
            {/* Author + time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#7f5af0', fontWeight: 700, fontSize: 13 }}>@{action.username}</span>
              <span style={{ color: '#475569', fontSize: 10 }}>
                {new Date(action.created_at).toLocaleString()}
              </span>
            </div>
            {/* Content */}
            <p style={{ color: '#e2e8f0', fontSize: 14, margin: '0 0 10px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {action.content}
            </p>
            {/* Actions row */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={() => like(action.id)} style={{
                background: 'rgba(247,37,133,0.1)', border: '1px solid rgba(247,37,133,0.2)',
                borderRadius: 8, color: '#f72585', padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>
                ❤️ {action.like_count || 0}
              </button>
              <button onClick={() => repost(action.id)} style={{
                background: 'rgba(44,182,125,0.1)', border: '1px solid rgba(44,182,125,0.2)',
                borderRadius: 8, color: '#2cb67d', padding: '4px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>
                🔁 {action.repost_count || 0}
              </button>
              {user && action.author_id === user.id && (
                <button onClick={() => del(action.id)} style={{
                  marginLeft: 'auto', background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                  color: '#ef4444', padding: '4px 8px', cursor: 'pointer', fontSize: 12,
                }}>🗑</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
