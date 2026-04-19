/**
 * ProductMaterialMapper — Maps tear sheet product data to Three.js materials
 *
 * Given a product from oia_tear_sheets with materials[] and finishes[],
 * creates appropriate Three.js materials that approximate the real product.
 */

// Material keyword → Three.js material config mapping
const MATERIAL_MAP = {
  // Woods
  'walnut': { color: 0x5C4033, roughness: 0.4, metalness: 0.0 },
  'oak': { color: 0xC8A882, roughness: 0.5, metalness: 0.0 },
  'cherry': { color: 0x8B4513, roughness: 0.4, metalness: 0.0 },
  'mahogany': { color: 0x6B3226, roughness: 0.35, metalness: 0.0 },
  'maple': { color: 0xDEB887, roughness: 0.45, metalness: 0.0 },
  'teak': { color: 0xB8860B, roughness: 0.4, metalness: 0.0 },
  'pine': { color: 0xE8D5B7, roughness: 0.6, metalness: 0.0 },
  'bamboo': { color: 0xD4B896, roughness: 0.5, metalness: 0.0 },
  // Metals
  'brass': { color: 0xB5A642, roughness: 0.2, metalness: 0.8 },
  'chrome': { color: 0xC0C0C0, roughness: 0.1, metalness: 0.9 },
  'nickel': { color: 0xAAAAAA, roughness: 0.15, metalness: 0.85 },
  'iron': { color: 0x444444, roughness: 0.6, metalness: 0.7 },
  'gold': { color: 0xFFD700, roughness: 0.15, metalness: 0.9 },
  'copper': { color: 0xB87333, roughness: 0.25, metalness: 0.8 },
  'steel': { color: 0x808080, roughness: 0.3, metalness: 0.8 },
  'aluminum': { color: 0xBFBFBF, roughness: 0.2, metalness: 0.8 },
  // Fabrics
  'linen': { color: 0xF5F0E1, roughness: 0.9, metalness: 0.0 },
  'velvet': { color: 0x4A3728, roughness: 0.95, metalness: 0.0 },
  'leather': { color: 0x5C4033, roughness: 0.4, metalness: 0.05 },
  'cotton': { color: 0xF0EDE6, roughness: 0.85, metalness: 0.0 },
  'silk': { color: 0xFFF8DC, roughness: 0.3, metalness: 0.05 },
  'wool': { color: 0xE8E0D4, roughness: 0.9, metalness: 0.0 },
  'cashmere': { color: 0xF5F0E8, roughness: 0.7, metalness: 0.0 },
  'polyester': { color: 0xE8DCC8, roughness: 0.7, metalness: 0.0 },
  'microfiber': { color: 0xDDD8CE, roughness: 0.75, metalness: 0.0 },
  // Stone & Tile
  'marble': { color: 0xF0EDE6, roughness: 0.2, metalness: 0.05 },
  'granite': { color: 0x808080, roughness: 0.4, metalness: 0.05 },
  'concrete': { color: 0xBBBBBB, roughness: 0.8, metalness: 0.0 },
  'slate': { color: 0x555555, roughness: 0.6, metalness: 0.0 },
  'limestone': { color: 0xD3D3D3, roughness: 0.5, metalness: 0.0 },
  'travertine': { color: 0xCCB89F, roughness: 0.5, metalness: 0.0 },
  // Glass & Acrylic
  'glass': { color: 0x88CCFF, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3 },
  'acrylic': { color: 0xBBDDFF, roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.4 },
  'polycarbonate': { color: 0xCCEEFF, roughness: 0.2, metalness: 0.05, transparent: true, opacity: 0.35 },
  // Other
  'plastic': { color: 0xCCCCCC, roughness: 0.6, metalness: 0.0 },
  'rubber': { color: 0x333333, roughness: 0.9, metalness: 0.0 },
  'laminate': { color: 0xD9D9D9, roughness: 0.4, metalness: 0.05 },
  'veneer': { color: 0xB8956A, roughness: 0.35, metalness: 0.0 },
};

/**
 * Extract material config from product's materials array
 * Looks for keywords and blends the colors/properties
 */
function extractMaterialConfig(materials) {
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    return { color: 0x888888, roughness: 0.5, metalness: 0.0 };
  }

  // Combine first few materials to get composite color/properties
  let configs = [];
  materials.slice(0, 3).forEach(mat => {
    const lower = typeof mat === 'string' ? mat.toLowerCase() : '';
    Object.entries(MATERIAL_MAP).forEach(([key, config]) => {
      if (lower.includes(key)) {
        configs.push(config);
      }
    });
  });

  if (configs.length === 0) {
    return { color: 0x888888, roughness: 0.5, metalness: 0.0 };
  }

  // Blend the colors by averaging (simple approach)
  if (configs.length === 1) {
    return configs[0];
  }

  const avgColor = Math.floor(
    configs.reduce((sum, c) => sum + c.color, 0) / configs.length
  );
  const avgRoughness = configs.reduce((sum, c) => sum + (c.roughness || 0.5), 0) / configs.length;
  const avgMetalness = configs.reduce((sum, c) => sum + (c.metalness || 0.0), 0) / configs.length;
  const transparent = configs.some(c => c.transparent);
  const opacity = transparent ? configs.reduce((sum, c) => sum + (c.opacity || 0.3), 0) / configs.length : undefined;

  return {
    color: avgColor,
    roughness: avgRoughness,
    metalness: avgMetalness,
    ...(transparent && { transparent: true, opacity })
  };
}

