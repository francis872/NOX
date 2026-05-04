// App.js - Entry point con loader inicial
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import MyLink from './pages/MyLink';
// ...importa otras páginas según sea necesario

export default function App() {
  const [loading, setLoading] = useState(true);

  // Cambia el tiempo de carga aquí (milisegundos)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2600); // Loader visible 2.6s
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/mylink" element={<MyLink />} />
        {/* ...otras rutas */}
      </Routes>
    </Router>
  );
}
