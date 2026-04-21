import { useState } from 'react'
import { Clock, Users, ChevronRight, Armchair, Lamp, Bath, UtensilsCrossed, Star, Lock } from 'lucide-react'

const ROOM_TYPES = ['All', 'Living Room', 'Bedroom', 'Kitchen', 'Dining', 'Bath', 'Office']
const DIFFICULTY = { member: 1, 'studio-pro': 2, senior: 3, principal: 4, fellow: 5 }

const BRIEFS = [
  {
    id: 101, title: "Maya's Portland Bungalow", client: 'Maya Chen',
    story: "A ceramicist who just bought a 1920s bungalow with original hardwoods and tons of natural light. She wants warmth without clutter — a space that feels like a deep breath.",
    room: 'Living Room', sqft: 320, difficulty: 'associate', timeLeft: '22h',
    entries: 47, constraints: ['Keep fireplace', 'Budget: Mid', 'No TV wall'],
    // Structured criteria the AI scoring engine evaluates against
    scoringCriteria: {
      mood: 'warm-minimal',           // desired emotional register
      maxItems: 8,                     // "without clutter" — penalize over-furnishing
      requiredTypes: ['Seating', 'Lighting'],  // minimum functional furniture
      forbiddenTypes: [],
      preferNaturalMaterials: true,    // ceramicist → artisan sensibility
      colorTemperature: 'warm',        // "warmth" — penalize cool-dominant palettes
      budgetTier: 'mid',               // mid budget → no ultra-luxury pieces
      requirePlant: true,              // natural light + bungalow = plants expected
      symmetryPreference: 'asymmetric', // "deep breath" → organic, not rigid
    },
    concepts: [
      { name: 'Warm Minimal', colors: ['#E8D5B7','#8B4513','#2C3E50','#D4A574','#F5F0E8'] },
      { name: 'Nordic Craft', colors: ['#E8E4DE','#5B7553','#2B2B2B','#C1A882','#FEFEFE'] },
      { name: 'Desert Modern', colors: ['#C1440E','#E8C07D','#2F4F4F','#F4ECD8','#8B6F47'] },
    ],
  },
  {
    id: 102, title: "The Silverlake Loft", client: 'James & Priya Okonkwo',
    story: "A couple who just moved from NYC. They have an open-plan loft with concrete floors and steel beams. They want California warmth layered onto the industrial bones.",
    room: 'Open Plan', sqft: 680, difficulty: 'senior', timeLeft: '14h',
    entries: 31, constraints: ['Open plan', 'Budget: High', 'Must seat 8 for dinner'],
    scoringCriteria: {
      mood: 'warm-industrial',
      maxItems: 14,                    // large open plan can handle more
      minItems: 8,                     // 680 sqft needs substance
      requiredTypes: ['Seating', 'Table', 'Lighting'],
      forbiddenTypes: [],
      minSeating: 8,                   // "must seat 8 for dinner"
      preferNaturalMaterials: true,    // "California warmth"
      colorTemperature: 'warm',        // "warmth layered onto industrial"
      budgetTier: 'high',
      requireTextile: true,            // softness to counter concrete/steel
      symmetryPreference: 'balanced',
    },
    concepts: [
      { name: 'Soft Industrial', colors: ['#8B8B8B','#E8D5B7','#2C2C2C','#C8AA78','#F0EDE8'] },
      { name: 'California Modern', colors: ['#87CEEB','#F5DEB3','#2F4F4F','#E8E4DE','#C1440E'] },
      { name: 'Japandi Loft', colors: ['#2B2B2B','#D4C5A9','#5B7553','#F5F0E8','#8B7355'] },
    ],
  },
  {
    id: 103, title: "Chelsea Pied-à-Terre", client: 'Dr. Evelyn Osei',
    story: "A surgeon who wants a serene retreat in her small Manhattan apartment. She travels constantly and collects textiles from West Africa. The space should feel curated, not decorated.",
    room: 'Bedroom', sqft: 180, difficulty: 'member', timeLeft: '36h',
    entries: 62, constraints: ['Queen bed required', 'Budget: Mid', 'Display textile collection'],
    scoringCriteria: {
      mood: 'serene-curated',
      maxItems: 6,                     // 180 sqft — "curated, not decorated"
      requiredTypes: ['Seating', 'Textile', 'Art'], // textile collection + curated
      forbiddenTypes: [],
      requireTextile: true,            // "collects textiles from West Africa"
      requireArt: true,                // "curated" implies displayed objects
      colorTemperature: 'neutral',     // "serene retreat"
      budgetTier: 'mid',
      symmetryPreference: 'asymmetric', // curated = intentional asymmetry
      preferNaturalMaterials: true,
    },
    concepts: [
      { name: 'Collected Calm', colors: ['#2C3E50','#C1440E','#E8D5B7','#1a1a2e','#D4A574'] },
      { name: 'Gallery Sleep', colors: ['#FEFEFE','#2B2B2B','#8B6F47','#E8E4DE','#5B7553'] },
      { name: 'Indigo Night', colors: ['#1B3A5C','#E8C07D','#2B2B2B','#C8AA78','#F5F0E8'] },
    ],
  },
  {
    id: 104, title: "Napa Valley Kitchen", client: 'The Reyes Family',
    story: "A family of four who loves cooking together. The kitchen is the heart of their home — they want it to feel like a European farmhouse but with modern function.",
    room: 'Kitchen', sqft: 240, difficulty: 'studio-pro', timeLeft: '8h',
    entries: 19, constraints: ['Island seating for 4', 'Budget: High', 'Open to dining room'],
    scoringCriteria: {
      mood: 'farmhouse-modern',
      maxItems: 10,
      minItems: 5,
      requiredTypes: ['Seating', 'Table', 'Lighting'],
      forbiddenTypes: [],
      minSeating: 4,                   // "island seating for 4"
      colorTemperature: 'warm',        // farmhouse warmth
      budgetTier: 'high',
      preferNaturalMaterials: true,    // European farmhouse = natural wood/stone
      requirePlant: false,
      symmetryPreference: 'balanced',  // family kitchen = functional balance
    },
    concepts: [
      { name: 'French Country', colors: ['#5B7553','#E8D5B7','#8B4513','#F5F0E8','#C8AA78'] },
      { name: 'Modern Rustic', colors: ['#2B2B2B','#D4C5A9','#C1440E','#E8E4DE','#8B7355'] },
      { name: 'Tuscan Light', colors: ['#C1440E','#F4ECD8','#5B7553','#E8C07D','#2F4F4F'] },
    ],
  },
  {
    id: 105, title: "Principal's Suite", client: 'Confidential',
    story: "An ultra-luxury primary suite for a hospitality executive. Full creative freedom — impress the client.",
    room: 'Bedroom', sqft: 520, difficulty: 'fellow', timeLeft: '48h',
    entries: 8, constraints: ['Budget: Unlimited', 'Ensuite visible', 'Fireplace wall'],
    scoringCriteria: {
      mood: 'ultra-luxury',
      maxItems: 12,
      minItems: 6,
      requiredTypes: ['Seating', 'Lighting', 'Art', 'Textile'],
      forbiddenTypes: [],
      colorTemperature: 'any',         // full creative freedom
      budgetTier: 'unlimited',
      preferNaturalMaterials: false,   // luxury can be anything
      requireArt: true,                // luxury suite needs art
      requireTextile: true,            // needs layers of luxury
      symmetryPreference: 'any',
    },
    concepts: [],
    locked: true
  },
]

