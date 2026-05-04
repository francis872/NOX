import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Notificaciones</h2>
      {loading && <p>Cargando...</p>}
      {!loading && notificaciones.length === 0 && <p style={{color:'#888'}}>Sin notificaciones.</p>}
      <ul style={{listStyle:'none', padding:0}}>
        {notificaciones.map(n => (
          <li key={n.id} className="card" style={{opacity: n.read ? 0.5 : 1}}>
            <span>{n.message || n.type}</span>
            <span style={{fontSize:10, color:'#888', marginLeft:8}}>{new Date(n.created_at).toLocaleString()}</span>
            {!n.read && <button onClick={() => marcarLeida(n.id)} style={{marginLeft:8,fontSize:11,padding:'2px 8px'}}>Marcar leída</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notificaciones;
