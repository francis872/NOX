import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UsoDatos({ userId }) {
  const [calidad, setCalidad] = useState('alta');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/settings/data-usage/${userId}`)
      .then(res => {
        if (res.data && res.data.quality) setCalidad(res.data.quality);
        setLoading(false);
      });
  }, [userId]);

  const handleChange = e => {
    setCalidad(e.target.value);
    axios.put(`/api/settings/data-usage/${userId}`, { quality: e.target.value });
  };

  if (loading) return <div>Cargando uso de datos...</div>;

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Uso de Datos</h2>
      <label>Calidad:
        <select value={calidad} onChange={handleChange}>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </label>
      <div style={{marginTop: 8}}>Calidad seleccionada: {calidad}</div>
    </div>
  );
}

export default UsoDatos;
