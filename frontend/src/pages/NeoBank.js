import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ACTIONS = [
  { label: 'Enviar',   icon: '↗', color: '#7f5af0' },
  { label: 'Recibir',  icon: '↙', color: '#22c55e' },
  { label: 'Ahorros',  icon: '⊕', color: '#38bdf8' },
  { label: 'Historial',icon: '≡', color: '#94a3b8' },
];
const EARN_RULES = [
  { label: 'Idea destacada',   amount: 50, color: '#7f5af0' },
  { label: 'Lockpost viral',   amount: 30, color: '#fb7185' },
  { label: 'Reaccion recibida',amount: 10, color: '#22c55e' },
];

export default function NeoBank() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earning, setEarning] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    axios.get(`/api/users/${user.id}`)
      .then(res => setBalance(res.data.nx_balance ?? 0))
      .catch(() => setBalance(0))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const earnNX = async () => {
    if (!user?.id) return;
    setEarning(true);
    try {
      const res = await axios.post(`/api/users/${user.id}/earn-nx`, { amount: 10 });
      setBalance(res.data.nx_balance);
    } catch {}
    finally { setEarning(false); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 18px 90px' }}>
      <div style={{ marginBottom: 26 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12 }}>TAIpay</span>
        <h2 style={{ margin: '16px 0 8px', fontSize: 30, fontWeight: 800, color: '#f8fafc' }}>Tu economia en NOX</h2>
        <p style={{ margin: 0, color: '#64748b', lineHeight: 1.7 }}>Saldo, recompensas y movimientos de tokens NX dentro de la red.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,0.7fr)', gap: 18, marginBottom: 22 }}>
        <div style={{ padding: 28, borderRadius: 28, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Saldo disponible</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', marginTop: 8, letterSpacing: '-0.02em' }}>
                {loading ? '-' : (balance ?? 0)}
                <span style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8', marginLeft: 8 }}>NX</span>
              </div>
            </div>
            <div style={{ width: 58, height: 58, borderRadius: 20, background: 'linear-gradient(135deg,#38bdf8,#7f5af0)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em' }}>TAI</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {ACTIONS.map(action => (
              <button key={action.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                <span style={{ color: action.color, fontSize: 18, width: 20, textAlign: 'center' }}>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: 24, borderRadius: 28, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.14)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>Ganar NX</div>
            <p style={{ margin: 0, color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>Crea valor en la red y gana tokens por ello.</p>
          </div>
          <div style={{ display: 'grid', gap: 8, flex: 1 }}>
            {EARN_RULES.map(rule => (
              <div key={rule.label} style={{ padding: '10px 14px', borderRadius: 14, background: `${rule.color}18`, color: '#cbd5e1', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>{rule.label}</span>
                <span style={{ color: rule.color, fontWeight: 700 }}>+{rule.amount}</span>
              </div>
            ))}
          </div>
          <button onClick={earnNX} disabled={earning} style={{ padding: '12px', borderRadius: 16, background: 'linear-gradient(135deg,#38bdf8,#7f5af0)', border: 'none', color: '#fff', fontWeight: 800, cursor: earning ? 'not-allowed' : 'pointer', fontSize: 14, opacity: earning ? 0.7 : 1 }}>
            {earning ? 'Procesando...' : '+ Ganar 10 NX ahora'}
          </button>
        </div>
      </div>
      <div style={{ padding: 22, borderRadius: 24, background: 'rgba(15,18,28,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>Como funciona TAIpay?</h3>
        <p style={{ margin: 0, color: '#64748b', lineHeight: 1.75, fontSize: 14 }}>Cada interaccion genuina genera valor. AXIOMS destacados, Lockpost virales y contribuciones reales se convierten en tokens NX que puedes usar para desbloquear experiencias y apoyar a otros creadores.</p>
      </div>
    </div>
  );
}
