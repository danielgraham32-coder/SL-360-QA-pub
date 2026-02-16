const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { runReview } = require('../engine/reviewer');

const router = express.Router();

// Submit a new review
router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const id = uuidv4();
  const db = getDb();

  db.prepare('INSERT INTO reviews (id, url, status) VALUES (?, ?, ?)').run(id, url, 'pending');

  // Start review in background
  runReview(id, url).catch((err) => {
    console.error(`Review ${id} failed:`, err);
    db.prepare("UPDATE reviews SET status = 'failed', summary = ? WHERE id = ?").run(
      err.message,
      id
    );
  });

  res.status(201).json({ id, url, status: 'pending' });
});

// Get all reviews
router.get('/', (_req, res) => {
  const db = getDb();
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json(reviews);
});

// Get a single review with findings
router.get('/:id', (req, res) => {
  const db = getDb();
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  const findings = db
    .prepare('SELECT * FROM findings WHERE review_id = ? ORDER BY slide_number, category')
    .all(req.params.id);

  const slides = db
    .prepare('SELECT * FROM slides WHERE review_id = ? ORDER BY slide_number')
    .all(req.params.id);

  const categorySummary = db
    .prepare(
      `SELECT category, severity, COUNT(*) as count
       FROM findings WHERE review_id = ?
       GROUP BY category, severity`
    )
    .all(req.params.id);

  res.json({ ...review, findings, slides, categorySummary });
});

// Delete a review
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM findings WHERE review_id = ?').run(req.params.id);
  db.prepare('DELETE FROM slides WHERE review_id = ?').run(req.params.id);
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
