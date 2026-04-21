import { useState } from 'react'
import { Star, Award, TrendingUp, Users, Palette, Grid3X3, Settings } from 'lucide-react'

const RANK_TIERS = ['Member', 'Studio Pro', 'Senior', 'Principal', 'Fellow', 'Master']
const CURRENT_RANK = 2 // Associate

const BADGES = [
  { name: 'Colorist', earned: true, desc: 'Top 20% palette scores across 10+ designs' },
  { name: 'Space Planner', earned: true, desc: 'Top 20% use-of-space scores across 10+ designs' },
  { name: 'Material Maven', earned: false, desc: 'Use 4+ unique materials in 5 consecutive designs' },
  { name: 'Lighting Expert', earned: false, desc: 'Score 4.5+ on designs using all 3 time-of-day settings' },
  { name: 'Small Space', earned: false, desc: 'Score 4.5+ on 5 rooms under 200 sq ft' },
  { name: 'Creativity', earned: true, desc: 'Top 10% creativity scores in 3 consecutive challenges' },
  { name: 'Mentor', earned: false, desc: 'Leave constructive feedback on 50 designs' },
]

const RADAR_DATA = {
  cohesion: 4.5, creativity: 4.2, space: 4.6, palette: 4.8
}

const PORTFOLIO_DESIGNS = [
  { id: 1, title: 'Brooklyn Brownstone Parlor', brief: 'Living Room', score: 4.6, rank: 12, date: '2 days ago',
    palette: ['#2C3E50','#E8D5B7','#8B4513','#D4A574','#1a1a2e'], concept: 'Warm Minimal', pinned: true },
  { id: 2, title: 'Malibu Beach House', brief: 'Open Plan', score: 4.8, rank: 3, date: '5 days ago',
    palette: ['#E8E4DE','#87CEEB','#F5DEB3','#2F4F4F','#FEFEFE'], concept: 'Coastal Modern', pinned: true },
  { id: 3, title: 'Chicago Mid-Century', brief: 'Living Room', score: 4.2, rank: 28, date: '1 week ago',
    palette: ['#C1440E','#2B2B2B','#E8C07D','#5B7553','#F4ECD8'], concept: 'Retro Warm', pinned: false },
  { id: 4, title: 'West Village Studio', brief: 'Bedroom', score: 4.4, rank: 15, date: '2 weeks ago',
    palette: ['#1B3A5C','#E8C07D','#2B2B2B','#C8AA78','#F5F0E8'], concept: 'Indigo Night', pinned: false },
  { id: 5, title: 'Austin Ranch Kitchen', brief: 'Kitchen', score: 4.7, rank: 5, date: '2 weeks ago',
    palette: ['#5B7553','#E8D5B7','#8B4513','#F5F0E8','#C8AA78'], concept: 'Modern Rustic', pinned: true },
  { id: 6, title: 'Seattle Craftsman Den', brief: 'Office', score: 4.0, rank: 34, date: '3 weeks ago',
    palette: ['#2C3E50','#C8AA78','#8B4513','#E8E4DE','#5B7553'], concept: 'Study Club', pinned: false },
]

