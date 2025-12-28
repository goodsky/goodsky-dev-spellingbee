const express = require('express');
const path = require('path');
const fs = require('fs');
const { loadDictionary, getValidWords } = require('./dictionary');

const app = express();
app.use(express.json());

// Determine storage path based on environment
const STORAGE_PATH = process.env.NODE_ENV === 'production' 
  ? '/app/storage' 
  : path.join(__dirname, '../storage');

// Maximum number of words that can be reported per type
const MAX_REPORTED_WORDS = 1000;

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

const REPORTED_ADD_FILE = path.join(STORAGE_PATH, 'reported_add.txt');
const REPORTED_REMOVE_FILE = path.join(STORAGE_PATH, 'reported_remove.txt');

// Helper functions for file operations
function readReportedWords(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').filter(line => line.trim().length > 0);
}

function appendReportedWord(filePath, word) {
  const existingWords = readReportedWords(filePath);
  
  // Check if limit reached
  if (existingWords.length >= MAX_REPORTED_WORDS) {
    return false;
  }
  
  // Check if word already exists
  if (existingWords.includes(word)) {
    return true; // Already exists, consider it a success
  }
  
  fs.appendFileSync(filePath, word + '\n', 'utf-8');
  return true;
}

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

// POST endpoint to report a word (add or remove suggestion)
app.post('/api/dictionary/report', (req, res) => {
  const { word, type } = req.body;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ error: 'word is required and must be a string' });
  }

  if (!type || (type !== 'add' && type !== 'remove')) {
    return res.status(400).json({ error: 'type must be either "add" or "remove"' });
  }

  const normalizedWord = word.trim().toUpperCase();

  if (normalizedWord.length === 0) {
    return res.status(400).json({ error: 'word cannot be empty' });
  }

  // Append to appropriate file
  const filePath = type === 'add' ? REPORTED_ADD_FILE : REPORTED_REMOVE_FILE;
  const success = appendReportedWord(filePath, normalizedWord);
  
  if (!success) {
    return res.status(429).json({ error: 'Maximum number of reported words reached' });
  }

  res.status(200).end();
});

// GET endpoint to retrieve all reported words
app.get('/api/dictionary/report', (req, res) => {
  const addWords = readReportedWords(REPORTED_ADD_FILE);
  const removeWords = readReportedWords(REPORTED_REMOVE_FILE);

  res.json({
    add: addWords,
    remove: removeWords
  });
});

// DELETE endpoint to clear all reported words
app.delete('/api/dictionary/report', (req, res) => {
  // Clear both files by writing empty content
  if (fs.existsSync(REPORTED_ADD_FILE)) {
    fs.writeFileSync(REPORTED_ADD_FILE, '', 'utf-8');
  }
  if (fs.existsSync(REPORTED_REMOVE_FILE)) {
    fs.writeFileSync(REPORTED_REMOVE_FILE, '', 'utf-8');
  }

  res.status(200).end();
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
