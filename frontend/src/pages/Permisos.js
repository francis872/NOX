import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Permisos({ userId }) {
  const [permisos, setPermisos] = useState([]);
  const [nuevoPermiso, setNuevoPermiso] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/settings/permissions/${userId}`)
      .then(res => {
        setPermisos(res.data || []);
        setLoading(false);
      });
  }, [userId]);

  const handleAdd = () => {
    if (!nuevoPermiso) return;
    axios.post(`/api/settings/permissions`, { user_id: userId, permission: nuevoPermiso })
      .then(res => setPermisos([...permisos, res.data]));
    setNuevoPermiso('');
  };

  const handleDelete = id => {
    axios.delete(`/api/settings/permissions/${id}`)
      .then(() => setPermisos(permisos.filter(p => p.id !== id)));
  };

  if (loading) return <div>Cargando permisos...</div>;

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Permisos</h2>
      <input value={nuevoPermiso} onChange={e => setNuevoPermiso(e.target.value)} placeholder="Nuevo permiso" />
      <button onClick={handleAdd}>Agregar</button>
      <ul>
        {permisos.map(p => (
          <li key={p.id}>{p.permission} <button onClick={() => handleDelete(p.id)}>Eliminar</button></li>
        ))}
      </ul>
    </div>
  );
}

export default Permisos;
