/**
 * Section Plane Tool for Interior Design Details
 * SketchUp-style cutting planes to show cross-sections
 * Uses Three.js clipping planes for invisible-side rendering
 */

import React, { useState, useEffect, useRef } from 'react'
import { Scissors, ChevronDown, ChevronUp, RotateCw } from 'lucide-react'

export default function SectionPlane({
  visible,
  onToggle,
  renderer,
  scene,
  dimensions = { width: 40, height: 30 },
  onApplyClipping,
  onRemoveClipping,
}) {
  const [active, setActive] = useState(false)
  const [axis, setAxis] = useState('z') // 'x', 'y', or 'z'
  const [position, setPosition] = useState(0)
  const [showFill, setShowFill] = useState(false)
  const [fillColor, setFillColor] = useState('#ff6b6b')
  const [isFlipped, setIsFlipped] = useState(false)

  // Constants for plane bounds
  const MAX_BOUNDS = {
    x: dimensions.width / 2,
    y: dimensions.height,
    z: dimensions.width / 2,
  }

  useEffect(() => {
    if (!active) {
      onRemoveClipping?.()
      return
    }

    // Create Three.js clipping plane
    if (renderer && onApplyClipping) {
      let plane
      const normal = new (window.THREE?.Vector3 || (() => {}))(0, 0, 0)

      // Set normal based on axis (which side to cut)
      if (axis === 'x') {
        normal.set(isFlipped ? -1 : 1, 0, 0)
      } else if (axis === 'y') {
        normal.set(0, isFlipped ? -1 : 1, 0)
      } else {
        normal.set(0, 0, isFlipped ? -1 : 1)
      }

      plane = new (window.THREE?.Plane || (() => {}))(normal, -position)

      onApplyClipping?.(plane)
    }
  }, [active, axis, position, isFlipped, renderer, onApplyClipping, onRemoveClipping])

  if (!visible) return null

  const handleAxisChange = (newAxis) => {
    setAxis(newAxis)
    setPosition(0) // Reset position when changing axis
  }

  const axisInfo = {
    x: { label: 'Left/Right', min: -MAX_BOUNDS.x, max: MAX_BOUNDS.x },
    y: { label: 'Top/Bottom', min: -MAX_BOUNDS.y, max: MAX_BOUNDS.y },
    z: { label: 'Front/Back', min: -MAX_BOUNDS.z, max: MAX_BOUNDS.z },
  }

  const info = axisInfo[axis]

  return (
    <div className="fixed left-6 bottom-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-40">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Scissors size={18} className="text-white" />
          <h3 className="text-sm font-bold text-white">Section Plane</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-white hover:bg-red-700 p-1 rounded transition"
          aria-label="Close section plane"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Active Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700">Active</label>
          <button
            onClick={() => setActive(!active)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              active ? 'bg-red-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                active ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {active && (
          <>
            {/* Axis Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
                Cutting Axis
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['x', 'y', 'z'].map(a => (
                  <button
                    key={a}
                    onClick={() => handleAxisChange(a)}
                    className={`py-2 px-3 rounded text-sm font-semibold transition ${
                      axis === a
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {a.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{info.label}</p>
            </div>

            {/* Position Slider */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">
                Position
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={info.min}
                  max={info.max}
                  value={position}
                  onChange={e => setPosition(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                  step="0.5"
                />
                <span className="text-sm font-mono text-gray-600 w-12 text-right">
                  {position.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Flip Button */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className={`w-full py-2 px-3 rounded text-sm font-semibold transition flex items-center justify-center gap-2 ${
                isFlipped
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RotateCw size={14} />
              {isFlipped ? 'Flipped' : 'Normal'}
            </button>

            {/* Show Fill Option */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  Section Fill
                </label>
                <button
                  onClick={() => setShowFill(!showFill)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                    showFill ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                      showFill ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {showFill && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fillColor}
                    onChange={e => setFillColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                  <span className="text-xs text-gray-600">
                    Section Fill Color
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-900">
                Plane is cutting along <strong>{axis.toUpperCase()}</strong> axis.
                Surfaces behind the plane are hidden.
              </p>
            </div>
          </>
        )}

        {!active && (
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <p className="text-xs text-gray-600">
              Enable the section plane to show cross-sections and details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
