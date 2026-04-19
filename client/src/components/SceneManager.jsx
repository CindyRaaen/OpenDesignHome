/**
 * Scene/View Manager for SketchUp-style Camera Positions
 * Saves and restores camera views with thumbnails
 * Provides tab-based navigation between scenes
 */

import React, { useState, useRef } from 'react'
import { Plus, Trash2, Edit2, GripHorizontal } from 'lucide-react'

const DEFAULT_SCENES = [
  {
    id: 'perspective',
    name: 'Perspective',
    cameraPosition: { x: 15, y: 12, z: 15 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    timeOfDay: 'day',
    isDefault: true,
  },
  {
    id: 'top',
    name: 'Top',
    cameraPosition: { x: 0, y: 30, z: 0 },
    cameraTarget: { x: 0, y: 0, z: 0 },
    timeOfDay: 'day',
    isDefault: true,
  },
  {
    id: 'front',
    name: 'Front',
    cameraPosition: { x: 0, y: 8, z: 25 },
    cameraTarget: { x: 0, y: 5, z: 0 },
    timeOfDay: 'day',
    isDefault: true,
  },
  {
    id: 'corner',
    name: 'Corner',
    cameraPosition: { x: 20, y: 15, z: 20 },
    cameraTarget: { x: 5, y: 5, z: 5 },
    timeOfDay: 'day',
    isDefault: true,
  },
]

export default function SceneManager({
  scenes = DEFAULT_SCENES,
  activeScene,
  onSceneSelect,
  onSceneSave,
  onSceneDelete,
  onSceneRename,
  onSceneReorder,
  getCameraState,
  captureThumnail,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const scrollContainerRef = useRef(null)

  const handleSaveScene = () => {
    const cameraState = getCameraState?.()
    if (cameraState) {
      const thumbnail = captureThumnail?.() || null
      const newScene = {
        id: `scene-${Date.now()}`,
        name: `Scene ${scenes.length}`,
        cameraPosition: cameraState.position,
        cameraTarget: cameraState.target,
        timeOfDay: cameraState.timeOfDay || 'day',
        thumbnail,
        isDefault: false,
      }
      onSceneSave?.(newScene)
    }
  }

  const handleStartRename = (scene) => {
    setEditingId(scene.id)
    setEditName(scene.name)
  }

  const handleSaveName = (sceneId) => {
    if (editName.trim() && editName !== scenes.find(s => s.id === sceneId)?.name) {
      onSceneRename?.(sceneId, editName.trim())
    }
    setEditingId(null)
  }

  const handleContextMenu = (e, sceneId) => {
    e.preventDefault()
    // In production, show a context menu with options
    // For now, just show a simple dialog
    const action = prompt(
      'Choose action:\n1) Rename\n2) Delete\n3) Update current view'
    )
    const scene = scenes.find(s => s.id === sceneId)
    if (action === '1') {
      handleStartRename(scene)
    } else if (action === '2') {
      if (window.confirm(`Delete scene "${scene.name}"?`)) {
        onSceneDelete?.(sceneId)
      }
    } else if (action === '3') {
      handleSaveScene()
    }
  }

  const handleDragStart = (e, sceneId) => {
    setDraggedId(sceneId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    if (draggedId && draggedId !== targetId) {
      const newOrder = scenes.map(s => s.id)
      const dragIndex = newOrder.indexOf(draggedId)
      const targetIndex = newOrder.indexOf(targetId)
      newOrder.splice(dragIndex, 1)
      newOrder.splice(targetIndex, 0, draggedId)
      onSceneReorder?.(newOrder)
    }
    setDraggedId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  return (
    <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-2 overflow-x-auto shadow-sm">
      {/* Scenes Tabs */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 flex-1 overflow-x-auto pb-2 scroll-smooth"
      >
        {scenes.map(scene => (
          <div
            key={scene.id}
            draggable={!scene.isDefault}
            onDragStart={e => handleDragStart(e, scene.id)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, scene.id)}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setHoveredId(scene.id)}
            onMouseLeave={() => setHoveredId(null)}
            onContextMenu={e => handleContextMenu(e, scene.id)}
            className={`flex-shrink-0 group relative ${
              draggedId === scene.id ? 'opacity-50' : ''
            }`}
          >
            {/* Tab Button */}
            <button
              onClick={() => onSceneSelect?.(scene.id)}
              className={`px-3 py-2 rounded text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${
                activeScene === scene.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {/* Drag Handle for Custom Scenes */}
              {!scene.isDefault && hoveredId === scene.id && (
                <GripHorizontal size={14} className="opacity-50" />
              )}

              {/* Thumbnail or Icon */}
              {scene.thumbnail ? (
                <img
                  src={scene.thumbnail}
                  alt={scene.name}
                  className="w-4 h-4 rounded opacity-75"
                />
              ) : (
                <div className="w-4 h-4 bg-gray-400 rounded opacity-50" />
              )}

              {/* Tab Name */}
              {editingId === scene.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => handleSaveName(scene.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName(scene.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="bg-transparent text-white outline-none w-20 text-sm"
                />
              ) : (
                <span>{scene.name}</span>
              )}
            </button>

            {/* Action Buttons on Hover */}
            {hoveredId === scene.id && !scene.isDefault && editingId !== scene.id && (
              <div className="absolute right-0 top-full mt-1 flex gap-1 bg-white rounded shadow-md border border-gray-200 p-1 z-10">
                <button
                  onClick={() => handleStartRename(scene)}
                  className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                  title="Rename"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete scene "${scene.name}"?`)) {
                      onSceneDelete?.(scene.id)
                    }
                  }}
                  className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Scene Button */}
      <button
        onClick={handleSaveScene}
        className="flex-shrink-0 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        title="Save current view as new scene"
      >
        <Plus size={18} />
      </button>
    </div>
  )
}
