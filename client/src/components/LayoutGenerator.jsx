import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Loader, Star, Check } from 'lucide-react'
// SmartTextArea stub
const SmartTextArea = (props) => React.createElement('textarea', { ...props, className: 'w-full p-2 bg-gray-800 border border-gray-700 rounded text-white text-sm' })
import { api } from '../utils/api'

const GRID_SIZE = 20

const STYLE_OPTIONS = [
  { id: 'modern', label: 'Modern', color: 'bg-gray-600' },
  { id: 'traditional', label: 'Traditional', color: 'bg-amber-700' },
  { id: 'scandinavian', label: 'Scandinavian', color: 'bg-blue-300' },
  { id: 'industrial', label: 'Industrial', color: 'bg-slate-700' },
  { id: 'bohemian', label: 'Bohemian', color: 'bg-red-400' },
  { id: 'coastal', label: 'Coastal', color: 'bg-cyan-400' },
  { id: 'mid-century', label: 'Mid-Century', color: 'bg-orange-600' },
  { id: 'farmhouse', label: 'Farmhouse', color: 'bg-yellow-100' }
]

const BUDGET_OPTIONS = [
  { id: 'budget', label: 'Budget-Friendly' },
  { id: 'medium', label: 'Mid-Range' },
  { id: 'luxury', label: 'Luxury' }
]

const LayoutGenerator = ({
  isOpen,
  onClose,
  roomWidth,
  roomHeight,
  walls = [],
  doors = [],
  windows = [],
  existingFurniture = [],
  onApplyLayout
}) => {
  const [description, setDescription] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('modern')
  const [selectedBudget, setSelectedBudget] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [layouts, setLayouts] = useState([])
  const [error, setError] = useState('')
  // api imported directly from utils/api
  const canvasRefs = useRef({})

  const placeholderExamples = [
    'Modern open kitchen with island seating for 4, minimalist, warm wood tones',
    'Cozy master bedroom with reading nook, soft lighting, natural materials',
    'Living room with conversation area around fireplace, contemporary style',
    'Home office with desk near window, comfortable guest seating'
  ]

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your ideal room')
      return
    }

    setLoading(true)
    setError('')
    setLayouts([])

    try {
      const response = await api.post('/layout-generator/generate', {
        roomWidth,
        roomHeight,
        walls,
        doors,
        windows,
        description,
        style: selectedStyle,
        budget: selectedBudget,
        existingFurniture
      })

      setLayouts(response.layouts)
    } catch (err) {
      setError(err.message || 'Failed to generate layouts')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyLayout = (layout) => {
    if (onApplyLayout) {
      onApplyLayout(layout)
    }
    onClose()
  }

  // Canvas preview for a single layout
  const renderLayoutPreview = (layout, canvasId) => {
    const canvas = canvasRefs.current[canvasId]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw room border
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

    // Scale factor for preview
    const scaleX = canvas.width / roomWidth
    const scaleY = canvas.height / roomHeight

    // Draw furniture
    for (const item of layout.furniture) {
      const x = item.x * scaleX
      const y = item.y * scaleY
      const w = item.w * GRID_SIZE * scaleX
      const h = item.h * GRID_SIZE * scaleY

      // Draw furniture rectangle
      ctx.fillStyle = item.color
      ctx.globalAlpha = 0.8

      if (item.rotation === 180) {
        ctx.save()
        ctx.translate(x + w / 2, y + h / 2)
        ctx.rotate(Math.PI)
        ctx.fillRect(-w / 2, -h / 2, w, h)
        ctx.restore()
      } else {
        ctx.fillRect(x, y, w, h)
      }

      ctx.globalAlpha = 1

      // Draw border
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, w, h)

      // Draw label (small text)
      if (w > 30 && h > 20) {
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = item.label.split('(')[0].trim()
        ctx.fillText(label, x + w / 2, y + h / 2)
      }
    }
  }

  // Trigger canvas drawing when layouts change
  useEffect(() => {
    if (layouts.length > 0) {
      layouts.forEach((layout) => {
        setTimeout(() => renderLayoutPreview(layout, layout.id), 0)
      })
    }
  }, [layouts, roomWidth, roomHeight])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">AI Room Layout Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Input Section */}
          {layouts.length === 0 && (
            <div className="space-y-6">
              {/* Description Input */}
              <div>
                <SmartTextArea
                  label="Describe Your Ideal Room"
                  value={description}
                  onChange={(val) => {
                    setDescription(val)
                    setError('')
                  }}
                  placeholder={placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)]}
                  rows={4}
                  aiContext={{ module: 'layout-generator', type: 'room-description' }}
                />
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
              </div>

              {/* Style Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Design Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedStyle(option.id)}
                      className={`p-3 rounded-lg font-medium transition ${
                        selectedStyle === option.id
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Budget Level
                </label>
                <div className="flex gap-3">
                  {BUDGET_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSelectedBudget(option.id)}
                      className={`flex-1 p-3 rounded-lg font-medium transition ${
                        selectedBudget === option.id
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating layout options...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Layouts
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results Grid */}
          {layouts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Generated Layouts ({layouts.length})
                </h3>
                <button
                  onClick={() => {
                    setLayouts([])
                    setDescription('')
                  }}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Start Over
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Canvas Preview */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <canvas
                        ref={(el) => {
                          canvasRefs.current[layout.id] = el
                        }}
                        width={250}
                        height={200}
                        className="w-full border border-gray-300 rounded bg-white"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Name */}
                      <h4 className="text-lg font-bold text-gray-900">
                        {layout.name}
                      </h4>

                      {/* Description */}
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {layout.description}
                      </p>

                      {/* Score */}
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.round(layout.score / 20)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {layout.score}%
                        </span>
                      </div>

                      {/* Reasoning */}
                      <p className="text-xs text-gray-600 border-t border-gray-200 pt-3">
                        {layout.reasoning}
                      </p>

                      {/* Furniture Count */}
                      <div className="text-xs text-gray-500">
                        {layout.furniture.length} items
                      </div>

                      {/* Apply Button */}
                      <button
                        onClick={() => handleApplyLayout(layout)}
                        className="w-full bg-indigo-600 text-white font-medium py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 mt-2"
                      >
                        <Check className="w-4 h-4" />
                        Apply to Floor Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LayoutGenerator
