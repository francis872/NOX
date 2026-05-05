import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PAGE = { background: '#0e0e1a', minHeight: '100vh', padding: '0 0 80px', fontFamily: 'inherit' };
const GRAD = 'linear-gradient(135deg,#7f5af0,#2cb67d)';

export default function MejoresAmigos() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const KEY = user ? `nox_best_friends_${user.id}` : 'nox_best_friends';
  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('friends'); // 'friends' | 'add'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users')
      .then(res => setAllUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveFriends = (list) => {
    setFriends(list);
    localStorage.setItem(KEY, JSON.stringify(list));
  };

  const addFriend = (u) => {
    if (friends.find(f => f.id === u.id)) return;
    saveFriends([...friends, { id: u.id, username: u.username }]);
  };

  const removeFriend = (id) => {
    saveFriends(friends.filter(f => f.id !== id));
  };

  const isFriend = (id) => friends.some(f => f.id === id);

  const friendIds = new Set(friends.map(f => f.id));
  const filteredUsers = allUsers.filter(u =>
    u.id !== user?.id &&
    !friendIds.has(u.id) &&
    (u.username || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredFriends = friends.filter(f =>
    (f.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabStyle = (t) => ({
    flex: 1, padding: '11px 0', background: 'none', border: 'none',
    borderBottom: tab === t ? '2px solid #7f5af0' : '2px solid transparent',
    color: tab === t ? '#e2e8f0' : '#475569', cursor: 'pointer',
    fontSize: 14, fontWeight: 700, transition: 'all 0.2s',
  });

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={{ padding: '60px 20px 16px', background: 'linear-gradient(180deg,rgba(127,90,240,0.08) 0%,transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>←</button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#e2e8f0' }}>💚 Mejores Amigos</h1>
        </div>
        <p style={{ margin: '4px 0 0 34px', fontSize: 13, color: '#475569' }}>
          Solo ellos ven tus historias exclusivas
        </p>
      </div>

      {/* Search */}
      <div style={{ padding: '16px 20px 0' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar usuario..."
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', margin: '16px 0 0' }}>
        <button style={tabStyle('friends')} onClick={() => setTab('friends')}>
          Mis amigos ({friends.length})
        </button>
        <button style={tabStyle('add')} onClick={() => setTab('add')}>
          + Agregar
        </button>
      </div>

      {/* List */}
      <div style={{ padding: '12px 20px' }}>
        {tab === 'friends' && (
          filteredFriends.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#334155', padding: '48px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💚</div>
              <div style={{ fontSize: 14 }}>Aún no has agregado mejores amigos</div>
              <button onClick={() => setTab('add')} style={{ marginTop: 14, background: GRAD, border: 'none', borderRadius: 10, color: '#fff', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Agregar ahora
              </button>
            </div>
          ) : filteredFriends.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', textTransform: 'uppercase', flexShrink: 0 }}>
                {f.username?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{f.username}</div>
                <div style={{ fontSize: 12, color: '#2cb67d' }}>Mejor amigo 💚</div>
              </div>
              <button onClick={() => removeFriend(f.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: 12, fontWeight: 700, padding: '6px 12px', cursor: 'pointer' }}>
                Quitar
              </button>
            </div>
          ))
        )}

        {tab === 'add' && (
          loading ? (
            <div style={{ textAlign: 'center', color: '#334155', padding: '48px 0' }}>Cargando usuarios...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#334155', padding: '48px 0', fontSize: 14 }}>
              {search ? 'No se encontraron usuarios' : 'No hay más usuarios para agregar'}
            </div>
          ) : filteredUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#475569,#334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', textTransform: 'uppercase', flexShrink: 0 }}>
                {u.username?.[0] || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{u.username}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>@{u.username}</div>
              </div>
              <button onClick={() => addFriend(u)} style={{ background: GRAD, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, padding: '7px 14px', cursor: 'pointer' }}>
                + Agregar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}