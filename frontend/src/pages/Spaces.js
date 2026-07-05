import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ACCENTS = ['#7f5af0', '#2cb67d', '#f72585', '#38bdf8', '#f59e0b', '#ec4899', '#10b981', '#fb7185'];

export default function Spaces() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [spaces,   setSpaces]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [form,     setForm]     = useState({ title: '', description: '', accent: '#7f5af0' });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    axios.get(`/api/spaces?user_id=${user.id}`)
      .then(res => setSpaces(res.data || []))
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await axios.post('/api/spaces', { user_id: user.id, ...form });
      setSpaces(prev => [res.data, ...prev]);
      setForm({ title: '', description: '', accent: '#7f5af0' });
      setCreating(false);
    } catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este espacio?')) return;
    try {
      await axios.delete(`/api/spaces/${id}`, { data: { user_id: user.id } });
      setSpaces(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 18px 90px' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#f8fafc' }}>Mis espacios</h2>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 15 }}>Organiza tus mundos creativos dentro de NOX.</p>
        </div>
        <button onClick={() => setCreating(c => !c)} style={{ padding: '11px 20px', borderRadius: 16, background: 'rgba(127,90,240,0.16)', border: '1px solid rgba(127,90,240,0.28)', color: '#c4b5fd', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}>
          {creating ? 'Cancelar' : '+ Nuevo espacio'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} style={{ padding: 24, borderRadius: 24, background: 'rgba(127,90,240,0.06)', border: '1px solid rgba(127,90,240,0.16)', marginBottom: 24 }}>
          <div style={{ display: 'grid', gap: 14 }}>
            <input placeholder="Nombre del espacio *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={80} required style={{ padding: '13px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            <textarea placeholder="Descripcion (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#f8fafc', fontSize: 14, resize: 'vertical', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>Color:</span>
              {ACCENTS.map(color => (
                <button key={color} type="button" onClick={() => setForm(f => ({ ...f, accent: color }))} style={{ width: 26, height: 26, borderRadius: '50%', background: color, border: form.accent === color ? '3px solid #fff' : '2px solid rgba(255,255,255,0.12)', cursor: 'pointer', flexShrink: 0 }} />
              ))}
            </div>
            <button type="submit" disabled={saving || !form.title.trim()} style={{ padding: '13px', borderRadius: 16, background: 'linear-gradient(135deg,#7f5af0,#2cb67d)', border: 'none', color: '#fff', fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creando...' : 'Crear espacio'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 48 }}>Cargando espacios...</div>
      ) : spaces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: '#334155' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🌌</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Aun no tienes espacios.</p>
          <p style={{ fontSize: 14, color: '#475569', marginTop: 6 }}>Crea el primero con el boton de arriba.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {spaces.map(space => (
            <div key={space.id} style={{ borderRadius: 24, padding: 22, minHeight: 180, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: space.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{space.title}</span>
                  </div>
                  <button onClick={() => handleDelete(space.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 2px' }} title="Eliminar">x</button>
                </div>
                {space.description && <p style={{ color: '#64748b', lineHeight: 1.6, margin: '0 0 16px', fontSize: 14 }}>{space.description}</p>}
              </div>
              <div>
                <button style={{ width: '100%', padding: '10px', borderRadius: 14, border: `1px solid ${space.accent}55`, background: `${space.accent}18`, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Entrar</button>
                <div style={{ marginTop: 10, fontSize: 11, color: '#334155' }}>
                  {new Date(space.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
