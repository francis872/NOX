import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function Navbar() {
  const { t, i18n } = useTranslation();
  return (
    <>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:8}}>
        <img src={require('../../noxfiles/noxlogo.png')} alt="NOX Logo" style={{height:36}} />
        <nav style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
          <Link to="/feed">{t('feed')}</Link>
          <Link to="/actividad">Actividad</Link>
          <Link to="/notificaciones">{t('notifications')}</Link>
          <Link to="/insights">Insights</Link>
          <Link to="/favoritos">Favoritos</Link>
          <Link to="/bloqueos">Bloqueos</Link>
          <Link to="/mejores-amigos">Mejores Amigos</Link>
          <Link to="/profile/1">{t('profile')}</Link>
          <Link to="/explore">{t('explore')}</Link>
          <Link to="/mylink">{t('messages')}</Link>
          <Link to="/tiempo">Tiempo</Link>
          <Link to="/palabras-filtradas">Palabras Filtradas</Link>
          <Link to="/cuentas-silenciadas">Cuentas Silenciadas</Link>
          <Link to="/preferencias-contenido">Preferencias Contenido</Link>
          <Link to="/suscripciones">{t('subscribe')}</Link>
          <Link to="/accesibilidad">Accesibilidad</Link>
          <Link to="/admin">{t('admin')}</Link>
        </nav>
        <select onChange={e => i18n.changeLanguage(e.target.value)} value={i18n.language} style={{marginLeft:16}}>
          <option value="es">{t('spanish')}</option>
          <option value="en">{t('english')}</option>
        </select>
      </div>
      <div style={{fontSize:13, color:'#7fd7ff', marginBottom:16, fontFamily:'inherit', textAlign:'center'}}>
        {t('welcome')}
      </div>
    </>
  );
}

export default Navbar;
