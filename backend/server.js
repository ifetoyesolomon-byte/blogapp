require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database connection ---
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'bloguser',
  password: process.env.DB_PASSWORD || 'blogpass',
  database: process.env.DB_NAME || 'blogdb',
});

// Retry DB connection on startup (db container may not be ready yet)
async function waitForDb(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Connected to database.');
      return;
    } catch (err) {
      console.log(`DB not ready (attempt ${i}/${retries}): ${err.message}`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw new Error('Could not connect to database after multiple attempts.');
}

app.use(express.json());

// Health check (used by docker-compose healthcheck / load balancers)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// --- API routes ---

// List all posts
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, content, created_at FROM posts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load posts.' });
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load post.' });
  }
});

// Create a post
app.post('/api/posts', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO posts (title, content) VALUES ($1, $2) RETURNING *',
      [title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// --- Start server ---
waitForDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Blog API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
