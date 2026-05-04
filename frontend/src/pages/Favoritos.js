import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Favoritos() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [favoritos, setFavoritos] = useState([]);
  const [postId, setPostId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      axios.get(`/api/favorites/${user.id}`)
        .then(res => setFavoritos(res.data))
        .catch(() => setError('Error al cargar favoritos'));
    }
  }, [user]);

  const agregarFavorito = async () => {
    if (!postId) return;
    try {
      await axios.post(`/api/favorites/${user.id}`, { post_id: postId });
      const res = await axios.get(`/api/favorites/${user.id}`);
      setFavoritos(res.data);
      setPostId('');
    } catch {
      setError('Error al agregar favorito');
    }
  };

  const eliminarFavorito = async (post_id) => {
    try {
      await axios.delete(`/api/favorites/${user.id}/${post_id}`);
      setFavoritos(favoritos.filter(f => f.post_id !== post_id));
    } catch {
      setError('Error al eliminar favorito');
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Favoritos</h2>
      <div style={{marginBottom: 16}}>
        <input value={postId} onChange={e => setPostId(e.target.value)} placeholder="ID del post" />
        <button onClick={agregarFavorito}>Agregar favorito</button>
      </div>
      {error && <div style={{color:'red'}}>{error}</div>}
      <ul>
        {favoritos.map(f => (
          <li key={f.id} style={{display:'flex',alignItems:'center',gap:8}}>
            {f.content}
            <button onClick={() => eliminarFavorito(f.post_id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Favoritos;
