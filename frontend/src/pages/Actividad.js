import React, { useState } from 'react';

function Actividad() {
  const [actividad, setActividad] = useState([
    { id: 1, desc: 'Has seguido a UsuarioA', fecha: new Date() },
    { id: 2, desc: 'Has publicado un Reel', fecha: new Date() }
  ]);

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Actividad</h2>
      <ul>
        {actividad.map(act => (
          <li key={act.id}>
            {act.desc} <span style={{fontSize: 10, color: '#888'}}>{act.fecha.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Actividad;
