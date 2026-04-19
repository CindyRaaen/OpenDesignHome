import express from 'express';
const router = express.Router();
import db from '../db.js';
const pool = db;

/**
 * GET /api/renderer3d/project/:projectId/products
 *
 * Fetches tear sheet products associated with a project.
 * Returns real product data (dimensions, materials, finishes, pricing) for the 3D renderer.
 */
router.get('/project/:projectId/products', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(`
      SELECT
        pts.id,
        pts."projectId",
        pts."tearSheetId",
        pts."furnitureItemId",
        pts.room,
        pts.quantity,
        pts.notes,
        ts."productName",
        ts."productSku",
        ts.category,
        ts.subcategory,
        ts.description,
        ts.dimensions,
        ts.materials,
        ts.finishes,
        ts."tradePrice",
        ts."retailPrice",
        ts."leadTimeWeeks",
        ts."imageUrls",
        ts."tearSheetData",
        ts.collection
      FROM oia_project_tear_sheets pts
      JOIN oia_tear_sheets ts ON pts."tearSheetId" = ts.id
      WHERE pts."projectId" = $1
      ORDER BY pts.room, ts."productName"
    `, [projectId]);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching project products:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/renderer3d/project/:projectId/products-by-room
 *
 * Fetches tear sheet products organized by room.
 * Useful for presentation mode to highlight products in context.
 */
router.get('/project/:projectId/products-by-room', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await pool.query(`
      SELECT
        pts.room,
        COUNT(DISTINCT pts.id) as "productCount",
        COALESCE(SUM(pts.quantity), 0) as "totalQuantity",
        json_agg(
          json_build_object(
            'id', pts.id,
            'tearSheetId', pts."tearSheetId",
            'furnitureItemId', pts."furnitureItemId",
            'productName', ts."productName",
            'productSku', ts."productSku",
            'category', ts.category,
            'subcategory', ts.subcategory,
            'dimensions', ts.dimensions,
            'materials', ts.materials,
            'finishes', ts.finishes,
            'tradePrice', ts."tradePrice",
            'retailPrice', ts."retailPrice",
            'imageUrls', ts."imageUrls",
            'quantity', pts.quantity,
            'notes', pts.notes
          ) ORDER BY ts."productName"
        ) as products
      FROM oia_project_tear_sheets pts
      JOIN oia_tear_sheets ts ON pts."tearSheetId" = ts.id
      WHERE pts."projectId" = $1
      GROUP BY pts.room
      ORDER BY pts.room
    `, [projectId]);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching products by room:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/renderer3d/tearsheet/:tearSheetId
 *
 * Fetch detailed tear sheet product info for a specific product.
 */
router.get('/tearsheet/:tearSheetId', async (req, res) => {
  try {
    const { tearSheetId } = req.params;

    const result = await pool.query(`
      SELECT * FROM oia_tear_sheets WHERE id = $1
    `, [tearSheetId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tear sheet not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching tear sheet:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
