// DirectMessages.js - Mensajería directa via HTTP + polling
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export default function MyLinkMessages({ user, peer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const bottomRef = useRef(null);
  const lastCountRef = useRef(0);

  const loadMessages = useCallback(async () => {
    if (!user?.id || !peer?.id) return;
    try {
      const res = await axios.get(`/api/messages/${user.id}/${peer.id}`);
      const data = res.data || [];
      if (data.length !== lastCountRef.current) {
        lastCountRef.current = data.length;
        setMessages(data);
      }
    } catch {}
  }, [user?.id, peer?.id]);

  // Carga inicial
  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Polling cada 3 segundos para recibir mensajes nuevos
  useEffect(() => {
    const timer = setInterval(loadMessages, 3000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  // Scroll al final al actualizar mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setErr('');
    // Optimistic update
    const optimistic = {
      id: `opt_${Date.now()}`,
      sender_id: user.id,
      receiver_id: peer.id,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    try {
      await axios.post('/api/messages', {
        sender_id: user.id,
        receiver_id: peer.id,
        content: text,
      });
      // Reload to get real ID from server
      await loadMessages();
    } catch {
      setErr('No se pudo enviar. Intenta de nuevo.');
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const fmt = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>
      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 6,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(127,90,240,0.3) transparent',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#334155', fontSize: 13, padding: '60px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
            Empieza la conversación con {peer?.username}
          </div>
        )}
        {messages.map(msg => {
          const isMine = String(msg.sender_id) === String(user?.id);
          return (
            <div key={msg.id} style={{
              display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start',
              opacity: String(msg.id).startsWith('opt_') ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}>
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMine
                    ? 'linear-gradient(135deg, #7f5af0, #5b3db0)'
                    : 'rgba(255,255,255,0.07)',
                  border: isMine ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', fontSize: 14, lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                <div style={{
                  fontSize: 10, color: '#334155', marginTop: 3,
                  textAlign: isMine ? 'right' : 'left', paddingLeft: 4, paddingRight: 4,
                }}>
                  {fmt(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {err && (
        <div style={{ padding: '4px 20px', fontSize: 12, color: '#ef4444', textAlign: 'center' }}>
          {err}
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', gap: 10, alignItems: 'center',
        background: 'rgba(10,10,20,0.6)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Mensaje a ${peer?.username}...`}
          disabled={sending}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
            padding: '10px 16px', color: '#e2e8f0', fontSize: 14,
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(127,90,240,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: sending || !input.trim()
              ? 'rgba(127,90,240,0.2)'
              : 'linear-gradient(135deg,#7f5af0,#2cb67d)',
            border: 'none', cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'all 0.2s',
          }}
        >
          {sending ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  );
}
