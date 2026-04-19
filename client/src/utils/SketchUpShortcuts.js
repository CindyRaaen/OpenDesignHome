/**
 * SketchUp-compatible keyboard shortcuts for Open Interior Designer
 * Provides muscle-memory shortcuts that SketchUp users expect
 */

export const SHORTCUT_MAP = {
  select: { key: ' ', label: 'Select Tool', category: 'tools' },
  line: { key: 'L', label: 'Line Tool (Wall)', category: 'tools' },
  rectangle: { key: 'R', label: 'Rectangle Tool (Room)', category: 'tools' },
  move: { key: 'M', label: 'Move Tool', category: 'tools' },
  rotate: { key: 'Q', label: 'Rotate Tool', category: 'tools' },
  delete: { key: 'E', label: 'Delete', category: 'editing' },
  measure: { key: 'T', label: 'Measure Tool', category: 'tools' },
  paintBucket: { key: 'B', label: 'Paint Bucket', category: 'tools' },
  makeGroup: { key: 'G', label: 'Make Group/Component', category: 'editing' },
  pan: { key: 'H', label: 'Pan (Hand Tool)', category: 'navigation' },
  zoom: { key: 'Z', label: 'Zoom Tool', category: 'navigation' },
  undo: { key: 'Ctrl+Z', label: 'Undo', category: 'editing' },
  redo: { key: 'Ctrl+Y', label: 'Redo', category: 'editing' },
  selectAll: { key: 'Ctrl+A', label: 'Select All', category: 'editing' },
  help: { key: '?', label: 'Show Shortcuts', category: 'help' },
}

/**
 * Register SketchUp keyboard shortcuts
 * @param {Object} handlers - Callback functions for each shortcut
 * @returns {Function} Event listener function to attach to window
 */
export function registerSketchUpShortcuts(handlers) {
  return function handleKeyDown(e) {
    // Ignore shortcuts when typing in input fields
    if (e.target.matches('input, textarea, [contenteditable]')) {
      // Allow Escape and Delete even in inputs
      if (e.key !== 'Escape' && e.key !== 'Delete') {
        return
      }
    }

    const key = e.key.toLowerCase()
    const isCtrl = e.ctrlKey || e.metaKey // Mac uses Cmd, Windows uses Ctrl
    const isShift = e.shiftKey

    // Tools
    if (key === ' ' && !isCtrl) {
      e.preventDefault()
      handlers.onSelect?.()
    } else if (key === 'l') {
      e.preventDefault()
      handlers.onLine?.()
    } else if (key === 'r') {
      e.preventDefault()
      handlers.onRectangle?.()
    } else if (key === 'm') {
      e.preventDefault()
      handlers.onMove?.()
    } else if (key === 'q') {
      e.preventDefault()
      handlers.onRotate?.()
    } else if (key === 'e') {
      e.preventDefault()
      handlers.onDelete?.()
    } else if (key === 't') {
      e.preventDefault()
      handlers.onMeasure?.()
    } else if (key === 'b') {
      e.preventDefault()
      handlers.onPaintBucket?.()
    } else if (key === 'g' && !isCtrl) {
      e.preventDefault()
      handlers.onMakeGroup?.()
    } else if (key === 'h') {
      e.preventDefault()
      handlers.onPan?.()
    } else if (key === 'z' && !isCtrl) {
      e.preventDefault()
      handlers.onZoom?.()
    }
    // Editing (with Ctrl/Cmd)
    else if (isCtrl && key === 'z') {
      e.preventDefault()
      handlers.onUndo?.()
    } else if (isCtrl && key === 'y') {
      e.preventDefault()
      handlers.onRedo?.()
    } else if (isCtrl && key === 'a') {
      e.preventDefault()
      handlers.onSelectAll?.()
    }
    // Delete (with or without Ctrl)
    else if (e.key === 'Delete') {
      e.preventDefault()
      handlers.onDelete?.()
    }
    // Help overlay
    else if (key === '?') {
      e.preventDefault()
      handlers.onToggleHelp?.()
    }
  }
}

/**
 * Format shortcut key for display
 * @param {string} keyStr - The key string from SHORTCUT_MAP
 * @returns {string} Formatted display string
 */
export function formatShortcut(keyStr) {
  return keyStr
    .replace('Ctrl+', 'Ctrl + ')
    .replace('Cmd+', 'Cmd + ')
    .replace('+', ' + ')
}

/**
 * Get all shortcuts organized by category
 * @returns {Object} Shortcuts grouped by category
 */
export function getShortcutsByCategory() {
  const categories = {}
  Object.values(SHORTCUT_MAP).forEach(shortcut => {
    if (!categories[shortcut.category]) {
      categories[shortcut.category] = []
    }
    categories[shortcut.category].push(shortcut)
  })
  return categories
}
