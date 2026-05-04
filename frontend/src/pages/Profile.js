import React, { useEffect, useState } from 'react';
import MyLinkMessages from '../components/DirectMessages';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [storyInput, setStoryInput] = useState('');
  const [reels, setReels] = useState([]);
  const [reelInput, setReelInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [destacados, setDestacados] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ bio: '', interests: '', age: '', origin: '', account_type: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/users/${id}`)
      .then(res => {
        setProfile(res.data);
        setForm({
          bio: res.data.bio || '',
          interests: (res.data.interests || []).join(', '),
          age: res.data.age || '',
          origin: res.data.origin || '',
          account_type: res.data.account_type || 'normal'
        });
      })
      .catch(() => setError('No se pudo cargar el perfil'));
    axios.get(`/api/users/${id}/posts`)
      .then(res => setPosts(res.data))
      .catch(() => {});
    // Simulación de datos para stories, reels y mensajes
    setStories([
      { id: 1, content: 'Story 1' },
      { id: 2, content: 'Story 2' },
      { id: 3, content: 'Story 3' }
    ]);
    setReels([
      { id: 1, title: 'Reel 1', created_at: new Date() },
      { id: 2, title: 'Reel 2', created_at: new Date() }
    ]);
    setMessages([
      { id: 1, sender: 'UsuarioA', content: '¡Hola!', created_at: new Date() },
      { id: 2, sender: 'UsuarioB', content: '¿Cómo estás?', created_at: new Date() }
    ]);
  }, [id]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        interests: form.interests.split(',').map(i => i.trim()),
        principios: form.principios.split(',').map(p => p.trim())
      };
      const res = await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(res.data);
      setEdit(false);
    } catch (err) {
      setError('Error al actualizar el perfil');
    }
  };

  const handleAccountType = async (type) => {
    setError('');
    try {
      const payload = { ...form, account_type: type, interests: form.interests.split(',').map(i => i.trim()) };
      const res = await axios.put(`/api/users/${id}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProfile(res.data);
      setForm(f => ({ ...f, account_type: type }));
    } catch (err) {
      setError('Error al cambiar tipo de cuenta');
    }
  };

  if (!profile) return <div>Cargando...</div>;

  // Principios (puedes editar en el perfil)
  const principios = profile.principios || [
    'Pensamiento crítico',
    'Colaboración',
    'Respeto a la diversidad',
  ];
  // Ideas más potentes: top 3 ideas con más encendidos
  const ideasPotentes = posts
    .sort((a, b) => (b.ignite_count || 0) - (a.ignite_count || 0))
    .slice(0, 3);
  // Historial de debates: ideas con más desafíos
  const debates = posts
    .filter(p => (p.challenge_count || 0) > 0)
    .sort((a, b) => (b.challenge_count || 0) - (a.challenge_count || 0));

  return (
    <div style={{maxWidth: 500, margin: '0 auto', border: '1px solid #ccc', borderRadius: 8, padding: 24}}>
      <h2 style={{marginBottom: 0}}>{profile.username}</h2>
      <div style={{fontSize:15, color:'#7fd7ff', marginBottom:16, fontWeight:'bold'}}>Nivel de pensamiento: {profile.thought_level}</div>
      <h3 style={{marginTop:0, marginBottom:16, color:'#bfc4c9'}}>Cerebro Público</h3>
      {/* Principios */}
      <div style={{marginBottom: 16, border: '1px solid #eee', borderRadius: 4, padding: 8}}>
        <h4>Principios</h4>
        <ul>
          {principios.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
      {/* Ideas más potentes */}
      <div style={{marginBottom: 16, border: '1px solid #eee', borderRadius: 4, padding: 8}}>
        <h4>Ideas más potentes</h4>
        {ideasPotentes.length === 0 ? <div>No hay ideas destacadas aún.</div> : (
          <ul>
            {ideasPotentes.map(idea => (
              <li key={idea.id}>
                <b>{idea.title}</b> <span style={{color:'#f90'}}>🔥 {idea.ignite_count || 0}</span>
                <div style={{fontSize:12}}>{idea.body}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Historial de debates */}
      <div style={{marginBottom: 16, border: '1px solid #eee', borderRadius: 4, padding: 8}}>
        <h4>Historial de debates</h4>
        {debates.length === 0 ? <div>No hay debates aún.</div> : (
          <ul>
            {debates.map(idea => (
              <li key={idea.id}>
                <b>{idea.title}</b> <span style={{color:'#09f'}}>⚡ {idea.challenge_count || 0}</span>
                <div style={{fontSize:12}}>{idea.body}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Administración de cuentas (multi-cuenta) */}
      <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}>
        <label><b>Cambiar de cuenta:</b></label>
        <select
          onChange={e => {
            const user = JSON.parse(localStorage.getItem('multi_accounts') || '[]').find(u => u.id === Number(e.target.value));
            if (user) {
              localStorage.setItem('user', JSON.stringify(user));
              window.location.href = `/profile/${user.id}`;
            }
          }}
          value={profile.id}
        >
          {(JSON.parse(localStorage.getItem('multi_accounts') || '[]')).map(u => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
        <button onClick={() => {
          const accounts = JSON.parse(localStorage.getItem('multi_accounts') || '[]');
          const current = JSON.parse(localStorage.getItem('user'));
          if (!accounts.find(u => u.id === current.id)) {
            accounts.push(current);
            localStorage.setItem('multi_accounts', JSON.stringify(accounts));
            alert('Cuenta añadida a multi-cuentas');
          } else {
            alert('Esta cuenta ya está añadida');
          }
        }}>Añadir cuenta</button>
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 16}}>
        <div style={{position: 'absolute', right: 24, top: 24}}>
          {profile.verified && <span style={{color: 'blue', fontWeight: 'bold'}}>✔ Verificado</span>}
        </div>
        <div style={{textAlign: 'center'}}>
          <b>{profile.posts_count}</b>
          <div>Publicaciones</div>
        </div>
        <div style={{textAlign: 'center'}}>
          <b>{profile.followers_count}</b>
          <div>Seguidores</div>
        </div>
        <div style={{textAlign: 'center'}}>
          <b>{profile.following_count}</b>
          <div>Siguiendo</div>
        </div>
      </div>
      {edit ? (
        <form onSubmit={handleEdit}>
          <input name="bio" placeholder="Biografía" value={form.bio} onChange={handleChange} />
          <input name="interests" placeholder="Intereses (separados por coma)" value={form.interests} onChange={handleChange} />
          <input name="age" type="number" placeholder="Edad" value={form.age} onChange={handleChange} />
          <input name="origin" placeholder="Origen" value={form.origin} onChange={handleChange} />
          <button type="submit">Guardar</button>
          <button type="button" onClick={() => setEdit(false)}>Cancelar</button>
        </form>
      ) : (
        <div>
          <p><b>Usuario:</b> {profile.username}</p>
          <p><b>Email:</b> {profile.email}</p>
          <p><b>Biografía:</b> {profile.bio}</p>
          <p><b>Intereses:</b> {(profile.interests || []).join(', ')}</p>
          <p><b>Edad:</b> {profile.age}</p>
          <p><b>Origen:</b> {profile.origin}</p>
          <div style={{marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap'}}>
            <button onClick={() => setEdit(true)}>Editar perfil</button>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.origin + `/profile/${profile.id}`);
              alert('¡Enlace de perfil copiado!');
            }}>Compartir perfil</button>
            <button onClick={() => handleAccountType('profesional')}>Panel profesional</button>
            <button onClick={() => handleAccountType('hobby')}>Panel hobby</button>
            <button onClick={() => handleAccountType('creativo')}>Panel creativo</button>
            <span style={{marginLeft: 8}}><b>Tipo de cuenta:</b> {profile.account_type}</span>
            {/* Aquí puedes agregar más opciones como administración de cuentas, privacidad, etc. */}
          </div>
        </div>
      )}
      {error && <p style={{color:'red'}}>{error}</p>}
      {/* Módulo de privacidad */}
      <div style={{marginBottom: 16, border: '1px solid #eee', borderRadius: 4, padding: 8}}>
        <h4>Privacidad</h4>
        <label>
          <input type="checkbox" checked={profile.account_type === 'privado'} onChange={e => handleAccountType(e.target.checked ? 'privado' : 'normal')} />
          Cuenta privada
        </label>
        <div style={{fontSize: 12, color: '#888', marginTop: 4}}>
          Si tu cuenta es privada, solo tus seguidores podrán ver tus publicaciones.
        </div>
      </div>
      {/* Destacados interactivo */}
      <div style={{marginBottom: 16}}>
        <h4>Destacados</h4>
        <button onClick={() => setDestacados(posts.slice(0, 3))}>Destacar primeros 3 posts</button>
        <div style={{display: 'flex', gap: 8}}>
          {destacados.map(post => (
            <div key={post.id} style={{border: '2px solid gold', borderRadius: 8, padding: 8, minWidth: 100}}>
              <b>{post.content}</b>
              <div style={{fontSize: 10, color: '#888'}}>{new Date(post.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Rail (Stories) interactivo */}
      <div style={{marginBottom: 16}}>
        <h4>Rail (Stories)</h4>
        <form onSubmit={e => { e.preventDefault(); setStories([...stories, { id: Date.now(), content: storyInput }]); setStoryInput(''); }}>
          <input value={storyInput} onChange={e => setStoryInput(e.target.value)} placeholder="Nueva story" />
          <button type="submit">Subir story</button>
        </form>
        <div style={{display: 'flex', gap: 8}}>
          {stories.map(story => (
            <div key={story.id} style={{border: '1px solid #aaa', borderRadius: '50%', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9'}}>
              <span>{story.content}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Movie (Reels) interactivo */}
      <div style={{marginBottom: 16}}>
        <h4>Movie (Reels)</h4>
        <form onSubmit={e => { e.preventDefault(); setReels([...reels, { id: Date.now(), title: reelInput, created_at: new Date() }]); setReelInput(''); }}>
          <input value={reelInput} onChange={e => setReelInput(e.target.value)} placeholder="Nuevo reel" />
          <button type="submit">Subir reel</button>
        </form>
        <div style={{display: 'flex', gap: 8}}>
          {reels.map(reel => (
            <div key={reel.id} style={{border: '1px solid #aaa', borderRadius: 8, padding: 8, minWidth: 120, background: '#f0f0ff'}}>
              <b>{reel.title}</b>
              <div style={{fontSize: 10, color: '#888'}}>{new Date(reel.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Mensajería real entre usuarios */}
      <div style={{marginBottom: 16}}>
        <h4>Mensajería directa</h4>
        {(() => {
          const currentUser = JSON.parse(localStorage.getItem('user'));
          if (!currentUser || currentUser.id === profile.id) {
            return <div style={{color:'#888'}}>Inicia sesión con otra cuenta para enviar mensajes a este usuario.</div>;
          }
          return <MyLinkMessages user={currentUser} peer={profile} />;
        })()}
      </div>
      <div style={{marginTop: 32}}>
        <h3>Mis publicaciones</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8}}>
          {posts.map(post => (
            <div key={post.id} style={{border: '1px solid #eee', borderRadius: 4, padding: 8, minHeight: 60}}>
              {post.content}
              <div style={{fontSize: 10, color: '#888'}}>{new Date(post.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
