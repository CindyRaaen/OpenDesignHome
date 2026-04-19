import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, X, Filter, ChevronDown, ChevronRight, Package, Armchair, Table2,
  Bed, Lamp, BookOpen, Star, Loader, ExternalLink, FileText, Check, Plus,
  CookingPot, Refrigerator, DoorOpen, Droplets, LayoutGrid, Layers,
} from 'lucide-react'
import { api } from '../utils/api'

// ── Image proxy helper ──────────────────────────────────────────────────
const proxyImg = (url, w, h) => {
  if (!url) return null
  const params = new URLSearchParams({ url })
  if (w) params.append('w', w)
  if (h) params.append('h', h)
  return `/api/image-proxy?${params.toString()}`
}

// ── Category definitions ────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Package },
  { id: 'seating', label: 'Seating', icon: Armchair },
  { id: 'tables', label: 'Tables', icon: Table2 },
  { id: 'bedroom', label: 'Beds', icon: Bed },
  { id: 'cabinetry', label: 'Cabinetry', icon: DoorOpen },
  { id: 'appliances', label: 'Appliances', icon: CookingPot },
  { id: 'countertops', label: 'Countertops', icon: Layers },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets },
  { id: 'lighting', label: 'Lighting', icon: Lamp },
  { id: 'storage', label: 'Storage', icon: BookOpen },
  { id: 'accessories', label: 'Accessories', icon: Star },
]

const PAGE_SIZE = 30

