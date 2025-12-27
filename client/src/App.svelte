<script>
  // Parse URL parameters for puzzle configuration
  const urlParams = new URLSearchParams(window.location.search);
  const lettersParam = urlParams.get('letters');
  const centerLetterParam = urlParams.get('centerLetter');

  // Common letters for random puzzle generation
  const commonLetters = 'AEIOURSTNLCDHPMBGFYWKVXZJQ'.split('');

  // Function to generate random letters
  function generateRandomLetters() {
    const shuffled = [...commonLetters].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 7);
  }

  // Game state
  let currentWord = $state('');
  let minWordLength = $state(4);
  let foundWords = $state([]);
  let score = $state(0);
  let validWords = $state([]);
  let scoringWords = $derived(
    validWords.filter(word => word.includes(centerLetter))
  );
  let isLoadingDictionary = $state(true);
  let menuOpen = $state(false);
  let kidAssistMode = $state(false);
  
  // Get a random unfound scoring word for Kid Assist mode
  let hintWord = $derived(
    kidAssistMode 
      ? getKidAssistWord()
      : ''
  );  
  
  // Notification system
  let notification = $state({ show: false, message: 'Blank', type: 'error' });
  let notificationTimeout;

  // Puzzle letters - configurable via URL parameters or randomized
  // Example: ?letters=ABCDEFG&centerLetter=A
  let letters = $state(
    lettersParam ? lettersParam.toUpperCase().split('') : generateRandomLetters()
  );
  let centerLetter = $state(centerLetterParam ? centerLetterParam.toUpperCase() : (letters[0] || 'A'));

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
      console.log(`${scoringWords.length} contain the center letter "${centerLetter}"`);
    } catch (error) {
      console.error('Error fetching dictionary:', error);
      showNotification('Error loading dictionary', 'error');
      isLoadingDictionary = false;
    }
  }

  function getKidAssistWord() {
    return scoringWords.find(word => word.startsWith(currentWord) && !foundWords.includes(word)) || '';
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
    currentWord = '';

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

    // Check if word is missing center letter
    if (!proposedWord.includes(centerLetter)) {
      showNotification(`Must include letter "${centerLetter}"!`, 'error');
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
  }

  function toggleMenu(event) {
    event.stopPropagation();
    menuOpen = !menuOpen;
  }

  function toggleKidAssist() {
    kidAssistMode = !kidAssistMode;
  }

  function closeMenu() {
    if (menuOpen) {
      menuOpen = false;
    }
  }

  function resetPuzzle() {
    // Generate new random letters
    letters = generateRandomLetters();
    centerLetter = letters[0];
    
    // Reset game state
    currentWord = '';
    foundWords = [];
    score = 0;
    menuOpen = false;
    
    // Fetch new dictionary for the new letters
    isLoadingDictionary = true;
    fetchDictionary();
    
    showNotification('New puzzle!', 'info', 1000);
  }
</script>

<!-- Backdrop to close menu when clicking outside -->
{#if menuOpen}
  <div class="menu-backdrop" onclick={closeMenu}></div>
{/if}

<main>
  <div class="game-container">
    <!-- Menu bar at top -->
    <div class="header">
      <button 
        class="kid-assist-button" 
        class:active={kidAssistMode}
        onclick={toggleKidAssist}
      >
        Kid Assist
        <span class="status-box">{kidAssistMode ? 'ON' : 'OFF'}</span>
      </button>
      <button class="menu-button" onclick={toggleMenu}>☰</button>
      {#if menuOpen}
        <div class="menu-dropdown">
          <button class="menu-item" onclick={resetPuzzle}>New Puzzle</button>
        </div>
      {/if}
    </div>

    <!-- Found words section -->
    <div class="found-words">
      <h2>Found Words ({foundWords.length}/{scoringWords.length})</h2>
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
    <div class="current-word" class:complete={kidAssistMode && hintWord && currentWord.length === hintWord.length}>
      {#if kidAssistMode && hintWord}
        {#each hintWord.split('') as letter, i}
          <span class:ghost={i >= currentWord.length}>
            {i < currentWord.length ? currentWord[i] : letter}
          </span>
        {/each}
      {:else if currentWord}
        {currentWord}
      {:else}
        <span class="cursor">_</span>
      {/if}
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
      <button class="delete" onclick={handleDelete}>Delete</button>
      <button onclick={handleCycle}><img src="/cycle.svg" alt="Cycle" /></button>
      <button class="enter" onclick={handleEnter}>Enter</button>
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

  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
  }

  .game-container {
    max-width: 600px;
    width: 100%;
    padding: 2rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    position: relative;
  }

  .kid-assist-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
  }

  .kid-assist-button:hover {
    background: #f0f0f0;
  }

  .kid-assist-button.active {
    background: #4dabf7;
    color: white;
    border-color: #339af0;
  }

  .status-box {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
    min-width: 32px;
    text-align: center;
  }

  .kid-assist-button.active .status-box {
    background: rgba(255, 255, 255, 0.3);
  }

  .menu-button {
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1.5rem;
    width: 48px;
    height: 48px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-button:hover {
    background: #f0f0f0;
    transform: scale(1.05);
  }

  .menu-dropdown {
    position: absolute;
    top: 56px;
    right: 0;
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    min-width: 150px;
    z-index: 100;
  }

  .menu-item {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
  }

  .menu-item:hover {
    background: #f0f0f0;
  }

  .menu-item:first-child {
    border-radius: 6px 6px 0 0;
  }

  .menu-item:last-child {
    border-radius: 0 0 6px 6px;
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
    min-height: 30px;
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

  .current-word.complete {
    color: #51cf66;
  }

  .current-word .ghost {
    opacity: 0.25;
  }

  .current-word .cursor {
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 50% {
      opacity: 1;
    }
    50.01%, 100% {
      opacity: 0;
    }
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
    padding: 0.75rem 1.0rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 16px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .controls button:hover {
    background: #f0f0f0;
  }

  .controls button.delete {
    background: #ff6b6b;
    border-color: #fa5252;
    color: white;
  }

  .controls button.delete:hover {
    background: #fa5252;
  }

  .controls button.enter {
    background: #51cf66;
    border-color: #40c057;
    color: white;
  }

  .controls button.enter:hover {
    background: #40c057;
  }
</style>
