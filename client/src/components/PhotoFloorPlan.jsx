import React, { useState, useRef } from 'react'
import { Upload, X, Loader, Camera, Copy, Check } from 'lucide-react'
import { api } from '../utils/api'

export default function PhotoFloorPlan({ onImport, onClose }) {
  const [mode, setMode] = useState('upload') // 'upload', 'analyzing', 'results', 'manual'
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [roomType, setRoomType] = useState('living_room')
  const [manualWidth, setManualWidth] = useState('')
  const [manualHeight, setManualHeight] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  const roomTypeOptions = [
    { id: 'living_room', label: 'Living Room' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bathroom', label: 'Bathroom' },
    { id: 'dining_room', label: 'Dining Room' },
    { id: 'home_office', label: 'Home Office' },
  ]

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (evt) => {
        setImagePreview(evt.target?.result)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleDragDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (evt) => {
        setImagePreview(evt.target?.result)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const analyzePhoto = async () => {
    if (!image) {
      setError('Please select an image first')
      return
    }

    try {
      setMode('analyzing')
      setError(null)

      const formData = new FormData()
      formData.append('image', image)
      formData.append('roomType', roomType)
      if (manualWidth) formData.append('manualWidth', manualWidth)
      if (manualHeight) formData.append('manualHeight', manualHeight)

      const response = await api.post('/api/photo-floor-plan/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setAnalysisResult(response)
      setMode('results')
    } catch (err) {
      setError(err.message || 'Failed to analyze photo')
      setMode('upload')
    }
  }

  const handleImportFloorPlan = () => {
    if (analysisResult && onImport) {
      onImport({
        walls: analysisResult.walls,
        doors: analysisResult.doors,
        windows: analysisResult.windows,
        dimensions: analysisResult.dimensions,
        source: 'photo-import',
        confidence: analysisResult.confidence,
      })
      onClose?.()
    }
  }

  const handleReset = () => {
    setMode('upload')
    setImage(null)
    setImagePreview(null)
    setAnalysisResult(null)
    setError(null)
    setManualWidth('')
    setManualHeight('')
  }

  if (mode === 'upload') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera size={24} />
              <div>
                <h2 className="text-lg font-bold">Photo to Floor Plan</h2>
                <p className="text-sm text-indigo-100">Convert a room photo into a floor plan</p>
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
            {/* Image Upload */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDragDrop}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Upload size={40} className="mx-auto mb-3 text-slate-400" />
              <p className="text-lg font-medium text-slate-900 mb-1">Drag and drop a photo</p>
              <p className="text-sm text-slate-500">or click to browse (max 10MB)</p>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700 mb-2">Preview</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-80 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Room Type Selector */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Room Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roomTypeOptions.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setRoomType(type.id)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      roomType === type.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Dimensions (Optional) */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Room Dimensions (optional - helps with accuracy)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Width (feet)</label>
                  <input
                    type="number"
                    value={manualWidth}
                    onChange={(e) => setManualWidth(e.target.value)}
                    placeholder="e.g., 12"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Height (feet)</label>
                  <input
                    type="number"
                    value={manualHeight}
                    onChange={(e) => setManualHeight(e.target.value)}
                    placeholder="e.g., 14"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={analyzePhoto}
                disabled={!image}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Analyze Photo
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'analyzing') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="animate-spin mb-4">
            <Loader size={48} className="mx-auto text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Analyzing your photo...</h3>
          <p className="text-slate-600">
            {analysisResult ? 'Processing results...' : 'Using AI vision to detect walls, doors, and windows'}
          </p>
        </div>
      </div>
    )
  }

  if (mode === 'results' && analysisResult) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Analysis Results</h2>
              <p className="text-sm text-indigo-100">
                Confidence: {(analysisResult.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <button onClick={handleReset} className="p-1 hover:bg-indigo-700 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Original Photo */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Original Photo</p>
                <img
                  src={imagePreview}
                  alt="Original"
                  className="w-full h-64 object-cover rounded-lg border border-slate-200"
                />
              </div>

              {/* Floor Plan Visualization */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Detected Floor Plan</p>
                <div className="w-full h-64 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                  <FloorPlanPreview data={analysisResult} />
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Dimensions</p>
                <p className="text-lg font-bold text-slate-900">
                  {(analysisResult.dimensions.width / 100).toFixed(1)}' x{' '}
                  {(analysisResult.dimensions.height / 100).toFixed(1)}'
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Walls</p>
                <p className="text-lg font-bold text-slate-900">{analysisResult.walls.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Doors + Windows</p>
                <p className="text-lg font-bold text-slate-900">
                  {analysisResult.doors.length + analysisResult.windows.length}
                </p>
              </div>
            </div>

            {/* Detected Features */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Detected Features</p>
              <p className="text-sm text-slate-600 mb-3">{analysisResult.analysis}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {analysisResult.doors.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Doors: {analysisResult.doors.length}</p>
                  </div>
                )}
                {analysisResult.windows.length > 0 && (
                  <div className="p-3 bg-cyan-50 rounded-lg">
                    <p className="font-medium text-cyan-900">Windows: {analysisResult.windows.length}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleImportFloorPlan}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Import to Floor Plan
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Simple floor plan visualization
function FloorPlanPreview({ data }) {
  const { walls, doors, windows, dimensions } = data
  const padding = 10
  const scale = Math.min(
    (300 - padding * 2) / dimensions.width,
    (240 - padding * 2) / dimensions.height
  )

  return (
    <svg
      width={dimensions.width * scale + padding * 2}
      height={dimensions.height * scale + padding * 2}
      className="bg-white"
    >
      {/* Walls */}
      {walls.map((wall, i) => (
        <line
          key={`wall-${i}`}
          x1={wall.x1 * scale + padding}
          y1={wall.y1 * scale + padding}
          x2={wall.x2 * scale + padding}
          y2={wall.y2 * scale + padding}
          stroke="#1E293B"
          strokeWidth="3"
        />
      ))}

      {/* Doors */}
      {doors.map((door, i) => (
        <circle
          key={`door-${i}`}
          cx={door.x * scale + padding}
          cy={door.y * scale + padding}
          r="4"
          fill="#EF4444"
        />
      ))}

      {/* Windows */}
      {windows.map((window, i) => (
        <rect
          key={`window-${i}`}
          x={Math.min(window.x1, window.x2) * scale + padding - 2}
          y={Math.min(window.y1, window.y2) * scale + padding - 2}
          width={Math.abs(window.x2 - window.x1) * scale + 4}
          height={Math.abs(window.y2 - window.y1) * scale + 4}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}
