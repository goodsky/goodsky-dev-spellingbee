const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '../data/dict.txt');

function loadDictionary() {
  try {
    const dictContent = fs.readFileSync(dictPath, 'utf-8');
    const dictionary = dictContent.split('\n').map(word => word.trim().toUpperCase()).filter(word => word.length > 0);
    console.log(`Loaded ${dictionary.length} words from dictionary`);
    return dictionary;
  } catch (error) {
    console.error('Error loading dictionary:', error);
  }
}

function getValidWords(dictionary, letters, minLength) {
  const availableLetters = letters.map(l => l.toUpperCase());
  const letterSet = new Set(availableLetters);

  const validWords = dictionary.filter(word => {
    if (word.length < minLength) return false;

    for (const char of word) {
      if (!letterSet.has(char)) return false;
    }

    return true;
  });

  return validWords;
}

module.exports = {
  loadDictionary,
  getValidWords
};