export default function PortfolioPage({ user }) {
  const [showAllBadges, setShowAllBadges] = useState(false)

  const RadarChart = () => {
    const cx = 100, cy = 100, r = 70
    const labels = [
      { key: 'cohesion', label: 'Cohesion', angle: -90 },
      { key: 'creativity', label: 'Creativity', angle: 0 },
      { key: 'space', label: 'Space', angle: 90 },
      { key: 'palette', label: 'Palette', angle: 180 },
    ]

    const toXY = (angle, radius) => ({
      x: cx + radius * Math.cos((angle * Math.PI) / 180),
      y: cy + radius * Math.sin((angle * Math.PI) / 180),
    })

    const dataPoints = labels.map(l => toXY(l.angle, (RADAR_DATA[l.key] / 5) * r))
    const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

    return (
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Grid rings */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((s, i) => {
          const pts = labels.map(l => toXY(l.angle, s * r))
          return <polygon key={i} points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="rgba(200,170,120,0.08)" strokeWidth="0.5" />
        })}
        {/* Axes */}
        {labels.map((l, i) => {
          const end = toXY(l.angle, r)
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(200,170,120,0.1)" strokeWidth="0.5" />
        })}
        {/* Data polygon */}
        <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(200,170,120,0.15)" stroke="#c8aa78" strokeWidth="1.5" />
        {/* Data points */}
        {dataPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#c8aa78" />)}
        {/* Labels */}
        {labels.map((l, i) => {
          const pos = toXY(l.angle, r + 18)
          return <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle"
            fill="#6a6258" fontSize="10">{l.label}</text>
        })}
      </svg>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '40px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Profile header */}
        <div style={{ display: 'flex', gap: 40, marginBottom: 48, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#6a6258', fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8, fontWeight: 500 }}>Portfolio</p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#f5f0e8', fontWeight: 400, marginBottom: 4 }}>
              {user?.name || 'Designer'}
            </h1>
            <p style={{ color: '#6a6258', fontSize: 14, marginBottom: 24 }}>@{user?.username || 'designer'}</p>

            {/* Rank progress */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#c8aa78', fontSize: 13, fontWeight: 500 }}>{RANK_TIERS[CURRENT_RANK]}</span>
                <span style={{ color: '#5a5248', fontSize: 12 }}>Next: {RANK_TIERS[CURRENT_RANK + 1]}</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                <div style={{ height: '100%', width: '65%', background: 'linear-gradient(90deg, #c8aa78, #d4b88a)', borderRadius: 2 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {RANK_TIERS.map((r, i) => (
                  <span key={i} style={{ fontSize: 9, color: i <= CURRENT_RANK ? '#c8aa78' : '#2a2620' }}>{r}</span>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 32 }}>
              {[
                { v: PORTFOLIO_DESIGNS.length, l: 'Designs' },
                { v: '4.5', l: 'Avg Score' },
                { v: '89', l: 'Followers' },
                { v: '12', l: 'Following' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ color: '#c8aa78', fontFamily: 'Georgia, serif', fontSize: 20 }}>{s.v}</div>
                  <div style={{ color: '#5a5248', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar chart */}
          <div style={{ textAlign: 'center' }}>
            <RadarChart />
            <p style={{ color: '#5a5248', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}>Skill Radar</p>
          </div>
        </div>

        {/* Badges */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16, fontWeight: 500 }}>Badges</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(showAllBadges ? BADGES : BADGES.filter(b => b.earned)).map((b, i) => (
              <div key={i} style={{
                padding: '8px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6,
                background: b.earned ? 'rgba(200,170,120,0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${b.earned ? 'rgba(200,170,120,0.25)' : 'rgba(255,255,255,0.04)'}`,
                opacity: b.earned ? 1 : 0.4
              }}>
                <Award size={14} style={{ color: b.earned ? '#c8aa78' : '#3a3630' }} />
                <span style={{ fontSize: 12, color: b.earned ? '#c8aa78' : '#5a5248' }}>{b.name}</span>
              </div>
            ))}
            <button onClick={() => setShowAllBadges(!showAllBadges)} style={{
              padding: '8px 16px', borderRadius: 20, background: 'none', border: '1px solid rgba(255,255,255,0.06)',
              color: '#5a5248', fontSize: 12, cursor: 'pointer'
            }}>{showAllBadges ? 'Show earned' : 'Show all'}</button>
          </div>
        </div>

        {/* Design gallery */}
        <div>
          <h2 style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20, fontWeight: 500 }}>Design Gallery</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {PORTFOLIO_DESIGNS.map(d => (
              <div key={d.id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14, overflow: 'hidden', position: 'relative'
              }}>
                {d.pinned && (
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 12,
                    background: 'rgba(0,0,0,0.6)', color: '#c8aa78', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Pinned</div>
                )}
                {/* Palette strip */}
                <div style={{ display: 'flex', height: 48 }}>
                  {d.palette.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
                </div>
                <div style={{ padding: 18 }}>
                  <h4 style={{ color: '#e8e4df', fontSize: 14, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{d.title}</h4>
                  <p style={{ color: '#5a5248', fontSize: 12, marginBottom: 12 }}>{d.brief} · {d.concept} · {d.date}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={13} style={{ color: '#c8aa78' }} fill="#c8aa78" />
                      <span style={{ color: '#c8aa78', fontSize: 14, fontWeight: 500 }}>{d.score}</span>
                    </div>
                    <span style={{ color: '#5a5248', fontSize: 12 }}>#{d.rank} in challenge</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
