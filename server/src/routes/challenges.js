import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET / - list active challenges
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, 
        COUNT(d.id) as entry_count
      FROM odh_challenges c
      LEFT JOIN odh_designs d ON c.id = d.challenge_id
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.ends_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// GET /:id - single challenge with top designs preview
router.get('/:id', async (req, res) => {
  try {
    const challengeResult = await db.query(
      'SELECT * FROM odh_challenges WHERE id = $1',
      [req.params.id]
    );
    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const designsResult = await db.query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM odh_votes WHERE design_id = d.id) as vote_count
      FROM odh_designs d
      WHERE d.challenge_id = $1 AND d.status = 'submitted'
      ORDER BY d.score DESC
      LIMIT 10
    `, [req.params.id]);

    res.json({
      challenge: challengeResult.rows[0],
      topDesigns: designsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

// POST / - create challenge (admin only)
router.post('/', async (req, res) => {
  const { title, description, room_type, difficulty, theme, ends_at } = req.body;
  if (!title || !room_type || !ends_at) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await db.query(`
      INSERT INTO odh_challenges (title, description, room_type, difficulty, theme, ends_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [title, description, room_type, difficulty, theme, ends_at]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

export default router;
