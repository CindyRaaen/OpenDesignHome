import { useEffect, useState, lazy, Suspense } from 'react'
import { ArrowLeft, Send, ChevronDown, Check, X, Palette, Armchair, RotateCcw } from 'lucide-react'
import { api } from '../utils/api'

const ThreeDRoom = lazy(() => import('../components/ThreeDRoom'))

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

          {/* ── 3D Room ── */}
          <div className="w-full max-w-lg">
            <Suspense fallback={<div className="w-full h-80 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">Loading 3D room...</div>}>
              <ThreeDRoom
                roomType={challenge?.room_type || 'living_room'}
                wallpaperId={wallpaper.id}
                floorId={floor.id}
                rugId={rug.id}
                filledSlots={filledSlots}
                slots={template.slots}
                activeSlot={activeSlot}
                onSlotClick={(slotId) => setActiveSlot(slotId)}
              />
            </Suspense>
            <p className="text-center text-gray-500 text-xs mt-1">Drag to orbit the room</p>
          </div>

          {/* ── Slot picker (tap to fill) ── */}
          <div className="w-full max-w-lg">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">Tap a spot to furnish it</h3>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {template.slots.map(slot => {
                const filled = filledSlots[slot.id]
                const isActive = activeSlot === slot.id
                return (
                  <button
                    key={slot.id}
                    onClick={() => filled ? clearSlot(slot.id) : setActiveSlot(slot.id)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition border ${
                      filled
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : isActive
                          ? 'bg-indigo-500 border-indigo-400 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <span className="mr-1">{CATEGORY_ICONS[slot.categories[0]] || '📦'}</span>
                    {filled ? (
                      <span>{filled.name.length > 12 ? filled.name.slice(0, 11) + '…' : filled.name} ✕</span>
                    ) : (
                      <span>{slot.label}</span>
                    )}
                  </button>
                )
              })}
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
