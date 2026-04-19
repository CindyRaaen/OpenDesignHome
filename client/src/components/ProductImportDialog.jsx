/**
 * ProductImportDialog.jsx — Paste a URL from any major vendor,
 * auto-detect product dimensions + type, save to catalog, and
 * optionally place on the active floor plan with accurate 3D rendering.
 */

import React, { useState, useCallback } from 'react'
import {
  Link2, Package, Ruler, Palette, Layers, ArrowRight,
  Check, AlertCircle, Loader2, X, ExternalLink, Plus, FileText
} from 'lucide-react'
import { api } from '../utils/api'

// ── Vendor logos/colors for visual identification ────────────────────────
const VENDOR_COLORS = {
  'Restoration Hardware': '#1a1a1a',
  'Arhaus':              '#2c5234',
  'Room & Board':        '#333333',
  'Design Within Reach': '#e63312',
  'Holly Hunt':          '#000000',
  'Baker Furniture':     '#8B7355',
  'West Elm':            '#3d3d3d',
  'CB2':                 '#1a1a1a',
  'Wayfair':             '#7b189f',
  'Pottery Barn':        '#6b4226',
  'IKEA':                '#0051ba',
  'B&B Italia':          '#1a1a1a',
  'Minotti':             '#1a1a1a',
  'Knoll':               '#cc0000',
  'Herman Miller':       '#e35205',
}

// ── Furniture type display names ─────────────────────────────────────────
const TYPE_LABELS = {
  sofa: 'Sofa', 'sectional-l': 'L-Sectional', armchair: 'Armchair',
  'accent-chair': 'Accent Chair', recliner: 'Recliner', loveseat: 'Loveseat',
  ottoman: 'Ottoman', bench: 'Bench', 'bar-stool': 'Bar Stool',
  'office-chair': 'Office Chair', 'dining-table': 'Dining Table',
  'round-table': 'Round Table', desk: 'Desk', 'coffee-table': 'Coffee Table',
  'side-table': 'Side Table', 'console-table': 'Console Table',
  'bar-table': 'Bar Table', island: 'Kitchen Island', nightstand: 'Nightstand',
  vanity: 'Vanity', 'bed-king': 'King Bed', 'bed-queen': 'Queen Bed',
  'bed-twin': 'Twin Bed', dresser: 'Dresser', wardrobe: 'Wardrobe',
  bookshelf: 'Bookshelf', cabinet: 'Cabinet', sideboard: 'Sideboard',
  'tv-console': 'TV Console', 'floor-lamp': 'Floor Lamp',
  'table-lamp': 'Table Lamp', rug: 'Area Rug', plant: 'Plant',
  fireplace: 'Fireplace', bathtub: 'Bathtub', shower: 'Shower',
  sink: 'Sink', fridge: 'Refrigerator', stove: 'Stove',
}

export default function ProductImportDialog({ onClose, onProductImported, projectId, floorPlanId }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [placed, setPlaced] = useState(false)

  const handleImport = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await api.post('/api/products/import-url', {
        url: url.trim(),
        projectId,
        floorPlanId,
      })
      setResult(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to import product')
    } finally {
      setLoading(false)
    }
  }, [url, projectId, floorPlanId])

  const handlePlaceOnFloorPlan = useCallback(() => {
    if (result?.furnitureItem && onProductImported) {
      onProductImported(result)
      setPlaced(true)
    }
  }, [result, onProductImported])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleImport()
  }

  const dims = result?.dimensions
  const hasDims = dims?.widthInches || dims?.depthInches || dims?.heightInches

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 size={20} className="text-white/80" />
            <div>
              <h2 className="text-lg font-bold text-white">Import Product from URL</h2>
              <p className="text-xs text-white/60">Paste a link from any major furniture vendor</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* URL Input */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://rh.com/catalog/product/..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              autoFocus
            />
            <button
              onClick={handleImport}
              disabled={loading || !url.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Scanning...' : 'Import'}
            </button>
          </div>

          {/* Supported vendors hint */}
          <div className="mt-2 flex flex-wrap gap-1">
            {['RH', 'Arhaus', 'Room & Board', 'DWR', 'Holly Hunt', 'Baker', 'B&B Italia', 'Minotti', 'West Elm', 'Wayfair'].map(v => (
              <span key={v} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                {v}
              </span>
            ))}
            <span className="text-[9px] text-slate-400">+ more</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-red-700 font-medium">Import failed</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Result Preview */}
        {result && (
          <div className="px-6 pb-5">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Vendor badge + product name */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  {result.vendor && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: VENDOR_COLORS[result.vendor] || '#555' }}
                    >
                      {result.vendor}
                    </span>
                  )}
                  {result.furnitureType && (
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium">
                      {TYPE_LABELS[result.furnitureType] || result.furnitureType}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900">{result.product?.name}</h3>
                {result.product?.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.product.description}</p>
                )}
              </div>

              {/* Specs grid */}
              <div className="px-4 py-3 grid grid-cols-2 gap-3">
                {/* Dimensions */}
                {hasDims && (
                  <div className="flex items-start gap-2">
                    <Ruler size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase">Dimensions</div>
                      <div className="text-sm text-slate-800 font-medium">
                        {dims.widthInches && `${dims.widthInches}"W`}
                        {dims.depthInches && ` × ${dims.depthInches}"D`}
                        {dims.heightInches && ` × ${dims.heightInches}"H`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Price */}
                {result.product?.basePrice && (
                  <div className="flex items-start gap-2">
                    <Package size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase">Price</div>
                      <div className="text-sm text-slate-800 font-medium">
                        ${Number(result.product.basePrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Color */}
                {result.color && (
                  <div className="flex items-start gap-2">
                    <Palette size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase">Color</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: result.color.hex }} />
                        <span className="text-sm text-slate-800 capitalize">{result.color.name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Material */}
                {result.material && (
                  <div className="flex items-start gap-2">
                    <Layers size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium uppercase">Material</div>
                      <div className="text-sm text-slate-800 capitalize">{result.material}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex gap-2">
                {result.furnitureItem && !placed && (
                  <button
                    onClick={handlePlaceOnFloorPlan}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    Place on Floor Plan
                  </button>
                )}
                {placed && (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg">
                    <Check size={14} />
                    Added to floor plan
                  </div>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ExternalLink size={12} />
                  View Original
                </a>
              </div>

              {/* Saved to catalog confirmation */}
              <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
                <Check size={12} className="text-green-600" />
                <span className="text-[11px] text-green-700">Saved to product catalog as {result.product?.productCode}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state / instructions */}
        {!result && !loading && !error && (
          <div className="px-6 pb-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">How it works</h4>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span>Paste a product URL from any supported vendor</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span>We auto-detect dimensions, materials, color, and pricing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span>Product saves to your catalog and places on the floor plan with accurate 3D rendering</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
