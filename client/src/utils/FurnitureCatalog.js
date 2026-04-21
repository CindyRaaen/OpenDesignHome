/**
 * FurnitureCatalog.js — API-backed product catalog with affiliate/retail revenue model
 *
 * Fetches real furniture from the odh_furniture and oia_products tables (shared DB with OID).
 * Brands like De Sousa Hughes, B&B Italia, Herman Miller, Knoll, etc. come from the live database.
 * This module provides helpers for ChallengeFlow's furniture phase and the retail revenue model.
 */

import { api } from './api'

// ── PLACEMENT TYPES for retail/advertising revenue ──────────────────────
export const PLACEMENT_TYPES = {
  FEATURED:  { id: 'featured',  label: 'Featured Pick',       revenueType: 'cpc' },
  SPONSORED: { id: 'sponsored', label: 'Sponsored',           revenueType: 'cpm' },
  NATIVE:    { id: 'native',    label: 'Native Suggestion',   revenueType: 'affiliate' },
  CHALLENGE: { id: 'challenge', label: 'Challenge Placement',  revenueType: 'flat' },
  AFFILIATE: { id: 'affiliate', label: 'Shop This Look',      revenueType: 'affiliate' },
}

// ── REVENUE MODEL ───────────────────────────────────────────────────────
export const REVENUE_MODEL = {
  affiliate:        { minRate: 0.03, maxRate: 0.12, description: 'Commission on completed sale' },
  sponsored_cpm:    { rate: 8.50, description: 'Per 1000 impressions in challenge feed' },
  featured_cpc:     { rate: 1.25, description: 'Per click on featured product card' },
  challenge_flat:   { rate: 500, description: 'Flat fee per challenge placement' },
  brand_partnership:{ rate: 2500, description: 'Monthly brand partnership' },
}

// ── LOCAL CACHE ─────────────────────────────────────────────────────────
let _furnitureCache = null
let _productsCache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function cacheExpired() {
  return Date.now() - _cacheTime > CACHE_TTL
}

// ── FETCH FROM REAL DATABASE ────────────────────────────────────────────

/** Fetch all items from odh_furniture (the 48+ real designer items) */
export async function fetchFurniture() {
  if (_furnitureCache && !cacheExpired()) return _furnitureCache
  try {
    const items = await api.get('/api/furniture')
    _furnitureCache = items
    _cacheTime = Date.now()
    return items
  } catch (err) {
    console.warn('FurnitureCatalog: could not fetch /api/furniture:', err.message)
    return _furnitureCache || []
  }
}

/** Fetch all items from oia_products (the professional product database shared with OID) */
export async function fetchProducts() {
  if (_productsCache && !cacheExpired()) return _productsCache
  try {
    const items = await api.get('/api/products')
    _productsCache = items
    _cacheTime = Date.now()
    return items
  } catch (err) {
    console.warn('FurnitureCatalog: could not fetch /api/products:', err.message)
    return _productsCache || []
  }
}

// ── HELPERS ─────────────────────────────────────────────────────────────

/** Get furniture items by category (sofas, chairs, tables, lamps, art, plants) */
export async function getByCategory(category) {
  const items = await fetchFurniture()
  if (!category || category === 'all') return items
  return items.filter(f => f.category === category)
}

/** Get furniture items by brand name */
export async function getByBrand(brand) {
  const items = await fetchFurniture()
  return items.filter(f => f.brand?.toLowerCase() === brand.toLowerCase())
}

/** Get furniture items by style (modern, mid-century, scandinavian, etc.) */
export async function getByStyle(style) {
  const items = await fetchFurniture()
  return items.filter(f => f.style?.toLowerCase() === style.toLowerCase())
}

/** Search furniture by name, brand, designer, or material */
export async function searchFurniture(query) {
  const items = await fetchFurniture()
  if (!query) return items
  const q = query.toLowerCase()
  return items.filter(f =>
    f.name?.toLowerCase().includes(q) ||
    f.brand?.toLowerCase().includes(q) ||
    f.designer?.toLowerCase().includes(q) ||
    f.material_name?.toLowerCase().includes(q)
  )
}

/** Get all unique brands from the furniture table */
export async function getBrands() {
  try {
    return await api.get('/api/furniture/brands')
  } catch {
    const items = await fetchFurniture()
    const brandMap = {}
    for (const f of items) {
      if (!f.brand) continue
      if (!brandMap[f.brand]) brandMap[f.brand] = { brand: f.brand, count: 0, min_price: Infinity, max_price: 0 }
      brandMap[f.brand].count++
      if (f.price_usd < brandMap[f.brand].min_price) brandMap[f.brand].min_price = f.price_usd
      if (f.price_usd > brandMap[f.brand].max_price) brandMap[f.brand].max_price = f.price_usd
    }
    return Object.values(brandMap)
  }
}

/** Get products that match a furniture type for the ChallengeFlow furniture phase */
export async function getProductsForSlot(furnitureType) {
  const items = await fetchFurniture()
  // Map ChallengeFlow types to odh_furniture categories
  const typeToCategory = {
    sofa: 'sofas', couch: 'sofas', sectional: 'sofas',
    chair: 'chairs', armchair: 'chairs', accent_chair: 'chairs',
    dining_chair: 'chairs', lounge_chair: 'chairs',
    table: 'tables', coffee_table: 'tables', dining_table: 'tables',
    side_table: 'tables', desk: 'tables', console: 'tables',
    lamp: 'lamps', floor_lamp: 'lamps', table_lamp: 'lamps',
    pendant: 'lamps', chandelier: 'lamps',
    art: 'art', painting: 'art', sculpture: 'art',
    plant: 'plants', planter: 'plants',
    rug: 'textiles', textile: 'textiles',
    storage: 'storage', bookshelf: 'storage', cabinet: 'storage',
  }
  const category = typeToCategory[furnitureType] || furnitureType
  return items.filter(f => f.category === category)
}

/** Get featured products for "Shop This Look" panel */
export async function getFeaturedProducts(limit = 4) {
  const items = await fetchFurniture()
  // Feature the most expensive items (they have the best margin for affiliate)
  return [...items]
    .sort((a, b) => (b.price_usd || 0) - (a.price_usd || 0))
    .slice(0, limit)
}

/** Estimate affiliate revenue for a set of products */
export function estimateAffiliateRevenue(products) {
  const totalPrice = products.reduce((sum, p) => sum + (p.price_usd || p.retail_price || 0), 0)
  return {
    lowEstimate:  Math.round(totalPrice * REVENUE_MODEL.affiliate.minRate * 100) / 100,
    highEstimate: Math.round(totalPrice * REVENUE_MODEL.affiliate.maxRate * 100) / 100,
    productCount: products.length,
    totalRetail:  totalPrice,
  }
}

/** Format price for display */
export function formatPrice(cents_or_dollars) {
  const val = typeof cents_or_dollars === 'number' ? cents_or_dollars : 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val)
}

/** Invalidate cache (e.g., after importing new products) */
export function invalidateCache() {
  _furnitureCache = null
  _productsCache = null
  _cacheTime = 0
}

// ── DEFAULT EXPORT ──────────────────────────────────────────────────────
export default {
  PLACEMENT_TYPES,
  REVENUE_MODEL,
  fetchFurniture,
  fetchProducts,
  getByCategory,
  getByBrand,
  getByStyle,
  searchFurniture,
  getBrands,
  getProductsForSlot,
  getFeaturedProducts,
  estimateAffiliateRevenue,
  formatPrice,
  invalidateCache,
}
