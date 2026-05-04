// ai.js - Endpoints para IA (moderación, sugerencias) — OpenAI v6
const express = require('express');
const router = express.Router();

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  const OpenAI = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// Moderar texto
router.post('/moderate', async (req, res) => {
  try {
    const openai = getOpenAI();
    if (!openai) return res.status(503).json({ error: 'IA no disponible' });
    const { text } = req.body;
    const response = await openai.moderations.create({ input: text });
    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sugerir ideas
router.post('/suggest', async (req, res) => {
  try {
    const openai = getOpenAI();
    if (!openai) return res.status(503).json({ error: 'IA no disponible' });
    const { prompt } = req.body;
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120
    });
    res.json({ suggestion: response.choices[0].message.content });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
