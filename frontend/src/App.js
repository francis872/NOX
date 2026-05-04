// App.js - Entry point con loader inicial
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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
import './darklab.css';

export default function App() {
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
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
      </Routes>
    </Router>
  );
}
