import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, Play, Pause, RotateCw, Camera, Zap, Save, Volume2, VolumeX, Info, X } from 'lucide-react'
import { CameraAnimator } from '../utils/CameraAnimator'
import { formatProductInfo } from '../utils/ProductMaterialMapper'

/**
 * PresentationMode3D — Full-screen cinematic client presentation
 *
 * Features:
 * - Predefined camera paths (Grand Tour, Walkthrough, Detail, Birds Eye)
 * - Custom recording of camera movements
 * - High-resolution capture (4K)
 * - Product callouts with pricing
 * - Room statistics overlay
 * - Beauty mode with enhanced lighting
 */

const CAMERA_PATHS = [
  {
    id: 'grand-tour',
    name: 'Grand Tour',
    description: 'Sweeping overview of the entire room',
    icon: '🎬',
  },
  {
    id: 'walkthrough',
    name: 'Eye Level Walkthrough',
    description: 'Walk through at standing height',
    icon: '👁️',
  },
  {
    id: 'details',
    name: 'Detail Focus',
    description: 'Close-up details of key furniture',
    icon: '🔍',
  },
  {
    id: 'birds-eye',
    name: 'Birds Eye',
    description: 'Slow top-down rotation',
    icon: '🔄',
  },
]

function PresentationMode3D({
  renderer3DRef,
  roomDimensions,
  furniture,
  projectName,
  projectClient,
  products,
  onExit,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentPath, setCurrentPath] = useState('grand-tour')
  const [showRoomStats, setShowRoomStats] = useState(true)
  const [showProductInfo, setShowProductInfo] = useState(false)
  const [activeProduct, setActiveProduct] = useState(null)
  const [beautyMode, setBeautyMode] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [nearbyProducts, setNearbyProducts] = useState([])

  const animatorRef = useRef(null)
  const recordedPathRef = useRef(null)
  const recordIntervalRef = useRef(null)

  // Initialize camera animator
  useEffect(() => {
    if (renderer3DRef?.current?.camera && renderer3DRef?.current?.controls) {
      animatorRef.current = new CameraAnimator(
        renderer3DRef.current.camera,
        renderer3DRef.current.controls
      )
    }

    return () => {
      if (animatorRef.current) {
        animatorRef.current.stop()
      }
    }
  }, [renderer3DRef])

  // Generate keyframes for current path
  const generateKeyframes = useCallback(() => {
    if (!animatorRef.current || !roomDimensions) return []

    const dims = roomDimensions

    switch (currentPath) {
      case 'grand-tour':
        return CameraAnimator.generateGrandTour(dims, furniture)
      case 'walkthrough':
        return CameraAnimator.generateWalkthrough(dims)
      case 'birds-eye':
        return CameraAnimator.generateBirdsEye(dims)
      case 'details':
        return CameraAnimator.generateDetailFocus(
          furniture.map(f => ({
            position: { x: f.x || 0, z: f.y || 0 },
            size: Math.max(f.width || 1, f.height || 1),
            name: f.name || 'Furniture',
          }))
        )
      default:
        return []
    }
  }, [currentPath, roomDimensions, furniture])

  // Play current path
  const playPath = useCallback(() => {
    if (!animatorRef.current) return

    setIsPlaying(true)
    const keyframes = generateKeyframes()

    animatorRef.current.playPath(
      keyframes,
      () => {
        setIsPlaying(false)
        setProgress(0)
      },
      (progressValue) => {
        setProgress(progressValue)
      }
    )
  }, [generateKeyframes])

  // Stop playback
  const stopPlayback = useCallback(() => {
    if (animatorRef.current) {
      animatorRef.current.stop()
    }
    setIsPlaying(false)
    setProgress(0)
  }, [])

  // Start recording custom path
  const startRecording = useCallback(() => {
    if (!animatorRef.current) return
    setIsRecording(true)
    animatorRef.current.startRecording()

    // Record frames periodically
    recordIntervalRef.current = setInterval(() => {
      animatorRef.current.recordFrame()
    }, 100)
  }, [])

  // Stop recording and save path
  const stopRecording = useCallback(() => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current)
    }

    if (animatorRef.current) {
      const recorded = animatorRef.current.stopRecording()
      if (recorded.length > 0) {
        recordedPathRef.current = CameraAnimator.smoothKeyframes(recorded, 3)
      }
    }

    setIsRecording(false)
  }, [])

  // Capture high-res screenshot
  const captureScreenshot = useCallback(() => {
    if (!renderer3DRef?.current?.renderer) return

    const renderer = renderer3DRef.current.renderer
    const oldSize = { w: renderer.domElement.width, h: renderer.domElement.height }

    // Set 4K resolution
    renderer.setSize(3840, 2160)
    renderer.render(renderer3DRef.current.scene, renderer3DRef.current.camera)

    // Capture
    const canvas = renderer.domElement
    const dataUrl = canvas.toDataURL('image/png')

    // Restore original size
    renderer.setSize(oldSize.w, oldSize.h)

    // Trigger download
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${projectName || 'design'}-${Date.now()}.png`
    link.click()
  }, [renderer3DRef, projectName])

  // Save custom path
  const saveCustomPath = useCallback(() => {
    if (!recordedPathRef.current) {
      alert('No custom path recorded. Record a path by moving the camera manually.')
      return
    }

    const pathData = {
      name: prompt('Enter path name:', 'Custom Path'),
      keyframes: recordedPathRef.current,
      timestamp: new Date().toISOString(),
    }

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('oia_custom_camera_paths') || '[]')
    saved.push(pathData)
    localStorage.setItem('oia_custom_camera_paths', JSON.stringify(saved))

    alert('Path saved! You can use it next time.')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) stopRecording()
      if (isPlaying) stopPlayback()
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current)
    }
  }, [isRecording, isPlaying, stopRecording, stopPlayback])

  // Calculate room statistics
  const roomStats = {
    squareFeet: roomDimensions ? Math.round(roomDimensions.width * roomDimensions.depth) : 0,
    itemCount: furniture?.length || 0,
    productCount: products?.length || 0,
    estimatedBudget: products?.reduce((sum, p) => sum + (p.retailPrice || p.tradePrice || 0), 0) || 0,
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* Top chrome */}
      <div className="bg-gradient-to-b from-black/90 to-black/50 px-6 py-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-white hover:text-indigo-400 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="font-medium">Exit Presentation</span>
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-white font-bold text-xl">{projectName || 'Design Presentation'}</h1>
          {projectClient && <p className="text-gray-400 text-sm">{projectClient}</p>}
        </div>

        <button
          onClick={() => setShowRoomStats(!showRoomStats)}
          className="text-gray-400 hover:text-white transition-colors"
          title="Toggle room stats"
        >
          <Info size={20} />
        </button>
      </div>

      {/* 3D viewport */}
      <div className="flex-1 relative bg-black" ref={(el) => {
        if (el && renderer3DRef?.current?.renderer) {
          if (el.children.length === 0) {
            el.appendChild(renderer3DRef.current.renderer.domElement)
          }
        }
      }} />

      {/* Beauty mode overlay (subtle) */}
      {beautyMode && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black/20 opacity-30" />
      )}

      {/* Product info callout */}
      {showProductInfo && activeProduct && (
        <div className="absolute bottom-24 right-6 bg-black/95 border border-amber-500/50 rounded-lg p-4 max-w-xs text-white z-40">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-sm">{activeProduct.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{activeProduct.sku}</p>
            </div>
            <button
              onClick={() => {
                setShowProductInfo(false)
                setActiveProduct(null)
              }}
              className="text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          {activeProduct.collection && (
            <p className="text-xs text-amber-300 mb-2">{activeProduct.collection}</p>
          )}

          {activeProduct.price && (
            <p className="text-sm font-bold text-amber-400 mb-2">
              ${activeProduct.price.toFixed(0)}
            </p>
          )}

          {activeProduct.description && (
            <p className="text-xs text-gray-300 mb-3 line-clamp-2">
              {activeProduct.description}
            </p>
          )}

          {activeProduct.dimensions && (
            <div className="text-xs text-gray-400 space-y-1">
              <p>
                {activeProduct.dimensions.width}" W × {activeProduct.dimensions.depth}" D ×{' '}
                {activeProduct.dimensions.height}" H
              </p>
              {activeProduct.materials && activeProduct.materials.length > 0 && (
                <p>{activeProduct.materials.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Room stats overlay */}
      {showRoomStats && (
        <div className="absolute top-20 left-6 bg-black/90 border border-indigo-500/30 rounded-lg p-4 text-white z-40 max-w-xs">
          <h3 className="font-bold text-sm mb-3 text-indigo-400">Room Overview</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Square Footage:</span>
              <span>{roomStats.squareFeet.toLocaleString()} sq ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Items Placed:</span>
              <span>{roomStats.itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Products Sourced:</span>
              <span>{roomStats.productCount}</span>
            </div>
            {roomStats.estimatedBudget > 0 && (
              <div className="flex justify-between pt-2 border-t border-indigo-500/30">
                <span className="text-gray-400">Estimated Budget:</span>
                <span className="text-indigo-300">
                  ${roomStats.estimatedBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="bg-gradient-to-t from-black/95 to-black/50 px-6 py-4 space-y-4">
        {/* Path selection */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CAMERA_PATHS.map(path => (
            <button
              key={path.id}
              onClick={() => {
                setCurrentPath(path.id)
                stopPlayback()
              }}
              className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
                currentPath === path.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title={path.description}
            >
              <span className="text-lg">{path.icon}</span>
              <span className="text-sm font-medium">{path.name}</span>
            </button>
          ))}
        </div>

        {/* Playback controls and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={() => (isPlaying ? stopPlayback() : playPath())}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span className="text-sm font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => {
                stopPlayback()
                setProgress(0)
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
              title="Reset camera to default"
            >
              <RotateCw size={18} />
            </button>

            {/* Record toggle */}
            <button
              onClick={() => (isRecording ? stopRecording() : startRecording())}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
              title="Record custom camera path"
            >
              <Zap size={18} />
              <span className="text-sm font-medium">{isRecording ? 'Recording...' : 'Record'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Beauty mode */}
            <button
              onClick={() => setBeautyMode(!beautyMode)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                beautyMode
                  ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
                  : 'bg-gray-800 text-gray-400'
              }`}
              title="Toggle enhanced lighting mode"
            >
              <Zap size={18} />
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
              title="Toggle sound (future feature)"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Capture */}
            <button
              onClick={captureScreenshot}
              className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
              title="Capture 4K screenshot"
            >
              <Camera size={18} />
            </button>

            {/* Save path */}
            {recordedPathRef.current && (
              <button
                onClick={saveCustomPath}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Save recorded custom path"
              >
                <Save size={18} />
                <span className="text-sm">Save Path</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isPlaying && (
          <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PresentationMode3D
