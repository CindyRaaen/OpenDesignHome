import { useEffect, useState } from 'react'
import { ArrowLeft, Send, ChevronDown, Check, X, Palette, Armchair } from 'lucide-react'
import { api } from '../utils/api'

// ── Wallpaper options ──
const WALLPAPERS = [
  { id: 'white',    name: 'Classic White',    bg: '#f5f0eb', pattern: null },
  { id: 'cream',    name: 'Warm Cream',       bg: '#f5e6d3', pattern: null },
  { id: 'sage',     name: 'Sage Green',       bg: '#c5d5c0', pattern: null },
  { id: 'navy',     name: 'Navy Blue',        bg: '#2c3e6b', pattern: null },
  { id: 'blush',    name: 'Blush Pink',       bg: '#f0d4d4', pattern: null },
  { id: 'charcoal', name: 'Charcoal',         bg: '#4a4a4a', pattern: null },
  { id: 'stripe',   name: 'Blue Stripe',      bg: '#e8edf4', pattern: 'repeating-linear-gradient(90deg, transparent 0px, transparent 18px, #c5d0e0 18px, #c5d0e0 20px)' },
  { id: 'damask',   name: 'Gold Damask',      bg: '#f5e6c8', pattern: 'radial-gradient(ellipse 20px 24px at 20px 20px, #e8d5a8 40%, transparent 42%), radial-gradient(ellipse 20px 24px at 0px 40px, #e8d5a8 40%, transparent 42%)' },
  { id: 'herring',  name: 'Gray Herringbone', bg: '#d8d3ce', pattern: 'linear-gradient(45deg, #c5c0ba 25%, transparent 25%, transparent 50%, #c5c0ba 50%, #c5c0ba 75%, transparent 75%)' },
]

// ── Rug options ──
const RUGS = [
  { id: 'none',     name: 'No Rug',          color: null },
  { id: 'persian',  name: 'Persian Red',     color: '#8b2020', border: '#d4a843', pattern: true },
  { id: 'modern',   name: 'Modern Gray',     color: '#9e9e9e', border: '#757575', pattern: false },
  { id: 'blue',     name: 'Navy Oriental',   color: '#1a3a5c', border: '#c5a84d', pattern: true },
  { id: 'cream',    name: 'Cream Shag',      color: '#f5f0e8', border: '#e0d8c8', pattern: false },
  { id: 'green',    name: 'Forest Green',    color: '#2d5a3d', border: '#8b7e3a', pattern: true },
  { id: 'blush',    name: 'Blush Pink',      color: '#e8b4b8', border: '#d4969b', pattern: false },
  { id: 'black',    name: 'Black & White',   color: '#333333', border: '#ffffff', pattern: true },
]

// ── Floor options ──
const FLOORS = [
  { id: 'oak',     name: 'Light Oak',     color: '#d4a86a', stripe: '#c49a5c' },
  { id: 'walnut',  name: 'Dark Walnut',   color: '#6b4226', stripe: '#5a3520' },
  { id: 'maple',   name: 'Honey Maple',   color: '#c8945a', stripe: '#b8844a' },
  { id: 'gray',    name: 'Gray Wash',     color: '#a8a090', stripe: '#989080' },
  { id: 'white',   name: 'White Oak',     color: '#ddd4c4', stripe: '#cec5b5' },
  { id: 'tile',    name: 'White Tile',    color: '#e8e4e0', stripe: '#d0ccc5' },
]

