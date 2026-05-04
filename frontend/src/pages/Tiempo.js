import React, { useState } from 'react';

function Tiempo() {
  const [tiempo, setTiempo] = useState(0);
  const [inicio, setInicio] = useState(null);

  const start = () => setInicio(Date.now());
  const stop = () => {
    if (inicio) setTiempo(tiempo + Math.floor((Date.now() - inicio) / 1000));
    setInicio(null);
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Administración del tiempo</h2>
      <div>Tiempo total en la app: {tiempo} segundos</div>
      <button onClick={start} disabled={!!inicio}>Iniciar sesión</button>
      <button onClick={stop} disabled={!inicio}>Detener sesión</button>
    </div>
  );
}

export default Tiempo;
