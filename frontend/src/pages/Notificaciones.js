import React, { useState } from 'react';

function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([
    { id: 1, desc: 'UsuarioB te ha seguido', fecha: new Date() },
    { id: 2, desc: 'UsuarioC comentó tu publicación', fecha: new Date() }
  ]);

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Notificaciones</h2>
      <ul>
        {notificaciones.map(n => (
          <li key={n.id}>
            {n.desc} <span style={{fontSize: 10, color: '#888'}}>{n.fecha.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notificaciones;
