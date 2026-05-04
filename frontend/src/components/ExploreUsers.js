// ExploreUsers.js - Explora y sigue usuarios
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ExploreUsers() {
  const [users, setUsers] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    axios.get('/api/explore')
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]));
    if (currentUser?.id) {
      axios.get(`/api/users/${currentUser.id}/following`)
        .then(res => setFollowing(res.data.map(u => u.id)))
        .catch(() => setFollowing([]));
    }
  }, []);

  const follow = async (id) => {
    await axios.post(`/api/follow/${id}/follow`, { follower_id: currentUser.id });
    setFollowing([...following, id]);
  };
  const unfollow = async (id) => {
    await axios.post(`/api/follow/${id}/unfollow`, { follower_id: currentUser.id });
    setFollowing(following.filter(fid => fid !== id));
  };

  return (
    <div style={{maxWidth:500,margin:'0 auto'}}>
      <h3>Explorar usuarios</h3>
      <ul style={{listStyle:'none',padding:0}}>
        {users.filter(u => u.id !== currentUser?.id).map(u => (
          <li key={u.id} style={{border:'1px solid #eee',borderRadius:6,padding:12,marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <b>{u.username}</b>
              <div style={{fontSize:12,color:'#888'}}>{u.bio}</div>
              <div style={{fontSize:12,color:'#7fd7ff'}}>Nivel: {u.thought_level}</div>
            </div>
            {following.includes(u.id)
              ? <button onClick={()=>unfollow(u.id)}>Siguiendo</button>
              : <button onClick={()=>follow(u.id)}>Seguir</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
