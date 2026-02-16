const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// API routes
app.use('/api/reviews', reviewRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Fallback to frontend
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});

initDb();

app.listen(PORT, () => {
  console.log(`SL-360 QA server running on port ${PORT}`);
});

module.exports = app;
