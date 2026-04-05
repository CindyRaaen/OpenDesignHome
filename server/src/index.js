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
        designer VARCHAR(255),
        collection_name VARCHAR(200),
        material_name VARCHAR(200),
        color_hex VARCHAR(7),
        width_inches DECIMAL(8,2),
        depth_inches DECIMAL(8,2),
        height_inches DECIMAL(8,2),
        price_usd DECIMAL(10,2),
        retail_price DECIMAL(10,2),
        affiliate_url TEXT,
        source_url TEXT,
        image_url TEXT,
        thumbnail_url TEXT,
        dimensions JSONB DEFAULT '{}',
        colors JSONB DEFAULT '[]',
        tags JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add new columns if table already existed
    const newCols = [
      'designer VARCHAR(255)', 'collection_name VARCHAR(200)', 'material_name VARCHAR(200)',
      'color_hex VARCHAR(7)', 'width_inches DECIMAL(8,2)', 'depth_inches DECIMAL(8,2)',
      'height_inches DECIMAL(8,2)', 'retail_price DECIMAL(10,2)', 'source_url TEXT',
    ];
    for (const col of newCols) {
      const colName = col.split(' ')[0];
      await db.query(`ALTER TABLE odh_furniture ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
    }

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

// Seed real designer furniture
async function seedFurniture() {
  try {
    // Check if we already have the new real-brand furniture (check for image_url populated)
    const check = await db.query(`SELECT COUNT(*) FROM odh_furniture WHERE image_url IS NOT NULL AND image_url != ''`);
    if (parseInt(check.rows[0].count) >= 48) return; // already seeded with images

    // Clear old generic data and reseed with real designer furniture
    await db.query(`DELETE FROM odh_furniture`);

    const furniture = [
      // ═══════════════════════════════════════════════════
      // ── SOFAS ──────────────────────────────────────────
      // ═══════════════════════════════════════════════════
      { name: 'Camaleonda Modular Sofa', category: 'sofas', style: 'modern', brand: 'B&B Italia', designer: 'Mario Bellini', collection: 'Camaleonda', material: 'Bouclé Fabric', color: '#C4B5A0', w: 96, d: 38, h: 28, price: 12800, retail: 15200, img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop', tags: ['iconic', 'modular', 'italian'] },
      { name: 'Cloud Sofa', category: 'sofas', style: 'modern', brand: 'Restoration Hardware', designer: 'RH Design', collection: 'Cloud Collection', material: 'Belgian Linen', color: '#E8E0D4', w: 96, d: 46, h: 31, price: 5495, retail: 5495, img: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400&h=300&fit=crop', tags: ['deep-seat', 'linen', 'oversized'] },
      { name: 'Togo Sofa', category: 'sofas', style: 'modern', brand: 'Ligne Roset', designer: 'Michel Ducaroy', collection: 'Togo', material: 'Alcantara', color: '#D2691E', w: 68, d: 40, h: 28, price: 6490, retail: 7200, img: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=300&fit=crop', tags: ['iconic', 'french', 'low-profile'] },
      { name: 'Mags Soft Sofa', category: 'sofas', style: 'scandinavian', brand: 'HAY', designer: 'HAY Design', collection: 'Mags', material: 'Steelcut Trio Wool', color: '#2F4F4F', w: 90, d: 37, h: 30, price: 4200, retail: 4600, img: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=400&h=300&fit=crop', tags: ['modular', 'danish', 'wool'] },
      { name: 'Hamilton Sofa', category: 'sofas', style: 'modern', brand: 'Minotti', designer: 'Rodolfo Dordoni', collection: 'Hamilton', material: 'Full-Grain Leather', color: '#3C2415', w: 94, d: 39, h: 29, price: 14500, retail: 16800, img: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=400&h=300&fit=crop', tags: ['italian', 'leather', 'luxury'] },
      { name: 'Ducal Velvet Sofa', category: 'sofas', style: 'traditional', brand: 'Holly Hunt', designer: 'Holly Hunt Studio', collection: 'Great Outdoors', material: 'Mohair Velvet', color: '#1B3A5C', w: 88, d: 36, h: 32, price: 18200, retail: 22000, img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop', tags: ['velvet', 'bespoke', 'navy'] },
      { name: 'Serpentine Sofa', category: 'sofas', style: 'modern', brand: 'Vladimir Kagan', designer: 'Vladimir Kagan', collection: 'Classics', material: 'Bouclé', color: '#F5F0E8', w: 108, d: 44, h: 30, price: 28000, retail: 35000, img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop', tags: ['sculptural', 'iconic', 'curved'] },
      { name: 'Bolster Sofa', category: 'sofas', style: 'mid-century', brand: 'Design Within Reach', designer: 'BassamFellows', collection: 'Bolster Collection', material: 'Aniline Leather', color: '#8B4513', w: 84, d: 34, h: 29, price: 7950, retail: 8500, img: 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=400&h=300&fit=crop', tags: ['mid-century', 'leather', 'walnut'] },

      // ═══════════════════════════════════════════════════
      // ── CHAIRS ─────────────────────────────────────────
      // ═══════════════════════════════════════════════════
      { name: 'Eames Lounge Chair', category: 'chairs', style: 'mid-century', brand: 'Herman Miller', designer: 'Charles & Ray Eames', collection: 'Eames Collection', material: 'Santos Palisander & Leather', color: '#1A1A1A', w: 33, d: 33, h: 32, price: 7395, retail: 7395, img: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=300&fit=crop', tags: ['iconic', 'leather', 'walnut'] },
      { name: 'Womb Chair', category: 'chairs', style: 'mid-century', brand: 'Knoll', designer: 'Eero Saarinen', collection: 'Saarinen Collection', material: 'Cato Fabric', color: '#C41E3A', w: 40, d: 34, h: 36, price: 6882, retail: 7200, img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop', tags: ['iconic', 'mid-century', 'organic'] },
      { name: 'CH25 Lounge Chair', category: 'chairs', style: 'scandinavian', brand: 'Carl Hansen & Son', designer: 'Hans J. Wegner', collection: 'Wegner Collection', material: 'Oak & Paper Cord', color: '#D4A86A', w: 28, d: 30, h: 28, price: 5200, retail: 5800, img: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop', tags: ['danish', 'handwoven', 'oak'] },
      { name: 'Le Bambole Armchair', category: 'chairs', style: 'modern', brand: 'B&B Italia', designer: 'Mario Bellini', collection: 'Le Bambole', material: 'Leather', color: '#8B6914', w: 43, d: 38, h: 28, price: 8900, retail: 10500, img: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=300&fit=crop', tags: ['italian', 'sculptural', 'leather'] },
      { name: 'Platner Arm Chair', category: 'chairs', style: 'modern', brand: 'Knoll', designer: 'Warren Platner', collection: 'Platner Collection', material: 'Nickel & Velvet', color: '#4F46E5', w: 27, d: 22, h: 30, price: 4648, retail: 5100, img: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=300&fit=crop', tags: ['sculptural', 'nickel', 'iconic'] },
      { name: 'PP Mobler Shell Chair', category: 'chairs', style: 'scandinavian', brand: 'PP Mobler', designer: 'Hans J. Wegner', collection: 'Shell Series', material: 'Beech & Hallingdal Wool', color: '#2D5A3D', w: 36, d: 33, h: 30, price: 9800, retail: 12000, img: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400&h=300&fit=crop', tags: ['danish', 'handcrafted', 'collector'] },
      { name: 'Archibald Armchair', category: 'chairs', style: 'modern', brand: 'Poltrona Frau', designer: 'Jean-Marie Massaud', collection: 'Archibald', material: 'Pelle Frau Leather', color: '#2C1810', w: 35, d: 34, h: 41, price: 11200, retail: 13500, img: 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=400&h=300&fit=crop', tags: ['italian', 'leather', 'executive'] },
      { name: 'Wishbone Chair', category: 'chairs', style: 'scandinavian', brand: 'Carl Hansen & Son', designer: 'Hans J. Wegner', collection: 'CH24', material: 'Soaped Oak & Natural Cord', color: '#C8A86A', w: 22, d: 20, h: 30, price: 795, retail: 895, img: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=400&h=300&fit=crop', tags: ['iconic', 'danish', 'dining'] },

      // ═══════════════════════════════════════════════════
      // ── TABLES ─────────────────────────────────────────
      // ═══════════════════════════════════════════════════
      { name: 'Noguchi Coffee Table', category: 'tables', style: 'mid-century', brand: 'Herman Miller', designer: 'Isamu Noguchi', collection: 'Noguchi Collection', material: 'Walnut & Glass', color: '#6B4226', w: 50, d: 36, h: 16, price: 2695, retail: 2695, img: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop', tags: ['iconic', 'sculptural', 'glass'] },
      { name: 'Saarinen Oval Dining Table', category: 'tables', style: 'modern', brand: 'Knoll', designer: 'Eero Saarinen', collection: 'Pedestal Collection', material: 'Arabescato Marble', color: '#E8E0D8', w: 78, d: 48, h: 28, price: 12890, retail: 14500, img: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=400&h=300&fit=crop', tags: ['marble', 'iconic', 'dining'] },
      { name: 'Platner Side Table', category: 'tables', style: 'modern', brand: 'Knoll', designer: 'Warren Platner', collection: 'Platner Collection', material: 'Nickel & Glass', color: '#C0C0C0', w: 16, d: 16, h: 18, price: 2395, retail: 2600, img: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?w=400&h=300&fit=crop', tags: ['sculptural', 'glass', 'accent'] },
      { name: 'CH337 Dining Table', category: 'tables', style: 'scandinavian', brand: 'Carl Hansen & Son', designer: 'Hans J. Wegner', collection: 'Dining Collection', material: 'Oiled Oak', color: '#D4A86A', w: 95, d: 45, h: 28, price: 8900, retail: 9800, img: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=400&h=300&fit=crop', tags: ['danish', 'extendable', 'oak'] },
      { name: 'Alanda Coffee Table', category: 'tables', style: 'modern', brand: 'B&B Italia', designer: 'Paolo Piva', collection: 'Alanda', material: 'Tempered Glass & Steel', color: '#2A2A2A', w: 47, d: 47, h: 10, price: 4200, retail: 4800, img: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=300&fit=crop', tags: ['geometric', 'glass', 'italian'] },
      { name: 'Tobi-Ishi Table', category: 'tables', style: 'modern', brand: 'B&B Italia', designer: 'Edward Barber & Jay Osgerby', collection: 'Tobi-Ishi', material: 'Calacatta Marble', color: '#F5F0E8', w: 94, d: 44, h: 29, price: 18500, retail: 22000, img: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop', tags: ['marble', 'sculptural', 'italian'] },
      { name: 'Eames Walnut Stool', category: 'tables', style: 'mid-century', brand: 'Herman Miller', designer: 'Charles & Ray Eames', collection: 'Eames Collection', material: 'Solid Walnut', color: '#5C3317', w: 13, d: 13, h: 15, price: 1295, retail: 1295, img: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=400&h=300&fit=crop', tags: ['walnut', 'accent', 'versatile'] },
      { name: 'Superellipse Table', category: 'tables', style: 'scandinavian', brand: 'Fritz Hansen', designer: 'Piet Hein & Bruno Mathsson', collection: 'Superellipse', material: 'White Laminate & Chrome', color: '#F8F8F8', w: 71, d: 48, h: 28, price: 3890, retail: 4200, img: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=400&h=300&fit=crop', tags: ['danish', 'minimalist', 'chrome'] },

      // ═══════════════════════════════════════════════════
      // ── LAMPS ──────────────────────────────────────────
      // ═══════════════════════════════════════════════════
      { name: 'Arco Floor Lamp', category: 'lamps', style: 'modern', brand: 'Flos', designer: 'Achille & Pier Giacomo Castiglioni', collection: 'Arco', material: 'Carrara Marble & Stainless Steel', color: '#C0C0C0', w: 13, d: 13, h: 95, price: 3195, retail: 3500, img: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab853?w=400&h=300&fit=crop', tags: ['iconic', 'italian', 'marble-base'] },
      { name: 'PH 5 Pendant', category: 'lamps', style: 'scandinavian', brand: 'Louis Poulsen', designer: 'Poul Henningsen', collection: 'PH Series', material: 'Spun Aluminum', color: '#F5F0E8', w: 20, d: 20, h: 12, price: 1248, retail: 1400, img: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop', tags: ['iconic', 'danish', 'pendant'] },
      { name: 'Grasshopper Floor Lamp', category: 'lamps', style: 'mid-century', brand: 'Gubi', designer: 'Greta Magnusson Grossman', collection: 'Grasshopper', material: 'Matte Black Steel', color: '#1A1A1A', w: 18, d: 18, h: 50, price: 1099, retail: 1200, img: 'https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=400&h=300&fit=crop', tags: ['scandinavian', 'floor', 'tripod'] },
      { name: 'IC Lights Table', category: 'lamps', style: 'modern', brand: 'Flos', designer: 'Michael Anastassiades', collection: 'IC Lights', material: 'Brass & Blown Glass', color: '#C8A060', w: 10, d: 10, h: 21, price: 795, retail: 895, img: 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop', tags: ['brass', 'sphere', 'table'] },
      { name: 'AJ Table Lamp', category: 'lamps', style: 'mid-century', brand: 'Louis Poulsen', designer: 'Arne Jacobsen', collection: 'AJ Series', material: 'Zinc & Steel', color: '#333333', w: 8, d: 14, h: 22, price: 998, retail: 1100, img: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400&h=300&fit=crop', tags: ['iconic', 'danish', 'directional'] },
      { name: 'Flowerpot VP1 Pendant', category: 'lamps', style: 'modern', brand: '&Tradition', designer: 'Verner Panton', collection: 'Flowerpot', material: 'Lacquered Steel', color: '#4F46E5', w: 9, d: 9, h: 6, price: 459, retail: 499, img: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop', tags: ['colorful', 'pendant', 'playful'] },
      { name: 'Tolomeo Mega Floor', category: 'lamps', style: 'modern', brand: 'Artemide', designer: 'Michele De Lucchi', collection: 'Tolomeo', material: 'Aluminum & Parchment', color: '#E8E0D4', w: 14, d: 14, h: 72, price: 1595, retail: 1800, img: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&h=300&fit=crop', tags: ['articulating', 'italian', 'floor'] },
      { name: 'Nelson Bubble Lamp', category: 'lamps', style: 'mid-century', brand: 'Herman Miller', designer: 'George Nelson', collection: 'Bubble Collection', material: 'Self-Webbing Polymer', color: '#F5F0E8', w: 24, d: 24, h: 16, price: 695, retail: 695, img: 'https://images.unsplash.com/photo-1530603907829-659dc1d5d42c?w=400&h=300&fit=crop', tags: ['iconic', 'pendant', 'organic'] },

      // ═══════════════════════════════════════════════════
      // ── ART ────────────────────────────────────────────
      // ═══════════════════════════════════════════════════
      { name: 'Color Field No. 9', category: 'art', style: 'modern', brand: 'Saatchi Art', designer: 'Studio Collective', collection: 'Color Field Series', material: 'Oil on Canvas', color: '#E04040', w: 48, d: 2, h: 36, price: 3200, retail: 3800, img: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop', tags: ['abstract', 'oil', 'statement'] },
      { name: 'Botanical Study Triptych', category: 'art', style: 'traditional', brand: 'Natural Curiosities', designer: 'Various', collection: 'Botanical Studies', material: 'Giclée on Paper', color: '#2D5A3D', w: 54, d: 1, h: 24, price: 1800, retail: 2200, img: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=300&fit=crop', tags: ['botanical', 'triptych', 'classic'] },
      { name: 'Minimalist Line Series', category: 'art', style: 'modern', brand: 'Tappan Collective', designer: 'Independent', collection: 'Line Series', material: 'Ink on Cotton Paper', color: '#1A1A1A', w: 30, d: 1, h: 40, price: 890, retail: 1100, img: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop', tags: ['minimalist', 'line-art', 'monochrome'] },
      { name: 'Agate Slice Diptych', category: 'art', style: 'modern', brand: 'Minted', designer: 'Crystal Arts', collection: 'Geological Series', material: 'Photography on Aluminum', color: '#4F46E5', w: 40, d: 1, h: 30, price: 1400, retail: 1600, img: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&h=300&fit=crop', tags: ['geological', 'photography', 'modern'] },
      { name: 'Ocean Gradient Canvas', category: 'art', style: 'modern', brand: 'Artsy', designer: 'Coastal Studio', collection: 'Gradient Series', material: 'Acrylic on Linen', color: '#1B5E8C', w: 60, d: 2, h: 40, price: 4500, retail: 5200, img: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop', tags: ['gradient', 'coastal', 'large'] },
      { name: 'Handwoven Textile Art', category: 'art', style: 'bohemian', brand: 'Anthropologie', designer: 'Artisan Collective', collection: 'Woven Series', material: 'Cotton & Wool on Dowel', color: '#C8A060', w: 36, d: 3, h: 28, price: 680, retail: 780, img: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400&h=300&fit=crop', tags: ['textile', 'handwoven', 'boho'] },
      { name: 'Bronze Disc Sculpture', category: 'art', style: 'modern', brand: 'Arteriors', designer: 'Barry Dixon', collection: 'Metal Works', material: 'Patinated Bronze', color: '#8B6914', w: 36, d: 4, h: 36, price: 2800, retail: 3400, img: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop', tags: ['sculpture', 'bronze', '3d'] },
      { name: 'Oversized Photography Print', category: 'art', style: 'modern', brand: 'Sonic Editions', designer: 'Archive Photography', collection: 'Icon Series', material: 'C-Type on Aluminum', color: '#333333', w: 40, d: 1, h: 60, price: 1200, retail: 1400, img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop', tags: ['photography', 'oversized', 'portrait'] },

      // ═══════════════════════════════════════════════════
      // ── PLANTS ─────────────────────────────────────────
      // ═══════════════════════════════════════════════════
      { name: 'Monstera Deliciosa XL', category: 'plants', style: 'modern', brand: 'The Sill', designer: null, collection: 'Tropical Collection', material: 'Ceramic Planter', color: '#2D8A4E', w: 24, d: 24, h: 42, price: 195, retail: 225, img: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=300&fit=crop', tags: ['tropical', 'statement', 'low-light'] },
      { name: 'Fiddle Leaf Fig Tree', category: 'plants', style: 'modern', brand: 'Bloomscape', designer: null, collection: 'Trees Collection', material: 'Stone Planter', color: '#3A7D44', w: 30, d: 30, h: 60, price: 299, retail: 349, img: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop', tags: ['tree', 'statement', 'bright-light'] },
      { name: 'Olive Tree', category: 'plants', style: 'scandinavian', brand: 'Terrain', designer: null, collection: 'Mediterranean', material: 'Terracotta Pot', color: '#708238', w: 28, d: 28, h: 48, price: 389, retail: 450, img: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop', tags: ['tree', 'mediterranean', 'terracotta'] },
      { name: 'Bird of Paradise', category: 'plants', style: 'bohemian', brand: 'The Sill', designer: null, collection: 'Tropical Collection', material: 'Woven Basket', color: '#228B22', w: 26, d: 26, h: 54, price: 249, retail: 289, img: 'https://images.unsplash.com/photo-1572969176406-b09a16168a05?w=400&h=300&fit=crop', tags: ['tropical', 'tall', 'dramatic'] },
      { name: 'Snake Plant Laurentii', category: 'plants', style: 'modern', brand: 'Bloomscape', designer: null, collection: 'Air Purifying', material: 'Matte White Ceramic', color: '#3B5323', w: 10, d: 10, h: 36, price: 65, retail: 79, img: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=300&fit=crop', tags: ['air-purifying', 'low-light', 'architectural'] },
      { name: 'Potted Succulent Arrangement', category: 'plants', style: 'modern', brand: 'Terrain', designer: null, collection: 'Desert Collection', material: 'Concrete Bowl', color: '#88B04B', w: 14, d: 14, h: 8, price: 85, retail: 99, img: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop', tags: ['succulent', 'low-water', 'tabletop'] },
      { name: 'Dried Pampas Grass Vase', category: 'plants', style: 'bohemian', brand: 'CB2', designer: null, collection: 'Natural Collection', material: 'Glass Cylinder Vase', color: '#D2B48C', w: 12, d: 12, h: 40, price: 129, retail: 149, img: 'https://images.unsplash.com/photo-1598880940080-ff9a29891b85?w=400&h=300&fit=crop', tags: ['dried', 'boho', 'sculptural'] },
      { name: 'Trailing Pothos in Macrame', category: 'plants', style: 'bohemian', brand: 'The Sill', designer: null, collection: 'Hanging Collection', material: 'Macrame & Ceramic', color: '#50C878', w: 10, d: 10, h: 30, price: 75, retail: 89, img: 'https://images.unsplash.com/photo-1620127252536-03bdfcb5ef73?w=400&h=300&fit=crop', tags: ['hanging', 'trailing', 'boho'] },
    ];

    for (const item of furniture) {
      await db.query(`
        INSERT INTO odh_furniture (name, category, style, brand, designer, collection_name, material_name, color_hex,
          width_inches, depth_inches, height_inches, price_usd, retail_price, image_url, tags, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true)
      `, [
        item.name, item.category, item.style, item.brand, item.designer, item.collection, item.material, item.color,
        item.w, item.d, item.h, item.price, item.retail, item.img, JSON.stringify(item.tags),
      ]);
    }
    console.log('Seeded 48 real designer furniture items');
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