export default function BriefsPage({ setPage, setActiveChallenge }) {
  const [filter, setFilter] = useState('All')
  const [expandedBrief, setExpandedBrief] = useState(null)

  const filtered = filter === 'All' ? BRIEFS : BRIEFS.filter(b => b.room === filter || b.room === 'Open Plan')

  const DifficultyDots = ({ level }) => (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i <= DIFFICULTY[level] ? '#c8aa78' : 'rgba(255,255,255,0.08)'
        }} />
      ))}
    </div>
  )

  const handleStart = (brief) => {
    if (brief.locked) return
    if (setActiveChallenge) setActiveChallenge(brief)
    setPage('challenge-flow')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '40px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <p style={{ color: '#6a6258', fontSize: 13, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8, fontWeight: 500 }}>Design Briefs</p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#f5f0e8', fontWeight: 400, marginBottom: 8 }}>Choose Your Project</h1>
        <p style={{ color: '#8a8078', fontSize: 15, marginBottom: 32 }}>Each brief is a real client with a real story. Read carefully — the constraints are where creativity starts.</p>

        {/* Room Type Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40, flexWrap: 'wrap' }}>
          {ROOM_TYPES.map(r => (
            <button key={r} onClick={() => setFilter(r)} style={{
              padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontWeight: 500,
              border: filter === r ? '1px solid rgba(200,170,120,0.4)' : '1px solid rgba(255,255,255,0.08)',
              background: filter === r ? 'rgba(200,170,120,0.12)' : 'rgba(255,255,255,0.03)',
              color: filter === r ? '#c8aa78' : '#6a6258', transition: 'all 0.2s'
            }}>{r}</button>
          ))}
        </div>

        {/* Brief Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(brief => (
            <div key={brief.id} style={{
              background: brief.locked ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${brief.locked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 16, overflow: 'hidden', opacity: brief.locked ? 0.5 : 1,
              transition: 'all 0.2s'
            }}>
              {/* Concept color strips */}
              {brief.concepts.length > 0 && (
                <div style={{ display: 'flex', height: 4 }}>
                  {brief.concepts[0].colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
                </div>
              )}
              <div style={{ padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: '#f5f0e8', fontWeight: 400 }}>{brief.title}</h3>
                      {brief.locked && <Lock size={14} style={{ color: '#5a5248' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#6a6258', fontSize: 12, marginBottom: 12 }}>
                      <span>{brief.room}</span>
                      <span>·</span>
                      <span>{brief.sqft} sq ft</span>
                      <span>·</span>
                      <DifficultyDots level={brief.difficulty} />
                      <span style={{ textTransform: 'capitalize' }}>{brief.difficulty}</span>
                    </div>
                    <p style={{ color: '#8a8078', fontSize: 14, lineHeight: 1.6, maxWidth: 640 }}>{brief.story}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, minWidth: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8a8078', fontSize: 12 }}>
                      <Clock size={13} /> {brief.timeLeft}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6a6258', fontSize: 12 }}>
                      <Users size={13} /> {brief.entries} entries
                    </div>
                  </div>
                </div>

                {/* Constraints */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  {brief.constraints.map((c, i) => (
                    <span key={i} style={{
                      fontSize: 11, padding: '4px 12px', borderRadius: 20,
                      background: 'rgba(255,255,255,0.04)', color: '#6a6258', letterSpacing: 0.5
                    }}>{c}</span>
                  ))}
                </div>

                {/* Concept Seeds */}
                {brief.concepts.length > 0 && (
                  <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                    {brief.concepts.map((concept, ci) => (
                      <div key={ci} style={{
                        flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 10, padding: 12, cursor: 'pointer'
                      }}>
                        <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                          {concept.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
                        </div>
                        <p style={{ fontSize: 12, color: '#8a8078', textAlign: 'center' }}>{concept.name}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Start Button */}
                {!brief.locked && (
                  <button onClick={() => handleStart(brief)} style={{
                    marginTop: 20, width: '100%', padding: '14px', borderRadius: 12,
                    background: 'rgba(200,170,120,0.1)', border: '1px solid rgba(200,170,120,0.25)',
                    color: '#c8aa78', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s'
                  }}>
                    Begin Design <ChevronRight size={16} />
                  </button>
                )}
                {brief.locked && (
                  <p style={{ marginTop: 16, color: '#4a4238', fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                    Reach Fellow rank to unlock this brief
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
