import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PreferenciasContenido() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [preferencias, setPreferencias] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      axios.get(`/api/preferences/${user.id}`)
        .then(res => setPreferencias(res.data))
        .catch(() => setError('Error al cargar preferencias'));
    }
  }, [user]);

  const agregar = async () => {
    if (!input) return;
    try {
      await axios.post(`/api/preferences/${user.id}`, { preference: input });
      const res = await axios.get(`/api/preferences/${user.id}`);
      setPreferencias(res.data);
      setInput('');
    } catch {
      setError('Error al agregar preferencia');
    }
  };

  const eliminar = async (pref_id) => {
    try {
      await axios.delete(`/api/preferences/${user.id}/${pref_id}`);
      setPreferencias(preferencias.filter(p => p.id !== pref_id));
    } catch {
      setError('Error al eliminar preferencia');
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Preferencias de contenido</h2>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Agregar preferencia" />
      <button onClick={agregar}>Agregar</button>
      {error && <div style={{color:'red'}}>{error}</div>}
      <ul>
        {preferencias.map(p => (
          <li key={p.id} style={{display:'flex',alignItems:'center',gap:8}}>
            {p.preference}
            <button onClick={() => eliminar(p.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PreferenciasContenido;
