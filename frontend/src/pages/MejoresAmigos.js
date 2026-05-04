import React, { useState } from 'react';

function MejoresAmigos() {
  const [amigos, setAmigos] = useState([
    { id: 1, username: 'UsuarioA' },
    { id: 2, username: 'UsuarioB' }
  ]);

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Mejores amigos</h2>
      <ul>
        {amigos.map(a => (
          <li key={a.id}>{a.username}</li>
        ))}
      </ul>
    </div>
  );
}

export default MejoresAmigos;
