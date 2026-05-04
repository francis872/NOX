// Camera.js — Página dedicada de cámara, accesible desde el menú
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GRADIENTS = [
  'linear-gradient(135deg,#7f5af0,#2cb67d)',
  'linear-gradient(135deg,#f72585,#7f5af0)',
  'linear-gradient(135deg,#4cc9f0,#2cb67d)',
];

export default function Camera() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();

  const [snapshot, setSnapshot] = useState(null);
  const [caption, setCaption] = useState('');
  const [facing, setFacing] = useState('user');
  const [cameraErr, setCameraErr] = useState('');
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postTarget, setPostTarget] = useState(null); // 'vibe' | 'idea'

  const startCamera = async (facingMode) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraErr('');
    } catch (e) {
      setCameraErr('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  useEffect(() => {
    startCamera(facing);
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []); // eslint-disable-line

  const flipCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    startCamera(next);
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
    setSnapshot(dataUrl);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setSnapshot(null);
    setPosted(false);
    setCaption('');
    setPostTarget(null);
    startCamera(facing);
  };

  const postAsVibe = async () => {
    setPosting(true);
    setPostTarget('vibe');
    try {
      await axios.post('/api/vibes', {
        author_id: user.id,
        media_type: 'image',
        media_data: snapshot,
        caption: caption || null,
      });
      setPosted(true);
      setTimeout(() => navigate('/feed'), 1400);
    } catch (e) {
      setCameraErr(e.response?.data?.error || 'Error al publicar Vibe');
      setPostTarget(null);
    } finally {
      setPosting(false);
    }
  };

  const attachToIdea = () => {
    // Pass photo via router state to Feed
    navigate('/feed', { state: { photoToAttach: snapshot } });
  };

  const btn = (onClick, children, extra = {}) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '13px', border: 'none', borderRadius: 12,
        cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 14,
        transition: 'transform 0.15s', ...extra,
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#04040e',
      display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, paddingLeft: 60,
    }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '0 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', padding: 0 }}>←</button>
          <span style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700 }}>📸 Cámara NOX</span>
          {!snapshot && (
            <button onClick={flipCamera} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '7px 14px', color: '#e2e8f0', cursor: 'pointer', fontSize: 13 }}>
              🔄 Voltear
            </button>
          )}
          {snapshot && <div style={{ width: 76 }} />}
        </div>

        {/* Viewfinder */}
        <div style={{ width: '100%', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '4/3', position: 'relative', boxShadow: '0 0 40px rgba(127,90,240,0.25)' }}>
          {!snapshot ? (
            <video
              ref={videoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none', display: 'block' }}
            />
          ) : (
            <img src={snapshot} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}

          {/* Live badge */}
          {!snapshot && !cameraErr && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '4px 10px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f72585', animation: 'livePulse 1.2s ease-in-out infinite' }} />
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>LIVE</span>
            </div>
          )}

          {/* Success overlay */}
          {posted && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,182,125,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 52 }}>✓</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>
                {postTarget === 'vibe' ? '¡Vibe publicado!' : '✓ Listo'}
              </span>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {cameraErr && (
          <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 12, textAlign: 'center', padding: '10px', background: 'rgba(255,107,107,0.08)', borderRadius: 10 }}>
            {cameraErr}
          </div>
        )}

        {/* Controls */}
        {!snapshot ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28, marginBottom: 16 }}>
            <button
              onClick={capture}
              title="Tomar foto"
              style={{
                width: 78, height: 78, borderRadius: '50%',
                background: '#fff', border: '6px solid rgba(127,90,240,0.7)',
                cursor: 'pointer', boxShadow: '0 0 24px rgba(127,90,240,0.55)',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Agrega un caption (opcional)..."
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '11px 14px', color: '#e2e8f0', fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              {btn(
                postAsVibe,
                posting ? '⏳ Publicando...' : '✨ Subir como Vibe',
                { background: posting ? '#334155' : 'linear-gradient(135deg,#f72585,#7f5af0)', cursor: posting ? 'not-allowed' : 'pointer' }
              )}
              {btn(
                attachToIdea,
                '💡 Adjuntar a Idea',
                { background: 'linear-gradient(135deg,#7f5af0,#2cb67d)' }
              )}
            </div>
            <button
              onClick={retake}
              style={{ padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
            >
              ↩ Retomar foto
            </button>
          </div>
        )}

        {/* Tip */}
        {!snapshot && (
          <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 14 }}>
            Toca el círculo para capturar · Sube como Vibe (24h) o adjunta a una idea
          </p>
        )}
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      `}</style>
    </div>
  );
}
