import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET / - current weekly leaderboard top 50
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT lb.*, u.email
      FROM odh_leaderboard lb
      JOIN users u ON lb.user_id = u.id
      WHERE lb.period = 'weekly'
      ORDER BY lb.rank ASC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /all-time - all-time top 50 by reputation
router.get('/all-time', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.email
      FROM odh_profiles p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.reputation DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
