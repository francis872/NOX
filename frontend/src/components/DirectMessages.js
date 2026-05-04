// MyLinkMessages.js - Mensajería en tiempo real con WebSocket
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function MyLinkMessages({ user, peer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const ws = useRef(null);

  // Cargar historial
  useEffect(() => {
    if (!user?.id || !peer?.id) return;
    axios.get(`/api/messages/${user.id}/${peer.id}`)
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]));
  }, [user, peer]);

  // WebSocket conexión
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const wsUrl = `ws://${window.location.hostname}:3001/?token=${token}`;
    ws.current = new window.WebSocket(wsUrl);
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && (data.from === peer.id || data.from === user.id)) {
          setMessages(msgs => [...msgs, {
            id: Date.now() + Math.random(),
            sender_id: data.from,
            receiver_id: data.from === user.id ? peer.id : user.id,
            content: data.content,
            created_at: data.created_at
          }]);
        }
      } catch {}
    };
    return () => ws.current && ws.current.close();
  }, [user, peer]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    // Enviar por WebSocket
    if (ws.current && ws.current.readyState === 1) {
      ws.current.send(JSON.stringify({
        type: 'message',
        to: peer.id,
        content: input
      }));
      setMessages([...messages, {
        id: Date.now() + Math.random(),
        sender_id: user.id,
        receiver_id: peer.id,
        content: input,
        created_at: new Date().toISOString()
      }]);
      setInput('');
    }
    setLoading(false);
  };

  return (
    <div style={{border:'1px solid #ccc', borderRadius:6, padding:12, maxWidth:400}}>
      <div style={{fontWeight:'bold', marginBottom:8}}>
        MyLink: Conversación con {peer?.username || 'Usuario'}
      </div>
      <div style={{maxHeight:200, overflowY:'auto', marginBottom:8, background:'#f9f9f9', padding:8, borderRadius:4}}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            textAlign: msg.sender_id === user.id ? 'right' : 'left',
            marginBottom:4
          }}>
            <span style={{
              display:'inline-block',
              background: msg.sender_id === user.id ? '#d1f7c4' : '#e6e6e6',
              borderRadius:8,
              padding:'4px 10px',
              maxWidth: '80%',
              wordBreak:'break-word'
            }}>{msg.content}</span>
            <div style={{fontSize:10, color:'#888'}}>{new Date(msg.created_at).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{display:'flex',gap:4}}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe un mensaje..." style={{flex:1}} />
        <button type="submit" disabled={loading || !input.trim()}>Enviar</button>
      </form>
    </div>
  );
}
