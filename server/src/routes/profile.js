import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET / - current user's profile
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM odh_profiles WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      // Create profile if doesn't exist
      const createResult = await db.query(`
        INSERT INTO odh_profiles (user_id)
        VALUES ($1)
        RETURNING *
      `, [req.user.id]);
      return res.json(createResult.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH / - update profile
router.patch('/', async (req, res) => {
  const { display_name, bio, avatar_url, favorite_style } = req.body;
  try {
    const result = await db.query(`
      UPDATE odh_profiles
      SET display_name = COALESCE($1, display_name),
          bio = COALESCE($2, bio),
          avatar_url = COALESCE($3, avatar_url),
          favorite_style = COALESCE($4, favorite_style)
      WHERE user_id = $5
      RETURNING *
    `, [display_name, bio, avatar_url, favorite_style, req.user.id]);
    
    res.json(result.rows[0] || { error: 'Profile not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /:userId - public profile view
router.get('/:userId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, user_id, display_name, bio, avatar_url, reputation, designs_submitted, favorite_style FROM odh_profiles WHERE user_id = $1',
      [req.params.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
