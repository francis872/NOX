import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Suscripciones() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [suscripciones, setSuscripciones] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      axios.get(`/api/subscriptions/${user.id}`)
        .then(res => setSuscripciones(res.data))
        .catch(() => setError('Error al cargar suscripciones'));
    }
  }, [user]);

  const agregar = async () => {
    if (!input) return;
    try {
      await axios.post(`/api/subscriptions/${user.id}`, { channel: input });
      const res = await axios.get(`/api/subscriptions/${user.id}`);
      setSuscripciones(res.data);
      setInput('');
    } catch {
      setError('Error al agregar suscripción');
    }
  };

  const eliminar = async (sub_id) => {
    try {
      await axios.delete(`/api/subscriptions/${user.id}/${sub_id}`);
      setSuscripciones(suscripciones.filter(s => s.id !== sub_id));
    } catch {
      setError('Error al eliminar suscripción');
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Suscripciones</h2>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Agregar canal" />
      <button onClick={agregar}>Agregar</button>
      {error && <div style={{color:'red'}}>{error}</div>}
      <ul>
        {suscripciones.map(s => (
          <li key={s.id} style={{display:'flex',alignItems:'center',gap:8}}>
            {s.channel}
            <button onClick={() => eliminar(s.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Suscripciones;
