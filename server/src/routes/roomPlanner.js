import express from 'express';
const router = express.Router();
import db from '../db.js';
const pool = db;
// cadToSpacePlan stub — CAD bridge not yet ported
const convertCanvasDataToSpacePlan = (data) => data;

// GET all floor plans (optionally filter by projectId)
router.get('/', async (req, res) => {
  try {
    const { projectId, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM oia_floor_plans WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (projectId) {
      query += ` AND "projectId" = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    query += ` ORDER BY "updatedAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching floor plans:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single floor plan
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM oia_floor_plans WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching floor plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE floor plan
router.post('/', async (req, res) => {
  try {
    const { projectId, name, room, canvasData, width, height } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      `INSERT INTO oia_floor_plans ("projectId", name, room, "canvasData", width, height, "createdBy")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [projectId || null, name, room || null, canvasData || '{}', width || 800, height || 600, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating floor plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE floor plan
router.put('/:id', async (req, res) => {
  try {
    const { name, room, canvasData, width, height } = req.body;

    const result = await pool.query(
      `UPDATE oia_floor_plans
       SET name = COALESCE($1, name),
           room = COALESCE($2, room),
           "canvasData" = COALESCE($3, "canvasData"),
           width = COALESCE($4, width),
           height = COALESCE($5, height),
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, room, canvasData, width, height, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating floor plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE floor plan
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM oia_floor_plans WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ══════════════════════════════════════════
// CAD → SPACE PLAN BRIDGE
// ══════════════════════════════════════════

// GET list of imported floor plans available for conversion to space plans
router.get('/importable-floor-plans', async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = `
      SELECT fp.id, fp.name, fp.room, fp."projectId", fp.width, fp.height,
             fp."createdAt", p.name as "projectName"
      FROM oia_floor_plans fp
      LEFT JOIN oia_projects p ON fp."projectId" = p.id
      WHERE fp."canvasData" IS NOT NULL
    `;
    const params = [];

    if (projectId) {
      params.push(projectId);
      query += ` AND fp."projectId" = $${params.length}`;
    }

    query += ` ORDER BY fp."createdAt" DESC LIMIT 50`;
    const result = await pool.query(query, params);

    res.json(result.rows.map(row => ({
      ...row,
      hasCanvasData: true,
    })));
  } catch (error) {
    console.error('Error fetching importable floor plans:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST convert a floor plan to a space plan
router.post('/import-from-floor-plan', async (req, res) => {
  try {
    const { floorPlanId, name, roomHeight = 96 } = req.body;

    if (!floorPlanId) {
      return res.status(400).json({ error: 'floorPlanId is required' });
    }

    // Fetch the floor plan's canvasData
    const fpResult = await pool.query(
      'SELECT * FROM oia_floor_plans WHERE id = $1',
      [floorPlanId]
    );

    if (fpResult.rows.length === 0) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    const floorPlan = fpResult.rows[0];
    const canvasData = typeof floorPlan.canvasData === 'string'
      ? JSON.parse(floorPlan.canvasData) : floorPlan.canvasData;

    if (!canvasData || !canvasData.walls || canvasData.walls.length === 0) {
      return res.status(400).json({ error: 'Floor plan has no wall data to convert' });
    }

    // Convert canvasData → SpacePlan format
    const planName = name || floorPlan.name || 'Imported Plan';
    const spacePlan = convertCanvasDataToSpacePlan(canvasData, {
      name: planName,
      roomHeight,
    });

    // Save as a new floor plan entry (space plans are stored in the same table)
    const result = await pool.query(
      `INSERT INTO oia_floor_plans
       (name, "projectId", room, "canvasData", width, height, "createdBy")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        planName,
        floorPlan.projectId,
        floorPlan.room,
        JSON.stringify(spacePlan),
        floorPlan.width,
        floorPlan.height,
        req.user.id,
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      conversionSummary: spacePlan._importMetadata,
    });
  } catch (error) {
    console.error('Error converting floor plan to space plan:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST preview conversion without saving
router.post('/preview-conversion', async (req, res) => {
  try {
    const { floorPlanId } = req.body;

    const fpResult = await pool.query(
      'SELECT * FROM oia_floor_plans WHERE id = $1',
      [floorPlanId]
    );

    if (fpResult.rows.length === 0) {
      return res.status(404).json({ error: 'Floor plan not found' });
    }

    const floorPlan = fpResult.rows[0];
    const canvasData = typeof floorPlan.canvasData === 'string'
      ? JSON.parse(floorPlan.canvasData) : floorPlan.canvasData;

    if (!canvasData) {
      return res.json({ canConvert: false, reason: 'No canvas data' });
    }

    const spacePlan = convertCanvasDataToSpacePlan(canvasData, {
      name: floorPlan.name || 'Preview',
    });

    res.json({
      canConvert: true,
      floorPlanName: floorPlan.name,
      summary: {
        walls: Object.keys(spacePlan.surfaces).length,
        doors: Object.values(spacePlan.openings).filter(o => o.openingType === 'door').length,
        windows: Object.values(spacePlan.openings).filter(o => o.openingType === 'window').length,
        furniture: Object.keys(spacePlan.items).length,
        annotations: Object.keys(spacePlan.annotations).length,
        roomWidth: Math.round(spacePlan.roomWidth),
        roomDepth: Math.round(spacePlan.roomDepth),
      },
    });
  } catch (error) {
    console.error('Error previewing conversion:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /process-images — Optimize room rendering images (thumbnails + metadata) ───
router.post('/process-images', async (req, res) => {
  try {
    const { imageUrl, maxWidth = 500 } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

    const { ImageProcessor } = await import('@openscaffold/integrations/imaging');

    // Fetch the image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return res.status(400).json({ error: 'Failed to fetch image' });
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Process image: metadata, thumbnail, for room renderings
    const [metadata, thumbnail] = await Promise.all([
      ImageProcessor.metadata(buffer),
      ImageProcessor.thumbnail(buffer, { width: maxWidth, height: Math.round(maxWidth * 0.75) }).catch(() => null),
    ]);

    res.json({
      success: true,
      original: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        aspectRatio: metadata.width / metadata.height,
      },
      thumbnail: thumbnail ? { data: thumbnail.toString('base64'), width: maxWidth } : null,
    });
  } catch (error) {
    console.error('Error processing images:', error);
    res.status(501).json({ error: 'Image processing not available', details: error.message });
  }
});

export default router;
