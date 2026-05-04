import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', bio: '', interests: '', age: '', origin: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, interests: form.interests.split(',').map(i => i.trim()) };
      const res = await axios.post('/api/auth/register', payload);
      navigate(`/login`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear cuenta');
    }
  };

  return (
    <div>
      <h2>Únete a NOX</h2>
      <div style={{fontSize:14, color:'#7fd7ff', marginBottom:16, fontFamily:'inherit', textAlign:'center'}}>
        Aquí no vienes a mirar. Vienes a pensar.<br/>
        <span style={{color:'#bfc4c9'}}>Un sistema para encender ideas en personas que piensan diferente.</span>
      </div>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Usuario" value={form.username} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
        <input name="bio" placeholder="Biografía" value={form.bio} onChange={handleChange} />
        <input name="interests" placeholder="Intereses (separados por coma)" value={form.interests} onChange={handleChange} />
        <input name="age" type="number" placeholder="Edad" value={form.age} onChange={handleChange} />
        <input name="origin" placeholder="Origen" value={form.origin} onChange={handleChange} />
        <button type="submit">Registrarse</button>
      </form>
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  );
}

export default Register;
