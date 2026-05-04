import React from 'react';

function CentroPrivacidad() {
  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Centro de Privacidad</h2>
      <ul>
        <li>Configuración de privacidad</li>
        <li>Gestión de datos personales</li>
        <li>Solicitar descarga de datos</li>
        <li>Eliminar cuenta</li>
        <li>Política de privacidad</li>
      </ul>
      <div style={{marginTop: 16}}>
        <strong>¿Preguntas sobre privacidad?</strong> Consulta nuestra <a href="/privacidad">política de privacidad</a> o escribe a privacidad@nox.com
      </div>
    </div>
  );
}

export default CentroPrivacidad;
