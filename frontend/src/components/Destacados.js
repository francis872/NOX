import React from 'react';

function Destacados({ posts }) {
  return (
    <div style={{marginBottom: 16}}>
      <h4>Destacados</h4>
      <div style={{display: 'flex', gap: 8}}>
        {posts.slice(0, 3).map(post => (
          <div key={post.id} style={{border: '2px solid gold', borderRadius: 8, padding: 8, minWidth: 100}}>
            <b>{post.content}</b>
            <div style={{fontSize: 10, color: '#888'}}>{new Date(post.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Destacados;
