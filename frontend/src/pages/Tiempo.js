import React, { useState, useEffect, useRef } from 'react';

const KEY = 'nox_time_tracking';
function fmt(secs){const h=Math.floor(secs/3600);const m=Math.floor((secs%3600)/60);const s=secs%60;if(h>0)return h+'h '+String(m).padStart(2,'0')+'m';return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}

export default function Tiempo(){
  const [sessions,setSessions]=useState(()=>{try{return JSON.parse(localStorage.getItem(KEY))||[];}catch{return [];}});
  const [active,setActive]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const startRef=useRef(null);const timerRef=useRef(null);
  useEffect(()=>()=>clearInterval(timerRef.current),[]);
  const start=()=>{startRef.current=Date.now();setElapsed(0);setActive(true);timerRef.current=setInterval(()=>setElapsed(Math.floor((Date.now()-startRef.current)/1000)),1000);};
  const stop=()=>{clearInterval(timerRef.current);setActive(false);const secs=Math.floor((Date.now()-startRef.current)/1000);if(secs<5)return;const entry={id:Date.now(),date:new Date().toISOString(),secs};const updated=[entry,...sessions].slice(0,30);setSessions(updated);localStorage.setItem(KEY,JSON.stringify(updated));setElapsed(0);};
  const totalToday=sessions.filter(s=>new Date(s.date).toDateString()===new Date().toDateString()).reduce((a,b)=>a+b.secs,0);
  const totalAll=sessions.reduce((a,b)=>a+b.secs,0);
  const avg=sessions.length>0?Math.floor(totalAll/sessions.length):0;
  return(<div style={{maxWidth:600,margin:'0 auto',padding:'0 16px 80px'}}>
    <div style={{padding:'24px 0 20px'}}><h2 style={{margin:0,fontSize:22,fontWeight:800,color:'#e2e8f0'}}>Tiempo en NOX</h2></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:24}}>
      {[['Hoy',fmt(totalToday),'#7f5af0'],['Total',fmt(totalAll),'#2cb67d'],['Promedio',fmt(avg),'#f4a261']].map(([label,val,color])=>(<div key={label} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'14px 12px',textAlign:'center'}}><div style={{fontSize:20,fontWeight:800,color}}>{val}</div><div style={{fontSize:12,color:'#475569',marginTop:4}}>{label}</div></div>))}
    </div>
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:20,padding:'32px 20px',textAlign:'center',marginBottom:20}}>
      <div style={{fontSize:52,fontWeight:900,color:active?'#7f5af0':'#334155',letterSpacing:2,marginBottom:20}}>{fmt(elapsed)}</div>
      {!active?(<button onClick={start} style={{padding:'14px 48px',background:'linear-gradient(135deg,#7f5af0,#2cb67d)',border:'none',borderRadius:24,color:'#fff',fontWeight:700,fontSize:16,cursor:'pointer'}}>Iniciar sesion</button>):(<button onClick={stop} style={{padding:'14px 48px',background:'rgba(239,68,68,0.9)',border:'none',borderRadius:24,color:'#fff',fontWeight:700,fontSize:16,cursor:'pointer'}}>Terminar sesion</button>)}
    </div>
    {sessions.length>0&&(<><div style={{fontSize:14,fontWeight:700,color:'#94a3b8',marginBottom:10}}>Historial</div><div style={{display:'flex',flexDirection:'column',gap:6}}>{sessions.slice(0,10).map(s=>(<div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 14px'}}><span style={{fontSize:13,color:'#64748b'}}>{new Date(s.date).toLocaleString()}</span><span style={{fontSize:14,fontWeight:700,color:'#a78bfa'}}>{fmt(s.secs)}</span></div>))}</div></>)}
  </div>);}
