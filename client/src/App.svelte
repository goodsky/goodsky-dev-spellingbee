<script>
  // Game state
  let currentWord = $state('');
  let minWordLength = $state(4);
  let foundWords = $state([]);
  let score = $state(0);
  let validWords = $state([]);
  let isLoadingDictionary = $state(true);
  
  // Notification system
  let notification = $state({ show: false, message: 'Blank', type: 'error' });
  let notificationTimeout;

  // Puzzle letters (will be configurable later)
  let letters = $state(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  let centerLetter = 'A'; // Required letter

  // Fetch valid words from API
  async function fetchDictionary() {
    try {
      const response = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letters, minLength: minWordLength })
      });
      const data = await response.json();
      validWords = data.validWords;
      isLoadingDictionary = false;
      console.log(`Loaded ${validWords.length} valid words`);
    } catch (error) {
      console.error('Error fetching dictionary:', error);
      showNotification('Error loading dictionary', 'error');
      isLoadingDictionary = false;
    }
  }

  // Load dictionary on mount
  fetchDictionary();

  // Helper function to show notifications
  function showNotification(message, type = 'error', duration = 2000) {
    clearTimeout(notificationTimeout);
    notification = { show: true, message, type };
    notificationTimeout = setTimeout(() => {
      notification = { ...notification, show: false };
    }, duration);
  }

  // Button handlers
  function handleLetterClick(letter) {
    currentWord += letter;
  }

  function handleDelete() {
    currentWord = currentWord.slice(0, -1);
  }

  function handleCycle() {
    // Shuffle the outer letters (keep center fixed)
    const outer = letters.filter(l => l !== centerLetter);
    const shuffled = outer.sort(() => Math.random() - 0.5);
    letters = [centerLetter, ...shuffled];
  }

  function handleEnter() {
    const proposedWord = currentWord.trim().toUpperCase();

    if (proposedWord.length < minWordLength) {
      showNotification(`Too short! Words must be at least ${minWordLength} letters.`, 'error');
      return;
    }

    // Check if word already found
    if (foundWords.some(w => w.toUpperCase() === proposedWord)) {
      showNotification('Already found!', 'info');
      return;
    }

    // Check if word is in valid dictionary
    if (!validWords.includes(proposedWord)) {
      showNotification('Not in word list!', 'error');
      return;
    }

    // Valid word!
    foundWords = [...foundWords, proposedWord];
    if (proposedWord.length === minWordLength) {
      score += 1;
      showNotification(`Good! +1`, 'success', 800);
    } else {
      score += proposedWord.length;
      showNotification(`Great! +${proposedWord.length}`, 'success', 800);
    }
    currentWord = '';
  }
</script>

<main>
  <div class="game-container">
    <!-- Found words section -->
    <div class="found-words">
      <h2>Found Words ({foundWords.length})</h2>
      <div class="words-list">
        {#each foundWords as word}
          <span class="word-chip">{word}</span>
        {/each}
      </div>
      <div class="score">Score: {score}</div>
    </div>

    <!-- Notification message -->
    <div 
      class="notification" 
      class:visible={notification.show}
      class:error={notification.type === 'error'}
      class:success={notification.type === 'success'}
      class:info={notification.type === 'info'}
    >
      {notification.message}
    </div>

    <!-- Current word display -->
    <div class="current-word">
      {currentWord || 'Type or click letters'}
    </div>

    <!-- Hexagon buttons (placeholder - we'll make these actual hexagons) -->
    <div class="hexagons">
      <div class="hex-grid">
        {#each letters as letter, i}
          <button
            class="hex-button {letter === centerLetter ? 'center' : ''}"
            onclick={() => handleLetterClick(letter)}
          >
            {letter}
          </button>
        {/each}
      </div>
    </div>

    <!-- Control buttons -->
    <div class="controls">
      <button onclick={handleDelete}>Delete</button>
      <button onclick={handleCycle}>Cycle</button>
      <button onclick={handleEnter}>Enter</button>
    </div>
  </div>
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
  }

  .game-container {
    max-width: 600px;
    width: 100%;
    padding: 2rem;
  }

  .found-words {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .words-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 1rem 0;
    min-height: 60px;
    align-items: flex-start;
    line-height: 1;
  }

  .word-chip {
    background: #e0e0e0;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .score {
    font-weight: bold;
    font-size: 1.2rem;
    color: #333;
  }

  .current-word {
    background: white;
    padding: 1.5rem;
    text-align: center;
    font-size: 2rem;
    font-weight: bold;
    border-radius: 8px;
    margin-bottom: 2rem;
    min-height: 60px;
    color: #333;
  }

  .notification {
    color: white;
    padding: 1rem;
    text-align: center;
    font-size: 1.2rem;
    font-weight: bold;
    border-radius: 8px;
    margin-bottom: 1rem;
    opacity: 0;
    transition: opacity 0.3s ease-out;
    pointer-events: none;
  }

  .notification.visible {
    opacity: 1;
  }

  .notification.error {
    background: #ff6b6b;
  }

  .notification.success {
    background: #51cf66;
  }

  .notification.info {
    background: #4dabf7;
  }

  .hexagons {
    margin-bottom: 2rem;
  }

  .hex-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    max-width: 300px;
    margin: 0 auto;
  }

  .hex-button {
    aspect-ratio: 1;
    font-size: 1.5rem;
    font-weight: bold;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hex-button:hover {
    background: #f0f0f0;
    transform: scale(1.05);
  }

  .hex-button.center {
    background: #ffd700;
    border-color: #ffb700;
  }

  .controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .controls button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .controls button:hover {
    background: #f0f0f0;
  }
</style>
