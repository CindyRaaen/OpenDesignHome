import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST / - cast a vote
router.post('/', async (req, res) => {
  const { design_id, stars } = req.body;
  if (!design_id || !stars || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid stars value (1-5)' });
  }

  try {
    // Get design owner
    const designResult = await db.query('SELECT user_id FROM odh_designs WHERE id = $1', [design_id]);
    if (designResult.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Prevent voting on own designs
    if (designResult.rows[0].user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot vote on your own design' });
    }

    // Insert vote with upsert
    const voteResult = await db.query(`
      INSERT INTO odh_votes (voter_id, design_id, stars)
      VALUES ($1, $2, $3)
      ON CONFLICT (voter_id, design_id) DO UPDATE SET stars = $3
      RETURNING *
    `, [req.user.id, design_id, stars]);

    // Calculate new average and update design score
    const scoreResult = await db.query(`
      SELECT AVG(stars) as avg_score, COUNT(*) as vote_count
      FROM odh_votes
      WHERE design_id = $1
    `, [design_id]);

    const avgScore = parseFloat(scoreResult.rows[0].avg_score).toFixed(2);
    const voteCount = scoreResult.rows[0].vote_count;

    await db.query(`
      UPDATE odh_designs
      SET score = $1, vote_count = $2
      WHERE id = $3
    `, [avgScore, voteCount, design_id]);

    res.status(201).json(voteResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// GET /pending - get random unvoted designs
router.get('/pending', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, c.title as challenge_title
      FROM odh_designs d
      JOIN odh_challenges c ON d.challenge_id = c.id
      WHERE d.user_id != $1 AND d.status = 'submitted'
        AND d.id NOT IN (SELECT design_id FROM odh_votes WHERE voter_id = $1)
      ORDER BY RANDOM()
      LIMIT 5
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

export default router;