/**
 * Map tear sheet product data to Three.js material configuration
 * @param {Object} product - Product from oia_tear_sheets
 * @returns {Object} Three.js material config + metadata
 */
export function mapProductToMaterial(product) {
  if (!product) {
    return { color: 0x888888, roughness: 0.5, metalness: 0.0 };
  }

  const materialConfig = extractMaterialConfig(product.materials);

  return {
    ...materialConfig,
    productName: product.productName,
    productSku: product.productSku,
    materials: product.materials,
    finishes: product.finishes,
  };
}

/**
 * Parse product dimensions from JSONB and convert to world units
 * @param {Object} product - Product from oia_tear_sheets
 * @param {Number} PX_TO_WORLD - Conversion factor (typically 0.01 feet per pixel)
 * @returns {Object} {w, d, h} in world units
 */
export function getProductDimensions(product, PX_TO_WORLD = 0.01) {
  if (!product || !product.dimensions) {
    return { w: 1, d: 1, h: 1 };
  }

  const dims = product.dimensions;
  const unit = dims.unit || 'inches';

  // Convert to world units (assuming base unit is inches)
  const multiplier = unit === 'feet' ? 12 : unit === 'cm' ? 0.3937 : 1;
  const w = (dims.width || 24) * multiplier * PX_TO_WORLD;
  const d = (dims.depth || 24) * multiplier * PX_TO_WORLD;
  const h = (dims.height || 30) * multiplier * PX_TO_WORLD;

  return { w, d, h };
}

/**
 * Create a text sprite label for the product
 * Shows product name and SKU above the furniture in 3D space
 * @param {Object} THREE - Three.js library
 * @param {Object} product - Product data
 * @returns {Object} {sprite, canvas} for adding to scene
 */
export function createProductLabel(THREE, product) {
  if (!product || !product.productName) {
    return null;
  }

  // Create canvas for texture
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.roundRect(10, 10, 492, 236, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
  ctx.lineWidth = 2;
  ctx.roundRect(10, 10, 492, 236, 8);
  ctx.stroke();

  // Product name
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText(product.productName, 30, 80);

  // SKU
  ctx.font = '20px Arial';
  ctx.fillStyle = '#CCCCCC';
  ctx.fillText(`SKU: ${product.productSku || 'N/A'}`, 30, 130);

  // Price (if available)
  if (product.retailPrice || product.tradePrice) {
    const price = product.retailPrice || product.tradePrice;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`$${price.toFixed(0)}`, 30, 180);
  }

  // Create texture and sprite
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);

  // Scale sprite to be readable (approximately 2x1 world units)
  sprite.scale.set(2, 1, 1);

  return { sprite, canvas, texture };
}

/**
 * Get product price information for display
 * @param {Object} product
 * @returns {Object} {tradePrice, retailPrice, showPrice}
 */
export function getProductPrice(product) {
  if (!product) {
    return { tradePrice: null, retailPrice: null, showPrice: null };
  }

  const showPrice = product.retailPrice || product.tradePrice;
  return {
    tradePrice: product.tradePrice,
    retailPrice: product.retailPrice,
    showPrice,
  };
}

/**
 * Create a product info card suitable for presentation mode
 * Returns HTML-ready data about the product
 * @param {Object} product
 * @returns {Object} Formatted product info
 */
export function formatProductInfo(product) {
  if (!product) return null;

  const dims = product.dimensions || {};
  const price = getProductPrice(product);

  return {
    name: product.productName,
    sku: product.productSku,
    category: product.category,
    subcategory: product.subcategory,
    collection: product.collection,
    description: product.description,
    dimensions: {
      width: dims.width,
      depth: dims.depth,
      height: dims.height,
      unit: dims.unit || 'inches'
    },
    materials: product.materials,
    finishes: product.finishes,
    price: price.showPrice,
    tradePrice: price.tradePrice,
    retailPrice: price.retailPrice,
    leadTime: product.leadTimeWeeks,
    imageUrl: product.imageUrls && product.imageUrls[0],
  };
}

/**
 * Estimate furniture type/style from product metadata
 * Helps with smart positioning and animation
 * @param {Object} product
 * @returns {String} Type category (e.g., 'seating', 'storage', 'table', 'accent')
 */
export function inferProductType(product) {
  if (!product || !product.category) return 'furniture';

  const cat = product.category.toLowerCase();
  const subcat = (product.subcategory || '').toLowerCase();

  if (cat.includes('sofa') || cat.includes('chair') || cat.includes('seating') || subcat.includes('seating')) {
    return 'seating';
  }
  if (cat.includes('table') || cat.includes('desk') || subcat.includes('table')) {
    return 'table';
  }
  if (cat.includes('storage') || cat.includes('cabinet') || cat.includes('shelf') || subcat.includes('storage')) {
    return 'storage';
  }
  if (cat.includes('bed') || subcat.includes('bed')) {
    return 'bed';
  }
  if (cat.includes('light') || cat.includes('lamp') || subcat.includes('lighting')) {
    return 'lighting';
  }
  if (cat.includes('decor') || cat.includes('art') || cat.includes('accent') || subcat.includes('accent')) {
    return 'accent';
  }

  return 'furniture';
}
