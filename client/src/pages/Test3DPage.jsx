import { useState } from 'react'
import RoomPreview3D from '../components/RoomPreview3D'

// Hardcoded test furniture — bypasses DB entirely
const TEST_ITEMS = [
  { name: 'Eames Lounge Chair', type: 'Seating', w: 33, d: 33, h: 33, x: 120, y: 100, colors: ['#5C3A1E'], color_hex: '#5C3A1E' },
  { name: 'Camaleonda Sofa', type: 'Seating', w: 96, d: 40, h: 28, x: 300, y: 80, colors: ['#8B7355'], color_hex: '#8B7355' },
  { name: 'Noguchi Coffee Table', type: 'Table', w: 50, d: 36, h: 16, x: 320, y: 200, colors: ['#C4A35A'], color_hex: '#C4A35A' },
  { name: 'Tobi-Ishi Side Table', type: 'Table', w: 24, d: 24, h: 22, x: 150, y: 220, colors: ['#E8E4DE'], color_hex: '#E8E4DE' },
  { name: 'Tolomeo Floor Lamp', type: 'Lighting', w: 12, d: 12, h: 60, x: 100, y: 50, colors: ['#C0C0C0'], color_hex: '#C0C0C0' },
  { name: 'Fiddle Leaf Fig', type: 'Plant', w: 24, d: 24, h: 48, x: 500, y: 50, colors: ['#16a34a'], color_hex: '#16a34a' },
  { name: 'Beni Ourain Rug', type: 'Textile', w: 96, d: 72, h: 1, x: 280, y: 140, colors: ['#E8DCC8'], color_hex: '#E8DCC8' },
  { name: 'Abstract Canvas', type: 'Art', w: 48, d: 4, h: 36, x: 320, y: 10, colors: ['#4F46E5'], color_hex: '#4F46E5' },
  { name: 'Tall Bookshelf', type: 'Storage', w: 36, d: 14, h: 72, x: 520, y: 80, colors: ['#92400e'], color_hex: '#92400e' },
]

const PALETTE = ['#C8AA78', '#5B3A1E', '#E8E4DE', '#92400e', '#3d2b1f']

// Match ChallengeFlow's constants
const INCH_TO_SVG = 2.5
const ROOM_ORIGIN_X = 60
const ROOM_ORIGIN_Y = 40
const ROOM_W = 500
const ROOM_H = 400

export default function Test3DPage() {
  const [timeOfDay, setTimeOfDay] = useState('day')

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', background: '#1a1612', borderBottom: '1px solid rgba(200,170,120,0.15)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <h2 style={{ color: '#c8aa78', margin: 0, fontFamily: 'Georgia, serif', fontSize: 16 }}>
          3D Furniture Test — HD Builders
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'sunset', 'night'].map(t => (
            <button key={t} onClick={() => setTimeOfDay(t)} style={{
              padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: timeOfDay === t ? '#c8aa78' : '#2a2520', color: timeOfDay === t ? '#1a1612' : '#8a8078',
              fontSize: 12, textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>
        <span style={{ color: '#6a6258', fontSize: 11, marginLeft: 'auto' }}>
          {TEST_ITEMS.length} items · Open console (F12) for debug logs
        </span>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <RoomPreview3D
          placedItems={TEST_ITEMS}
          palette={PALETTE}
          timeOfDay={timeOfDay}
          INCH_TO_SVG={INCH_TO_SVG}
          ROOM_ORIGIN_X={ROOM_ORIGIN_X}
          ROOM_ORIGIN_Y={ROOM_ORIGIN_Y}
          ROOM_W={ROOM_W}
          ROOM_H={ROOM_H}
        />
      </div>
    </div>
  )
}
