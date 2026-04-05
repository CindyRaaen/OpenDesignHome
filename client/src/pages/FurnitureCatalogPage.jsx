import { useEffect, useState } from 'react'
import { Search, Eye } from 'lucide-react'
import { api } from '../utils/api'

export default function FurnitureCatalogPage() {
  const [furniture, setFurniture] = useState([])
  const [categories, setCategories] = useState(['Seating', 'Tables', 'Storage', 'Decor', 'Lighting'])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [styleFilter, setStyleFilter] = useState('all')
  const [styles] = useState(['Modern', 'Classic', 'Rustic', 'Contemporary', 'Minimalist'])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/api/furniture/catalog')
      .then(setFurniture)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredFurniture = furniture.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
    if (styleFilter !== 'all' && item.style !== styleFilter) return false
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-indigo-400">Loading catalog...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">Furniture Catalog</h1>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search furniture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Style</label>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Styles</option>
              {styles.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded font-medium transition ${selectedCategory === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded font-medium transition ${selectedCategory === cat ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredFurniture.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">No furniture found matching your search.</p>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFurniture.map((item) => (
            <div key={item.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-indigo-500 transition group">
              <div className="bg-gray-700 h-48 flex items-center justify-center relative overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition" />
                ) : (
                  <div className="text-4xl">{item.emoji || '🛋️'}</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">{item.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{item.brand}</p>

                <div className="flex gap-2 mb-3 flex-wrap">
                  {item.style && (
                    <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded text-xs font-semibold">
                      {item.style}
                    </span>
                  )}
                  {item.category && (
                    <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs font-semibold">
                      {item.category}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-indigo-400">${item.price}</p>
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded transition flex items-center gap-1"
                  >
                    <Eye size={16} />
                    <span className="text-xs font-semibold hidden sm:inline">View</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{selectedItem.name}</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-700 h-40 flex items-center justify-center rounded">
                {selectedItem.imageUrl ? (
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <div className="text-5xl">{selectedItem.emoji || '🛋️'}</div>
                )}
              </div>

              <div>
                <p className="text-gray-400 text-sm">Brand</p>
                <p className="text-white font-semibold">{selectedItem.brand}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Price</p>
                <p className="text-2xl font-bold text-indigo-400">${selectedItem.price}</p>
              </div>

              {selectedItem.description && (
                <div>
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white text-sm">{selectedItem.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {selectedItem.style && (
                  <div className="bg-gray-700 rounded p-2 text-center">
                    <p className="text-xs text-gray-400">Style</p>
                    <p className="text-white font-semibold text-sm">{selectedItem.style}</p>
                  </div>
                )}
                {selectedItem.category && (
                  <div className="bg-gray-700 rounded p-2 text-center">
                    <p className="text-xs text-gray-400">Category</p>
                    <p className="text-white font-semibold text-sm">{selectedItem.category}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}