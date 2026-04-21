import { useState } from 'react'
import { Users, TrendingUp, Star, Heart, Eye } from 'lucide-react'

const DESIGNERS = [
  { id: 1, name: 'Studio Nora', rank: 'Studio Pro', designs: 34, avgScore: 4.7, followers: 128, badges: ['Colorist','Space Planner'],
    palette: ['#E8D5B7','#2C3E50','#8B4513','#D4A574','#F5F0E8'], specialty: 'Warm Minimalism' },
  { id: 2, name: 'Kai Studio', rank: 'Member', designs: 18, avgScore: 4.3, followers: 56, badges: ['Material Maven'],
    palette: ['#C1440E','#E8C07D','#2F4F4F','#F4ECD8','#8B6F47'], specialty: 'Desert Modern' },
  { id: 3, name: 'Atelier M', rank: 'Studio Pro', designs: 41, avgScore: 4.8, followers: 203, badges: ['Colorist','Lighting Expert','Space Planner'],
    palette: ['#8B8B8B','#E8D5B7','#2C2C2C','#C8AA78','#F0EDE8'], specialty: 'Soft Industrial' },
  { id: 4, name: 'Lin Works', rank: 'Member', designs: 9, avgScore: 4.1, followers: 23, badges: ['Small Space'],
    palette: ['#2B2B2B','#D4C5A9','#5B7553','#F5F0E8','#8B7355'], specialty: 'Japandi' },
  { id: 5, name: 'Casa Verde', rank: 'Fellow', designs: 67, avgScore: 4.9, followers: 412, badges: ['Colorist','Material Maven','Mentor'],
    palette: ['#5B7553','#E8D5B7','#C1440E','#2C3E50','#F5F0E8'], specialty: 'Biophilic Design' },
  { id: 6, name: 'West & Rowe', rank: 'Member', designs: 22, avgScore: 4.4, followers: 71, badges: ['Creativity'],
    palette: ['#1B3A5C','#E8C07D','#C1440E','#F4ECD8','#2B2B2B'], specialty: 'Eclectic Modern' },
]

const TRENDING_PALETTES = [
  { name: 'Quiet Luxury', colors: ['#E8D5B7','#2C3E50','#C8AA78','#F5F0E8','#8B4513'], uses: 142 },
  { name: 'Terracotta Dream', colors: ['#C1440E','#E8C07D','#F4ECD8','#5B7553','#2F4F4F'], uses: 98 },
  { name: 'Midnight Garden', colors: ['#1a1a2e','#5B7553','#E8D5B7','#C8AA78','#2C3E50'], uses: 87 },
  { name: 'Coastal Fog', colors: ['#87CEEB','#E8E4DE','#D4C5A9','#2F4F4F','#FEFEFE'], uses: 76 },
  { name: 'Rust & Stone', colors: ['#C1440E','#4A4A48','#E8D5B7','#8B6F47','#F5F0E8'], uses: 63 },
]

export default function CommunityPage() {
  const [tab, setTab] = useState('designers')
  const [following, setFollowing] = useState([])

  const toggleFollow = (id) => {
    setFollowing(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '40px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <p style={{ color: '#6a6258', fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8, fontWeight: 500 }}>Community</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#f5f0e8', fontWeight: 400, marginBottom: 32 }}>Explore & Follow</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {['designers', 'palettes'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
              background: tab === t ? 'rgba(200,170,120,0.15)' : 'transparent',
              color: tab === t ? '#c8aa78' : '#6a6258', fontWeight: tab === t ? 500 : 400, textTransform: 'capitalize'
            }}>{t === 'designers' ? 'Top Designers' : 'Trending Palettes'}</button>
          ))}
        </div>

        {tab === 'designers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
            {DESIGNERS.map(d => (
              <div key={d.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, overflow: 'hidden'
              }}>
                {/* Signature palette */}
                <div style={{ display: 'flex', height: 4 }}>
                  {d.palette.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ color: '#f5f0e8', fontSize: 17, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{d.name}</h3>
                      <p style={{ color: '#6a6258', fontSize: 12, textTransform: 'capitalize' }}>{d.rank} · {d.specialty}</p>
                    </div>
                    <button onClick={() => toggleFollow(d.id)} style={{
                      padding: '6px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                      background: following.includes(d.id) ? 'rgba(200,170,120,0.15)' : 'transparent',
                      border: `1px solid ${following.includes(d.id) ? 'rgba(200,170,120,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: following.includes(d.id) ? '#c8aa78' : '#6a6258'
                    }}>{following.includes(d.id) ? 'Following' : 'Follow'}</button>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
                    {[
                      { v: d.designs, l: 'designs' },
                      { v: d.avgScore, l: 'avg score' },
                      { v: d.followers, l: 'followers' },
                    ].map((s, i) => (
                      <div key={i}>
                        <span style={{ color: '#c8aa78', fontSize: 15, fontWeight: 500 }}>{s.v}</span>
                        <span style={{ color: '#5a5248', fontSize: 11, marginLeft: 4 }}>{s.l}</span>
                      </div>
                    ))}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {d.badges.map((b, i) => (
                      <span key={i} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, background: 'rgba(200,170,120,0.08)', color: '#c8aa78' }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'palettes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TRENDING_PALETTES.map((p, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 20
              }}>
                <span style={{ color: 'rgba(200,170,120,0.3)', fontFamily: 'Georgia, serif', fontSize: 28, minWidth: 40, textAlign: 'center' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ display: 'flex', height: 48, borderRadius: 10, overflow: 'hidden', flex: 1, maxWidth: 300 }}>
                  {p.colors.map((c, ci) => <div key={ci} style={{ flex: 1, background: c }} />)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#e8e4df', fontSize: 15, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{p.name}</h4>
                  <p style={{ color: '#5a5248', fontSize: 12 }}>{p.uses} designs this week</p>
                </div>
                <button style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#6a6258'
                }}>Use in Design</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
