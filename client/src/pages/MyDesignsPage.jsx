import { useState } from 'react'
import { ArrowRight, Clock, Palette, Star, Filter, ChevronRight, Eye, Trash2 } from 'lucide-react'
import { SEED_DESIGNS, formatTimeAgo } from '../utils/SeedData'

const PHASE_LABELS = ['Brief', 'Palette', 'Room Plan', 'Elevations', 'Furniture', '3D Preview', 'Submit']
const FILTER_OPTIONS = ['All', 'In Progress', 'Nearly Done', 'Just Started']

export default function MyDesignsPage({ setPage, setActiveChallenge }) {
  const [filter, setFilter] = useState('All')
  const [sortBy, setSortBy] = useState('recent') // recent | progress | name
  const [expandedId, setExpandedId] = useState(null)

  const handleResume = (design) => {
    if (setActiveChallenge) setActiveChallenge(design)
    setPage('challenge-flow')
  }

  // Filter
  let designs = [...SEED_DESIGNS]
  if (filter === 'In Progress') designs = designs.filter(d => d.phase >= 2 && d.phase <= 4)
  if (filter === 'Nearly Done') designs = designs.filter(d => d.phase >= 5)
  if (filter === 'Just Started') designs = designs.filter(d => d.phase <= 1)

  // Sort
  if (sortBy === 'recent') designs.sort((a, b) => b.savedAt - a.savedAt)
  if (sortBy === 'progress') designs.sort((a, b) => b.phase - a.phase)
  if (sortBy === 'name') designs.sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setPage('studio')} style={{
              background: 'transparent', border: 'none', color: '#5a5248', cursor: 'pointer', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ← Studio
            </button>
          </div>
          <h1 style={{ color: '#f5f0e8', fontSize: 28, fontFamily: 'Georgia, serif', marginBottom: 6 }}>My Designs</h1>
          <p style={{ color: '#6a6258', fontSize: 14 }}>
            {SEED_DESIGNS.length} designs in progress · Resume any design right where you left off
          </p>
        </div>

        {/* Filters + Sort */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {FILTER_OPTIONS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: filter === f ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.03)',
                color: filter === f ? '#c8aa78' : '#6a6258',
                transition: 'all 0.2s',
              }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#5a5248', fontSize: 11 }}>Sort:</span>
            {[['recent', 'Recent'], ['progress', 'Progress'], ['name', 'Name']].map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)} style={{
                padding: '4px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 11,
                background: sortBy === val ? 'rgba(200,170,120,0.1)' : 'transparent',
                color: sortBy === val ? '#c8aa78' : '#5a5248',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Design cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {designs.map((design, di) => {
            const progress = Math.round((design.phase / 6) * 100)
            const isExpanded = expandedId === design.id
            const itemCount = design.state.placedItems.length
            const materialCount = design.state.selectedMaterials.length

            return (
              <div key={design.id} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16, overflow: 'hidden', transition: 'all 0.3s',
                animation: `fadeIn 0.3s ease ${di * 0.05}s both`,
              }}>
                {/* Main card content */}
                <div style={{ padding: 24, cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : design.id)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 12, background: 'rgba(200,170,120,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
                    }}>
                      {design.thumbnail}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ color: '#f5f0e8', fontSize: 17, fontFamily: 'Georgia, serif', margin: 0 }}>{design.title}</h3>
                        {design.phase >= 5 && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 8, fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                            background: 'rgba(200,170,120,0.2)', color: '#c8aa78', letterSpacing: 1,
                          }}>Ready to submit</span>
                        )}
                      </div>
                      <div style={{ color: '#6a6258', fontSize: 13, marginBottom: 8 }}>
                        {design.client} · {design.room} · Saved {formatTimeAgo(design.savedAt)}
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, maxWidth: 300 }}>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${progress}%`,
                              background: progress >= 80 ? 'linear-gradient(90deg, #c8aa78, #7da870)' : 'linear-gradient(90deg, #c8aa78, #d4a574)',
                              borderRadius: 3, transition: 'width 0.5s',
                            }} />
                          </div>
                        </div>
                        <span style={{ color: '#8a8078', fontSize: 11, fontFamily: 'monospace', minWidth: 40 }}>
                          {progress}%
                        </span>
                        <span style={{ color: '#5a5248', fontSize: 11 }}>
                          Phase {design.phase}/6 — {design.phaseLabel}
                        </span>
                      </div>
                    </div>

                    {/* Resume button */}
                    <button onClick={(e) => { e.stopPropagation(); handleResume(design) }} style={{
                      padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: design.phase >= 5 ? 'rgba(125,168,112,0.2)' : 'rgba(200,170,120,0.15)',
                      color: design.phase >= 5 ? '#7da870' : '#c8aa78',
                      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s',
                    }}>
                      <ArrowRight size={16} />
                      {design.phase >= 5 ? 'Review & Submit' : design.phase === 0 ? 'Start Design' : 'Resume'}
                    </button>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.06)', padding: 24,
                    background: 'rgba(255,255,255,0.01)',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                      {/* Brief preview */}
                      <div>
                        <div style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Brief</div>
                        <p style={{ color: '#8a8078', fontSize: 12, lineHeight: 1.5, margin: 0 }}>{design.story}</p>
                        {design.brief.constraints && (
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {design.brief.constraints.map((c, ci) => (
                              <span key={ci} style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 10,
                                background: 'rgba(255,255,255,0.04)', color: '#6a6258',
                              }}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Palette + Materials */}
                      <div>
                        <div style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Palette & Materials</div>
                        {design.state.palette.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                            {design.state.palette.map((c, ci) => (
                              <div key={ci} style={{
                                width: 28, height: 28, borderRadius: 6, background: c,
                                border: '1px solid rgba(255,255,255,0.1)',
                              }} title={c} />
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: '#5a5248', fontSize: 12, fontStyle: 'italic' }}>Not yet chosen</p>
                        )}
                        {materialCount > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {design.state.selectedMaterials.map(m => (
                              <span key={m.id} style={{
                                padding: '3px 8px', borderRadius: 6, fontSize: 10,
                                background: 'rgba(255,255,255,0.04)', color: '#8a8078',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                                {m.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Design stats */}
                      <div>
                        <div style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Status</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#6a6258' }}>Concept</span>
                            <span style={{ color: design.state.selectedConcept ? '#c8aa78' : '#3a3630' }}>
                              {design.state.selectedConcept?.name || '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#6a6258' }}>Mode</span>
                            <span style={{ color: design.state.designMode ? '#c8aa78' : '#3a3630' }}>
                              {design.state.designMode ? design.state.designMode.charAt(0).toUpperCase() + design.state.designMode.slice(1) : '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#6a6258' }}>Furniture</span>
                            <span style={{ color: itemCount > 0 ? '#c8aa78' : '#3a3630' }}>
                              {itemCount > 0 ? `${itemCount} placed` : '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#6a6258' }}>Time Left</span>
                            <span style={{ color: design.state.competitionSeconds < 600 ? '#e05050' : '#c8aa78', fontFamily: 'monospace' }}>
                              {Math.floor(design.state.competitionSeconds / 60)}:{(design.state.competitionSeconds % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#6a6258' }}>Time of Day</span>
                            <span style={{ color: '#8a8078' }}>
                              {design.state.timeOfDay === 'day' ? '☀️ Day' : design.state.timeOfDay === 'night' ? '🌙 Night' : '🌅 Sunset'}
                            </span>
                          </div>
                        </div>
                        {design.state.designNotes && (
                          <div style={{ marginTop: 10, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ color: '#5a5248', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Notes</div>
                            <p style={{ color: '#8a8078', fontSize: 11, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>
                              "{design.state.designNotes}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phase timeline */}
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 0 }}>
                      {PHASE_LABELS.map((label, pi) => (
                        <div key={pi} style={{ display: 'flex', alignItems: 'center', flex: pi < 6 ? 1 : 0 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: pi < design.phase ? 'rgba(200,170,120,0.2)' : pi === design.phase ? 'rgba(200,170,120,0.3)' : 'rgba(255,255,255,0.04)',
                            border: pi === design.phase ? '2px solid #c8aa78' : '1px solid rgba(255,255,255,0.08)',
                            fontSize: 10, fontWeight: 600,
                            color: pi <= design.phase ? '#c8aa78' : '#3a3630',
                          }}>
                            {pi < design.phase ? '✓' : pi + 1}
                          </div>
                          <div style={{
                            position: 'absolute', top: -14, left: -8,
                            color: pi === design.phase ? '#c8aa78' : '#5a5248',
                            fontSize: 8, whiteSpace: 'nowrap', marginTop: 30,
                          }} />
                          {pi < 6 && (
                            <div style={{
                              flex: 1, height: 2, marginLeft: 2, marginRight: 2,
                              background: pi < design.phase ? '#c8aa78' : 'rgba(255,255,255,0.06)',
                            }} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingRight: 0 }}>
                      {PHASE_LABELS.map((label, pi) => (
                        <span key={pi} style={{
                          fontSize: 8, color: pi === design.phase ? '#c8aa78' : '#3a3630',
                          textAlign: 'center', width: pi < 6 ? `${100/7}%` : 'auto',
                        }}>{label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {designs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#5a5248', fontSize: 14 }}>No designs match this filter.</p>
            <button onClick={() => setFilter('All')} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', background: 'rgba(200,170,120,0.15)',
              color: '#c8aa78', fontSize: 13, cursor: 'pointer', marginTop: 12,
            }}>Show All</button>
          </div>
        )}
      </div>
    </div>
  )
}