// ═══════════════════════════════════════════════════════════════════════════
// ProductConfigurator — shown when a product is selected for configuration
// ═══════════════════════════════════════════════════════════════════════════
function ProductConfigurator({ product, onPlace, onBack }) {
  const [finishes, setFinishes] = useState([])
  const [fabrics, setFabrics] = useState([])
  const [isUpholsterable, setIsUpholsterable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedFinish, setSelectedFinish] = useState(null)
  const [selectedFabric, setSelectedFabric] = useState(null)
  const [selectedColorway, setSelectedColorway] = useState(null)
  const [expandedType, setExpandedType] = useState(null)
  const [fabricExpanded, setFabricExpanded] = useState(false)
  const [fabricSearch, setFabricSearch] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  // Fetch configurator data (product detail + finishes + fabrics)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get(`/api/products/products/${product.id}/configurator`)
      .then(res => {
        if (cancelled) return
        const data = res.data || res
        setFinishes(data.finishes || [])
        setFabrics(data.fabrics || [])
        setIsUpholsterable(data.isUpholsterable || false)
        // Auto-expand first finish type
        if (data.finishes?.length > 0) {
          const types = [...new Set(data.finishes.map(f => f.finishType))]
          setExpandedType(types[0])
        }
      })
      .catch(err => console.error('Error fetching configurator:', err))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [product.id])

  const images = product.imageUrls || []
  const heroUrl = product.imageUrl || (images[0]?.url)
  const galleryImages = images.filter(i => i.type === 'gallery' || i.type === 'gallery_hd')
  const allImages = heroUrl ? [{ url: heroUrl, type: 'hero' }, ...galleryImages] : galleryImages
  const tearSheets = product.tearSheets || []

  // Group finishes by type
  const finishGroups = {}
  finishes.forEach(f => {
    if (!finishGroups[f.finishType]) finishGroups[f.finishType] = []
    finishGroups[f.finishType].push(f)
  })

  // Parse colorways from fabric tear sheet data
  const getFabricColorways = (fabric) => {
    const tsd = fabric.tearSheetData || {}
    return tsd.colorways || []
  }

  // Filter fabrics by search
  const filteredFabrics = fabrics.filter(f => {
    if (!fabricSearch) return true
    const q = fabricSearch.toLowerCase()
    return (f.productName || '').toLowerCase().includes(q) ||
           (f.showroomName || '').toLowerCase().includes(q) ||
           (f.collection || '').toLowerCase().includes(q)
  })

  // Group fabrics by showroom
  const fabricsByShowroom = {}
  filteredFabrics.forEach(f => {
    const key = f.showroomName || 'Other'
    if (!fabricsByShowroom[key]) fabricsByShowroom[key] = []
    fabricsByShowroom[key].push(f)
  })

  const handlePlace = () => {
    // Floor plan uses SCALE_FACTOR=0.5 → 1 grid unit (20px) = 6 inches
    // So pxPerInch = GRID_SIZE / 6 = 3.333
    const GRID_SIZE = 20
    const INCHES_PER_GRID = 6
    const pxPerInch = GRID_SIZE / INCHES_PER_GRID

    // Apply fabric color to render profile if a fabric is selected
    const fabricColor = selectedColorway?.hex || selectedFabric?.tearSheetData?.colorways?.[0]?.hex || null
    const effectiveFinish = selectedFinish || (fabricColor ? {
      finishType: 'fabric',
      materialType: 'fabric',
      colorHex: fabricColor,
      finishName: selectedFabric?.productName || 'Custom Fabric',
    } : null)

    const item = {
      type: (product.furnitureArchetype || 'generic').replace(/_/g, '-'),
      label: product.name,
      width: Math.round((product.widthInches || 36) * pxPerInch),
      height: Math.round((product.depthInches || 24) * pxPerInch),
      widthInches: parseFloat(product.widthInches) || 36,
      depthInches: parseFloat(product.depthInches) || 24,
      heightInches: parseFloat(product.heightInches) || 30,
      rotation: 0,
      color: fabricColor || selectedFinish?.colorHex || product.colorHex || '#6366f1',
      productId: product.id,
      vendorName: product.vendorName || 'Unknown',
      imageUrl: product.imageUrl || product.thumbnailUrl || null,
      renderProfile: buildConfiguredProfile(product, effectiveFinish),
      category: 'imported',
      // Fabric reference for downstream use (BOM, fabric schedule, presentations)
      fabricRef: selectedFabric ? {
        tearSheetId: selectedFabric.id,
        name: selectedFabric.productName,
        sku: selectedFabric.productSku,
        showroom: selectedFabric.showroomName,
        collection: selectedFabric.collection,
        colorway: selectedColorway?.name || null,
        colorHex: fabricColor || null,
        tradePrice: selectedFabric.tradePrice || null,
      } : null,
    }
    onPlace(item)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button + product name */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mb-2"
        >
          <ChevronDown size={14} className="rotate-90" /> Back to catalog
        </button>
        <h3 className="text-base font-semibold text-gray-900 leading-tight">{product.name}</h3>
        {product.vendorName && (
          <p className="text-xs text-gray-500 mt-0.5">by {product.vendorName}</p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image gallery */}
        {allImages.length > 0 && (
          <div className="relative">
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img
                src={proxyImg(allImages[activeImage]?.url, 800, 800)}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = ''; e.target.style.display = 'none' }}
              />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-1 p-2 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition ${
                      i === activeImage ? 'border-indigo-500' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={proxyImg(img.url, 100, 100)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dimensions */}
        {(product.widthInches || product.depthInches || product.heightInches) && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-1">Dimensions</p>
            <p className="text-sm text-gray-900">
              {product.widthInches && `W: ${Math.round(product.widthInches)}"`}
              {product.depthInches && ` × D: ${Math.round(product.depthInches)}"`}
              {product.heightInches && ` × H: ${Math.round(product.heightInches)}"`}
            </p>
          </div>
        )}

        {/* Tear sheets */}
        {tearSheets.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">Tear Sheets & Specifications</p>
            <div className="space-y-1">
              {tearSheets.map((ts, i) => (
                <a
                  key={i}
                  href={ts.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 py-1"
                >
                  <FileText size={14} />
                  <span className="truncate">{ts.label}</span>
                  <ExternalLink size={10} className="flex-shrink-0 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Finish options configurator */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size={18} className="animate-spin text-indigo-500" />
          </div>
        ) : finishes.length > 0 ? (
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-gray-500 mb-3">Available Finishes</p>
            {Object.entries(finishGroups).map(([type, items]) => (
              <div key={type} className="mb-3">
                <button
                  onClick={() => setExpandedType(expandedType === type ? null : type)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 uppercase tracking-wide py-1"
                >
                  <span>{type} ({items.length})</span>
                  <ChevronRight size={14} className={`transition ${expandedType === type ? 'rotate-90' : ''}`} />
                </button>
                {expandedType === type && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {items.map(finish => {
                      const isSelected = selectedFinish?.id === finish.id
                      return (
                        <button
                          key={finish.id}
                          onClick={() => setSelectedFinish(isSelected ? null : finish)}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition text-center ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                          title={`${finish.finishName}${finish.textureDesc ? ' — ' + finish.textureDesc : ''}`}
                        >
                          {/* Color swatch */}
                          <div
                            className="w-8 h-8 rounded-full border border-gray-300 shadow-inner"
                            style={{
                              backgroundColor: finish.colorHex || '#CCCCCC',
                              backgroundImage: !finish.colorHex ? 'repeating-conic-gradient(#ccc 0% 25%, #eee 0% 50%) 50% / 8px 8px' : undefined,
                            }}
                          >
                            {isSelected && (
                              <div className="w-full h-full rounded-full flex items-center justify-center bg-indigo-500/30">
                                <Check size={14} className="text-white drop-shadow" />
                              </div>
                            )}
                          </div>
                          {/* Name */}
                          <span className="text-[10px] text-gray-600 leading-tight truncate w-full">
                            {finish.finishName}
                          </span>
                          {finish.tier !== 'standard' && (
                            <span className="text-[8px] text-amber-600 font-medium uppercase">{finish.tier}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* ── Fabric / Upholstery Picker (for upholsterable furniture) ── */}
        {isUpholsterable && fabrics.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setFabricExpanded(!fabricExpanded)}
              className="flex items-center justify-between w-full"
            >
              <p className="text-xs font-medium text-gray-500">
                Upholstery / Fabric
                {selectedFabric && (
                  <span className="ml-2 text-indigo-600 font-semibold">
                    — {selectedFabric.productName}
                    {selectedColorway ? ` (${selectedColorway.name})` : ''}
                  </span>
                )}
              </p>
              <ChevronRight size={14} className={`text-gray-400 transition ${fabricExpanded ? 'rotate-90' : ''}`} />
            </button>

            {fabricExpanded && (
              <div className="mt-3">
                {/* Fabric search */}
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search fabrics..."
                    value={fabricSearch}
                    onChange={(e) => setFabricSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Selected fabric detail */}
                {selectedFabric && (
                  <div className="mb-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-indigo-900">{selectedFabric.productName}</p>
                        <p className="text-[10px] text-indigo-600">{selectedFabric.showroomName}{selectedFabric.collection ? ` · ${selectedFabric.collection}` : ''}</p>
                        {selectedFabric.tradePrice && (
                          <p className="text-[10px] text-indigo-500 mt-0.5">Trade: ${parseFloat(selectedFabric.tradePrice).toFixed(2)}/yd</p>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedFabric(null); setSelectedColorway(null) }}
                        className="text-indigo-400 hover:text-indigo-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Colorway swatches */}
                    {getFabricColorways(selectedFabric).length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-indigo-600 mb-1.5">Colorways</p>
                        <div className="flex flex-wrap gap-1.5">
                          {getFabricColorways(selectedFabric).map((cw, i) => {
                            const isSel = selectedColorway?.name === cw.name
                            return (
                              <button
                                key={i}
                                onClick={() => setSelectedColorway(isSel ? null : cw)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border transition ${
                                  isSel
                                    ? 'border-indigo-500 bg-indigo-100 text-indigo-800 ring-1 ring-indigo-500'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                                }`}
                                title={cw.name}
                              >
                                {cw.hex && (
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                                    style={{ backgroundColor: cw.hex }}
                                  />
                                )}
                                <span className="truncate max-w-[80px]">{cw.name || `Color ${i + 1}`}</span>
                                {isSel && <Check size={10} className="flex-shrink-0" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fabric list grouped by showroom */}
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {Object.entries(fabricsByShowroom).map(([showroom, items]) => (
                    <div key={showroom}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{showroom}</p>
                      <div className="space-y-0.5">
                        {items.map(fabric => {
                          const isSel = selectedFabric?.id === fabric.id
                          const colorways = getFabricColorways(fabric)
                          const previewColor = colorways[0]?.hex || '#9CA3AF'
                          return (
                            <button
                              key={fabric.id}
                              onClick={() => {
                                if (isSel) {
                                  setSelectedFabric(null)
                                  setSelectedColorway(null)
                                } else {
                                  setSelectedFabric(fabric)
                                  setSelectedColorway(colorways[0] || null)
                                }
                              }}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md transition ${
                                isSel
                                  ? 'bg-indigo-50 border border-indigo-300'
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <span
                                className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: previewColor }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs truncate ${isSel ? 'text-indigo-800 font-medium' : 'text-gray-800'}`}>
                                  {fabric.productName}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                  {fabric.collection || fabric.productSku}
                                  {colorways.length > 0 ? ` · ${colorways.length} colorways` : ''}
                                </p>
                              </div>
                              {isSel && <Check size={12} className="flex-shrink-0 text-indigo-600" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {filteredFabrics.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">No fabrics found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Place button */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <button
          onClick={handlePlace}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {selectedFabric
            ? `Place with ${selectedFabric.productName.split(' ').slice(0, 3).join(' ')}${selectedColorway ? ` — ${selectedColorway.name}` : ''}`
            : selectedFinish
              ? `Place with ${selectedFinish.finishName}`
              : 'Place in Room'}
        </button>
        {(selectedFinish || selectedFabric) && (
          <p className="text-[10px] text-gray-400 text-center mt-1">
            {selectedFabric
              ? `${selectedFabric.showroomName}${selectedFabric.collection ? ` · ${selectedFabric.collection}` : ''}${selectedFabric.tradePrice ? ` · $${parseFloat(selectedFabric.tradePrice).toFixed(0)}/yd` : ''}`
              : `${selectedFinish.finishType} finish — ${selectedFinish.materialType}${selectedFinish.textureDesc ? ` — ${selectedFinish.textureDesc}` : ''}`
            }
          </p>
        )}
      </div>
    </div>
  )
}

// ── Build a configured renderProfile from product + selected finish ──────
function buildConfiguredProfile(product, selectedFinish) {
  const profile = product.renderProfile ? { ...product.renderProfile } : null
  if (!profile) return null
  if (!selectedFinish) return profile

  // Deep clone materials
  profile.materials = { ...profile.materials }

  // Map finish selection onto the appropriate material zone
  const materialType = selectedFinish.materialType || 'wood'
  const color = selectedFinish.colorHex || '#888888'

  // Determine the primary zone based on archetype category
  const seatingArchetypes = ['sofa', 'lounge_chair', 'accent_chair', 'dining_chair', 'bar_stool', 'ottoman', 'bench', 'sectional']
  const tableArchetypes = ['dining_table', 'round_table', 'desk', 'coffee_table', 'side_table', 'console_table']
  const archetype = profile.archetype || 'generic'

  if (selectedFinish.finishType === 'wood' || selectedFinish.finishType === 'lacquer') {
    // Wood/lacquer finishes apply to frame or legs (structural parts)
    if (seatingArchetypes.includes(archetype)) {
      profile.materials.frame = { type: 'wood', color, roughness: 0.55 }
      profile.materials.legs = { type: 'wood', color, roughness: 0.55 }
    } else if (tableArchetypes.includes(archetype)) {
      profile.materials.top = { type: 'wood', color, roughness: 0.5 }
      profile.materials.legs = { type: 'wood', color, roughness: 0.55 }
    } else {
      profile.materials.frame = { type: 'wood', color, roughness: 0.55 }
    }
  } else if (selectedFinish.finishType === 'metal') {
    if (profile.materials.legs) {
      profile.materials.legs = { type: 'metal', color, roughness: 0.15, metalness: 0.85 }
    }
    if (profile.materials.hardware) {
      profile.materials.hardware = { type: 'metal', color, roughness: 0.15, metalness: 0.85 }
    }
    if (!profile.materials.legs && !profile.materials.hardware) {
      profile.materials.frame = { type: 'metal', color, roughness: 0.15, metalness: 0.85 }
    }
  } else if (selectedFinish.finishType === 'fabric' || selectedFinish.finishType === 'leather') {
    if (seatingArchetypes.includes(archetype)) {
      profile.materials.seat = { type: materialType, color, roughness: materialType === 'leather' ? 0.6 : 0.85 }
      profile.materials.upholstery = { type: materialType, color, roughness: materialType === 'leather' ? 0.6 : 0.85 }
    } else {
      const primaryZone = Object.keys(profile.materials)[0]
      if (primaryZone) {
        profile.materials[primaryZone] = { type: materialType, color }
      }
    }
  } else if (selectedFinish.finishType === 'stone') {
    if (tableArchetypes.includes(archetype)) {
      profile.materials.top = { type: 'marble', color, roughness: 0.2 }
    } else {
      profile.materials.frame = { type: 'marble', color, roughness: 0.2 }
    }
  }

  return profile
}

// ═══════════════════════════════════════════════════════════════════════════
// ProductBrowser — main component
// ═══════════════════════════════════════════════════════════════════════════
const ProductBrowser = ({ onSelectProduct, projectId, isOpen, onClose, initialSearch = '', initialCategory = 'all' }) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedDesigner, setSelectedDesigner] = useState('all')
  const [products, setProducts] = useState([])
  const [designers, setDesigners] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [designerOpen, setDesignerOpen] = useState(false)
  const [configProduct, setConfigProduct] = useState(null) // Product being configured
  const [favoriteIds, setFavoriteIds] = useState({})
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const containerRef = useRef(null)

  // Fetch favorite product IDs
  useEffect(() => {
    if (!isOpen) return
    api.get('/api/products/favorites/ids')
      .then(res => {
        const data = res.data || res
        setFavoriteIds(data.products || {})
      })
      .catch(() => {})
  }, [isOpen])

  const toggleBrowserFavorite = async (e, productId) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await api.post('/api/products/favorites/toggle', { productId, scope: 'personal' })
      // Refresh favorite IDs
      const res = await api.get('/api/products/favorites/ids')
      const data = res.data || res
      setFavoriteIds(data.products || {})
    } catch (err) {
      console.error('Favorite toggle error:', err)
    }
  }

  // When opened with new initial filters (e.g. from archetype palette), apply them
  useEffect(() => {
    if (isOpen) {
      if (initialSearch !== undefined) setSearchQuery(initialSearch)
      if (initialCategory !== undefined) setSelectedCategory(initialCategory)
    }
  }, [isOpen, initialSearch, initialCategory])

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Shared fetch helper
  const fetchProductPage = useCallback(async (pageOffset, search, category, designer) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (category && category !== 'all') params.append('subcategory', category)
    if (designer && designer !== 'all') params.append('vendorId', designer)
    params.append('limit', String(PAGE_SIZE))
    params.append('offset', String(pageOffset))
    const response = await api.get(`/api/products?${params.toString()}`)
    return response.data || response || []
  }, [])

  // Fetch distinct designers on mount
  useEffect(() => {
    api.get('/api/products/vendors')
      .then(res => {
        const vendorList = (res.data || res || [])
          .filter(v => v.name && typeof v.name === 'string')
          .sort((a, b) => a.name.localeCompare(b.name))
        setDesigners(vendorList)
      })
      .catch(err => console.error('Error fetching designers:', err))
  }, [])

  // Reset and fetch when filters change
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setOffset(0)
    setProducts([])
    setHasMore(true)
    setLoading(true)
    setConfigProduct(null)

    fetchProductPage(0, debouncedSearch, selectedCategory, selectedDesigner)
      .then(newProducts => {
        if (cancelled) return
        setProducts(newProducts)
        setOffset(PAGE_SIZE)
        setHasMore(newProducts.length === PAGE_SIZE)
      })
      .catch(err => { if (!cancelled) { console.error('Error:', err); setHasMore(false) } })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [debouncedSearch, selectedCategory, selectedDesigner, isOpen, fetchProductPage])

  // Load more
  const handleLoadMore = async () => {
    if (loading) return
    setLoading(true)
    try {
      const newProducts = await fetchProductPage(offset, debouncedSearch, selectedCategory, selectedDesigner)
      setProducts(prev => [...prev, ...newProducts])
      setOffset(prev => prev + PAGE_SIZE)
      setHasMore(newProducts.length === PAGE_SIZE)
    } catch (err) {
      console.error('Error loading more:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  // Format dimensions
  const formatDims = (p) => {
    const parts = []
    if (p.widthInches) parts.push(`${Math.round(p.widthInches)}"W`)
    if (p.depthInches) parts.push(`${Math.round(p.depthInches)}"D`)
    if (p.heightInches) parts.push(`${Math.round(p.heightInches)}"H`)
    return parts.join(' × ')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex">
      {/* Sidebar panel — wider for photos */}
      <div className="w-[480px] bg-white border-r border-gray-200 shadow-xl flex flex-col">

        {/* If a product is being configured, show the configurator */}
        {configProduct ? (
          <ProductConfigurator
            product={configProduct}
            onBack={() => setConfigProduct(null)}
            onPlace={(item) => {
              onSelectProduct(item)
              setConfigProduct(null)
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Product Catalog</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={20} />
                </button>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search 1,100+ products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 py-2.5">
              <div className="flex gap-1.5 overflow-x-auto">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon size={13} />
                      {cat.label}
                    </button>
                  )
                })}
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    showFavoritesOnly
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                  }`}
                >
                  <Star size={13} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
                  Favorites
                </button>
              </div>
            </div>

            {/* Designer filter */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 py-2.5">
              <button
                onClick={() => setDesignerOpen(!designerOpen)}
                className="flex items-center justify-between w-full text-xs font-medium text-gray-600"
              >
                <span className="flex items-center gap-2">
                  <Filter size={13} />
                  {selectedDesigner === 'all' ? 'All Designers' : designers.find(d => String(d.id) === selectedDesigner)?.name || 'Designer'}
                </span>
                <ChevronDown size={14} className={`transition ${designerOpen ? 'rotate-180' : ''}`} />
              </button>
              {designerOpen && (
                <div className="mt-2 space-y-0.5 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => { setSelectedDesigner('all'); setDesignerOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs transition ${
                      selectedDesigner === 'all' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    All Designers
                  </button>
                  {designers.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setSelectedDesigner(String(d.id)); setDesignerOpen(false) }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition truncate ${
                        String(d.id) === selectedDesigner ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product photo grid */}
            <div ref={containerRef} className="flex-1 overflow-y-auto p-3">
              {products.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Package size={36} className="mb-3 opacity-40" />
                  <p className="text-sm">No products found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {products
                  .filter(p => !showFavoritesOnly || favoriteIds[p.id])
                  .map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setConfigProduct(product)}
                    className="text-left rounded-lg border border-gray-200 overflow-hidden hover:border-indigo-400 hover:shadow-md transition group cursor-pointer bg-white relative"
                  >
                    {/* Product photo */}
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={proxyImg(product.thumbnailUrl || product.imageUrl, 400, 400)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling?.classList?.remove('hidden')
                          }}
                        />
                      ) : null}
                      {/* Fallback placeholder */}
                      <div className={`absolute inset-0 flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}>
                        <Package size={28} className="text-gray-300" />
                      </div>
                      {/* Category badge */}
                      {product.furnitureCategory && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 text-white text-[9px] rounded font-medium uppercase tracking-wide">
                          {product.furnitureCategory}
                        </span>
                      )}
                      {/* Favorite star */}
                      <span
                        role="button"
                        onClick={(e) => toggleBrowserFavorite(e, product.id)}
                        className={`absolute top-1.5 right-1.5 p-1.5 rounded-full shadow-sm border transition ${
                          favoriteIds[product.id]
                            ? 'bg-amber-400 text-white border-amber-500'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500 hover:border-amber-300 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Star size={14} fill={favoriteIds[product.id] ? 'currentColor' : 'none'} />
                      </span>
                    </div>
                    {/* Product info */}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">
                        {product.name}
                      </p>
                      {product.vendorName && (
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{product.vendorName}</p>
                      )}
                      {(product.widthInches || product.depthInches) && (
                        <p className="text-[10px] text-gray-400 mt-1">{formatDims(product)}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Loading spinner */}
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader size={20} className="animate-spin text-indigo-500" />
                </div>
              )}

              {/* Load more */}
              {hasMore && !loading && products.length > 0 && (
                <div className="py-4">
                  <button
                    onClick={handleLoadMore}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition"
                  >
                    Load More Products
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 px-4 py-2 text-[10px] text-gray-400">
              {products.length > 0 ? `${products.length} products` : 'No results'} — De Sousa Hughes Trade Catalog
            </div>
          </>
        )}
      </div>

      {/* Overlay */}
      <div onClick={onClose} className="flex-1 bg-black/20 cursor-pointer" />
    </div>
  )
}

export default ProductBrowser
