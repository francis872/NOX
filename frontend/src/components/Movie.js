import React from 'react';

function Movie({ reels }) {
  return (
    <div style={{marginBottom: 16}}>
      <h4>Movie (Reels)</h4>
      <div style={{display: 'flex', gap: 8}}>
        {reels.map(reel => (
          <div key={reel.id} style={{border: '1px solid #aaa', borderRadius: 8, padding: 8, minWidth: 120, background: '#f0f0ff'}}>
            <b>{reel.title}</b>
            <div style={{fontSize: 10, color: '#888'}}>{new Date(reel.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Movie;
