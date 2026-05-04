import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';

const STEPS = [
  { key: 'credentials', label: 'Acceso' },
  { key: 'identity',    label: 'Identidad' },
  { key: 'interests',   label: 'Intereses' },
];

function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '', interests: '', age: '', origin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, interests: form.interests.split(',').map(i => i.trim()).filter(Boolean) };
      await axios.post('/api/auth/register', payload);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
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
            <div key={s.key} className={`auth-step ${i === step ? 'active' : i < step ? 'done' : ''}` }>
              <div className="auth-step-dot">{i < step ? '✓' : i + 1}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 0 && (
            <>
              <div className="auth-field">
                <label>Usuario</label>
                <input name="username" placeholder="@tunombre" value={form.username} onChange={handleChange} required />
              </div>
              <div className="auth-field">
                <label>Email</label>
                <input name="email" type="email" placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="auth-field">
                <label>Contraseña</label>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="auth-field">
                <label>Biografía <span className="auth-optional">(opcional)</span></label>
                <textarea name="bio" placeholder="Cuéntanos algo sobre ti..." value={form.bio} onChange={handleChange} rows={3} style={{resize:'vertical'}} />
              </div>
              <div className="auth-field">
                <label>Edad <span className="auth-optional">(opcional)</span></label>
                <input name="age" type="number" placeholder="23" value={form.age} onChange={handleChange} min={13} />
              </div>
              <div className="auth-field">
                <label>Origen <span className="auth-optional">(opcional)</span></label>
                <input name="origin" placeholder="Ciudad, País" value={form.origin} onChange={handleChange} />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="auth-field">
                <label>Intereses <span className="auth-optional">(separados por coma)</span></label>
                <input name="interests" placeholder="filosofía, tecnología, arte" value={form.interests} onChange={handleChange} />
              </div>
              <div className="auth-plan-info">
                <div className="auth-plan-badge">PLAN FREE</div>
                <ul>
                  <li>✓ Acceso completo a la plataforma</li>
                  <li>✓ Crea y comenta ideas</li>
                  <li>✓ Mensajes directos</li>
                  <li>✓ Sin tarjeta de crédito</li>
                </ul>
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-btn-row">
            {step > 0 && (
              <button type="button" className="auth-btn-back" onClick={() => setStep(s => s - 1)}>← Atrás</button>
            )}
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creando...' : step < STEPS.length - 1 ? 'Siguiente →' : 'Crear cuenta gratis'}
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

export default Register;