// ── Room configs with placement slots ──
const ROOM_TEMPLATES = {
  living_room: {
    label: 'Living Room',
    hasFireplace: true,
    windowCount: 2,
    slots: [
      { id: 'sofa',       label: 'Sofa Area',        zone: 'floor', x: '15%', y: '55%', w: '35%', h: '28%', categories: ['sofas'] },
      { id: 'chair1',     label: 'Accent Chair',     zone: 'floor', x: '55%', y: '50%', w: '18%', h: '22%', categories: ['chairs'] },
      { id: 'coffeetable',label: 'Coffee Table',     zone: 'floor', x: '28%', y: '48%', w: '20%', h: '15%', categories: ['tables'] },
      { id: 'sidetable',  label: 'Side Table',       zone: 'floor', x: '5%',  y: '55%', w: '12%', h: '14%', categories: ['tables', 'lamps'] },
      { id: 'lamp1',      label: 'Floor Lamp',       zone: 'floor', x: '78%', y: '40%', w: '10%', h: '25%', categories: ['lamps'] },
      { id: 'plant1',     label: 'Plant',            zone: 'floor', x: '82%', y: '55%', w: '12%', h: '18%', categories: ['plants'] },
      { id: 'wallart1',   label: 'Wall Art (Left)',  zone: 'wall',  x: '8%',  y: '12%', w: '18%', h: '22%', categories: ['art'] },
      { id: 'wallart2',   label: 'Wall Art (Right)', zone: 'wall',  x: '60%', y: '10%', w: '16%', h: '20%', categories: ['art'] },
    ]
  },
  bedroom: {
    label: 'Bedroom',
    hasFireplace: false,
    windowCount: 2,
    slots: [
      { id: 'bed',        label: 'Bed',              zone: 'floor', x: '20%', y: '35%', w: '40%', h: '45%', categories: ['sofas'] },
      { id: 'nightstand1',label: 'Left Nightstand',  zone: 'floor', x: '8%',  y: '45%', w: '13%', h: '16%', categories: ['tables'] },
      { id: 'nightstand2',label: 'Right Nightstand', zone: 'floor', x: '60%', y: '45%', w: '13%', h: '16%', categories: ['tables'] },
      { id: 'lamp1',      label: 'Table Lamp',       zone: 'floor', x: '8%',  y: '38%', w: '10%', h: '15%', categories: ['lamps'] },
      { id: 'chair1',     label: 'Reading Chair',    zone: 'floor', x: '75%', y: '48%', w: '18%', h: '24%', categories: ['chairs'] },
      { id: 'plant1',     label: 'Plant',            zone: 'floor', x: '80%', y: '35%', w: '12%', h: '18%', categories: ['plants'] },
      { id: 'wallart1',   label: 'Wall Art',         zone: 'wall',  x: '28%', y: '8%',  w: '24%', h: '22%', categories: ['art'] },
    ]
  },
  kitchen: {
    label: 'Kitchen',
    hasFireplace: false,
    windowCount: 1,
    slots: [
      { id: 'table',      label: 'Dining Table',     zone: 'floor', x: '15%', y: '50%', w: '30%', h: '25%', categories: ['tables'] },
      { id: 'chair1',     label: 'Chair 1',          zone: 'floor', x: '10%', y: '48%', w: '12%', h: '18%', categories: ['chairs'] },
      { id: 'chair2',     label: 'Chair 2',          zone: 'floor', x: '40%', y: '48%', w: '12%', h: '18%', categories: ['chairs'] },
      { id: 'plant1',     label: 'Counter Plant',    zone: 'floor', x: '75%', y: '35%', w: '12%', h: '18%', categories: ['plants'] },
      { id: 'lamp1',      label: 'Pendant Light',    zone: 'wall',  x: '25%', y: '5%',  w: '14%', h: '16%', categories: ['lamps'] },
      { id: 'wallart1',   label: 'Wall Art',         zone: 'wall',  x: '58%', y: '10%', w: '18%', h: '20%', categories: ['art'] },
    ]
  },
  dining_room: {
    label: 'Dining Room',
    hasFireplace: false,
    windowCount: 2,
    slots: [
      { id: 'table',      label: 'Dining Table',     zone: 'floor', x: '22%', y: '42%', w: '35%', h: '30%', categories: ['tables'] },
      { id: 'chair1',     label: 'Chair 1',          zone: 'floor', x: '12%', y: '45%', w: '12%', h: '18%', categories: ['chairs'] },
      { id: 'chair2',     label: 'Chair 2',          zone: 'floor', x: '55%', y: '45%', w: '12%', h: '18%', categories: ['chairs'] },
      { id: 'chair3',     label: 'Chair 3',          zone: 'floor', x: '28%', y: '68%', w: '12%', h: '18%', categories: ['chairs'] },
      { id: 'chair4',     label: 'Chair 4',          zone: 'floor', x: '42%', y: '68%', w: '12%', h: '18%', categories: ['chairs'] },
      { id: 'sideboard',  label: 'Sideboard',        zone: 'floor', x: '70%', y: '40%', w: '22%', h: '18%', categories: ['tables'] },
      { id: 'lamp1',      label: 'Chandelier',       zone: 'wall',  x: '32%', y: '3%',  w: '16%', h: '18%', categories: ['lamps'] },
      { id: 'wallart1',   label: 'Wall Art',         zone: 'wall',  x: '8%',  y: '12%', w: '18%', h: '22%', categories: ['art'] },
      { id: 'plant1',     label: 'Corner Plant',     zone: 'floor', x: '82%', y: '55%', w: '12%', h: '18%', categories: ['plants'] },
    ]
  },
  bathroom: {
    label: 'Bathroom',
    hasFireplace: false,
    windowCount: 1,
    slots: [
      { id: 'plant1',     label: 'Plant',            zone: 'floor', x: '8%',  y: '50%', w: '14%', h: '20%', categories: ['plants'] },
      { id: 'chair1',     label: 'Vanity Stool',     zone: 'floor', x: '55%', y: '55%', w: '16%', h: '20%', categories: ['chairs'] },
      { id: 'table1',     label: 'Storage Table',    zone: 'floor', x: '75%', y: '48%', w: '16%', h: '18%', categories: ['tables'] },
      { id: 'lamp1',      label: 'Vanity Light',     zone: 'wall',  x: '55%', y: '8%',  w: '16%', h: '14%', categories: ['lamps'] },
      { id: 'wallart1',   label: 'Wall Art',         zone: 'wall',  x: '10%', y: '12%', w: '16%', h: '20%', categories: ['art'] },
      { id: 'wallart2',   label: 'Mirror Art',       zone: 'wall',  x: '55%', y: '25%', w: '14%', h: '16%', categories: ['art'] },
    ]
  },
  studio: {
    label: 'Studio Apartment',
    hasFireplace: false,
    windowCount: 2,
    slots: [
      { id: 'sofa',       label: 'Sofa / Daybed',    zone: 'floor', x: '5%',  y: '45%', w: '30%', h: '30%', categories: ['sofas'] },
      { id: 'table',      label: 'Desk / Table',     zone: 'floor', x: '55%', y: '38%', w: '22%', h: '18%', categories: ['tables'] },
      { id: 'chair1',     label: 'Desk Chair',       zone: 'floor', x: '58%', y: '55%', w: '14%', h: '18%', categories: ['chairs'] },
      { id: 'sidetable',  label: 'Side Table',       zone: 'floor', x: '35%', y: '52%', w: '14%', h: '14%', categories: ['tables'] },
      { id: 'lamp1',      label: 'Floor Lamp',       zone: 'floor', x: '80%', y: '40%', w: '10%', h: '25%', categories: ['lamps'] },
      { id: 'plant1',     label: 'Plant',            zone: 'floor', x: '82%', y: '58%', w: '12%', h: '18%', categories: ['plants'] },
      { id: 'plant2',     label: 'Shelf Plant',      zone: 'floor', x: '3%',  y: '35%', w: '10%', h: '14%', categories: ['plants'] },
      { id: 'wallart1',   label: 'Wall Art',         zone: 'wall',  x: '15%', y: '10%', w: '20%', h: '22%', categories: ['art'] },
      { id: 'wallart2',   label: 'Wall Art 2',       zone: 'wall',  x: '60%', y: '8%',  w: '16%', h: '20%', categories: ['art'] },
      { id: 'lamp2',      label: 'Table Lamp',       zone: 'floor', x: '36%', y: '45%', w: '10%', h: '14%', categories: ['lamps'] },
    ]
  }
}

