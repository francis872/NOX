// missions.js - Endpoints for user missions (retos, quests)
const express = require('express');
const router = express.Router();

// Missions would be stored in DB in a real system
const missions = [
  { id: 1, title: 'Desafía una idea popular', description: 'Encuentra una idea con muchos encendidos y publícale un contraargumento.' },
  { id: 2, title: 'Evoluciona una idea', description: 'Haz un fork de una idea y mejora su argumento o evidencia.' },
  { id: 3, title: 'Cita una fuente', description: 'Publica una idea que incluya al menos una cita o referencia.' }
];

// Get all missions
router.get('/', (req, res) => {
  res.json(missions);
});

// Mark mission as completed (stub)
router.post('/:id/complete', (req, res) => {
  res.json({ success: true, mission_id: req.params.id });
});

module.exports = router;
