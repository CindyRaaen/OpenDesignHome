import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from './db.js';
import challengesRouter from './routes/challenges.js';
import designsRouter from './routes/designs.js';
import voteRouter from './routes/vote.js';
import furnitureRouter from './routes/furniture.js';
import profileRouter from './routes/profile.js';
import leaderboardRouter from './routes/leaderboard.js';
import publicChallengesRouter from './routes/public-challenges.js';

const app = express();
const PORT = 3029;
const JWT_SECRET = process.env.JWT_SECRET || 'your-shared-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    // Ensure users table exists (shared across all Open Scaffold apps)
    // Schema matches Open Restaurant: username (not email), password, name, role
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(200),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    // Add name column if missing (table may have been created by another app)
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200)`).catch(() => {});
    // Log actual table columns for debugging
    const cols = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
    console.log('USERS TABLE COLUMNS:', JSON.stringify(cols.rows));

    // Create furniture table
    await db.query(`
      CREATE TABLE IF NOT EXISTS odh_furniture (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        style VARCHAR(100),
        brand VARCHAR(255),
        price_usd DECIMAL(10,2),
        affiliate_url TEXT,
        image_url TEXT,
        thumbnail_url TEXT,
        dimensions JSONB DEFAULT '{}',
        colors JSONB DEFAULT '[]',
        tags JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create challenges table
    await db.query(`
      CREATE TABLE IF NOT EXISTS odh_challenges (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        room_type VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'casual',
        theme VARCHAR(255),
        constraints JSONB DEFAULT '{}',
        room_template JSONB DEFAULT '{}',
        sponsor_brand VARCHAR(255),
        max_entries INTEGER DEFAULT 1000,
        entry_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active',
        starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ends_at TIMESTAMP NOT NULL,
        voting_ends_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Single init promise — awaited by middleware before handling requests
const dbReady = (async () => {
  await initializeDatabase();
  await createDesignsTables();
  await createLeaderboardTable();
  await seedSampleData();
  await seedFurniture();
})().catch(err => console.error('DB init failed:', err));

// Create designs table
async function createDesignsTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS odh_designs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        challenge_id INTEGER REFERENCES odh_challenges(id) ON DELETE CASCADE,
        title VARCHAR(255),
        design_data JSONB NOT NULL DEFAULT '{}',
        thumbnail_url TEXT,
        render_url TEXT,
        score DECIMAL(3,2) DEFAULT 0,
        vote_count INTEGER DEFAULT 0,
        rank INTEGER,
        status VARCHAR(20) DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create votes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS odh_votes (
        id SERIAL PRIMARY KEY,
        voter_id INTEGER,
        design_id INTEGER REFERENCES odh_designs(id) ON DELETE CASCADE,
        stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(voter_id, design_id)
      )
    `);

    // Create profiles table
    await db.query(`
      CREATE TABLE IF NOT EXISTS odh_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE,
        display_name VARCHAR(100),
        bio TEXT,
        avatar_url TEXT,
        reputation INTEGER DEFAULT 0,
        designs_submitted INTEGER DEFAULT 0,
        challenges_won INTEGER DEFAULT 0,
        votes_cast INTEGER DEFAULT 0,
        favorite_style VARCHAR(100),
        badges JSONB DEFAULT '[]',
        is_pro BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('Error creating designs tables:', err);
  }
}

// Create leaderboard table
async function createLeaderboardTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS odh_leaderboard (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        period VARCHAR(20) NOT NULL,
        period_start DATE NOT NULL,
        score DECIMAL(10,2) DEFAULT 0,
        rank INTEGER,
        designs_count INTEGER DEFAULT 0,
        avg_rating DECIMAL(3,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_odh_designs_challenge ON odh_designs(challenge_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_odh_designs_user ON odh_designs(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_odh_votes_design ON odh_votes(design_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_odh_challenges_status ON odh_challenges(status)`);
  } catch (err) {
    console.error('Error creating leaderboard table:', err);
  }
}

