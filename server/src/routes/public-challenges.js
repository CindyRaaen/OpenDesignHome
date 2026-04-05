import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET / - active challenges (no auth needed)
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

export default router;
