import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Admin() {
  const token = localStorage.getItem('token');
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get('/api/admin/metrics', { headers })
      .then(res => setMetrics(res.data))
      .catch(err => setError(err.response?.data?.error || 'Sin acceso admin'));
    axios.get('/api/admin/users', { headers })
      .then(res => setUsers(res.data))
      .catch(() => {});
  }, []);

  const banUser = async (id) => {
    await axios.post(`/api/admin/ban/${id}`, {}, { headers }).catch(() => {});
    setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: true } : u));
  };

  if (error) return <div style={{ maxWidth: 700, margin: '0 auto' }}><h2>Admin</h2><p className="error">{error}</p></div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h2>Panel de Administración</h2>
      {metrics && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(metrics).map(([key, val]) => (
            <div key={key} className="card" style={{ minWidth: 100, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#7fd7ff' }}>{val}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{key}</div>
            </div>
          ))}
        </div>
      )}
      <h3>Usuarios</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #2e2e4a', color: '#9ca3af' }}>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>ID</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Usuario</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Admin</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Estado</th>
            <th style={{ textAlign: 'left', padding: '6px 4px' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #1e1e30' }}>
              <td style={{ padding: '6px 4px' }}>{u.id}</td>
              <td style={{ padding: '6px 4px' }}>{u.username}</td>
              <td style={{ padding: '6px 4px' }}>{u.email}</td>
              <td style={{ padding: '6px 4px' }}>{u.is_admin ? '✓' : '-'}</td>
              <td style={{ padding: '6px 4px' }}>{u.banned ? <span style={{ color: '#ff6b6b' }}>Baneado</span> : <span style={{ color: '#2cb67d' }}>Activo</span>}</td>
              <td style={{ padding: '6px 4px' }}>
                {!u.banned && <button onClick={() => banUser(u.id)} style={{ background: '#3a1a1a', fontSize: 11, padding: '2px 8px' }}>Banear</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
