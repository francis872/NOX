import React, { useState, useEffect } from 'react';

const KEY = 'nox_accessibility';
const DEFAULTS = { fontSize: 'medium', contrast: 'normal', animations: true, autoplay: true };

const FONT_SIZES = [
  { id:'small',   label:'Pequeno',  px:13 },
  { id:'medium',  label:'Normal',   px:15 },
  { id:'large',   label:'Grande',   px:17 },
  { id:'xlarge',  label:'Muy grande', px:20 },
];

function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <div>
        <div style={{ color:'#e2e8f0', fontSize:15, fontWeight:600 }}>{label}</div>
        {desc && <div style={{ color:'#475569', fontSize:12, marginTop:2 }}>{desc}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{ width:46, height:26, borderRadius:13, background: value ? 'linear-gradient(135deg,#7f5af0,#2cb67d)' : 'rgba(255,255,255,0.08)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:3, left: value ? 23 : 3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}

export default function Accesibilidad() {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }; }
    catch { return DEFAULTS; }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings]);

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'0 16px 80px' }}>
      <div style={{ padding:'24px 0 20px' }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:'#e2e8f0' }}>Accesibilidad</h2>
        <p style={{ margin:'4px 0 0', fontSize:14, color:'#475569' }}>Personaliza la experiencia de lectura</p>
      </div>

      {/* Font size */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'16px 18px', marginBottom:12 }}>
        <div style={{ color:'#94a3b8', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>Tamano de texto</div>
        <div style={{ display:'flex', gap:8 }}>
          {FONT_SIZES.map(f => (
            <button key={f.id} onClick={() => set('fontSize', f.id)}
              style={{ flex:1, padding:'10px 4px', borderRadius:10, border: settings.fontSize===f.id ? '1px solid #7f5af0' : '1px solid rgba(255,255,255,0.08)', background: settings.fontSize===f.id ? 'rgba(127,90,240,0.15)' : 'transparent', color: settings.fontSize===f.id ? '#a78bfa' : '#64748b', fontSize: f.px, fontWeight:600, cursor:'pointer' }}>
              Aa
            </button>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, padding:'0 4px' }}>
          {FONT_SIZES.map(f => <span key={f.id} style={{ flex:1, textAlign:'center', fontSize:10, color: settings.fontSize===f.id ? '#a78bfa' : '#334155' }}>{f.label}</span>)}
        </div>
      </div>

      {/* Toggles */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'0 18px', marginBottom:12 }}>
        <Toggle label="Alto contraste" desc="Mejora la legibilidad en pantallas brillantes" value={settings.contrast==='high'} onChange={v => set('contrast', v ? 'high' : 'normal')} />
        <Toggle label="Reducir animaciones" desc="Desactiva transiciones y efectos de movimiento" value={!settings.animations} onChange={v => set('animations', !v)} />
        <Toggle label="Autoplay de videos" desc="Los videos se reproducen automaticamente" value={settings.autoplay} onChange={v => set('autoplay', v)} />
      </div>

      <div style={{ background:'rgba(44,182,125,0.07)', border:'1px solid rgba(44,182,125,0.2)', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#4ade80' }}>
        &#10003; Los cambios se aplican automaticamente y se guardan en tu dispositivo.
      </div>
    </div>
  );
}