// ── Furniture emoji/icon by category ──
const CATEGORY_ICONS = {
  sofas: '🛋️', chairs: '🪑', tables: '🪵', lamps: '💡',
  rugs: '🟫', art: '🖼️', plants: '🪴',
}

export default function DesignEditorPage({ challenge, setPage }) {
  const [furniture, setFurniture] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Design choices
  const [wallpaper, setWallpaper] = useState(WALLPAPERS[0])
  const [rug, setRug] = useState(RUGS[0])
  const [floor, setFloor] = useState(FLOORS[0])
  const [filledSlots, setFilledSlots] = useState({}) // slotId -> furniture item

  // UI state
  const [activeSlot, setActiveSlot] = useState(null)  // which slot is being filled
  const [activePanel, setActivePanel] = useState(null) // 'wallpaper' | 'rug' | 'floor' | null
  const [filterCat, setFilterCat] = useState('all')

  const template = ROOM_TEMPLATES[challenge?.room_type] || ROOM_TEMPLATES.living_room

  useEffect(() => {
    api.get('/api/furniture')
      .then(setFurniture)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter furniture for the active slot's allowed categories
  const slotDef = activeSlot ? template.slots.find(s => s.id === activeSlot) : null
  const allowedCategories = slotDef?.categories || []
  const catalogItems = furniture.filter(f => {
    if (allowedCategories.length && !allowedCategories.includes(f.category)) return false
    if (filterCat !== 'all' && f.category !== filterCat) return false
    return true
  })

  const placeItem = (slotId, item) => {
    setFilledSlots(prev => ({ ...prev, [slotId]: item }))
    setActiveSlot(null)
  }

  const clearSlot = (slotId) => {
    setFilledSlots(prev => {
      const next = { ...prev }
      delete next[slotId]
      return next
    })
  }

  const filledCount = Object.keys(filledSlots).length
  const totalSlots = template.slots.length
  const totalValue = Object.values(filledSlots).reduce((sum, i) => sum + parseFloat(i.price_usd || 0), 0)

  const handleSubmit = async () => {
    if (!challenge) return
    setSubmitting(true)
    try {
      await api.post('/api/designs', {
        challenge_id: challenge.id,
        title: challenge.title + ' - My Design',
        design_data: {
          wallpaper: wallpaper.id,
          rug: rug.id,
          floor: floor.id,
          items: Object.entries(filledSlots).map(([slotId, item]) => ({
            slotId, id: item.id, name: item.name,
          })),
        },
      })
      alert('Design submitted for voting!')
      setPage('challenges')
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!challenge) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-3">No Challenge Selected</h2>
        <button onClick={() => setPage('challenges')} className="bg-indigo-500 text-white font-semibold px-6 py-2 rounded">
          Browse Challenges
        </button>
      </div>
    )
  }

  // ── Wallpaper style for the back wall ──
  const wallStyle = {
    backgroundColor: wallpaper.bg,
    ...(wallpaper.pattern ? { backgroundImage: wallpaper.pattern, backgroundSize: '40px 40px' } : {}),
  }

  // ── Floor style ──
  const floorStyle = {
    backgroundColor: floor.color,
    backgroundImage: `repeating-linear-gradient(90deg, ${floor.stripe} 0px, ${floor.stripe} 2px, transparent 2px, transparent 48px)`,
    backgroundSize: '48px 100%',
  }

  // Dark wallpaper = light text
  const isDarkWall = ['navy', 'charcoal'].includes(wallpaper.id)

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-900">
      {/* ── Top bar ── */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 py-2.5 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => setPage('challenges')} className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-indigo-400 truncate">{challenge.title}</h1>
          <p className="text-xs text-gray-400">{template.label} · {filledCount}/{totalSlots} filled · ${totalValue.toFixed(0)}</p>
        </div>
      </div>

      {/* ── Room view ── */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 flex flex-col items-center gap-3">

          {/* The perspective room */}
          <div className="w-full max-w-lg" style={{ perspective: '600px' }}>
            <div className="relative" style={{ paddingBottom: '75%' }}>
              <div className="absolute inset-0 overflow-hidden rounded-lg shadow-2xl">

                {/* ── Back wall ── */}
                <div className="absolute z-0" style={{
                  top: '0', left: '12%', right: '12%', bottom: '40%',
                  ...wallStyle,
                  borderBottom: '3px solid #8b7355',
                }}>
                  {/* Crown molding */}
                  <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(180deg, #f0ebe4, #d4cec4)' }}></div>

                  {/* ── Windows ── */}
                  {template.windowCount >= 1 && (
                    <div className="absolute" style={{ left: '8%', top: '15%', width: '28%', height: '55%' }}>
                      <div className="w-full h-full rounded-t-sm" style={{ border: '3px solid #f0ebe4', background: 'linear-gradient(180deg, #87CEEB 0%, #b8dff0 60%, #d4eef8 100%)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)' }}>
                        <div className="absolute inset-0 flex">
                          <div className="flex-1 border-r" style={{ borderColor: '#f0ebe4' }}></div>
                          <div className="flex-1"></div>
                        </div>
                        <div className="absolute left-0 right-0 top-1/2" style={{ height: '2px', background: '#f0ebe4' }}></div>
                      </div>
                      {/* Sill */}
                      <div style={{ height: '6px', background: 'linear-gradient(180deg, #f0ebe4, #d4cec4)', borderRadius: '0 0 2px 2px' }}></div>
                    </div>
                  )}
                  {template.windowCount >= 2 && (
                    <div className="absolute" style={{ right: '8%', top: '15%', width: '28%', height: '55%' }}>
                      <div className="w-full h-full rounded-t-sm" style={{ border: '3px solid #f0ebe4', background: 'linear-gradient(180deg, #87CEEB 0%, #b8dff0 60%, #d4eef8 100%)', boxShadow: 'inset 0 0 20px rgba(255,255,255,0.3)' }}>
                        <div className="absolute inset-0 flex">
                          <div className="flex-1 border-r" style={{ borderColor: '#f0ebe4' }}></div>
                          <div className="flex-1"></div>
                        </div>
                        <div className="absolute left-0 right-0 top-1/2" style={{ height: '2px', background: '#f0ebe4' }}></div>
                      </div>
                      <div style={{ height: '6px', background: 'linear-gradient(180deg, #f0ebe4, #d4cec4)', borderRadius: '0 0 2px 2px' }}></div>
                    </div>
                  )}

                  {/* ── Fireplace ── */}
                  {template.hasFireplace && (
                    <div className="absolute" style={{ left: '50%', bottom: '0', transform: 'translateX(-50%)', width: '30%', height: '60%' }}>
                      {/* Mantle */}
                      <div style={{ height: '8%', background: 'linear-gradient(180deg, #f0ebe4, #c8bfb0)', borderRadius: '3px 3px 0 0', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}></div>
                      {/* Surround */}
                      <div className="relative" style={{ height: '92%', background: '#e8e0d4', border: '2px solid #c8bfb0' }}>
                        {/* Opening */}
                        <div className="absolute" style={{ left: '15%', right: '15%', top: '8%', bottom: '0', background: '#1a1a1a', borderRadius: '40% 40% 0 0' }}>
                          {/* Fire glow */}
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: '60%', height: '45%', background: 'radial-gradient(ellipse, #ff6b35 0%, #ff4500 40%, transparent 70%)', opacity: 0.8, filter: 'blur(3px)' }}></div>
                          {/* Logs */}
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2" style={{ width: '70%', height: '18%', background: '#4a3728', borderRadius: '40%' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Wall-zone slots (art, etc.) ── */}
                  {template.slots.filter(s => s.zone === 'wall').map(slot => {
                    const filled = filledSlots[slot.id]
                    return (
                      <button
                        key={slot.id}
                        onClick={() => filled ? clearSlot(slot.id) : setActiveSlot(slot.id)}
                        className="absolute transition-all group"
                        style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h, zIndex: 5 }}
                      >
                        {filled ? (
                          <div className="w-full h-full rounded shadow-lg flex items-center justify-center relative" style={{
                            background: 'linear-gradient(145deg, #f5f0e8, #e0d8cc)',
                            border: '3px solid #c8bfb0',
                            boxShadow: '2px 3px 8px rgba(0,0,0,0.25)',
                          }}>
                            <span className="text-2xl">{CATEGORY_ICONS[filled.category] || '🖼️'}</span>
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</div>
                          </div>
                        ) : (
                          <div className={`w-full h-full rounded border-2 border-dashed flex flex-col items-center justify-center transition-all ${isDarkWall ? 'border-white/30 hover:border-white/60' : 'border-gray-500/30 hover:border-indigo-400/60 hover:bg-indigo-100/20'}`}>
                            <span className="text-lg opacity-40 group-hover:opacity-70">🖼️</span>
                            <span className={`text-xs font-medium mt-0.5 opacity-40 group-hover:opacity-70 ${isDarkWall ? 'text-white' : 'text-gray-600'}`}>{slot.label}</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* ── Left wall (perspective) ── */}
                <div className="absolute z-1" style={{
                  top: '0', left: '0', width: '12%', bottom: '40%',
                  background: `linear-gradient(90deg, ${adjustColor(wallpaper.bg, -30)}, ${wallpaper.bg})`,
                  borderRight: '2px solid rgba(0,0,0,0.08)',
                  transformOrigin: 'right center',
                }}></div>

                {/* ── Right wall (perspective) ── */}
                <div className="absolute z-1" style={{
                  top: '0', right: '0', width: '12%', bottom: '40%',
                  background: `linear-gradient(270deg, ${adjustColor(wallpaper.bg, -30)}, ${wallpaper.bg})`,
                  borderLeft: '2px solid rgba(0,0,0,0.08)',
                }}></div>

                {/* ── Floor ── */}
                <div className="absolute z-0" style={{
                  top: '60%', left: '0', right: '0', bottom: '0',
                  ...floorStyle,
                  transform: 'perspective(400px) rotateX(5deg)',
                  transformOrigin: 'top center',
                }}>
                  {/* Baseboard */}
                  <div className="absolute top-0 left-0 right-0" style={{ height: '4px', background: '#d4cec4' }}></div>
                </div>

                {/* ── Rug on floor ── */}
                {rug.id !== 'none' && (
                  <div className="absolute z-2" style={{
                    top: '62%', left: '20%', right: '20%', bottom: '5%',
                    backgroundColor: rug.color,
                    border: `3px solid ${rug.border}`,
                    borderRadius: '2px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    {rug.pattern && (
                      <>
                        <div className="absolute inset-2 border border-current opacity-20" style={{ borderColor: rug.border }}></div>
                        <div className="absolute inset-4 border border-current opacity-15" style={{ borderColor: rug.border }}></div>
                        {/* Center medallion for oriental rugs */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{
                          width: '30%', height: '40%',
                          border: `2px solid ${rug.border}`,
                          borderRadius: '50%',
                          opacity: 0.25,
                        }}></div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Floor-zone slots (furniture) ── */}
                {template.slots.filter(s => s.zone === 'floor').map(slot => {
                  const filled = filledSlots[slot.id]
                  // Map slot positions into the floor area (60% - 100% of height)
                  const topPct = 60 + parseFloat(slot.y) * 0.4
                  const leftPct = 12 + parseFloat(slot.x) * 0.76
                  const wPct = parseFloat(slot.w) * 0.76
                  const hPct = parseFloat(slot.h) * 0.4
                  return (
                    <button
                      key={slot.id}
                      onClick={() => filled ? clearSlot(slot.id) : setActiveSlot(slot.id)}
                      className="absolute transition-all group"
                      style={{ left: `${leftPct}%`, top: `${topPct}%`, width: `${wPct}%`, height: `${hPct}%`, zIndex: 10 }}
                    >
                      {filled ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                          <span className="text-3xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}>
                            {CATEGORY_ICONS[filled.category] || '📦'}
                          </span>
                          <span className="text-xs font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded mt-0.5 truncate max-w-full">
                            {filled.name.length > 15 ? filled.name.slice(0, 14) + '…' : filled.name}
                          </span>
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">×</div>
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-lg border-2 border-dashed border-white/25 hover:border-indigo-400/60 hover:bg-indigo-400/10 flex flex-col items-center justify-center transition-all">
                          <span className="text-xl opacity-30 group-hover:opacity-60">{CATEGORY_ICONS[slot.categories[0]] || '📦'}</span>
                          <span className="text-xs font-medium text-white/40 group-hover:text-white/70 mt-0.5">{slot.label}</span>
                        </div>
                      )}
                    </button>
                  )
                })}

              </div>
            </div>
          </div>

          {/* ── Design controls (wallpaper, rug, floor) ── */}
          <div className="w-full max-w-lg flex gap-2">
            <button
              onClick={() => setActivePanel(activePanel === 'wallpaper' ? null : 'wallpaper')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition ${activePanel === 'wallpaper' ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              <Palette size={15} /> Walls
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'floor' ? null : 'floor')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition ${activePanel === 'floor' ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              <ChevronDown size={15} /> Floor
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'rug' ? null : 'rug')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition ${activePanel === 'rug' ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              🟫 Rug
            </button>
          </div>

          {/* ── Wallpaper picker ── */}
          {activePanel === 'wallpaper' && (
            <div className="w-full max-w-lg bg-gray-800 rounded-lg p-3">
              <h3 className="text-sm font-bold text-white mb-2">Choose Wallpaper</h3>
              <div className="grid grid-cols-3 gap-2">
                {WALLPAPERS.map(wp => (
                  <button key={wp.id} onClick={() => { setWallpaper(wp); setActivePanel(null) }}
                    className={`relative rounded-lg p-2 flex flex-col items-center gap-1 transition ${wallpaper.id === wp.id ? 'ring-2 ring-indigo-400' : 'hover:bg-gray-700'}`}
                  >
                    <div className="w-full h-10 rounded" style={{
                      backgroundColor: wp.bg,
                      ...(wp.pattern ? { backgroundImage: wp.pattern, backgroundSize: '20px 20px' } : {}),
                    }}></div>
                    <span className="text-xs text-gray-300">{wp.name}</span>
                    {wallpaper.id === wp.id && <Check size={14} className="absolute top-1 right-1 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Floor picker ── */}
          {activePanel === 'floor' && (
            <div className="w-full max-w-lg bg-gray-800 rounded-lg p-3">
              <h3 className="text-sm font-bold text-white mb-2">Choose Flooring</h3>
              <div className="grid grid-cols-3 gap-2">
                {FLOORS.map(fl => (
                  <button key={fl.id} onClick={() => { setFloor(fl); setActivePanel(null) }}
                    className={`relative rounded-lg p-2 flex flex-col items-center gap-1 transition ${floor.id === fl.id ? 'ring-2 ring-indigo-400' : 'hover:bg-gray-700'}`}
                  >
                    <div className="w-full h-10 rounded" style={{
                      backgroundColor: fl.color,
                      backgroundImage: `repeating-linear-gradient(90deg, ${fl.stripe} 0px, ${fl.stripe} 2px, transparent 2px, transparent 12px)`,
                      backgroundSize: '12px 100%',
                    }}></div>
                    <span className="text-xs text-gray-300">{fl.name}</span>
                    {floor.id === fl.id && <Check size={14} className="absolute top-1 right-1 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Rug picker ── */}
          {activePanel === 'rug' && (
            <div className="w-full max-w-lg bg-gray-800 rounded-lg p-3">
              <h3 className="text-sm font-bold text-white mb-2">Choose a Rug</h3>
              <div className="grid grid-cols-4 gap-2">
                {RUGS.map(r => (
                  <button key={r.id} onClick={() => { setRug(r); setActivePanel(null) }}
                    className={`relative rounded-lg p-2 flex flex-col items-center gap-1 transition ${rug.id === r.id ? 'ring-2 ring-indigo-400' : 'hover:bg-gray-700'}`}
                  >
                    <div className="w-full h-8 rounded" style={{
                      backgroundColor: r.color || '#374151',
                      border: r.border ? `2px solid ${r.border}` : '2px dashed #555',
                    }}></div>
                    <span className="text-xs text-gray-300 leading-tight text-center">{r.name}</span>
                    {rug.id === r.id && <Check size={14} className="absolute top-1 right-1 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="w-full max-w-lg pb-4">
            <button onClick={handleSubmit} disabled={filledCount === 0 || submitting}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 text-base">
              <Send size={18} />
              {submitting ? 'Submitting...' : `Submit Design (${filledCount}/${totalSlots} · $${totalValue.toFixed(0)})`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Furniture picker overlay (when a slot is tapped) ── */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col">
          <div className="p-3 border-b border-gray-700 flex items-center gap-3 bg-gray-800">
            <button onClick={() => setActiveSlot(null)} className="text-gray-400 hover:text-white">
              <X size={22} />
            </button>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white">Choose: {slotDef?.label}</h2>
              <p className="text-xs text-gray-400">
                {allowedCategories.map(c => (CATEGORY_ICONS[c] || '') + ' ' + c).join(', ')}
              </p>
            </div>
          </div>

          {/* Category filter if multiple categories */}
          {allowedCategories.length > 1 && (
            <div className="px-3 pt-2 flex gap-1.5 flex-wrap">
              <button onClick={() => setFilterCat('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium ${filterCat === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                All
              </button>
              {allowedCategories.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-medium capitalize ${filterCat === cat ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {CATEGORY_ICONS[cat] || ''} {cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loading ? (
              <p className="text-gray-500 text-sm p-4 text-center">Loading furniture...</p>
            ) : catalogItems.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 text-center">No items available for this slot</p>
            ) : catalogItems.map(item => (
              <button key={item.id} onClick={() => placeItem(activeSlot, item)}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 text-left transition flex items-center gap-3 border border-gray-700">
                <span className="text-3xl w-12 text-center">{CATEGORY_ICONS[item.category] || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-base truncate">{item.name}</p>
                  <p className="text-sm text-gray-400">${parseFloat(item.price_usd || 0).toFixed(0)} · {item.style}</p>
                </div>
                <div className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs font-medium">Select</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Utility: darken/lighten a hex color
function adjustColor(hex, amount) {
  try {
    let r = parseInt(hex.slice(1, 3), 16) + amount
    let g = parseInt(hex.slice(3, 5), 16) + amount
    let b = parseInt(hex.slice(5, 7), 16) + amount
    r = Math.max(0, Math.min(255, r))
    g = Math.max(0, Math.min(255, g))
    b = Math.max(0, Math.min(255, b))
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
  } catch {
    return hex
  }
}
