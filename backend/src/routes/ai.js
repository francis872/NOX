// ai.js - Endpoints para IA (moderación, sugerencias, coaching)
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

// Moderar texto
router.post('/moderate', async (req, res) => {
  try {
    const { text } = req.body;
    const response = await openai.createModeration({ input: text });
    res.json(response.data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sugerir ideas
router.post('/suggest', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 80
    });
    res.json({ suggestion: response.data.choices[0].text });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
