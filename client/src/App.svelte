<script>
  // Game state
  let currentWord = '';
  let foundWords = [];
  let score = 0;

  // Puzzle letters (will be configurable later)
  let letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  let centerLetter = 'A'; // Required letter

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
    // TODO: Validate word and update score
    if (currentWord.length >= 4) {
      foundWords = [...foundWords, currentWord];
      score += currentWord.length;
      currentWord = '';
    }
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
            on:click={() => handleLetterClick(letter)}
          >
            {letter}
          </button>
        {/each}
      </div>
    </div>

    <!-- Control buttons -->
    <div class="controls">
      <button on:click={handleDelete}>Delete</button>
      <button on:click={handleCycle}>Cycle</button>
      <button on:click={handleEnter}>Enter</button>
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
  }

  .word-chip {
    background: #e0e0e0;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.9rem;
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
