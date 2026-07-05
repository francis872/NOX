// ai.js - Endpoints para IA (moderación, sugerencias) — OpenAI v6
const express = require('express');
const router = express.Router();

const getOpenAI = () => {
  const apiKey = process.env.LLAMA_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const OpenAI = require('openai');
  const baseURL = process.env.LLAMA_BASE_URL || process.env.OPENAI_BASE_URL;
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
};

const chatModel = process.env.LLAMA_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

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
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: 'Eres el asistente de NOX. Responde breve, claro, con criterio y tono natural. Evita relleno y emojis salvo que el usuario ya los use.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 120
    });
    res.json({ suggestion: response.choices[0].message.content });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
