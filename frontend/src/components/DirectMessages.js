// DirectMessages.js - Mensajería directa via HTTP + polling
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { createRealtimeClient } from '../utils/realtime';

export default function MyLinkMessages({ user, peer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [presence, setPresence] = useState(null);
  const [recording, setRecording] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const bottomRef = useRef(null);
  const lastCountRef = useRef(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const socketRef = useRef(null);
  const typingStopTimerRef = useRef(null);
  const peerTypingTimerRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!user?.id || !peer?.id) return;
    try {
      const res = await axios.get(`/api/messages/thread/${user.id}/${peer.id}`);
      const data = res.data || [];
      lastCountRef.current = data.length;
      setMessages(data);
    } catch {}
  }, [user?.id, peer?.id]);

  const loadPresence = useCallback(async () => {
    if (!peer?.id || !user?.id) return;
    try {
      await axios.post('/api/users/heartbeat', { user_id: user.id });
      const res = await axios.get(`/api/users/presence?ids=${peer.id}`);
      setPresence((res.data || [])[0] || null);
    } catch {}
  }, [peer?.id, user?.id]);

  // Carga inicial
  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Polling cada 3 segundos para recibir mensajes nuevos
  useEffect(() => {
    const timer = setInterval(loadMessages, 15000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    loadPresence();
    const timer = setInterval(loadPresence, 10000);
    return () => clearInterval(timer);
  }, [loadPresence]);

  // Scroll al final al actualizar mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user?.id || !token) return undefined;

    const socket = createRealtimeClient(token);
    if (!socket) return undefined;

    socketRef.current = socket;

    const handleIncoming = (message) => {
      const belongsToThread =
        String(message.sender_id) === String(peer?.id) ||
        String(message.receiver_id) === String(peer?.id);
      if (!belongsToThread) return;

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((item) => !String(item.id).startsWith('opt_'));
        if (withoutOptimistic.some((item) => String(item.id) === String(message.id))) return withoutOptimistic;
        return [...withoutOptimistic, message];
      });
    };

    const handleTyping = ({ from }) => {
      if (String(from) !== String(peer?.id)) return;
      setIsPeerTyping(true);
      clearTimeout(peerTypingTimerRef.current);
      peerTypingTimerRef.current = setTimeout(() => setIsPeerTyping(false), 2200);
    };

    const handleTypingStop = ({ from }) => {
      if (String(from) !== String(peer?.id)) return;
      setIsPeerTyping(false);
      clearTimeout(peerTypingTimerRef.current);
    };

    socket.on('dm:new', handleIncoming);
    socket.on('dm:sent', handleIncoming);
    socket.on('dm:typing', handleTyping);
    socket.on('dm:typing_stop', handleTypingStop);

    return () => {
      clearTimeout(peerTypingTimerRef.current);
      socket.off('dm:new', handleIncoming);
      socket.off('dm:sent', handleIncoming);
      socket.off('dm:typing', handleTyping);
      socket.off('dm:typing_stop', handleTypingStop);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [peer?.id, user?.id]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingStopTimerRef.current);
    if (socketRef.current?.connected && peer?.id) {
      socketRef.current.emit('dm:typing_stop', { to: peer.id });
    }
  }, [peer?.id]);

  const emitTyping = useCallback(() => {
    if (!socketRef.current?.connected || !peer?.id) return;
    socketRef.current.emit('dm:typing', { to: peer.id });
    clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('dm:typing_stop', { to: peer.id });
    }, 1400);
  }, [peer?.id]);

  const sendPayload = async ({ content, mediaType = 'text', mediaData = null }) => {
    if (sending) return;
    setSending(true);
    setErr('');
    const optimistic = {
      id: `opt_${Date.now()}`,
      sender_id: user.id,
      receiver_id: peer.id,
      content: content || '',
      media_type: mediaType,
      media_data: mediaData,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      stopTyping();
      if (socketRef.current?.connected) {
        const response = await new Promise((resolve) => {
          socketRef.current.emit('dm:send', {
            to: peer.id,
            content: content || '',
            media_type: mediaType,
            media_data: mediaData,
          }, resolve);
        });

        if (!response?.ok) {
          const error = new Error(response?.error || 'No se pudo enviar.');
          error.code = response?.code;
          throw error;
        }

        setMessages(prev => prev.map((m) => (
          m.id === optimistic.id ? response.message : m
        )));
      } else {
        await axios.post('/api/messages', {
          sender_id: user.id,
          receiver_id: peer.id,
          content: content || '',
          media_type: mediaType,
          media_data: mediaData,
        });
        await loadMessages();
      }
    } catch (e) {
      if (e.response?.data?.code === 'DM_REQUEST_REQUIRED' || e.code === 'DM_REQUEST_REQUIRED') {
        setErr('Cuenta privada: se envió solicitud y debes esperar aprobación.');
      } else {
        setErr('No se pudo enviar. Intenta de nuevo.');
      }
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    await sendPayload({ content: text });
  };

  const suggestReply = async () => {
    if (!peer?.username || assistantBusy) return;
    setAssistantBusy(true);
    setErr('');
    try {
      const history = messages.slice(-6).map((message) => (
        `${String(message.sender_id) === String(user?.id) ? 'Yo' : peer.username}: ${message.content || '[media]'}`
      )).join('\n');
      const res = await axios.post('/api/ai/suggest', {
        prompt: `Escribe una respuesta breve, natural y con tono inteligente para este chat de NOX. No uses comillas ni prefacios.\n\nContexto:\n${history}\n\nBorrador actual: ${input || '(vacío)'}`,
      });
      setInput((res.data?.suggestion || '').trim());
    } catch {
      setErr('La ayuda de IA no está disponible ahora.');
    } finally {
      setAssistantBusy(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => chunksRef.current.push(ev.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async (ev) => {
          await sendPayload({ content: '🎤 Nota de voz', mediaType: 'audio', mediaData: ev.target.result });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setErr('No se pudo iniciar el micrófono.');
    }
  };

  const fmt = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fmtLastSeen = (d) => {
    if (!d) return 'sin actividad reciente';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins <= 1) return 'hace un momento';
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours} h`;
    return `el ${new Date(d).toLocaleDateString()}`;
  };

  const statusText = (m) => {
    if (String(m.sender_id) !== String(user?.id)) return '';
    if (m.read_at) return 'Leído';
    if (m.delivered_at) return 'Entregado';
    return 'Enviado';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>
      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 6,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(127,90,240,0.3) transparent',
      }}>
        {peer && (
          <div style={{ textAlign:'center', fontSize:11, color:'#64748b', marginBottom:6 }}>
            {presence?.online ? 'En línea ahora' : `Última vez activo: ${fmtLastSeen(presence?.last_active_at)}`}
          </div>
        )}

        {isPeerTyping && (
          <div style={{ textAlign:'left', fontSize:12, color:'#8b9bb3', marginBottom:8, paddingLeft:6 }}>
            {peer?.username} está escribiendo...
          </div>
        )}

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
                  {msg.media_type === 'audio' && msg.media_data ? (
                    <audio controls src={msg.media_data} style={{ maxWidth: 220 }} />
                  ) : (
                    msg.content
                  )}
                </div>
                <div style={{
                  fontSize: 10, color: '#334155', marginTop: 3,
                  textAlign: isMine ? 'right' : 'left', paddingLeft: 4, paddingRight: 4,
                }}>
                  {fmt(msg.created_at)} {isMine && <span style={{ color:'#94a3b8' }}>· {statusText(msg)}</span>}
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
        <button
          type="button"
          onClick={() => setInput((prev) => `${prev}${prev ? ' ' : ''}🔥`)}
          style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}
        >
          🔥
        </button>
        <button
          type="button"
          onClick={() => setInput((prev) => `${prev}${prev ? ' ' : ''}😂`)}
          style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}
        >
          😂
        </button>
        <input
          value={input}
          onChange={e => {
            setInput(e.target.value);
            if (e.target.value.trim()) emitTyping();
            else stopTyping();
          }}
          placeholder={`Mensaje a ${peer?.username}...`}
          disabled={sending}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
            padding: '10px 16px', color: '#e2e8f0', fontSize: 14,
            outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(127,90,240,0.5)'}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            stopTyping();
          }}
        />
        <button
          type="button"
          onClick={suggestReply}
          disabled={assistantBusy || sending}
          title="Sugerir respuesta con IA"
          style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: assistantBusy ? 'rgba(76,201,240,0.25)' : 'rgba(76,201,240,0.14)',
            border: '1px solid rgba(76,201,240,0.26)', color:'#dff7ff',
            cursor: assistantBusy || sending ? 'not-allowed' : 'pointer',
          }}
        >
          {assistantBusy ? '…' : 'AI'}
        </button>
        <button
          type="button"
          onClick={toggleRecording}
          disabled={sending}
          style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: recording ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.16)', color:'#fff',
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          {recording ? '■' : '🎤'}
        </button>
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
