// CameraCapture.js — In-app camera: take a photo, post as Vibe or attach to Idea
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const GRADIENTS = [
  'linear-gradient(135deg,#7f5af0,#2cb67d)',
  'linear-gradient(135deg,#f72585,#7f5af0)',
  'linear-gradient(135deg,#4cc9f0,#2cb67d)',
];

export default function CameraCapture({ user, onClose, onAttachToIdea }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();

  const [snapshot, setSnapshot] = useState(null); // base64 captured photo
  const [caption, setCaption] = useState('');
  const [facing, setFacing] = useState('user'); // 'user' | 'environment'
  const [cameraErr, setCameraErr] = useState('');
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  // Start camera
  const startCamera = async (facingMode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraErr('');
    } catch (e) {
      setCameraErr('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  useEffect(() => {
    startCamera(facing);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
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
    // Mirror if front camera
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    setSnapshot(dataUrl);
    // Stop live preview
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const retake = () => {
    setSnapshot(null);
    setPosted(false);
    setCaption('');
    startCamera(facing);
  };

  const postAsVibe = async () => {
    setPosting(true);
    try {
      await axios.post('/api/vibes', {
        author_id: user.id,
        media_type: 'image',
        media_data: snapshot,
        caption: caption || null,
      });
      setPosted(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setCameraErr(e.response?.data?.error || 'Error al publicar Vibe');
    } finally {
      setPosting(false);
    }
  };

  const attachToIdea = () => {
    onAttachToIdea(snapshot);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9200,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px', gap: 0 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 }}>
          <span style={{ color: '#e2e8f0', fontSize: 17, fontWeight: 700 }}>📸 Cámara NOX</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {!snapshot && (
              <button onClick={flipCamera} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, padding: '6px 14px', color: '#e2e8f0', cursor: 'pointer', fontSize: 13 }}>
                🔄 Voltear
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* Viewfinder / snapshot */}
        <div style={{ width: '100%', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '4/3', position: 'relative' }}>
          {!snapshot ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: facing === 'user' ? 'scaleX(-1)' : 'none',
                display: 'block',
              }}
            />
          ) : (
            <img src={snapshot} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}

          {/* Live indicator */}
          {!snapshot && !cameraErr && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '4px 10px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f72585', animation: 'livePulse 1.2s ease-in-out infinite' }} />
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>LIVE</span>
            </div>
          )}

          {posted && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,182,125,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 48 }}>✓</span>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {cameraErr && (
          <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 10, textAlign: 'center' }}>{cameraErr}</div>
        )}

        {/* Controls */}
        {!snapshot ? (
          /* Capture button */
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={capture}
              style={{
                width: 70, height: 70, borderRadius: '50%',
                background: '#fff', border: '5px solid rgba(127,90,240,0.7)',
                cursor: 'pointer', boxShadow: '0 0 20px rgba(127,90,240,0.5)',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
        ) : (
          /* Post options */
          <div style={{ width: '100%', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Caption (opcional)..."
              style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 14,
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={postAsVibe}
                disabled={posting}
                style={{
                  flex: 1, padding: '13px', border: 'none', borderRadius: 12, cursor: posting ? 'not-allowed' : 'pointer',
                  background: posting ? '#334155' : 'linear-gradient(135deg,#f72585,#7f5af0)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                }}
              >
                {posting ? '...' : '✨ Subir como Vibe'}
              </button>
              <button
                onClick={attachToIdea}
                style={{
                  flex: 1, padding: '13px', border: 'none', borderRadius: 12, cursor: 'pointer',
                  background: 'linear-gradient(135deg,#7f5af0,#2cb67d)',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                }}
              >
                💡 Adjuntar a Idea
              </button>
            </div>
            <button
              onClick={retake}
              style={{ padding: '10px', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
            >
              ↩ Retomar
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
