import React, { useState, useEffect } from 'react'
import { Palette, Sparkles, X, Loader, ChevronDown } from 'lucide-react'
import { api } from '../utils/api'

export default function FinishPairing({ currentMaterials = {}, roomType = 'living_room', onApply, onClose }) {
  const [mode, setMode] = useState('selection') // 'selection', 'styles', 'loading', 'results'
  const [selectedStyle, setSelectedStyle] = useState('scandinavian')
  const [styles, setStyles] = useState([])
  const [suggestions, setSuggestions] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStyles()
  }, [])

  const loadStyles = async () => {
    try {
      const response = await api.get('/api/finish-pairing/styles')
      setStyles(response)
      setLoading(false)
    } catch (err) {
      console.error('Error loading styles:', err)
      setError('Failed to load design styles')
      setLoading(false)
    }
  }

  const getSuggestions = async () => {
    try {
      setMode('loading')
      setError(null)

      const selectedMaterials = []
      if (currentMaterials.floor) {
        selectedMaterials.push({
          type: 'floor',
          id: currentMaterials.floor,
        })
      }
      if (currentMaterials.walls) {
        selectedMaterials.push({
          type: 'wall',
          id: currentMaterials.walls,
        })
      }
      if (currentMaterials.ceiling) {
        selectedMaterials.push({
          type: 'ceiling',
          id: currentMaterials.ceiling,
        })
      }

      if (selectedMaterials.length === 0) {
        setError('Please select at least one material first')
        setMode('selection')
        return
      }

      const response = await api.post('/api/finish-pairing/suggest', {
        selectedMaterials,
        roomType,
        style: selectedStyle,
      })

      setSuggestions(response)
      setMode('results')
    } catch (err) {
      setError(err.message || 'Failed to generate suggestions')
      setMode('selection')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <Loader size={48} className="mx-auto mb-4 text-indigo-600 animate-spin" />
        <p className="text-slate-600">Loading finish pairing engine...</p>
      </div>
    )
  }

  if (mode === 'selection') {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette size={24} />
            <div>
              <h2 className="text-lg font-bold">Smart Finish Pairing</h2>
              <p className="text-sm text-indigo-100">AI-powered material recommendations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Current Selections */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Current Selections</p>
            <div className="grid grid-cols-3 gap-3">
              {currentMaterials.floor && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Floor</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: '#C4A35A' }}
                    />
                    <p className="text-sm font-medium text-slate-900">{currentMaterials.floor}</p>
                  </div>
                </div>
              )}
              {currentMaterials.walls && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Wall</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: '#F5F5F5' }}
                    />
                    <p className="text-sm font-medium text-slate-900">{currentMaterials.walls}</p>
                  </div>
                </div>
              )}
              {currentMaterials.ceiling && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Ceiling</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border border-slate-300"
                      style={{ backgroundColor: '#FFFFFF' }}
                    />
                    <p className="text-sm font-medium text-slate-900">{currentMaterials.ceiling}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Style Selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Design Style</p>
            <div className="grid grid-cols-4 gap-2">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center ${
                    selectedStyle === style.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={style.name}
                >
                  {style.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={getSuggestions}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            Get Suggestions
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'loading') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <Loader size={48} className="mx-auto mb-4 text-indigo-600 animate-spin" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Generating suggestions...</h3>
        <p className="text-slate-600">
          Analyzing your selections and design preferences
        </p>
      </div>
    )
  }

  if (mode === 'results' && suggestions) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Finish Pairing Results</h2>
            <p className="text-sm text-indigo-100">{suggestions.moodDescription}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-indigo-700 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Color Palette */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Harmonized Color Palette</p>
            <div className="flex gap-2 mb-3">
              {Object.entries(suggestions.palette || {})
                .filter(([key]) => ['primary', 'secondary', 'accent1', 'accent2', 'neutral'].includes(key))
                .map(([key, color]) => (
                  <div
                    key={key}
                    className="w-12 h-12 rounded-lg border border-slate-300 shadow-sm"
                    style={{ backgroundColor: color }}
                    title={key}
                  />
                ))}
            </div>
            <p className="text-xs text-slate-500">
              Harmony Score: {((suggestions.harmony || 0) * 100).toFixed(0)}%
            </p>
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            {suggestions.suggestions?.map((suggestion, idx) => (
              <SuggestionCard
                key={idx}
                suggestion={suggestion}
                isExpanded={expandedCategory === idx}
                onToggle={() =>
                  setExpandedCategory(expandedCategory === idx ? null : idx)
                }
                onApply={onApply}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              onClose?.()
            }}
            className="mt-6 w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return null
}

function SuggestionCard({ suggestion, isExpanded, onToggle, onApply }) {
  const compatibilityColor = suggestion.compatibility > 0.9
    ? 'bg-green-100'
    : suggestion.compatibility > 0.8
      ? 'bg-yellow-100'
      : 'bg-orange-100'

  const compatibilityText = suggestion.compatibility > 0.9
    ? 'text-green-700'
    : suggestion.compatibility > 0.8
      ? 'text-yellow-700'
      : 'text-orange-700'

  const isColorRec = suggestion.recommendation?.color
  const color = isColorRec ? suggestion.recommendation.color : null

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          {color && (
            <div
              className="w-8 h-8 rounded border border-slate-300 shadow-sm"
              style={{ backgroundColor: color }}
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-slate-900">
              {isColorRec ? suggestion.recommendation.name : suggestion.recommendation}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {suggestion.category.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-2 py-1 rounded text-sm font-medium ${compatibilityColor} ${compatibilityText}`}>
            {(suggestion.compatibility * 100).toFixed(0)}%
          </div>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <p className="text-sm text-slate-700 mb-4">{suggestion.reasoning}</p>

          {suggestion.alternatives && suggestion.alternatives.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">ALTERNATIVES</p>
              <div className="space-y-2">
                {suggestion.alternatives.map((alt, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                    {alt.color && (
                      <div
                        className="w-4 h-4 rounded border border-slate-300"
                        style={{ backgroundColor: alt.color }}
                      />
                    )}
                    <span>{typeof alt === 'string' ? alt : alt.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {onApply && (
            <button
              onClick={() => onApply(suggestion)}
              className="mt-4 w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded font-medium hover:bg-indigo-700 transition-colors"
            >
              Apply This
            </button>
          )}
        </div>
      )}
    </div>
  )
}
