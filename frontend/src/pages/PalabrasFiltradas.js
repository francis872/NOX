import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PalabrasFiltradas() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [palabras, setPalabras] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      axios.get(`/api/filtered_words/${user.id}`)
        .then(res => setPalabras(res.data))
        .catch(() => setError('Error al cargar palabras filtradas'));
    }
  }, [user]);

  const agregar = async () => {
    if (!input) return;
    try {
      await axios.post(`/api/filtered_words/${user.id}`, { word: input });
      const res = await axios.get(`/api/filtered_words/${user.id}`);
      setPalabras(res.data);
      setInput('');
    } catch {
      setError('Error al agregar palabra');
    }
  };

  const eliminar = async (word_id) => {
    try {
      await axios.delete(`/api/filtered_words/${user.id}/${word_id}`);
      setPalabras(palabras.filter(p => p.id !== word_id));
    } catch {
      setError('Error al eliminar palabra');
    }
  };

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <h2>Palabras filtradas</h2>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Agregar palabra" />
      <button onClick={agregar}>Agregar</button>
      {error && <div style={{color:'red'}}>{error}</div>}
      <ul>
        {palabras.map(p => (
          <li key={p.id} style={{display:'flex',alignItems:'center',gap:8}}>
            {p.word}
            <button onClick={() => eliminar(p.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PalabrasFiltradas;
