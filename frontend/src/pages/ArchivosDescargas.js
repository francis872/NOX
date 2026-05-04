import React from 'react';
import { useNavigate } from 'react-router-dom';
export default function ArchivosDescargas() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'0 16px 80px', minHeight:'100vh', background:'#0e0e1a', color:'#e2e8f0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'20px 0 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'#7f5af0', fontSize:22, cursor:'pointer', padding:0 }}>&#8249;</button>
        <h2 style={{ margin:0, fontSize:19, fontWeight:800 }}>Archivos y descargas</h2>
      </div>
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <div style={{ fontSize:56, marginBottom:16 }}>📁</div>
        <div style={{ fontSize:18, fontWeight:700, marginBottom:10 }}>Archivos y descargas</div>
        <div style={{ fontSize:14, color:'#475569', lineHeight:1.7 }}>Gestiona el contenido que has descargado desde NOX.</div>
        <div style={{ marginTop:24, display:'inline-block', padding:'8px 20px', background:'rgba(127,90,240,0.1)', border:'1px solid rgba(127,90,240,0.2)', borderRadius:20, fontSize:13, color:'#7f5af0' }}>Próximamente</div>
      </div>
    </div>
  );
}