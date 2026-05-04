// StructuredIdeaForm.js - Formulario para ideas estructuradas (premisa, argumento, evidencia, conclusión, contraargumento)
import React, { useState } from 'react';

const initialState = {
  premise: '',
  argument: '',
  evidence: '',
  conclusion: '',
  counterargument: ''
};

export default function StructuredIdeaForm({ onSubmit, initialData }) {
  const [fields, setFields] = useState(initialData || initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit(fields);
      setFields(initialState);
    } catch (err) {
      setError(err.message || 'Error al enviar la idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="structured-idea-form">
      <label>Premisa
        <textarea name="premise" value={fields.premise} onChange={handleChange} required />
      </label>
      <label>Argumento
        <textarea name="argument" value={fields.argument} onChange={handleChange} required />
      </label>
      <label>Evidencia
        <textarea name="evidence" value={fields.evidence} onChange={handleChange} required />
      </label>
      <label>Conclusión
        <textarea name="conclusion" value={fields.conclusion} onChange={handleChange} required />
      </label>
      <label>Contraargumento (opcional)
        <textarea name="counterargument" value={fields.counterargument} onChange={handleChange} />
      </label>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar Idea'}</button>
    </form>
  );
}
