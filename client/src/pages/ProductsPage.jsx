import React, { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Search, Filter, Package, ExternalLink, Star, ChevronDown } from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sofas', label: 'Sofas' },
  { id: 'chairs', label: 'Chairs' },
  { id: 'tables', label: 'Tables' },
  { id: 'lamps', label: 'Lighting' },
  { id: 'art', label: 'Art' },
  { id: 'plants', label: 'Plants' },
]

const STYLES = ['all', 'modern', 'mid-century', 'scandinavian', 'traditional', 'bohemian']

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [style, setStyle] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [category, style, search])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category !== 'all') params.append('category', category)
      if (style !== 'all') params.append('style', style)
      if (search) params.append('search', search)
      const data = await api.get(`/api/furniture?${params}`)
      setProducts(Array.isArray(data) ? data : data.rows || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Product Catalog</h1>
        <div className="text-sm text-gray-400">{products.length} products</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, brands, designers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          {STYLES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Styles' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              category === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-indigo-400">Loading products...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all cursor-pointer group"
            >
              <div className="aspect-[4/3] bg-gray-900 relative overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                {product.style && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-gray-300">{product.style}</span>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-white truncate">{product.name}</div>
                <div className="text-xs text-indigo-400 mt-0.5">{product.brand || 'Unknown Brand'}</div>
                {product.designer && <div className="text-xs text-gray-500">by {product.designer}</div>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold text-emerald-400">
                    {product.price_usd ? `$${Number(product.price_usd).toLocaleString()}` : '—'}
                  </span>
                  {product.material_name && (
                    <span className="text-xs text-gray-500 truncate ml-2">{product.material_name}</span>
                  )}
                </div>
                {product.width_inches && product.depth_inches && product.height_inches && (
                  <div className="text-xs text-gray-600 mt-1">
                    {product.width_inches}"W × {product.depth_inches}"D × {product.height_inches}"H
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-gray-900 relative">
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-gray-600" /></div>
              )}
              <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80">✕</button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white">{selectedProduct.name}</h2>
              <div className="text-indigo-400 mt-1">{selectedProduct.brand}</div>
              {selectedProduct.designer && <div className="text-sm text-gray-400">Designed by {selectedProduct.designer}</div>}
              {selectedProduct.collection_name && <div className="text-sm text-gray-500 mt-1">{selectedProduct.collection_name} Collection</div>}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase">Price</div>
                  <div className="text-lg font-bold text-emerald-400">${Number(selectedProduct.price_usd || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Material</div>
                  <div className="text-sm text-white">{selectedProduct.material_name || '—'}</div>
                </div>
                {selectedProduct.width_inches && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Dimensions</div>
                    <div className="text-sm text-white">{selectedProduct.width_inches}"W × {selectedProduct.depth_inches}"D × {selectedProduct.height_inches}"H</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500 uppercase">Style</div>
                  <div className="text-sm text-white capitalize">{selectedProduct.style || '—'}</div>
                </div>
              </div>
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {(typeof selectedProduct.tags === 'string' ? JSON.parse(selectedProduct.tags) : selectedProduct.tags).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
