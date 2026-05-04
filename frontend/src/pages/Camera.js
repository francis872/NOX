// Camera.js — Página dedicada de cámara (Foto / Video / Boomerang / Galería)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MODES = [
  { id: 'photo',     label: '📸 Foto' },
  { id: 'video',     label: '🎬 Video' },
  { id: 'boomerang', label: '🔁 Boomerang' },
  { id: 'gallery',   label: '📁 Galería' },
];

export default function Camera() {
  const user     = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const videoRef         = useRef();
  const canvasRef        = useRef();
  const streamRef        = useRef();
  const mediaRecorderRef = useRef();
  const recordTimerRef   = useRef();
  const recordTickRef    = useRef();
  const fileInputRef     = useRef();

  const [mode,         setMode]         = useState('photo');
  const [snapshot,     setSnapshot]     = useState(null);
  const [snapType,     setSnapType]     = useState('image');
  const [caption,      setCaption]      = useState('');
  const [facing,       setFacing]       = useState('user');
  const [cameraErr,    setCameraErr]    = useState('');
  const [posting,      setPosting]      = useState(false);
  const [posted,       setPosted]       = useState(false);
  const [postTarget,   setPostTarget]   = useState(null);
  const [recording,    setRecording]    = useState(false);
  const [recSecs,      setRecSecs]      = useState(0);
  const [boomeranging, setBoomeranging] = useState(false);

  // ── Camera stream ──
  const startCamera = useCallback(async (facingMode) => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    try {
      const audio = mode === 'video';
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraErr('');
    } catch {
      setCameraErr('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'gallery') startCamera(facing);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearTimeout(recordTimerRef.current);
      clearInterval(recordTickRef.current);
    };
  }, [mode]); // eslint-disable-line

  const flipCamera = () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    startCamera(next);
  };

  const switchMode = (m) => {
    setMode(m); setSnapshot(null); setSnapType('image');
    setCameraErr(''); setRecording(false); setRecSecs(0);
  };

  // ── PHOTO ──
  const capturePhoto = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSnapshot(canvas.toDataURL('image/jpeg', 0.82)); setSnapType('image');
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  // ── VIDEO ──
  const startVideo = () => {
    if (!streamRef.current) return;
    const chunks = [];
    const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
      .find(t => { try { return MediaRecorder.isTypeSupported(t); } catch { return false; } }) || '';
    try {
      const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: mr.mimeType || 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => { setSnapshot(reader.result); setSnapType('video'); setRecording(false); setRecSecs(0); };
        reader.readAsDataURL(blob);
        streamRef.current?.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start(200); setRecording(true); setRecSecs(0);
      recordTickRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
      recordTimerRef.current = setTimeout(stopVideo, 15000);
    } catch { setCameraErr('Tu navegador no soporta grabación de video.'); }
  };

  const stopVideo = () => {
    clearTimeout(recordTimerRef.current); clearInterval(recordTickRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  // ── BOOMERANG ──
  const captureBoomerang = () => {
    const video = videoRef.current; const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth || 480; const h = video.videoHeight || 360;
    canvas.width = w; canvas.height = h;
    const frames = []; const TOTAL = 20; let captured = 0;
    setBoomeranging(true);
    const grabFrame = () => {
      const ctx = canvas.getContext('2d'); ctx.save();
      if (facing === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, w, h); ctx.restore();
      frames.push(canvas.toDataURL('image/jpeg', 0.65)); captured++;
      if (captured < TOTAL) setTimeout(grabFrame, 55);
      else {
        setBoomeranging(false);
        streamRef.current?.getTracks().forEach(t => t.stop());
        buildBoomerangVideo(frames, w, h);
      }
    };
    grabFrame();
  };

  const buildBoomerangVideo = (frames, w, h) => {
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    const all = [...frames, ...[...frames].reverse()];
    try {
      if (!off.captureStream) throw new Error('no captureStream');
      const stream = off.captureStream(20);
      const mimeType = ['video/webm;codecs=vp8', 'video/webm']
        .find(t => { try { return MediaRecorder.isTypeSupported(t); } catch { return false; } }) || '';
      const mr = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 1200000 } : {});
      const chunks = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onload = () => { setSnapshot(reader.result); setSnapType('video'); };
        reader.readAsDataURL(blob);
      };
      let idx = 0; mr.start();
      const drawNext = () => {
        if (idx >= all.length) { mr.stop(); return; }
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); idx++; setTimeout(drawNext, 50); };
        img.src = all[idx];
      };
      drawNext();
    } catch {
      setSnapshot(frames[Math.floor(frames.length / 2)]); setSnapType('image');
      setCameraErr('Boomerang guardado como foto (navegador sin soporte de video animado).');
    }
  };

  // ── GALLERY ──
  const handleGalleryFile = e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 9 * 1024 * 1024) { setCameraErr('Archivo muy grande (máx 9 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => { setSnapshot(reader.result); setSnapType(file.type.startsWith('video') ? 'video' : 'image'); setCameraErr(''); };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setSnapshot(null); setSnapType('image'); setPosted(false); setCaption('');
    setPostTarget(null); setCameraErr(''); setRecording(false); setRecSecs(0);
    if (mode !== 'gallery') startCamera(facing);
  };

  // ── POST ──
  const postAsVibe = async () => {
    setPosting(true); setPostTarget('vibe');
    try {
      await axios.post('/api/vibes', { author_id: user.id, media_type: snapType, media_data: snapshot, caption: caption || null });
      setPosted(true); setTimeout(() => navigate('/feed'), 1400);
    } catch (e) { setCameraErr(e.response?.data?.error || 'Error al publicar Vibe'); setPostTarget(null); }
    finally { setPosting(false); }
  };

  const attachToIdea = () => navigate('/feed', { state: { photoToAttach: snapshot } });

  const actionBtn = (onClick, label, style = {}) => (
    <button onClick={onClick} style={{ flex: 1, padding: 13, border: 'none', borderRadius: 12, cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 14, transition: 'transform 0.15s', ...style }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseOut={e  => e.currentTarget.style.transform = 'scale(1)'}>
      {label}
    </button>
  );

  const showLive = mode !== 'gallery' && !snapshot && !cameraErr;

  return (
    <div style={{ minHeight: '100vh', background: '#04040e', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, paddingLeft: 60 }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '0 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer', padding: 0 }}>←</button>
          <span style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700 }}>📸 Cámara NOX</span>
          {!snapshot && mode !== 'gallery'
            ? <button onClick={flipCamera} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '7px 14px', color: '#e2e8f0', cursor: 'pointer', fontSize: 13 }}>🔄 Voltear</button>
            : <div style={{ width: 76 }} />}
        </div>

        {/* Mode tabs */}
        {!snapshot && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4 }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => switchMode(m.id)}
                style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  background: mode === m.id ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : 'transparent',
                  color: mode === m.id ? '#fff' : '#64748b' }}>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Viewfinder / Preview */}
        <div style={{ width: '100%', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '4/3', position: 'relative', boxShadow: '0 0 40px rgba(127,90,240,0.25)' }}>

          {showLive && (
            <video ref={videoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none', display: 'block' }} />
          )}

          {mode === 'gallery' && !snapshot && (
            <div onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
              <span style={{ fontSize: 54 }}>📁</span>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>Toca para elegir foto o video</span>
              <span style={{ color: '#475569', fontSize: 11 }}>Máx 9 MB</span>
            </div>
          )}

          {snapshot && snapType === 'image' && <img src={snapshot} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          {snapshot && snapType === 'video' && <video src={snapshot} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}

          {/* Live badge */}
          {showLive && !recording && !boomeranging && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '4px 10px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f72585', animation: 'livePulse 1.2s ease-in-out infinite' }} />
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>LIVE</span>
            </div>
          )}

          {/* Recording badge */}
          {recording && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(220,38,38,0.85)', borderRadius: 20, padding: '4px 12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>● REC {recSecs}s / 15s</span>
            </div>
          )}

          {/* Boomerang overlay */}
          {boomeranging && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>🔁 Capturando loop...</span>
            </div>
          )}

          {/* Boomerang watermark */}
          {snapshot && mode === 'boomerang' && snapType === 'video' && (
            <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.55)', borderRadius: 20, padding: '3px 10px', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              🔁 BOOMERANG
            </div>
          )}

          {/* Success overlay */}
          {posted && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,182,125,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 52 }}>✓</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{postTarget === 'vibe' ? '¡Vibe publicado!' : '✓ Listo'}</span>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleGalleryFile} />

        {cameraErr && (
          <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: 12, textAlign: 'center', padding: 10, background: 'rgba(255,107,107,0.08)', borderRadius: 10 }}>
            {cameraErr}
          </div>
        )}

        {/* Capture controls */}
        {!snapshot && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 28, marginBottom: 8, gap: 20 }}>
            {mode === 'photo' && (
              <button onClick={capturePhoto} title="Tomar foto"
                style={{ width: 78, height: 78, borderRadius: '50%', background: '#fff', border: '6px solid rgba(127,90,240,0.7)', cursor: 'pointer', boxShadow: '0 0 24px rgba(127,90,240,0.55)', transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={e   => e.currentTarget.style.transform = 'scale(1)'} />
            )}
            {mode === 'video' && !recording && (
              <button onClick={startVideo} title="Iniciar grabación"
                style={{ width: 78, height: 78, borderRadius: '50%', background: '#ef4444', border: '6px solid rgba(239,68,68,0.4)', cursor: 'pointer', boxShadow: '0 0 24px rgba(239,68,68,0.5)', transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={e   => e.currentTarget.style.transform = 'scale(1)'} />
            )}
            {mode === 'video' && recording && (
              <button onClick={stopVideo} title="Detener"
                style={{ width: 78, height: 78, borderRadius: '50%', background: '#ef4444', border: '6px solid rgba(239,68,68,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'recPulse 1s ease-in-out infinite' }}>
                <div style={{ width: 26, height: 26, background: '#fff', borderRadius: 4 }} />
              </button>
            )}
            {mode === 'boomerang' && (
              <button onClick={captureBoomerang} disabled={boomeranging} title="Capturar boomerang"
                style={{ width: 78, height: 78, borderRadius: '50%', background: boomeranging ? '#475569' : 'linear-gradient(135deg,#7f5af0,#f72585)', border: '6px solid rgba(127,90,240,0.4)', cursor: boomeranging ? 'not-allowed' : 'pointer', boxShadow: '0 0 24px rgba(127,90,240,0.4)', fontSize: 28, transition: 'transform 0.1s' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={e   => e.currentTarget.style.transform = 'scale(1)'}>
                🔁
              </button>
            )}
            {mode === 'gallery' && (
              <button onClick={() => fileInputRef.current?.click()}
                style={{ padding: '16px 38px', background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', borderRadius: 16, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                📁 Elegir archivo
              </button>
            )}
          </div>
        )}

        {/* Mode tip */}
        {!snapshot && (
          <p style={{ textAlign: 'center', color: '#334155', fontSize: 11, marginTop: 6, marginBottom: 16 }}>
            {mode === 'photo'     && 'Toca el círculo para capturar una foto'}
            {mode === 'video'     && (recording ? `Toca el cuadrado para detener · ${15 - recSecs}s restantes` : 'Toca el círculo rojo para grabar (máx 15 s)')}
            {mode === 'boomerang' && 'Toca 🔁 — captura ~1 s de frames y los une en un loop forward·backward'}
            {mode === 'gallery'   && 'Elige una foto o video desde tu dispositivo (máx 9 MB)'}
          </p>
        )}

        {/* Post-capture actions */}
        {snapshot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Agrega un caption (opcional)..."
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              {actionBtn(postAsVibe, posting ? '⏳ Publicando...' : '✨ Subir como Vibe',
                { background: posting ? '#334155' : 'linear-gradient(135deg,#f72585,#7f5af0)', cursor: posting ? 'not-allowed' : 'pointer' })}
              {actionBtn(attachToIdea, '💡 Adjuntar a Idea',
                { background: 'linear-gradient(135deg,#7f5af0,#2cb67d)' })}
            </div>
            <button onClick={retake}
              style={{ padding: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
              ↩ {mode === 'video' ? 'Grabar de nuevo' : mode === 'boomerang' ? 'Nuevo boomerang' : mode === 'gallery' ? 'Elegir otro' : 'Retomar foto'}
            </button>
          </div>
        )}

      </div>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes recPulse  { 0%,100%{box-shadow:0 0 16px rgba(239,68,68,0.7)} 50%{box-shadow:0 0 32px rgba(239,68,68,1)} }
      `}</style>
    </div>
  );
}

