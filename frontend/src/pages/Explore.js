import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Explore() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    axios.get(`/api/users?follower_id=${currentUser.id}`)
      .then(res => setUsers(res.data))
      .catch(() => setError('No se pudo cargar usuarios'));
  }, []);

  const follow = async (id) => {
    try {
      await axios.post(`/api/follow/${id}/follow`, { follower_id: currentUser.id });
      setUsers(users.map(u => u.id === id ? { ...u, followed: true } : u));
    } catch {
      setError('Error al seguir usuario');
    }
  };

  const unfollow = async (id) => {
    try {
      await axios.post(`/api/follow/${id}/unfollow`, { follower_id: currentUser.id });
      setUsers(users.map(u => u.id === id ? { ...u, followed: false } : u));
    } catch {
      setError('Error al dejar de seguir usuario');
    }
  };

  return (
    <div>
      <h2>Explorar usuarios</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      <ul>
        {users.filter(u => u.id !== currentUser.id).map(user => (
          <li key={user.id}>
            <b>{user.username}</b> ({user.email})
            {user.followed ? (
              <button onClick={() => unfollow(user.id)}>Dejar de seguir</button>
            ) : (
              <button onClick={() => follow(user.id)}>Seguir</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Explore;
