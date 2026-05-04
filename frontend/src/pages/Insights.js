import React, { useState } from 'react';

function Insights() {
  const [insights, setInsights] = useState([
    { id: 1, desc: 'Tu Reel tuvo 100 vistas', fecha: new Date() },
    { id: 2, desc: 'Tu perfil fue visitado 50 veces', fecha: new Date() }
  ]);

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Insights</h2>
      <ul>
        {insights.map(i => (
          <li key={i.id}>
            {i.desc} <span style={{fontSize: 10, color: '#888'}}>{i.fecha.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Insights;
