const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files from the built Svelte app
app.use(express.static(path.join(__dirname, '../public')));

// API routes will go here in the future
// Example: app.post('/api/report-word', (req, res) => { ... });

// SPA fallback - serve index.html for all other routes
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Spelling Bee server running on port ${PORT}`);
});
