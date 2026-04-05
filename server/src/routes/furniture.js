import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET / - list all furniture with filters
router.get('/', async (req, res) => {
  const { category, style, search } = req.query;
  try {
    let query = 'SELECT * FROM odh_furniture WHERE is_active = true';
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (style) {
      params.push(style);
      query += ` AND style = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch furniture' });
  }
});

// GET /:id - single furniture item
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM odh_furniture WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Furniture not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch furniture' });
  }
});

export default router;
