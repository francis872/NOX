import React from 'react';

function DropTail({ messages }) {
  return (
    <div style={{marginBottom: 16}}>
      <h4>Mensajería (Drop Tail)</h4>
      <div style={{border: '1px solid #ccc', borderRadius: 8, padding: 8, minHeight: 60}}>
        {messages.map(msg => (
          <div key={msg.id} style={{marginBottom: 8}}>
            <b>{msg.sender}:</b> {msg.content}
            <div style={{fontSize: 10, color: '#888'}}>{new Date(msg.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DropTail;
