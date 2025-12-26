const express = require('express');
const path = require('path');
const { loadDictionary, getValidWords } = require('./dictionary');

const app = express();
app.use(express.json());

// Load dictionary on startup
const dictionary = loadDictionary();

// API endpoint to get valid words based on available letters and min length
app.post('/api/dictionary', (req, res) => {
  const { letters, minLength } = req.body;

  if (!letters || !Array.isArray(letters) || letters.length === 0) {
    return res.status(400).json({ error: 'letters array is required' });
  }

  if (!minLength || typeof minLength !== 'number' || minLength < 1) {
    return res.status(400).json({ error: 'valid minLength is required' });
  }

  const validWords = getValidWords(dictionary, letters, minLength);

  res.json({ 
    validWords,
    count: validWords.length
  });
});

// Serve static files from the built Svelte app
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback - serve index.html for all other routes
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Spelling Bee server running on port ${PORT}`);
});
