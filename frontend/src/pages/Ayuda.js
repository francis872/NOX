import React from 'react';

function Ayuda() {
  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Centro de Ayuda</h2>
      <ul>
        <li>¿Cómo usar NOX?</li>
        <li>Configuración de privacidad</li>
        <li>Gestión de cuentas</li>
        <li>Reportar un problema</li>
        <li>Contacto y soporte</li>
      </ul>
      <div style={{marginTop: 16}}>
        <strong>¿Necesitas ayuda?</strong> Escríbenos a soporte@nox.com
      </div>
    </div>
  );
}

export default Ayuda;
