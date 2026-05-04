// Loader.js - Loader animado con Nox Icon
import React from 'react';
import './Loader.css';

export default function Loader() {
  return (
    <div className="nox-loader">
      <img src={require('../assets/Noxicon.png')} alt="Nox Icon" className="nox-loader-icon" />
      <div className="nox-loader-text">Cargando NOX...</div>
    </div>
  );
}
