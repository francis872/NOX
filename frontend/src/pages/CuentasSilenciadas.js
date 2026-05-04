import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CuentasSilenciadas() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [silenciadas, setSilenciadas] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      axios.get(`/api/silenced/${user.id}`)
        .then(res => setSilenciadas(res.data))
        .catch(() => setError('Error al cargar silenciados'));
    }
  }, [user]);

  const agregar = async () => {
    if (!input) return;
    try {
      await axios.post(`/api/silenced/${user.id}`, { silenced_id: input });
      const res = await axios.get(`/api/silenced/${user.id}`);
      setSilenciadas(res.data);
      setInput('');
    } catch {
      setError('Error al silenciar usuario');
    }
  };

  const eliminar = async (silenced_id) => {
    try {
      await axios.delete(`/api/silenced/${user.id}/${silenced_id}`);
      setSilenciadas(silenciadas.filter(s => s.silenced_id !== silenced_id));
    } catch {
      setError('Error al eliminar silenciado');
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Cuentas silenciadas</h2>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="ID del usuario" />
      <button onClick={agregar}>Agregar</button>
      {error && <div style={{color:'red'}}>{error}</div>}
      <ul>
        {silenciadas.map(s => (
          <li key={s.id} style={{display:'flex',alignItems:'center',gap:8}}>
            {s.username}
            <button onClick={() => eliminar(s.silenced_id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CuentasSilenciadas;
