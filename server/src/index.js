const express = require('express');
const path = require('path');
const { loadDictionary, getValidWords } = require('./dictionary');
const reportRouter = require('./report');

const app = express();
app.use(express.json());

// Load dictionary on startup
const dictionary = loadDictionary();

// Common letters for random puzzle generation (weighted by frequency)
const commonLetters = 'AEIOURSTNLCDHPMBGFYWKVXZJQ'.split('');

// Helper function to generate random letters with scoring heuristic
function generateSmartNewGame(dictionary, minLength = 4) {
  const maxAttempts = 10;
  let bestLetters = null;
  let bestScore = -1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Shuffle and pick 7 letters
    const shuffled = [...commonLetters].sort(() => Math.random() - 0.5);
    const letters = shuffled.slice(0, 7);
    
    // Try each letter as center
    for (const centerLetter of letters) {
      const validWords = getValidWords(dictionary, letters, minLength);
      const scoringWords = validWords.filter(word => word.includes(centerLetter));
      
      // Calculate score based on:
      // 1. How many letters are used (want to use all letters)
      // 2. Total Score (want good amount, not too few, not overwhelming)
      const usedLetters = new Set(scoringWords.join('').split(''));
      const totalScore = scoringWords.reduce((sum, word) => {
        return sum + (word.length === minLength ? 1 : word.length);
      }, 0);

      // 20 points per unique letter used
      const uniqueLetterScore = usedLetters.size * 20;
      
      // 100 points max for total score in ideal range
      const totalScoreScore = Math.max(0, 100 - Math.abs(100 - totalScore) / 2);
      
      const heuristicScore = uniqueLetterScore + totalScoreScore;
      
      if (heuristicScore > bestScore) {
        bestScore = heuristicScore;
        bestLetters = {
          letters,
          centerLetter,
          validWords,
          stats: {
            usedLetterCount: usedLetters.size,
            totalPossibleScore: totalScore,
            heuristicScore
          }
        };
      }
    }
  }
  
  return bestLetters;
}

// GET endpoint to generate a new game with smart letter selection
app.get('/api/newgame', (req, res) => {
  const minLength = parseInt(req.query.minLength) || 4;
  
  const result = generateSmartNewGame(dictionary, minLength);
  
  if (!result) {
    return res.status(500).json({ error: 'Failed to generate valid game' });
  }
  
  res.json({
    letters: result.letters,
    centerLetter: result.centerLetter,
    validWords: result.validWords,
    stats: result.stats
  });
});

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

// Mount report router
app.use('/api/dictionary/report', reportRouter);

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
