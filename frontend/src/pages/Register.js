import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';

const STEPS = [
  { key: 'credentials', label: 'Acceso' },
  { key: 'identity',    label: 'Identidad' },
  { key: 'interests',   label: 'Intereses' },
];

function calcAge(birthdate) {
  if (!birthdate) return null;
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function Register() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', bio: '', birthdate: '', interests: '', origin: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const computedAge = calcAge(form.birthdate);

  const validateStep = () => {
    if (step === 0) {
      if (!form.username.trim()) return 'El nombre de usuario es obligatorio.';
      if (!form.email.trim()) return 'El email es obligatorio.';
      if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
      if (form.password !== form.confirm) return 'Las contraseñas no coinciden.';
    }
    if (step === 1 && form.birthdate) {
      const age = calcAge(form.birthdate);
      if (age < 13) return 'Debes tener al menos 13 años para registrarte.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateStep();
    if (validationError) { setError(validationError); return; }
    setError('');

    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }

    setLoading(true);
    try {
      const { confirm, birthdate, ...rest } = form;
      const payload = {
        ...rest,
        age: computedAge,
        interests: form.interests.split(',').map(i => i.trim()).filter(Boolean),
      };
      await axios.post('/api/auth/register', payload);
      navigate('/login');
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || `Error ${err.response.status}`);
      } else {
        setError('No se pudo conectar con el servidor. Asegúrate de que el backend esté activo.');
      }
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
            <div key={s.key} className={`auth-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
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
              <div className="auth-field">
                <label>Confirmar contraseña</label>
                <input name="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={handleChange} required />
                {form.confirm && form.password !== form.confirm && (
                  <span className="auth-field-hint error">Las contraseñas no coinciden</span>
                )}
                {form.confirm && form.password === form.confirm && form.confirm.length > 0 && (
                  <span className="auth-field-hint ok">✓ Las contraseñas coinciden</span>
                )}
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
                <label>Fecha de nacimiento <span className="auth-optional">(opcional)</span></label>
                <input name="birthdate" type="date" value={form.birthdate} onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]} />
                {computedAge !== null && (
                  <span className="auth-field-hint ok">Edad calculada: {computedAge} años</span>
                )}
                {form.birthdate && computedAge !== null && computedAge < 13 && (
                  <span className="auth-field-hint error">Debes tener al menos 13 años</span>
                )}
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
                {form.interests && (
                  <div className="auth-tags-preview">
                    {form.interests.split(',').map(i => i.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="auth-tag">{tag}</span>
                    ))}
                  </div>
                )}
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
