import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /my - list current user's designs
router.get('/my', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, c.title as challenge_title
      FROM odh_designs d
      JOIN odh_challenges c ON d.challenge_id = c.id
      WHERE d.user_id = $1
      ORDER BY d.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// GET /challenge/:challengeId - all designs for a challenge
router.get('/challenge/:challengeId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM odh_votes WHERE design_id = d.id) as vote_count
      FROM odh_designs d
      WHERE d.challenge_id = $1 AND d.status = 'submitted'
      ORDER BY d.score DESC
    `, [req.params.challengeId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// GET /:id - single design detail
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM odh_votes WHERE design_id = d.id) as vote_count,
        (SELECT AVG(stars) FROM odh_votes WHERE design_id = d.id) as avg_rating
      FROM odh_designs d
      WHERE d.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch design' });
  }
});

// POST / - submit a design
router.post('/', async (req, res) => {
  const { title, challenge_id, design_data } = req.body;
  if (!challenge_id || !design_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await db.query(`
      INSERT INTO odh_designs (user_id, challenge_id, title, design_data)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, challenge_id, title, JSON.stringify(design_data)]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit design' });
  }
});

// PATCH /:id - update design
router.patch('/:id', async (req, res) => {
  const { title, design_data } = req.body;
  try {
    const result = await db.query(`
      UPDATE odh_designs
      SET title = COALESCE($1, title),
          design_data = COALESCE($2::jsonb, design_data),
          updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `, [title, design_data ? JSON.stringify(design_data) : null, req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update design' });
  }
});

export default router;
