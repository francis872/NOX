import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PrivacidadCuenta() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`/api/users/${user.id}/settings`)
      .then(res => setIsPrivate(!!res.data.is_private))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const toggle = async () => {
    if (saving) return;
    setSaving(true); setMsg('');
    const next = !isPrivate;
    try {
      await axios.patch(`/api/users/${user.id}/privacy`, { is_private: next });
      setIsPrivate(next);
      setMsg(next ? 'Cuenta privada activada.' : 'Cuenta pública activada.');
    } catch {
      setMsg('Error al actualizar. Inténtalo de nuevo.');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 80px', minHeight: '100vh', background: '#0e0e1a', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 0 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#7f5af0', fontSize: 22, cursor: 'pointer', padding: 0 }}>‹</button>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Privacidad de la cuenta</h2>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>Cargando...</div> : (
        <>
          {/* Toggle */}
          <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Cuenta privada</div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                  {isPrivate ? 'Solo tus seguidores pueden ver tu contenido' : 'Cualquier persona en NOX puede ver tu contenido'}
                </div>
              </div>
              <div onClick={toggle} style={{ width: 52, height: 28, borderRadius: 14, background: isPrivate ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : 'rgba(255,255,255,0.1)', cursor: saving ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 4, left: isPrivate ? 26 : 4, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
              </div>
            </div>
          </div>

          {msg && <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(44,182,125,0.1)', border: '1px solid rgba(44,182,125,0.3)', borderRadius: 10, fontSize: 13, color: '#2cb67d' }}>{msg}</div>}

          {/* Explanation */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🌐', title: 'Cuenta pública', desc: 'Cualquier persona puede ver tus ideas, vibes y perfil. Apareces en búsquedas y en el Loop público.' },
              { icon: '🔒', title: 'Cuenta privada', desc: 'Solo tus seguidores aprobados pueden ver tu contenido. Los nuevos seguidores necesitan tu aprobación. Tu perfil no aparece en búsquedas públicas.' },
            ].map(item => (
              <div key={item.title} style={{ background: isPrivate && item.icon === '🔒' || !isPrivate && item.icon === '🌐' ? 'rgba(127,90,240,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isPrivate && item.icon === '🔒' || !isPrivate && item.icon === '🌐' ? 'rgba(127,90,240,0.25)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.icon} {item.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}