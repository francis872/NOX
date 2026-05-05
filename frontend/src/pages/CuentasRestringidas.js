import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RESTRICTED_KEY = (id) => 'nox_restricted_' + id;

export default function CuentasRestringidas() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [tab, setTab] = useState('list');
  const [restricted, setRestricted] = useState(() => { try { return JSON.parse(localStorage.getItem(RESTRICTED_KEY(user.id))) || []; } catch { return []; } });
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => { axios.get('/api/users').then(r => setAllUsers(r.data || [])).catch(() => {}); }, []);

  const save = (list) => { setRestricted(list); localStorage.setItem(RESTRICTED_KEY(user.id), JSON.stringify(list)); };
  const restrict = (u) => { if (!restricted.find(r => r.id === u.id)) save([...restricted, { id: u.id, username: u.username, avatar: u.avatar }]); };
  const unrestrict = (id) => save(restricted.filter(r => r.id !== id));

  const filtered = allUsers.filter(u => u.id !== user.id && u.username?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '20px 0 80px', background: '#0e0e1a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>&#8249;</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>Cuentas restringidas</h1>
      </div>

      <p style={{ padding: '16px 16px 0', fontSize: 13, color: '#475569', margin: 0 }}>Cuando restricion a alguien, sus comentarios solo son visibles para ellos. No veran cuando estes activo.</p>

      <div style={{ display: 'flex', margin: '16px 16px 0', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, gap: 4 }}>
        {[{ id: 'list', label: 'Restringidos (' + restricted.length + ')' }, { id: 'add', label: 'Restringir cuenta' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: 'none', background: tab === t.id ? 'rgba(127,90,240,0.25)' : 'none', color: tab === t.id ? '#7f5af0' : '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'list' && (
        <div style={{ padding: '12px 16px' }}>
          {restricted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#334155' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>&#128683;</div>
              <div style={{ fontSize: 15 }}>No has restringido ninguna cuenta</div>
            </div>
          ) : restricted.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                {r.avatar ? <img src={r.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : r.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, color: '#e2e8f0', fontWeight: 600 }}>@{r.username}</div>
              <button onClick={() => unrestrict(r.id)} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, color: '#e2e8f0', cursor: 'pointer', fontSize: 13 }}>Quitar restriccion</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'add' && (
        <div style={{ padding: '12px 16px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..." style={{ width: '100%', padding: '11px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          {filtered.map(u => {
            const isRestricted = !!restricted.find(r => r.id === u.id);
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
                  {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, color: '#e2e8f0', fontWeight: 600 }}>@{u.username}</div>
                <button onClick={() => isRestricted ? unrestrict(u.id) : restrict(u)} style={{ padding: '7px 14px', background: isRestricted ? 'rgba(127,90,240,0.15)' : 'rgba(239,68,68,0.1)', border: isRestricted ? '1px solid rgba(127,90,240,0.3)' : '1px solid rgba(239,68,68,0.25)', borderRadius: 10, color: isRestricted ? '#7f5af0' : '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {isRestricted ? 'Restringido' : 'Restringir'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
