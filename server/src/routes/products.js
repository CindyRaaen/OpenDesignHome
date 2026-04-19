import express from 'express';
const router = express.Router();
import db from '../db.js';
const pool = db;
// createNotification stubbed — notifications not yet ported
const createNotification = () => {};

// ===== VENDORS =====

// GET all vendors with search
router.get('/vendors', async (req, res) => {
  try {
    const { search, type, status } = req.query;

    let query = 'SELECT * FROM oia_vendors WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR "vendorCode" ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create vendor
router.post('/vendors', async (req, res) => {
  try {
    const { vendorCode, name, type, website, email, phone, contact, location, paymentTerms, leadTime, status, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO oia_vendors ("vendorCode", name, type, website, email, phone, contact, location, "paymentTerms", "leadTime", status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [vendorCode, name, type, website, email, phone, contact, location, paymentTerms, leadTime, status || 'active', notes]
    );

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [null, req.user?.id, 'created', 'vendor', result.rows[0].id, JSON.stringify({ name: name })]
      );
    } catch (logErr) { /* silent */ }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update vendor
router.put('/vendors/:id', async (req, res) => {
  try {
    const { name, type, website, email, phone, contact, location, paymentTerms, leadTime, status, notes } = req.body;

    const result = await pool.query(
      `UPDATE oia_vendors SET name = COALESCE($1, name), type = COALESCE($2, type),
       website = COALESCE($3, website), email = COALESCE($4, email), phone = COALESCE($5, phone),
       contact = COALESCE($6, contact), location = COALESCE($7, location),
       "paymentTerms" = COALESCE($8, "paymentTerms"), "leadTime" = COALESCE($9, "leadTime"),
       status = COALESCE($10, status), notes = COALESCE($11, notes)
       WHERE id = $12 RETURNING *`,
      [name, type, website, email, phone, contact, location, paymentTerms, leadTime, status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [null, req.user?.id, 'updated', 'vendor', req.params.id, JSON.stringify({ summary: 'Vendor updated' })]
      );
    } catch (logErr) { /* silent */ }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PRODUCTS =====

// GET all products with filters — root handler for /api/products
// (Also accessible via /api/products/products for backward compat)
const productListHandler = async (req, res) => {
  try {
    const { search, category, subcategory, vendorId, availability } = req.query;

    let query = 'SELECT p.*, v.name as "vendorName" FROM oia_products p LEFT JOIN oia_vendors v ON p."vendorId" = v.id WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (subcategory) {
      query += ` AND p.subcategory = $${paramIndex}`;
      params.push(subcategory);
      paramIndex++;
    }

    if (vendorId) {
      query += ` AND p."vendorId" = $${paramIndex}`;
      params.push(vendorId);
      paramIndex++;
    }

    if (availability) {
      query += ` AND p.availability = $${paramIndex}`;
      params.push(availability);
      paramIndex++;
    }

    query += ' ORDER BY p.name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
router.get('/products', productListHandler);

// GET single product
const productDetailHandler = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, v.name as "vendorName" FROM oia_products p LEFT JOIN oia_vendors v ON p."vendorId" = v.id WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
router.get('/products/:id', productDetailHandler);

// POST create product
const productCreateHandler = async (req, res) => {
  try {
    const { productCode, name, category, subcategory, description, imageUrl, specification, basePrice, vendorId, leadTime, availability, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO oia_products ("productCode", name, category, subcategory, description, "imageUrl", specification, "basePrice", "vendorId", "leadTime", availability, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [productCode, name, category, subcategory, description, imageUrl, JSON.stringify(specification || {}), basePrice, vendorId, leadTime, availability || 'in_stock', notes]
    );

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [null, req.user?.id, 'created', 'product', result.rows[0].id, JSON.stringify({ name: name })]
      );
    } catch (logErr) { /* silent */ }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
router.post('/products', productCreateHandler);

// GET products by specific product codes (for showcase / targeted lookups)
// POST body: { codes: ["P-WE-001", "P-KNOLL-002", ...] }
router.post('/by-codes', async (req, res) => {
  try {
    const { codes } = req.body;
    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: 'codes array required' });
    }
    const result = await pool.query(
      `SELECT p.*, v.name as "vendorName"
       FROM oia_products p
       LEFT JOIN oia_vendors v ON p."vendorId" = v.id
       WHERE p."productCode" = ANY($1)
       ORDER BY p.name ASC`,
      [codes]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products by codes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== ROOT-LEVEL ALIASES =====
// Frontend calls /api/products (not /api/products/products)
// These MUST come after /vendors, /selections, /samples to avoid catching those as :id
router.get('/', productListHandler);
router.post('/', productCreateHandler);

// PUT update product
router.put('/products/:id', async (req, res) => {
  try {
    const { name, category, subcategory, description, imageUrl, specification, basePrice, vendorId, leadTime, availability, notes } = req.body;

    const result = await pool.query(
      `UPDATE oia_products SET name = COALESCE($1, name), category = COALESCE($2, category),
       subcategory = COALESCE($3, subcategory), description = COALESCE($4, description),
       "imageUrl" = COALESCE($5, "imageUrl"), specification = COALESCE($6, specification),
       "basePrice" = COALESCE($7, "basePrice"), "vendorId" = COALESCE($8, "vendorId"),
       "leadTime" = COALESCE($9, "leadTime"), availability = COALESCE($10, availability),
       notes = COALESCE($11, notes), "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [name, category, subcategory, description, imageUrl, specification ? JSON.stringify(specification) : null, basePrice, vendorId, leadTime, availability, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [null, req.user?.id, 'updated', 'product', req.params.id, JSON.stringify({ summary: 'Product updated' })]
      );
    } catch (logErr) { /* silent */ }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PROJECT SELECTIONS =====

// GET all selections for a project
router.get('/selections', async (req, res) => {
  try {
    const { projectId, room, specStatus } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    let query = `SELECT ps.*, p.name as "productName", p.category, p."basePrice"
                 FROM oia_project_selections ps
                 LEFT JOIN oia_products p ON ps."productId" = p.id
                 WHERE ps."projectId" = $1`;
    const params = [projectId];
    let paramIndex = 2;

    if (room) {
      query += ` AND ps.room = $${paramIndex}`;
      params.push(room);
      paramIndex++;
    }

    if (specStatus) {
      query += ` AND ps."specStatus" = $${paramIndex}`;
      params.push(specStatus);
      paramIndex++;
    }

    query += ' ORDER BY ps."selectedDate" DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching selections:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create selection
router.post('/selections', async (req, res) => {
  try {
    const { projectId, productId, room, quantity, selectedPrice, specStatus, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO oia_project_selections ("projectId", "productId", room, quantity, "selectedPrice", "specStatus", notes, "selectedDate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) RETURNING *`,
      [projectId, productId, room, quantity || 1, selectedPrice, specStatus || 'specified', notes]
    );

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, req.user?.id, 'created', 'selection', result.rows[0].id, JSON.stringify({ room: room, quantity: quantity })]
      );
    } catch (logErr) { /* silent */ }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating selection:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update selection
router.put('/selections/:id', async (req, res) => {
  try {
    const { room, quantity, selectedPrice, specStatus, notes } = req.body;

    // Get original selection
    const originalResult = await pool.query(
      'SELECT * FROM oia_project_selections WHERE id = $1',
      [req.params.id]
    );

    if (originalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Selection not found' });
    }

    const originalSelection = originalResult.rows[0];

    const result = await pool.query(
      `UPDATE oia_project_selections SET room = COALESCE($1, room), quantity = COALESCE($2, quantity),
       "selectedPrice" = COALESCE($3, "selectedPrice"), "specStatus" = COALESCE($4, "specStatus"),
       notes = COALESCE($5, notes) WHERE id = $6 RETURNING *`,
      [room, quantity, selectedPrice, specStatus, notes, req.params.id]
    );

    const updatedSelection = result.rows[0];

    // Notify on spec status change (approval/rejection)
    if (specStatus && specStatus !== originalSelection.specStatus) {
      try {
        const projectTeam = await pool.query(
          `SELECT DISTINCT "userId" FROM oia_project_team WHERE "projectId" = $1`,
          [updatedSelection.projectId]
        );

        const product = await pool.query(
          `SELECT name FROM oia_products WHERE id = $1`,
          [updatedSelection.productId]
        );

        const productName = product.rows[0]?.name || 'Product';
        let notificationType = 'approval_completed';
        if (specStatus === 'rejected') {
          notificationType = 'approval_requested';
        }

        const notificationTasks = projectTeam.rows.map(member =>
          createNotification({
            userId: member.userId,
            type: notificationType,
            title: `Product selection ${specStatus}: ${productName}`,
            message: `Product "${productName}" for ${updatedSelection.room || 'project'} has been ${specStatus}`,
            entityType: 'selection',
            entityId: updatedSelection.id,
            projectId: updatedSelection.projectId,
            actionUrl: `/products?projectId=${updatedSelection.projectId}`,
          }).catch(() => {})
        );

        await Promise.all(notificationTasks);
      } catch (notifErr) { /* silent */ }
    }

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [result.rows[0].projectId, req.user?.id, 'updated', 'selection', req.params.id, JSON.stringify({ summary: 'Selection updated' })]
      );
    } catch (logErr) { /* silent */ }

    res.json(updatedSelection);
  } catch (error) {
    console.error('Error updating selection:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE selection
router.delete('/selections/:id', async (req, res) => {
  try {
    // Get projectId before deleting
    const selectResult = await pool.query(
      'SELECT "projectId" FROM oia_project_selections WHERE id = $1',
      [req.params.id]
    );

    const result = await pool.query(
      'DELETE FROM oia_project_selections WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Selection not found' });
    }

    // Log activity
    try {
      const projectId = selectResult.rows.length > 0 ? selectResult.rows[0].projectId : null;
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, req.user?.id, 'deleted', 'selection', req.params.id, JSON.stringify({ summary: 'Selection deleted' })]
      );
    } catch (logErr) { /* silent */ }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting selection:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== MATERIAL SAMPLES =====

// GET all material samples for a project
router.get('/samples', async (req, res) => {
  try {
    const { projectId, status } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId required' });

    let query = `SELECT ms.*, v.name as "vendorName" FROM oia_material_samples ms
                 LEFT JOIN oia_vendors v ON ms."vendorId" = v.id
                 WHERE ms."projectId" = $1`;
    const params = [projectId];
    let paramIndex = 2;

    if (status) {
      query += ` AND ms.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY ms."createdAt" DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching samples:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create material sample
router.post('/samples', async (req, res) => {
  try {
    const { projectId, materialType, name, description, colorCode, vendorId, cost, status, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO oia_material_samples ("projectId", "materialType", name, description, "colorCode", "vendorId", cost, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [projectId, materialType, name, description, colorCode, vendorId, cost, status || 'in_review', notes]
    );

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, req.user?.id, 'created', 'sample', result.rows[0].id, JSON.stringify({ name: name })]
      );
    } catch (logErr) { /* silent */ }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating sample:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update material sample
router.put('/samples/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;

    const result = await pool.query(
      `UPDATE oia_material_samples SET status = COALESCE($1, status), notes = COALESCE($2, notes)
       WHERE id = $3 RETURNING *`,
      [status, notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [result.rows[0].projectId, req.user?.id, 'updated', 'sample', req.params.id, JSON.stringify({ summary: 'Sample updated' })]
      );
    } catch (logErr) { /* silent */ }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating sample:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE material sample
router.delete('/samples/:id', async (req, res) => {
  try {
    // Get projectId before deleting
    const selectResult = await pool.query(
      'SELECT "projectId" FROM oia_material_samples WHERE id = $1',
      [req.params.id]
    );

    const result = await pool.query(
      'DELETE FROM oia_material_samples WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sample not found' });
    }

    // Log activity
    try {
      const projectId = selectResult.rows.length > 0 ? selectResult.rows[0].projectId : null;
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, req.user?.id, 'deleted', 'sample', req.params.id, JSON.stringify({ summary: 'Sample deleted' })]
      );
    } catch (logErr) { /* silent */ }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting sample:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== URL IMPORT =====

// POST import product from URL — scrapes vendor page, creates product + optional floor plan placement
router.post('/import-url', async (req, res) => {
  try {
    const { url, projectId, floorPlanId } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // productImporter not yet ported — stub
    const importFromUrl = async () => ({ error: 'Import service not configured' });
    const detectVendor = () => null;

    // Scrape the product page
    const imported = await importFromUrl(url);

    // Find or create the vendor
    let vendorId = null;
    if (imported.vendorCode) {
      const vendorResult = await pool.query(
        `SELECT id FROM oia_vendors WHERE "vendorCode" = $1`, [imported.vendorCode]
      );
      if (vendorResult.rows.length > 0) {
        vendorId = vendorResult.rows[0].id;
      }
    }

    // Insert the product
    const result = await pool.query(
      `INSERT INTO oia_products (
        "productCode", name, category, subcategory, description, "imageUrl",
        specification, "basePrice", "vendorId", "leadTime", availability, notes,
        "sourceUrl", "sourceType", "furnitureType",
        "widthInches", "depthInches", "heightInches",
        "colorHex", "materialName", "collectionName", "thumbnailUrl", "dimensions3d"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      ON CONFLICT ("productCode") DO UPDATE SET
        name = EXCLUDED.name, description = EXCLUDED.description,
        "imageUrl" = EXCLUDED."imageUrl", "basePrice" = EXCLUDED."basePrice",
        specification = EXCLUDED.specification, "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        imported.productCode, imported.name, imported.category, imported.subcategory,
        imported.description, imported.imageUrl,
        JSON.stringify(imported.specification), imported.basePrice,
        vendorId, null, imported.availability, null,
        imported.sourceUrl, imported.sourceType, imported.furnitureType,
        imported.widthInches, imported.depthInches, imported.heightInches,
        imported.colorHex, imported.materialName, imported.collectionName,
        imported.thumbnailUrl, JSON.stringify(imported.dimensions3d),
      ]
    );

    const product = result.rows[0];

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId || null, req.user?.id, 'created', 'product', product.id, JSON.stringify({ source: 'import_url', name: product.name })]
      );
    } catch (logErr) { /* silent */ }

    // If a floorPlanId was given, build a furniture item for the floor plan
    let furnitureItem = null;
    if (imported.furnitureType && (imported.widthInches || imported.depthInches)) {
      // Convert inches to floor plan pixels (20px grid = 1 foot = 12 inches)
      const pxPerInch = 20 / 12;
      furnitureItem = {
        type: imported.furnitureType,
        x: 200, // Default placement — center-ish
        y: 200,
        width: Math.round((imported.widthInches || 36) * pxPerInch),
        height: Math.round((imported.depthInches || 24) * pxPerInch),
        rotation: 0,
        color: imported.colorHex || undefined,
        label: imported.name,
        productId: product.id,
        vendorName: imported.vendorName,
      };
    }

    res.status(201).json({
      product,
      furnitureItem,
      vendor: imported.vendorName,
      dimensions: {
        widthInches: imported.widthInches,
        depthInches: imported.depthInches,
        heightInches: imported.heightInches,
      },
      furnitureType: imported.furnitureType,
      material: imported.materialName,
      color: imported.colorHex ? { hex: imported.colorHex, name: imported.specification?.color } : null,
    });
  } catch (error) {
    console.error('Error importing from URL:', error);
    res.status(500).json({ error: error.message || 'Failed to import product' });
  }
});

// POST manual product entry with dimensions (for products without a URL)
router.post('/import-manual', async (req, res) => {
  try {
    const {
      name, furnitureType, vendorId, category,
      widthInches, depthInches, heightInches,
      colorHex, materialName, basePrice, description, imageUrl,
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const productCode = `V-MAN-${Date.now().toString(36).toUpperCase()}`;

    const dimensions3d = {};
    if (widthInches) dimensions3d.widthFt = widthInches / 12;
    if (depthInches) dimensions3d.depthFt = depthInches / 12;
    if (heightInches) dimensions3d.heightFt = heightInches / 12;
    if (furnitureType) dimensions3d.furnitureType = furnitureType;
    if (colorHex) dimensions3d.colorHex = colorHex;

    const result = await pool.query(
      `INSERT INTO oia_products (
        "productCode", name, category, description, "imageUrl",
        "basePrice", "vendorId", "sourceType", "furnitureType",
        "widthInches", "depthInches", "heightInches",
        "colorHex", "materialName", "dimensions3d"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        productCode, name, category || 'furniture', description, imageUrl,
        basePrice, vendorId, 'manual', furnitureType,
        widthInches, depthInches, heightInches,
        colorHex, materialName, JSON.stringify(dimensions3d),
      ]
    );

    // Log activity
    try {
      await pool.query(
        `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [null, req.user?.id, 'created', 'product', result.rows[0].id, JSON.stringify({ source: 'import_manual', name: name })]
      );
    } catch (logErr) { /* silent */ }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating manual product:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== FAVORITES =====

// GET /api/products/favorites/ids — map of favorited product/tearSheet IDs by scope
router.get('/favorites/ids', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    const result = await pool.query(
      `SELECT "productId", "tearSheetId", scope FROM oia_favorites WHERE "userId" = $1`,
      [req.user.id]
    );
    const products = {};
    const tearSheets = {};
    for (const row of result.rows) {
      if (row.productId) {
        if (!products[row.productId]) products[row.productId] = [];
        products[row.productId].push(row.scope);
      }
      if (row.tearSheetId) {
        if (!tearSheets[row.tearSheetId]) tearSheets[row.tearSheetId] = [];
        tearSheets[row.tearSheetId].push(row.scope);
      }
    }
    res.json({ products, tearSheets });
  } catch (err) {
    console.error('Error fetching favorite IDs:', err);
    res.status(500).json({ error: 'Failed to fetch favorite IDs' });
  }
});

// GET /api/products/favorites — list full favorite objects
router.get('/favorites', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    const { scope } = req.query;
    let query = `SELECT f.*, p.name as "productName", p."productCode" as sku, p.category, p."basePrice" as price, p."imageUrl",
                   ts."productName" as "tearSheetName", ts."productSku" as "tearSheetSku",
                   ts.category as "tearSheetCategory"
                 FROM oia_favorites f
                 LEFT JOIN oia_products p ON f."productId" = p.id
                 LEFT JOIN oia_tear_sheets ts ON f."tearSheetId" = ts.id
                 WHERE f."userId" = $1`;
    const params = [req.user.id];

    if (scope && scope !== 'all') {
      query += ` AND f.scope = $2`;
      params.push(scope);
    }

    query += ` ORDER BY f."createdAt" DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST /api/products/favorites/toggle — add or remove a favorite
router.post('/favorites/toggle', async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    const { productId, tearSheetId, scope = 'personal' } = req.body;

    if (!productId && !tearSheetId) {
      return res.status(400).json({ error: 'productId or tearSheetId is required' });
    }

    // Check if already favorited
    let checkQuery, checkParams;
    if (productId) {
      checkQuery = `SELECT id FROM oia_favorites WHERE "userId" = $1 AND "productId" = $2 AND scope = $3`;
      checkParams = [req.user.id, productId, scope];
    } else {
      checkQuery = `SELECT id FROM oia_favorites WHERE "userId" = $1 AND "tearSheetId" = $2 AND scope = $3`;
      checkParams = [req.user.id, tearSheetId, scope];
    }

    const existing = await pool.query(checkQuery, checkParams);

    if (existing.rows.length > 0) {
      // Remove favorite
      await pool.query(`DELETE FROM oia_favorites WHERE id = $1`, [existing.rows[0].id]);

      // Log activity
      try {
        await pool.query(
          `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [null, req.user?.id, 'deleted', 'favorite', existing.rows[0].id, JSON.stringify({ scope: scope })]
        );
      } catch (logErr) { /* silent */ }

      res.json({ action: 'removed', id: existing.rows[0].id });
    } else {
      // Add favorite
      const result = await pool.query(
        `INSERT INTO oia_favorites ("userId", "productId", "tearSheetId", scope)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, productId || null, tearSheetId || null, scope]
      );

      // Log activity
      try {
        await pool.query(
          `INSERT INTO oia_activity_log ("projectId", "userId", action, "entityType", "entityId", details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [null, req.user?.id, 'created', 'favorite', result.rows[0].id, JSON.stringify({ scope: scope })]
        );
      } catch (logErr) { /* silent */ }

      res.json({ action: 'added', favorite: result.rows[0] });
    }
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Root-level /:id — MUST be last to avoid catching /vendors, /selections, /samples as :id
router.get('/:id', productDetailHandler);

// ─── POST /api/products/:id/analyze-image ──────────────────────────
// Analyze a product's image: metadata, dominant colors, color harmony
// Uses ImageProcessor (Sharp) + ColorEngine (Chroma.js)
router.post('/:id/analyze-image', async (req, res) => {
  try {
    const product = await pool.query(
      `SELECT * FROM oia_products WHERE id = $1`, [req.params.id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const record = product.rows[0];
    const imageUrl = record.imageUrl || record.thumbnailUrl;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Product has no image' });
    }

    const { ImageProcessor } = await import('@openscaffold/integrations/imaging');
    const { ColorEngine } = await import('@openscaffold/integrations/color');

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return res.status(400).json({ error: 'Could not fetch product image' });
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const [meta, colors] = await Promise.all([
      ImageProcessor.metadata(buffer),
      ImageProcessor.dominantColors(buffer, { count: 6 }).catch(() => []),
    ]);

    // Enrich colors with harmony + accessibility
    const enrichedColors = colors.map(c => {
      const hex = c.hex || c;
      try {
        return {
          hex,
          population: c.population || null,
          harmonies: ColorEngine.harmony(hex, 'analogous'),
          contrastOnWhite: ColorEngine.contrastRatio(hex, '#FFFFFF'),
        };
      } catch { return { hex }; }
    });

    // Store analysis results
    await pool.query(
      `UPDATE oia_products
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify({ imageAnalysis: { colors: enrichedColors, dimensions: { width: meta.width, height: meta.height } } }), req.params.id]
    );

    res.json({
      productId: record.id,
      image: { width: meta.width, height: meta.height, format: meta.format },
      dominantColors: enrichedColors,
    });
  } catch (error) {
    console.error('Product image analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/products/:id/generate-thumbnail ────────────────────
// Generate optimized thumbnail for a product image
router.post('/:id/generate-thumbnail', async (req, res) => {
  try {
    const product = await pool.query(
      `SELECT * FROM oia_products WHERE id = $1`, [req.params.id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imageUrl = product.rows[0].imageUrl;
    if (!imageUrl) return res.status(400).json({ error: 'Product has no image' });

    const { ImageProcessor } = await import('@openscaffold/integrations/imaging');

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return res.status(400).json({ error: 'Could not fetch image' });
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const width = parseInt(req.body.width) || 300;
    const thumbnail = await ImageProcessor.thumbnail(buffer, {
      width,
      format: 'webp',
      quality: 80,
    });

    const thumbUrl = `data:image/webp;base64,${thumbnail.toString('base64')}`;

    await pool.query(
      `UPDATE oia_products SET "thumbnailUrl" = $1 WHERE id = $2`,
      [thumbUrl, req.params.id]
    );

    res.json({ productId: parseInt(req.params.id), thumbnailUrl: thumbUrl, width });
  } catch (error) {
    console.error('Product thumbnail error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /send-approval-email — Send product selection approval email with branded template
router.post('/send-approval-email', async (req, res) => {
  try {
    const { productName, productId, clientName, recipientEmail, approvalLink } = req.body;

    if (!productName || !recipientEmail) {
      return res.status(400).json({ error: 'productName and recipientEmail are required' });
    }

    const { EmailBuilder } = await import('@openscaffold/integrations/email');

    const template = `
      <h2>Product Selection Approval Needed</h2>
      <p>Hello {{clientName}},</p>
      <p>Please review and approve the following product selection:</p>
      <p><strong>Product:</strong> {{productName}}</p>
      <p><a href="{{approvalLink}}" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review & Approve</a></p>
      <p>Your approval is required to proceed with ordering. Review the specifications, pricing, and delivery timeline.</p>
      <p>Best regards,<br/>OpenInteriorDesign Team</p>
    `;

    const variables = {
      productName: productName,
      clientName: clientName || 'Client',
      approvalLink: approvalLink || `${process.env.APP_URL || 'http://localhost:5176'}/products/${productId}/approve`,
    };

    const { html } = EmailBuilder.interpolate(template, variables);

    res.json({
      success: true,
      html,
      subject: `Product Approval: ${productName}`,
      to: recipientEmail,
    });
  } catch (error) {
    console.error('Error rendering product approval email:', error);
    res.status(501).json({ error: 'Email service not configured', details: error.message });
  }
});

export default router;
