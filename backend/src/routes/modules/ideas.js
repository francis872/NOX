const express = require('express');
const router = express.Router();
const pool = require('../../db');

// Crear idea (post estructurado)
router.post('/', async (req, res) => {
  const { user_id, title, body } = req.body;
  const MIN_CHARS = 80; // mínimo de caracteres en el body
  const MAX_POSTS_PER_DAY = 3; // máximo de posts por día
  if (!user_id || !title || !body) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  if (body.length < MIN_CHARS) {
    return res.status(400).json({ error: `El desarrollo debe tener al menos ${MIN_CHARS} caracteres.` });
  }
  try {
    // Límite de posts por día
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM posts WHERE user_id = $1 AND created_at >= $2 AND created_at < $3',
      [user_id, today, tomorrow]
    );
    const postsToday = parseInt(countResult.rows[0].count);
    if (postsToday >= MAX_POSTS_PER_DAY) {
      return res.status(429).json({ error: `Límite de ${MAX_POSTS_PER_DAY} ideas por día alcanzado.` });
    }
    const result = await pool.query(
      'INSERT INTO posts (user_id, title, body) VALUES ($1, $2, $3) RETURNING *',
      [user_id, title, body]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear idea' });
  }
});

// Reaccionar a una idea (🔥, 🧠, ⚡)
router.post('/:id/react', async (req, res) => {
  const { type } = req.body; // 'ignite', 'expand', 'challenge'
  if (!['ignite', 'expand', 'challenge'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de reacción inválido' });
  }
  try {
    const field = type === 'ignite' ? 'ignite_count' : type === 'expand' ? 'expand_count' : 'challenge_count';
    const result = await pool.query(
      `UPDATE posts SET ${field} = ${field} + 1 WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Idea no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al reaccionar' });
  }
});

// Obtener ideas (feed)
router.get('/', async (req, res) => {
  try {
    // Traer todas las ideas
    const result = await pool.query('SELECT *, LENGTH(body) as depth FROM posts');
    // Calcular score heurístico para cada idea
    const ideas = result.rows.map(idea => {
      // Profundidad: longitud del body
      const profundidad = parseInt(idea.depth) || 0;
      // Impacto: suma de expand y challenge
      const impacto = (idea.expand_count || 0) + (idea.challenge_count || 0);
      // Originalidad: menos reacciones totales (menos "ignite"), más original
      const originalidad = 100 - ((idea.ignite_count || 0) + (idea.expand_count || 0) + (idea.challenge_count || 0));
      // Score heurístico (ajusta pesos según preferencia)
      const score = (profundidad * 1.5) + (impacto * 3) + (originalidad * 2);
      return { ...idea, score };
    });
    // Ordenar por score descendente
    ideas.sort((a, b) => b.score - a.score);
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ideas' });
  }
});

module.exports = router;
