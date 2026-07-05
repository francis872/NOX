// StructuredIdeaForm.js - Formulario para ideas estructuradas con soporte de media
import React, { useState, useRef } from 'react';

const initialState = {
  premise: '',
  argument: '',
  evidence: '',
  conclusion: '',
  counterargument: '',
  media_url: '',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '10px 12px',
  color: '#e2e8f0',
  fontSize: 14,
  resize: 'vertical',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  marginBottom: 14,
  fontSize: 12,
  color: '#94a3b8',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function StructuredIdeaForm({ onSubmit, initialData }) {
  const [fields, setFields] = useState(initialData || initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaMode, setMediaMode] = useState(
    initialData?.media_url ? 'image' : 'none'
  );
  const [imagePreview, setImagePreview] = useState(
    initialData?.media_url || null
  );
  const fileRef = useRef();

  const handleChange = e => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_500_000) { setError('Imagen demasiado grande (máx 2.5 MB)'); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = ev => {
      setFields(f => ({ ...f, media_url: ev.target.result }));
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(fields);
      setFields(initialState);
      setMediaMode('none');
      setImagePreview(null);
    } catch (err) {
      setError(err.message || 'Error al enviar la idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[
        { name: 'premise', label: 'Premisa *', required: true },
        { name: 'argument', label: 'Argumento *', required: true },
        { name: 'evidence', label: 'Evidencia *', required: true },
        { name: 'conclusion', label: 'Conclusión *', required: true },
        { name: 'counterargument', label: 'Contraargumento (opcional)', required: false },
      ].map(({ name, label, required }) => (
        <label key={name} style={{ display: 'block', marginBottom: 10 }}>
          <span style={labelStyle}>{label}</span>
          <textarea
            name={name}
            value={fields[name]}
            onChange={handleChange}
            required={required}
            rows={2}
            style={inputStyle}
          />
        </label>
      ))}

      {/* ── Media section ── */}
      <div style={{ marginBottom: 14 }}>
        <span style={labelStyle}>Adjuntar media (opcional)</span>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {['none', 'image', 'video'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMediaMode(m);
                // Only clear media_url when switching AWAY from image/camera source
                if (m === 'none') {
                  setFields(f => ({ ...f, media_url: '' }));
                  setImagePreview(null);
                }
                if (m === 'video') {
                  setFields(f => ({ ...f, media_url: '' }));
                  setImagePreview(null);
                }
              }}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: mediaMode === m ? '#7f5af0' : 'rgba(255,255,255,0.07)',
                color: mediaMode === m ? '#fff' : '#64748b', transition: 'all 0.2s',
              }}
            >
              {m === 'none' ? '✗ Sin media' : m === 'image' ? '📷 Foto' : '🎥 Video URL'}
            </button>
          ))}
        </div>

        {mediaMode === 'image' && (
          <>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed rgba(127,90,240,0.35)', borderRadius: 10, padding: '14px', textAlign: 'center', cursor: 'pointer', background: 'rgba(127,90,240,0.04)', overflow: 'hidden', marginBottom: 6 }}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, objectFit: 'cover' }} />
                : <div style={{ color: '#475569', fontSize: 13 }}>📷 Toca para subir imagen (máx 2.5 MB)</div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
          </>
        )}

        {mediaMode === 'video' && (
          <input
            type="url"
            value={fields.media_url}
            onChange={e => setFields(f => ({ ...f, media_url: e.target.value }))}
            placeholder="https://... (URL directa de video mp4 o YouTube)"
            style={{ ...inputStyle, marginBottom: 4 }}
          />
        )}
      </div>

      {error && <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 8 }}>{error}</div>}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '12px', background: loading ? '#334155' : 'linear-gradient(135deg,#7f5af0,#2cb67d)',
          border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
        }}
      >
        {loading ? 'Publicando...' : '🚀 Publicar Idea'}
      </button>
    </form>
  );
}
