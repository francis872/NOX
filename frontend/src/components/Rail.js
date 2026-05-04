import React from 'react';

function Rail({ stories }) {
  return (
    <div style={{marginBottom: 16}}>
      <h4>Rail (Stories)</h4>
      <div style={{display: 'flex', gap: 8}}>
        {stories.map(story => (
          <div key={story.id} style={{border: '1px solid #aaa', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9'}}>
            <span>{story.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Rail;
