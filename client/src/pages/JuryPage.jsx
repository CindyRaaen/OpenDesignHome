import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star, MessageSquare } from 'lucide-react'

const CRITERIA = ['Cohesion', 'Creativity', 'Use of Space', 'Palette']

const MATCHUPS = [
  {
    id: 'm1',
    brief: "Maya's Portland Bungalow",
    designs: [
      {
        id: 'd1', designer: 'Studio Nora', rank: 'Studio Pro',
        palette: ['#E8D5B7','#8B4513','#2C3E50','#D4A574','#F5F0E8'],
        materials: ['White Oak', 'Belgian Linen', 'Brushed Brass'],
        items: 7, concept: 'Warm Minimal',
        notes: "I wanted the hardwoods to do the talking — everything else supports the warmth of the original floors.",
      },
      {
        id: 'd2', designer: 'Kai Studio', rank: 'Member',
        palette: ['#C1440E','#E8C07D','#2F4F4F','#F4ECD8','#8B6F47'],
        materials: ['Walnut', 'Leather Saddle', 'Matte Black'],
        items: 9, concept: 'Desert Modern',
        notes: "Terracotta and walnut create a desert warmth that still feels Pacific Northwest.",
      },
    ]
  },
  {
    id: 'm2',
    brief: "The Silverlake Loft",
    designs: [
      {
        id: 'd3', designer: 'Atelier M', rank: 'Senior',
        palette: ['#8B8B8B','#E8D5B7','#2C2C2C','#C8AA78','#F0EDE8'],
        materials: ['Soapstone', 'Boucle', 'Oil-Rubbed Bronze'],
        items: 11, concept: 'Soft Industrial',
        notes: "The concrete wants contrast — boucle and warm metals soften without hiding the bones.",
      },
      {
        id: 'd4', designer: 'Lin Works', rank: 'Member',
        palette: ['#2B2B2B','#D4C5A9','#5B7553','#F5F0E8','#8B7355'],
        materials: ['Maple', 'Zellige', 'Brushed Brass'],
        items: 8, concept: 'Japandi Loft',
        notes: "Japanese restraint meets California light. Every piece earns its place.",
      },
    ]
  }
]

export default function JuryPage() {
  const [matchIndex, setMatchIndex] = useState(0)
  const [scores, setScores] = useState({}) // { designId: { criterion: score } }
  const [votedPairs, setVotedPairs] = useState([])

  const match = MATCHUPS[matchIndex % MATCHUPS.length]

  const setScore = (designId, criterion, value) => {
    setScores(prev => ({
      ...prev,
      [designId]: { ...(prev[designId] || {}), [criterion]: value }
    }))
  }

  const allScored = match.designs.every(d =>
    CRITERIA.every(c => scores[d.id]?.[c] > 0)
  )

  const handleSubmitVote = () => {
    setVotedPairs([...votedPairs, match.id])
    setScores({})
    setMatchIndex(matchIndex + 1)
  }

  const StarRating = ({ designId, criterion }) => {
    const current = scores[designId]?.[criterion] || 0
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => setScore(designId, criterion, s)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: s <= current ? '#c8aa78' : '#2a2620', transition: 'color 0.1s'
          }}>
            <Star size={16} fill={s <= current ? '#c8aa78' : 'none'} />
          </button>
        ))}
      </div>
    )
  }

  const DesignCard = ({ design }) => (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, overflow: 'hidden'
    }}>
      {/* Palette strip */}
      <div style={{ display: 'flex', height: 6 }}>
        {design.palette.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
      </div>

      {/* Room preview placeholder */}
      <div style={{ height: 200, background: `linear-gradient(135deg, ${design.palette[0]}20, ${design.palette[2]}15)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#5a5248', fontSize: 12 }}>{design.items} items placed</p>
        <p style={{ color: '#3a3630', fontSize: 11 }}>{design.concept}</p>
      </div>

      <div style={{ padding: 24 }}>
        {/* Designer info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ color: '#e8e4df', fontSize: 14, fontWeight: 500 }}>{design.designer}</p>
            <p style={{ color: '#5a5248', fontSize: 11, textTransform: 'capitalize' }}>{design.rank}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {design.materials.map((m, i) => (
              <span key={i} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', color: '#6a6258' }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Designer notes */}
        {design.notes && (
          <div style={{ background: 'rgba(200,170,120,0.04)', borderLeft: '2px solid rgba(200,170,120,0.2)',
            padding: '10px 14px', borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
            <p style={{ color: '#8a8078', fontSize: 12, fontStyle: 'italic', lineHeight: 1.5 }}>"{design.notes}"</p>
          </div>
        )}

        {/* Criteria ratings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CRITERIA.map(c => (
            <div key={c} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#6a6258', fontSize: 12 }}>{c}</span>
              <StarRating designId={design.id} criterion={c} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '40px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <p style={{ color: '#6a6258', fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8, fontWeight: 500 }}>The Jury</p>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#f5f0e8', fontWeight: 400, marginBottom: 8 }}>Vote on Designs</h1>
            <p style={{ color: '#8a8078', fontSize: 15 }}>Rate each design on four criteria. Your votes shape the community.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#c8aa78', fontFamily: 'Georgia, serif', fontSize: 22 }}>{votedPairs.length}</div>
            <div style={{ color: '#5a5248', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Voted Today</div>
          </div>
        </div>

        {/* Brief context */}
        <p style={{ color: '#c8aa78', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>
          Brief: {match.brief}
        </p>

        {/* Side-by-side designs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {match.designs.map(d => <DesignCard key={d.id} design={d} />)}
        </div>

        {/* Submit vote */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={allScored ? handleSubmitVote : undefined} style={{
            padding: '14px 48px', borderRadius: 12, border: 'none', cursor: allScored ? 'pointer' : 'default',
            background: allScored ? 'rgba(200,170,120,0.2)' : 'rgba(255,255,255,0.03)',
            color: allScored ? '#c8aa78' : '#3a3630', fontSize: 15, fontWeight: 500,
            fontFamily: 'Georgia, serif', transition: 'all 0.2s'
          }}>
            {allScored ? 'Submit Votes & Next Pair' : 'Rate all criteria to continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
