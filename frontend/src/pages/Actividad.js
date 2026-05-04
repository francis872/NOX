import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Actividad() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`/api/activitylog/${user.id}`)
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Actividad</h2>
      {loading && <p>Cargando...</p>}
      {!loading && logs.length === 0 && <p style={{color:'#888'}}>Sin actividad registrada.</p>}
      <ul style={{listStyle:'none', padding:0}}>
        {logs.map(log => (
          <li key={log.id} className="card">
            <strong>{log.action}</strong>
            <span style={{fontSize:10, color:'#888', marginLeft:8}}>{new Date(log.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Actividad;
