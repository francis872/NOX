import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { track } from '../utils/analytics';
import { passwordStrength, calcAge } from '../utils/security';
import './auth.css';

const STEPS = [
  { key: 'acceso',    label: 'Acceso',    icon: '🔐' },
  { key: 'identidad', label: 'Identidad', icon: '👤' },
  { key: 'perfil',    label: 'Perfil',    icon: '✨' },
];

// ─── Password strength meter ──────────────────────────────────────────────────
function StrengthMeter({ password }) {
  const { score, label, color } = passwordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= score ? color : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ─── Minor mode badge ─────────────────────────────────────────────────────────
function MinorBadge({ age }) {
  if (age === null || age >= 18) return null;
  if (age < 13) return (
    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
      ⛔ Debes tener al menos 13 años para registrarte en NOX.
    </div>
  );
  return (
    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontSize: 13 }}>
      🛡️ Modo Menores activo — {age} años. Funciones de comunicación estarán restringidas para tu protección.
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', password: '', confirm: '',
    date_of_birth: '', origin: '', bio: '', interests: '', terms: false,
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const age      = calcAge(form.date_of_birth);
  const pwInfo   = passwordStrength(form.password);

  const handleChange = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [e.target.name]: val }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.email.trim())              return 'El email es obligatorio.';
      if (!form.password)                  return 'La contraseña es obligatoria.';
      if (form.password.length < 8)        return 'La contraseña debe tener al menos 8 caracteres.';
      if (!/[0-9]/.test(form.password))    return 'La contraseña debe incluir al menos un número.';
      if (form.password !== form.confirm)  return 'Las contraseñas no coinciden.';
    }
    if (step === 1) {
      if (!form.full_name.trim())          return 'El nombre completo es obligatorio.';
      if (!form.username.trim())           return 'El nombre de usuario es obligatorio.';
      if (form.username.length < 3)        return 'El usuario debe tener al menos 3 caracteres.';
      if (!form.date_of_birth)             return 'La fecha de nacimiento es obligatoria.';
      if (age === null)                    return 'Fecha de nacimiento no válida.';
      if (age < 13)                        return 'Debes tener al menos 13 años para registrarte en NOX.';
    }
    if (step === 2) {
      if (!form.terms) return 'Debes aceptar los Términos y Política de Privacidad.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');

    if (step < STEPS.length - 1) {
      track('onboarding_step_completed', { step: STEPS[step].key });
      setStep(s => s + 1);
      return;
    }

    setLoading(true);
    track('signup_started');
    try {
      await axios.post('/api/auth/register', {
        full_name:     form.full_name.trim(),
        username:      form.username.trim().toLowerCase(),
        email:         form.email.trim().toLowerCase(),
        password:      form.password,
        date_of_birth: form.date_of_birth,
        bio:           form.bio.trim(),
        interests:     form.interests.split(',').map(i => i.trim()).filter(Boolean),
        origin:        form.origin.trim(),
        age:           age,
      });
      track('signup_completed');
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 14, padding: '13px 16px', color: '#f8fafc', fontSize: 16, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo-row">
          <img src={require('../assets/noxlogo.png')} alt="NOX" className="auth-logo" />
        </div>
        <h1 className="auth-title">Únete a NOX</h1>
        <p className="auth-sub">Gratis. Para siempre. <span className="auth-accent">Sin excusas.</span></p>

        {/* Stepper */}
        <div className="auth-stepper">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`auth-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="auth-step-dot">{i < step ? '✓' : s.icon}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          {/* ── Paso 1: Acceso ── */}
          {step === 0 && (
            <>
              <div className="auth-field">
                <label>Email *</label>
                <input name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="auth-field">
                <label>Contraseña *</label>
                <input name="password" type="password" placeholder="Mínimo 8 caracteres con número" value={form.password} onChange={handleChange} required style={inputStyle} />
                <StrengthMeter password={form.password} />
                {form.password && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      ['8+ chars',   form.password.length >= 8],
                      ['Mayúscula',  /[A-Z]/.test(form.password)],
                      ['Número',     /[0-9]/.test(form.password)],
                      ['Símbolo',    /[^A-Za-z0-9]/.test(form.password)],
                    ].map(([label, ok]) => (
                      <span key={label} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)', color: ok ? '#22c55e' : '#475569', fontWeight: 600 }}>
                        {ok ? '✓' : '○'} {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="auth-field">
                <label>Confirmar contraseña *</label>
                <input name="confirm" type="password" placeholder="Repite la contraseña" value={form.confirm} onChange={handleChange} required style={{ ...inputStyle, borderColor: form.confirm ? (form.password === form.confirm ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(255,255,255,0.1)' }} />
                {form.confirm && form.password !== form.confirm && <span className="auth-field-hint error">Las contraseñas no coinciden</span>}
                {form.confirm && form.password === form.confirm && <span className="auth-field-hint ok">✓ Contraseñas coinciden</span>}
              </div>
            </>
          )}

          {/* ── Paso 2: Identidad ── */}
          {step === 1 && (
            <>
              <div className="auth-field">
                <label>Nombre completo real * <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>(solo para verificación interna)</span></label>
                <input name="full_name" placeholder="Tu nombre y apellido" value={form.full_name} onChange={handleChange} required style={inputStyle} />
              </div>
              <div className="auth-field">
                <label>Nombre de usuario * <span style={{ fontSize: 11, color: '#475569' }}>@visible para todos</span></label>
                <input name="username" placeholder="@tunombre" value={form.username} onChange={handleChange} required minLength={3} maxLength={30} style={inputStyle} />
                {form.username && !/^[a-z0-9._-]*$/.test(form.username.toLowerCase()) && (
                  <span className="auth-field-hint error">Solo letras, números, puntos, guiones y _</span>
                )}
              </div>
              <div className="auth-field">
                <label>Fecha de nacimiento * <span style={{ fontSize: 11, color: '#475569' }}>Requerida para protección de menores</span></label>
                <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} required max={new Date().toISOString().split('T')[0]} style={inputStyle} />
                {age !== null && age >= 13 && (
                  <span className="auth-field-hint ok">Edad calculada: {age} años{age < 18 ? ' — Modo Menores' : ''}</span>
                )}
                <MinorBadge age={age} />
              </div>
              <div className="auth-field">
                <label>País / Ciudad <span className="auth-optional">(opcional)</span></label>
                <input name="origin" placeholder="Madrid, España" value={form.origin} onChange={handleChange} style={inputStyle} />
              </div>
            </>
          )}

          {/* ── Paso 3: Perfil ── */}
          {step === 2 && (
            <>
              <div className="auth-field">
                <label>Biografía <span className="auth-optional">(opcional)</span></label>
                <textarea name="bio" placeholder="Cuéntanos algo sobre ti..." value={form.bio} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div className="auth-field">
                <label>Intereses <span className="auth-optional">(separados por coma)</span></label>
                <input name="interests" placeholder="filosofía, tecnología, arte" value={form.interests} onChange={handleChange} style={inputStyle} />
                {form.interests && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {form.interests.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(127,90,240,0.12)', color: '#a78bfa' }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Security summary */}
              <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(127,90,240,0.07)', border: '1px solid rgba(127,90,240,0.18)', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 8 }}>🔐 Tu cuenta NOX incluye:</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {[
                    'Contraseña cifrada con bcrypt (12 rondas)',
                    'Token JWT firmado y con expiración',
                    'Bloqueo automático tras 5 intentos fallidos',
                    'Sanitización de entradas contra XSS',
                    age !== null && age < 18 ? '🛡️ Modo Menores: comunicación restringida' : 'Cuenta adulto con acceso completo',
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#7f5af0', flexShrink: 0 }} />
                <span>
                  Acepto los{' '}
                  <span style={{ color: '#7f5af0', cursor: 'pointer' }}>Términos de Servicio</span>
                  {' '}y la{' '}
                  <span style={{ color: '#7f5af0', cursor: 'pointer' }}>Política de Privacidad</span>
                  {' '}de NOX, incluyendo el tratamiento de datos según el RGPD.
                </span>
              </label>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-btn-row">
            {step > 0 && (
              <button type="button" className="auth-btn-back" onClick={() => { setError(''); setStep(s => s - 1); }}>← Atrás</button>
            )}
            <button type="submit" className="auth-btn" disabled={loading || (step === 0 && pwInfo.score < 2)}>
              {loading ? 'Creando...' : step < STEPS.length - 1 ? 'Siguiente →' : 'Crear cuenta'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Entra aquí</Link>
        </div>
      </div>
    </div>
  );
}
