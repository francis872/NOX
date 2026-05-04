// App.js - Entry point con loader inicial
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{color:'#ff6b6b',padding:40,fontFamily:'monospace',background:'#0e0e1a',minHeight:'100vh'}}>
          <h2>Error en la app</h2>
          <pre style={{whiteSpace:'pre-wrap'}}>{this.state.error.message}</pre>
          <pre style={{whiteSpace:'pre-wrap',fontSize:11,color:'#aaa'}}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import MyLink from './pages/MyLink';
import Login from './pages/Login';
import Register from './pages/Register';
import Notificaciones from './pages/Notificaciones';
import Actividad from './pages/Actividad';
import Insights from './pages/Insights';
import Favoritos from './pages/Favoritos';
import Bloqueos from './pages/Bloqueos';
import MejoresAmigos from './pages/MejoresAmigos';
import Tiempo from './pages/Tiempo';
import PalabrasFiltradas from './pages/PalabrasFiltradas';
import CuentasSilenciadas from './pages/CuentasSilenciadas';
import PreferenciasContenido from './pages/PreferenciasContenido';
import Suscripciones from './pages/Suscripciones';
import Accesibilidad from './pages/Accesibilidad';
import UsoDatos from './pages/UsoDatos';
import Permisos from './pages/Permisos';
import Ayuda from './pages/Ayuda';
import CentroPrivacidad from './pages/CentroPrivacidad';
import Admin from './pages/Admin';
import Loop from './pages/Loop';
import Camera from './pages/Camera';
import Onboarding from './components/Onboarding';
import Settings from './pages/Settings';
import PrivacidadCuenta from './pages/PrivacidadCuenta';
import CambiarContrasena from './pages/CambiarContrasena';
import DatosPersonales from './pages/DatosPersonales';
import CuentasRestringidas from './pages/CuentasRestringidas';
import Verificacion from './pages/Verificacion';
import CentroFamilias from './pages/CentroFamilias';
import Archivo from './pages/Archivo';
import EstadoCuenta from './pages/EstadoCuenta';
import Informacion from './pages/Informacion';
import ExperienciasConectadas from './pages/ExperienciasConectadas';
import PreferenciasAnuncios from './pages/PreferenciasAnuncios';
import ArchivosDescargas from './pages/ArchivosDescargas';
import PedidosPagos from './pages/PedidosPagos';
import './darklab.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return user && !localStorage.getItem('nox_onboarded');
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  // Sincronizar user si otra pestaña o componente actualiza localStorage
  useEffect(() => {
    const onStorage = () => {
      try { setUser(JSON.parse(localStorage.getItem('user'))); } catch { setUser(null); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (loading) return <Loader />;

  const handleOnboardingDone = () => {
    localStorage.setItem('nox_onboarded', '1');
    setShowOnboarding(false);
  };

  return (
    <ErrorBoundary>
      {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}
      <Router>
        {user && <Navbar />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/feed" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" />} />
          <Route path="/profile/:id" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/explore" element={user ? <Explore /> : <Navigate to="/login" />} />
          <Route path="/mylink" element={user ? <MyLink /> : <Navigate to="/login" />} />
          <Route path="/notificaciones" element={user ? <Notificaciones /> : <Navigate to="/login" />} />
          <Route path="/actividad" element={user ? <Actividad /> : <Navigate to="/login" />} />
          <Route path="/insights" element={user ? <Insights /> : <Navigate to="/login" />} />
          <Route path="/favoritos" element={user ? <Favoritos /> : <Navigate to="/login" />} />
          <Route path="/bloqueos" element={user ? <Bloqueos /> : <Navigate to="/login" />} />
          <Route path="/mejores-amigos" element={user ? <MejoresAmigos /> : <Navigate to="/login" />} />
          <Route path="/tiempo" element={user ? <Tiempo /> : <Navigate to="/login" />} />
          <Route path="/palabras-filtradas" element={user ? <PalabrasFiltradas /> : <Navigate to="/login" />} />
          <Route path="/cuentas-silenciadas" element={user ? <CuentasSilenciadas /> : <Navigate to="/login" />} />
          <Route path="/preferencias-contenido" element={user ? <PreferenciasContenido /> : <Navigate to="/login" />} />
          <Route path="/suscripciones" element={user ? <Suscripciones /> : <Navigate to="/login" />} />
          <Route path="/accesibilidad" element={user ? <Accesibilidad /> : <Navigate to="/login" />} />
          <Route path="/uso-datos" element={user ? <UsoDatos /> : <Navigate to="/login" />} />
          <Route path="/permisos" element={user ? <Permisos /> : <Navigate to="/login" />} />
          <Route path="/ayuda" element={user ? <Ayuda /> : <Navigate to="/login" />} />
          <Route path="/centro-privacidad" element={user ? <CentroPrivacidad /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user ? <Admin /> : <Navigate to="/login" />} />
          <Route path="/loop" element={user ? <Loop /> : <Navigate to="/login" />} />
          <Route path="/camara" element={user ? <Camera /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/settings/privacidad-cuenta" element={user ? <PrivacidadCuenta /> : <Navigate to="/login" />} />
          <Route path="/settings/contrasena" element={user ? <CambiarContrasena /> : <Navigate to="/login" />} />
          <Route path="/settings/datos-personales" element={user ? <DatosPersonales /> : <Navigate to="/login" />} />
          <Route path="/settings/restringidas" element={user ? <CuentasRestringidas /> : <Navigate to="/login" />} />
          <Route path="/settings/verificacion" element={user ? <Verificacion /> : <Navigate to="/login" />} />
          <Route path="/settings/centro-familias" element={user ? <CentroFamilias /> : <Navigate to="/login" />} />
          <Route path="/settings/archivo" element={user ? <Archivo /> : <Navigate to="/login" />} />
          <Route path="/settings/estado-cuenta" element={user ? <EstadoCuenta /> : <Navigate to="/login" />} />
          <Route path="/settings/informacion" element={user ? <Informacion /> : <Navigate to="/login" />} />
          <Route path="/settings/experiencias" element={user ? <ExperienciasConectadas /> : <Navigate to="/login" />} />
          <Route path="/settings/anuncios" element={user ? <PreferenciasAnuncios /> : <Navigate to="/login" />} />
          <Route path="/settings/archivos" element={user ? <ArchivosDescargas /> : <Navigate to="/login" />} />
          <Route path="/settings/pedidos" element={user ? <PedidosPagos /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