// Seed sample data
async function seedSampleData() {
  try {
    const challengeCount = await db.query(`SELECT COUNT(*) FROM odh_challenges`);
    if (parseInt(challengeCount.rows[0].count) < 6) {
      // Clear and reseed with more room types
      if (parseInt(challengeCount.rows[0].count) > 0) {
        await db.query(`DELETE FROM odh_challenges`);
      }
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

      const challenges = [
        ['Modern Living Room Refresh', 'Design a contemporary living space with clean lines', 'living_room', 'casual', 'modern', in7Days],
        ['Cozy Bedroom Retreat', 'Create a relaxing bedroom sanctuary', 'bedroom', 'casual', 'cozy', in5Days],
        ['Dream Kitchen Makeover', 'Transform a kitchen into a chef\'s paradise', 'kitchen', 'intermediate', 'modern', in7Days],
        ['Elegant Dinner Party', 'Set the scene for an unforgettable dinner party', 'dining_room', 'intermediate', 'traditional', in10Days],
        ['Spa Bathroom Oasis', 'Design a luxurious bathroom retreat', 'bathroom', 'casual', 'modern', in3Days],
        ['Small Space Big Style', 'Make a studio apartment feel like home', 'studio', 'expert', 'modern', in5Days],
      ];

      for (const [title, description, room_type, difficulty, theme, ends_at] of challenges) {
        await db.query(
          `INSERT INTO odh_challenges (title, description, room_type, difficulty, theme, ends_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [title, description, room_type, difficulty, theme, ends_at]
        );
      }
    }
  } catch (err) {
    console.error('Error seeding challenges:', err);
  }
}

// Seed furniture items
async function seedFurniture() {
  try {
    const furnitureCount = await db.query(`SELECT COUNT(*) FROM odh_furniture`);
    if (parseInt(furnitureCount.rows[0].count) < 48) {
      // Clear old seed data and re-seed with expanded catalog
      if (parseInt(furnitureCount.rows[0].count) > 0) {
        await db.query(`DELETE FROM odh_furniture`);
      }
      const furniture = [
        // ── Sofas (8 items) ──
        { name: 'Minimalist Grey Sofa', category: 'sofas', style: 'modern', brand: 'Design Co', price: 899.99 },
        { name: 'Mid-Century Teal Sofa', category: 'sofas', style: 'mid-century', brand: 'Vintage Living', price: 1299.99 },
        { name: 'Scandinavian Light Oak Sofa', category: 'sofas', style: 'scandinavian', brand: 'Nordic Home', price: 1199.99 },
        { name: 'Velvet Navy Chesterfield', category: 'sofas', style: 'traditional', brand: 'Heritage Home', price: 1899.99 },
        { name: 'Cloud Modular Sectional', category: 'sofas', style: 'modern', brand: 'Comfort Zone', price: 2499.99 },
        { name: 'Leather Cognac Loveseat', category: 'sofas', style: 'mid-century', brand: 'Artisan Leather', price: 1599.99 },
        { name: 'Boucle Ivory Sofa', category: 'sofas', style: 'modern', brand: 'Luxe Living', price: 1799.99 },
        { name: 'Bohemian Daybed Sofa', category: 'sofas', style: 'bohemian', brand: 'Free Spirit', price: 999.99 },
        // ── Chairs (8 items) ──
        { name: 'Bohemian Patterned Chair', category: 'chairs', style: 'bohemian', brand: 'Ethic Home', price: 449.99 },
        { name: 'Mid-Century Eames-Style Chair', category: 'chairs', style: 'mid-century', brand: 'Classics', price: 329.99 },
        { name: 'Modern Minimalist Chair', category: 'chairs', style: 'modern', brand: 'Form Design', price: 279.99 },
        { name: 'Velvet Emerald Accent Chair', category: 'chairs', style: 'traditional', brand: 'Regal Seating', price: 549.99 },
        { name: 'Woven Rattan Lounge Chair', category: 'chairs', style: 'bohemian', brand: 'Island Living', price: 389.99 },
        { name: 'Leather Butterfly Chair', category: 'chairs', style: 'industrial', brand: 'Urban Loft', price: 299.99 },
        { name: 'Scandinavian Shell Chair', category: 'chairs', style: 'scandinavian', brand: 'Nordic Craft', price: 419.99 },
        { name: 'Papasan Cushion Chair', category: 'chairs', style: 'bohemian', brand: 'Cozy Corner', price: 249.99 },
        // ── Tables (8 items) ──
        { name: 'Walnut Coffee Table', category: 'tables', style: 'scandinavian', brand: 'Wood Masters', price: 449.99 },
        { name: 'Glass and Steel Coffee Table', category: 'tables', style: 'modern', brand: 'Industrial Modern', price: 399.99 },
        { name: 'Marble Side Table', category: 'tables', style: 'modern', brand: 'Luxury Home', price: 699.99 },
        { name: 'Round Oak Dining Table', category: 'tables', style: 'scandinavian', brand: 'Nordic Home', price: 899.99 },
        { name: 'Live Edge Console Table', category: 'tables', style: 'industrial', brand: 'Rustic Works', price: 749.99 },
        { name: 'Brass and Glass Nesting Tables', category: 'tables', style: 'modern', brand: 'Glam Studio', price: 549.99 },
        { name: 'Ceramic Drum Side Table', category: 'tables', style: 'bohemian', brand: 'Earthen Home', price: 199.99 },
        { name: 'Acrylic Waterfall Table', category: 'tables', style: 'modern', brand: 'Clear Form', price: 599.99 },
        // ── Lamps (8 items) ──
        { name: 'Edison Bulb Floor Lamp', category: 'lamps', style: 'industrial', brand: 'Lighting Pro', price: 179.99 },
        { name: 'Mid-Century Arc Lamp', category: 'lamps', style: 'mid-century', brand: 'Modern Classics', price: 399.99 },
        { name: 'Minimalist Black Pendant Lamp', category: 'lamps', style: 'modern', brand: 'Light Design', price: 149.99 },
        { name: 'Brass Pharmacy Floor Lamp', category: 'lamps', style: 'traditional', brand: 'Classic Light', price: 259.99 },
        { name: 'Paper Lantern Table Lamp', category: 'lamps', style: 'bohemian', brand: 'Zen Glow', price: 89.99 },
        { name: 'Crystal Chandelier Mini', category: 'lamps', style: 'traditional', brand: 'Regal Light', price: 449.99 },
        { name: 'Concrete Base Table Lamp', category: 'lamps', style: 'industrial', brand: 'Raw Material', price: 129.99 },
        { name: 'Rattan Dome Pendant', category: 'lamps', style: 'bohemian', brand: 'Woven Light', price: 199.99 },
        // ── Art (8 items) ──
        { name: 'Abstract Canvas Art', category: 'art', style: 'modern', brand: 'Artist Co', price: 299.99 },
        { name: 'Botanical Print Set', category: 'art', style: 'bohemian', brand: 'Nature Art', price: 129.99 },
        { name: 'Minimalist Line Drawing', category: 'art', style: 'modern', brand: 'Simple Art', price: 89.99 },
        { name: 'Vintage Travel Poster', category: 'art', style: 'mid-century', brand: 'Retro Prints', price: 59.99 },
        { name: 'Oversized Oil Painting', category: 'art', style: 'traditional', brand: 'Gallery Wall', price: 599.99 },
        { name: 'Photography Triptych', category: 'art', style: 'modern', brand: 'Lens Art', price: 249.99 },
        { name: 'Macrame Wall Hanging', category: 'art', style: 'bohemian', brand: 'Knot Studio', price: 149.99 },
        { name: 'Geometric Metal Wall Art', category: 'art', style: 'industrial', brand: 'Metal Craft', price: 179.99 },
        // ── Plants (8 items) ──
        { name: 'Potted Monstera Plant', category: 'plants', style: 'bohemian', brand: 'Plant Co', price: 45.99 },
        { name: 'Fiddle Leaf Fig Tree', category: 'plants', style: 'modern', brand: 'Greenscape', price: 79.99 },
        { name: 'Snake Plant in Ceramic Pot', category: 'plants', style: 'modern', brand: 'Urban Green', price: 34.99 },
        { name: 'Trailing Pothos Planter', category: 'plants', style: 'bohemian', brand: 'Vine Life', price: 29.99 },
        { name: 'Bird of Paradise', category: 'plants', style: 'modern', brand: 'Tropical Home', price: 89.99 },
        { name: 'Olive Tree in Basket', category: 'plants', style: 'scandinavian', brand: 'Mediterranean', price: 129.99 },
        { name: 'Succulent Arrangement', category: 'plants', style: 'modern', brand: 'Desert Bloom', price: 39.99 },
        { name: 'Dried Pampas Grass Vase', category: 'plants', style: 'bohemian', brand: 'Earth Tones', price: 54.99 },
      ];

      for (const item of furniture) {
        await db.query(`
          INSERT INTO odh_furniture (name, category, style, brand, price_usd)
          VALUES ($1, $2, $3, $4, $5)
        `, [item.name, item.category, item.style, item.brand, item.price]);
      }
    }
  } catch (err) {
    console.error('Error seeding furniture:', err);
  }
}

// Wait for DB init on every request (resolves instantly after first cold start)
app.use(async (req, res, next) => {
  await dbReady;
  next();
});

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const existing = await db.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, "passwordHash", name) VALUES ($1, $2, $3) RETURNING id, username, name',
      [username, hashedPassword, displayName || username]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.name } });
  } catch (err) {
    console.error('Register error:', err.message, err.detail || '', err.code || '');
    res.status(400).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT id, username, name, "passwordHash" FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user.id, username: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, name FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Mount routes
app.use('/api/challenges', authMiddleware, challengesRouter);
app.use('/api/designs', authMiddleware, designsRouter);
app.use('/api/vote', authMiddleware, voteRouter);
app.use('/api/furniture', authMiddleware, furnitureRouter);
app.use('/api/profile', authMiddleware, profileRouter);
app.use('/api/leaderboard', authMiddleware, leaderboardRouter);
app.use('/api/public/challenges', publicChallengesRouter);

// Health check + debug
app.get('/api/health', async (req, res) => {
  try {
    const cols = await db.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`);
    res.json({ status: 'ok', users_columns: cols.rows });
  } catch (err) {
    res.json({ status: 'error', message: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Open Design Home server running on port ${PORT}`);
  });
}

export default app;
