import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Accesibilidad({ userId }) {
  const [modo, setModo] = useState('normal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/settings/accessibility/${userId}`)
      .then(res => {
        if (res.data && res.data.mode) setModo(res.data.mode);
        setLoading(false);
      });
  }, [userId]);

  const handleChange = e => {
    const newMode = e.target.checked ? 'alto-contraste' : 'normal';
    setModo(newMode);
    axios.put(`/api/settings/accessibility/${userId}`, { mode: newMode });
  };

  if (loading) return <div>Cargando accesibilidad...</div>;

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Accesibilidad</h2>
      <label>
        <input type="checkbox" checked={modo === 'alto-contraste'} onChange={handleChange} />
        Modo alto contraste
      </label>
      <div style={{marginTop: 8}}>Modo actual: {modo}</div>
    </div>
  );
}

export default Accesibilidad;
