import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Bloqueos() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [bloqueados, setBloqueados] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      axios.get(`/api/blocks/${user.id}`)
        .then(res => setBloqueados(res.data))
        .catch(() => setError('Error al cargar bloqueos'));
    }
  }, [user]);

  const agregarBloqueo = async () => {
    if (!blockId) return;
    try {
      await axios.post(`/api/blocks/${user.id}`, { blocked_id: blockId });
      const res = await axios.get(`/api/blocks/${user.id}`);
      setBloqueados(res.data);
      setBlockId('');
    } catch {
      setError('Error al bloquear usuario');
    }
  };

  const eliminarBloqueo = async (blocked_id) => {
    try {
      await axios.delete(`/api/blocks/${user.id}/${blocked_id}`);
      setBloqueados(bloqueados.filter(b => b.blocked_id !== blocked_id));
    } catch {
      setError('Error al eliminar bloqueo');
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Cuentas bloqueadas</h2>
      <div style={{marginBottom: 16}}>
        <input value={blockId} onChange={e => setBlockId(e.target.value)} placeholder="ID del usuario" />
        <button onClick={agregarBloqueo}>Bloquear usuario</button>
      </div>
      {error && <div style={{color:'red'}}>{error}</div>}
      <ul>
        {bloqueados.map(b => (
          <li key={b.id} style={{display:'flex',alignItems:'center',gap:8}}>
            {b.username}
            <button onClick={() => eliminarBloqueo(b.blocked_id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Bloqueos;
