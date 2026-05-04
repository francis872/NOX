import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Idioma({ userId }) {
  const [idioma, setIdioma] = useState('es');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/settings/language/${userId}`)
      .then(res => {
        if (res.data && res.data.language) setIdioma(res.data.language);
        setLoading(false);
      });
  }, [userId]);

  const handleChange = e => {
    setIdioma(e.target.value);
    axios.put(`/api/settings/language/${userId}`, { language: e.target.value });
  };

  if (loading) return <div>Cargando idioma...</div>;

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Idioma</h2>
      <select value={idioma} onChange={handleChange}>
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
      </select>
      <div style={{marginTop: 8}}>Idioma seleccionado: {idioma}</div>
    </div>
  );
}

export default Idioma;
