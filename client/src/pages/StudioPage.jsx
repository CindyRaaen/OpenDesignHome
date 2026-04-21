import { useState, useEffect } from 'react'
import { Clock, ArrowRight, Palette, Star, TrendingUp, Sparkles, Award, Eye, ChevronRight, Zap } from 'lucide-react'
import { JUDGES } from '../utils/ScoringEngine'
import { walletManager, ENTRY_TIERS } from '../utils/WalletEngine'
import { getAvailableRounds, getLeaderboard, generateActivityItem, getSeasonTier, SEASON_TIERS } from '../utils/MatchmakingEngine'
import { SEED_DESIGNS, formatTimeAgo } from '../utils/SeedData'

// ═══════════════════════════════════════════════════════════
// COMPETITION DASHBOARD — The eBay of Design Competitions
// ═══════════════════════════════════════════════════════════

// Player profile (mirrors ChallengeFlow)
const PLAYER = {
  handle: '@DesignDreamer', avatar: '🎨', city: 'San Francisco',
  rank: { city: 14, state: 89, national: 2340 },
  stats: { wins: 12, losses: 8, streak: 3, bestStreak: 7, totalDesigns: 24, seasonPoints: 1840 },
  tier: 'member',
}

// LIVE rounds you're competing in right now
const LIVE_ROUNDS = [
  {
    id: 'r1', title: "Maya's Portland Bungalow", room: 'Living Room',
    format: 'Weekly Showdown', tier: 'State', tierIcon: '🗺️',
    phase: 3, phaseName: 'Elevations', totalPhases: 7,
    secondsLeft: 2172, // ~36 min
    poolSize: 8, prizePool: '$240',
    yourScore: 72, topScore: 84, yourRank: 3,
    judgeScores: [
      { judgeId: 'margaux', score: 78 }, { judgeId: 'dex', score: 68 },
      { judgeId: 'yuki', score: 74 }, { judgeId: 'ava', score: 71 },
      { judgeId: 'rio', score: 69 }, { judgeId: 'algo', score: 73 },
    ],
    opponents: [
      { handle: '@QuietLuxCA', score: 84, avatar: '🕯️' },
      { handle: '@NordicNest', score: 79, avatar: '❄️' },
      { handle: '@DesignDreamer', score: 72, avatar: '🎨', isYou: true },
      { handle: '@MidCenturyMaven', score: 65, avatar: '🪑' },
    ],
  },
  {
    id: 'r2', title: 'The Silverlake Loft', room: 'Open Plan Studio',
    format: 'Flash Round', tier: 'City', tierIcon: '🏙️',
    phase: 1, phaseName: 'Palette', totalPhases: 7,
    secondsLeft: 892,
    poolSize: 4, prizePool: '$80',
    yourScore: 0, topScore: 0, yourRank: null,
    judgeScores: [],
    opponents: [
      { handle: '@BohoSoulSF', score: 0, avatar: '🌿' },
      { handle: '@DesignDreamer', score: 0, avatar: '🎨', isYou: true },
      { handle: '@PacificHeightsStyle', score: 0, avatar: '✨' },
      { handle: '@TheMaximalist', score: 0, avatar: '💎' },
    ],
  },
]

// Rival activity feed — the "watching" dopamine
const ACTIVITY_FEED = [
  { id: 1, time: '2m ago', text: '@QuietLuxCA scored 84 in Portland Bungalow', icon: '🔥', type: 'score' },
  { id: 2, time: '5m ago', text: '@NordicNest submitted their Silverlake design', icon: '✅', type: 'submit' },
  { id: 3, time: '12m ago', text: 'Margaux gave @MidCenturyMaven a 91 on color!', icon: '🤍', type: 'judge' },
  { id: 4, time: '18m ago', text: 'New Flash Round opens in 22 minutes', icon: '⚡', type: 'event' },
  { id: 5, time: '25m ago', text: 'You moved up to #14 in San Francisco', icon: '📈', type: 'rank' },
  { id: 6, time: '31m ago', text: '@DesertModernist entered the State Showdown', icon: '🌵', type: 'join' },
  { id: 7, time: '45m ago', text: 'Prize pool for National Open hit $12,400', icon: '💰', type: 'prize' },
  { id: 8, time: '1h ago', text: '@BohoSoulSF broke a 5-round win streak!', icon: '🌿', type: 'streak' },
]

// Upcoming rounds you can enter
const UPCOMING = [
  { id: 'u1', title: 'Napa Wine Country Estate', format: 'State Showdown', tier: 'State', opens: '22m', entryFee: '$30', prizePool: '$1,200', spots: '6/8 filled', hot: true },
  { id: 'u2', title: 'Brooklyn Industrial Conversion', format: 'National Open', tier: 'National', opens: '2h 14m', entryFee: '$50', prizePool: '$8,500', spots: '89/128 filled', hot: false },
  { id: 'u3', title: 'Tokyo Minimalist Apartment', format: 'Global Championship Qualifier', tier: 'Global', opens: '6h', entryFee: '$100', prizePool: '$45,000', spots: '312/512 filled', hot: false },
]

// Recent results
const RECENT_RESULTS = [
  { id: 'rr1', title: 'Austin Hill Country Ranch', format: 'City Showdown', place: 1, prize: '$60', yourScore: 82, topJudge: 'Yuki Tanaka', topJudgeScore: 91, palette: ['#C8AA78','#5B3A1E','#E8D5B7','#5B7553','#F5F0E8'] },
  { id: 'rr2', title: 'SoHo Micro Studio', format: 'State Showdown', place: 3, prize: '200 coins', yourScore: 71, topJudge: 'Dex Washington', topJudgeScore: 79, palette: ['#2C3E50','#C1440E','#E8E4DE','#1a1a1a','#E8C07D'] },
  { id: 'rr3', title: 'Seattle Craftsman Revival', format: 'Weekly Showdown', place: 2, prize: '$40', yourScore: 77, topJudge: 'Ava Thornton', topJudgeScore: 85, palette: ['#E8E4DE','#5B7553','#8B4513','#C8AA78','#2B2B2B'] },
]

export default function StudioPage({ setPage, setActiveChallenge }) {
  const [timers, setTimers] = useState(LIVE_ROUNDS.map(r => r.secondsLeft))
  const [feedVisible, setFeedVisible] = useState(5) // how many feed items to show
  const [greeting, setGreeting] = useState('')
  const [walletBalance, setWalletBalance] = useState(walletManager.balance)
  const [walletSummary, setWalletSummary] = useState(walletManager.getSummary())
  const [availableRounds, setAvailableRounds] = useState(() => getAvailableRounds())
  const [liveFeed, setLiveFeed] = useState(ACTIVITY_FEED)
  const [seasonInfo, setSeasonInfo] = useState(() => getSeasonTier(PLAYER.stats.seasonPoints))

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  // Subscribe to wallet updates
  useEffect(() => {
    return walletManager.subscribe(w => {
      setWalletBalance(w.balance)
      setWalletSummary(walletManager.getSummary())
    })
  }, [])

  // Generate live activity feed items from MatchmakingEngine
  useEffect(() => {
    const interval = setInterval(() => {
      const newItem = generateActivityItem()
      setLiveFeed(prev => [
        { id: newItem.id, time: 'just now', text: newItem.text, icon: '⚡', type: 'live' },
        ...prev.slice(0, 11)
      ])
    }, 4000 + Math.random() * 6000)
    return () => clearInterval(interval)
  }, [])

  // Tick all live round timers
  useEffect(() => {
    const tick = setInterval(() => {
      setTimers(prev => prev.map(t => Math.max(0, t - 1)))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  const fmt = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleResume = (round) => {
    if (setActiveChallenge) setActiveChallenge(round)
    setPage('challenge-flow')
  }

  const urgent = (secs) => secs < 300
  const warning = (secs) => secs < 600 && !urgent(secs)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      {/* ─── TOP STATS BAR ─── */}
      <div style={{
        background: '#0e0e0e', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{PLAYER.avatar}</span>
            <div>
              <span style={{ color: '#f5f0e8', fontSize: 14, fontWeight: 600 }}>{PLAYER.handle}</span>
              <div style={{ color: '#5a5248', fontSize: 10 }}>{PLAYER.city} · {seasonInfo.name}</div>
            </div>
          </div>
          {/* Stat pills */}
          {[
            { label: 'W-L', value: `${PLAYER.stats.wins}-${PLAYER.stats.losses}`, color: '#c8aa78' },
            { label: 'Streak', value: `${PLAYER.stats.streak}🔥`, color: '#e0a050' },
            { label: 'City', value: `#${PLAYER.rank.city}`, color: '#87CEEB' },
            { label: 'State', value: `#${PLAYER.rank.state}`, color: '#7BAF6E' },
            { label: 'Season Pts', value: PLAYER.stats.seasonPoints.toLocaleString(), color: '#c8aa78' },
            { label: 'Wallet', value: `$${walletBalance.toFixed(2)}`, color: '#27AE60' },
            { label: 'Won', value: `$${walletSummary.totalWon.toFixed(0)}`, color: '#F1C40F' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              <span style={{ color: s.color, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5a5248', fontSize: 11 }}>
          <span style={{ color: '#4a4640', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Part of the OpenScaffold ecosystem</span>
        </div>
      </div>

      {/* ─── MAIN DASHBOARD GRID ─── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>

        {/* LEFT COLUMN — Live rounds + upcoming + results */}
        <div>
          {/* Section: LIVE NOW */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e05050', boxShadow: '0 0 8px rgba(224,80,80,0.6)', animation: 'pulse 2s infinite' }} />
              <h2 style={{ color: '#f5f0e8', fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>Live Now</h2>
              <span style={{ color: '#5a5248', fontSize: 12 }}>{LIVE_ROUNDS.length} active round{LIVE_ROUNDS.length !== 1 ? 's' : ''}</span>
            </div>

            {LIVE_ROUNDS.map((round, ri) => {
              const secs = timers[ri]
              const isUrgent = urgent(secs)
              const isWarn = warning(secs)
              return (
                <div key={round.id} style={{
                  background: isUrgent ? 'rgba(200,60,60,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isUrgent ? 'rgba(200,60,60,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 16, padding: 24, marginBottom: 16,
                  transition: 'all 0.3s',
                }}>
                  {/* Round header: title + timer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{round.tierIcon}</span>
                        <span style={{ color: '#8a8078', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>{round.format} · {round.tier}</span>
                      </div>
                      <h3 style={{ color: '#f5f0e8', fontSize: 20, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{round.title}</h3>
                      <p style={{ color: '#5a5248', fontSize: 13 }}>{round.room} · Phase {round.phase}/{round.totalPhases} ({round.phaseName})</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        padding: '6px 16px', borderRadius: 20, fontFamily: 'monospace', fontSize: 18, fontWeight: 700,
                        background: isUrgent ? 'rgba(200,60,60,0.2)' : isWarn ? 'rgba(200,170,60,0.15)' : 'rgba(200,170,120,0.1)',
                        color: isUrgent ? '#e05050' : isWarn ? '#d4a840' : '#c8aa78',
                        border: `1px solid ${isUrgent ? 'rgba(200,60,60,0.3)' : 'rgba(200,170,120,0.15)'}`,
                      }}>⏱ {fmt(secs)}</div>
                      <div style={{ color: '#5a5248', fontSize: 10, marginTop: 4 }}>{round.poolSize} designers · {round.prizePool}</div>
                    </div>
                  </div>

                  {/* Leaderboard strip + judge scores side by side */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    {/* Mini leaderboard */}
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12 }}>
                      <div style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Standings</div>
                      {round.opponents.map((opp, oi) => (
                        <div key={oi} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '5px 8px', borderRadius: 6, marginBottom: 2,
                          background: opp.isYou ? 'rgba(200,170,120,0.08)' : 'transparent',
                          border: opp.isYou ? '1px solid rgba(200,170,120,0.15)' : '1px solid transparent',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#5a5248', fontSize: 11, fontFamily: 'monospace', width: 18 }}>{oi + 1}.</span>
                            <span style={{ fontSize: 13 }}>{opp.avatar}</span>
                            <span style={{ color: opp.isYou ? '#c8aa78' : '#8a8078', fontSize: 12, fontWeight: opp.isYou ? 600 : 400 }}>
                              {opp.handle}{opp.isYou ? ' (you)' : ''}
                            </span>
                          </div>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                            color: opp.score >= 80 ? '#7da870' : opp.score >= 60 ? '#c8aa78' : '#5a5248',
                          }}>{opp.score || '—'}</span>
                        </div>
                      ))}
                    </div>

                    {/* Judge scores (only if you have scores) */}
                    {round.judgeScores.length > 0 && (
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 12 }}>
                        <div style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Your Judges</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          {round.judgeScores.map(js => {
                            const judge = JUDGES.find(j => j.id === js.judgeId)
                            if (!judge) return null
                            const reaction = js.score >= 85 ? '😍' : js.score >= 75 ? '😊' : js.score >= 60 ? '🤔' : '😐'
                            return (
                              <div key={js.judgeId} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6,
                                background: 'rgba(255,255,255,0.02)',
                              }}>
                                <span style={{ fontSize: 14 }}>{judge.avatar}</span>
                                <span style={{ color: '#6a6258', fontSize: 10, flex: 1 }}>{judge.name.split(' ')[0]}</span>
                                <span style={{ fontSize: 10 }}>{reaction}</span>
                                <span style={{
                                  fontFamily: 'monospace', fontSize: 12, fontWeight: 600,
                                  color: js.score >= 80 ? '#7da870' : js.score >= 60 ? '#c8aa78' : '#c06050',
                                }}>{js.score}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resume button */}
                  <button onClick={() => handleResume(round)} style={{
                    width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                    background: isUrgent ? 'rgba(200,60,60,0.2)' : 'rgba(200,170,120,0.15)',
                    color: isUrgent ? '#e05050' : '#c8aa78',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}>
                    {isUrgent ? <Zap size={16} /> : <ArrowRight size={16} />}
                    {isUrgent ? 'HURRY — Resume Design' : 'Resume Design'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Section: MY DESIGNS (seed data — resumable in-progress designs) */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Palette size={16} color="#c8aa78" />
                <h2 style={{ color: '#c8aa78', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>My Designs</h2>
                <span style={{ color: '#5a5248', fontSize: 12 }}>{SEED_DESIGNS.length} in progress</span>
              </div>
              <button onClick={() => setPage('my-designs')} style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                color: '#8a8078', fontSize: 11, padding: '4px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                View All <ChevronRight size={12} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {SEED_DESIGNS.slice(0, 4).map(design => {
                const progress = Math.round((design.phase / 6) * 100)
                return (
                  <div key={design.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.2s',
                  }} onClick={() => handleResume(design)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{design.thumbnail}</span>
                        <div>
                          <div style={{ color: '#f5f0e8', fontSize: 14, fontWeight: 600 }}>{design.title}</div>
                          <div style={{ color: '#5a5248', fontSize: 11 }}>{design.client} · {design.room}</div>
                        </div>
                      </div>
                      <span style={{ color: '#5a5248', fontSize: 10 }}>{formatTimeAgo(design.savedAt)}</span>
                    </div>
                    {/* Phase progress bar */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#8a8078', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                          Phase {design.phase}/6 — {design.phaseLabel}
                        </span>
                        <span style={{ color: '#c8aa78', fontSize: 10, fontFamily: 'monospace' }}>{progress}%</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #c8aa78, #d4a574)', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                    {/* Palette preview */}
                    {design.state.palette.length > 0 && (
                      <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
                        {design.state.palette.slice(0, 5).map((c, ci) => (
                          <div key={ci} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                        ))}
                        {design.state.palette.length > 5 && <span style={{ color: '#5a5248', fontSize: 10, alignSelf: 'center' }}>+{design.state.palette.length - 5}</span>}
                      </div>
                    )}
                    {/* Resume button */}
                    <button onClick={(e) => { e.stopPropagation(); handleResume(design) }} style={{
                      width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                      background: design.phase >= 4 ? 'rgba(200,170,120,0.2)' : 'rgba(200,170,120,0.1)',
                      color: '#c8aa78', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <ArrowRight size={14} />
                      {design.phase >= 5 ? 'Review & Submit' : design.phase === 0 ? 'Start Design' : 'Resume Design'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section: UPCOMING ROUNDS */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles size={16} color="#c8aa78" />
              <h2 style={{ color: '#c8aa78', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>Upcoming Rounds</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
              {availableRounds.map(u => (
                <div key={u.id} style={{
                  background: u.hot ? 'rgba(200,170,120,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${u.hot ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 12, padding: 20, cursor: 'pointer',
                  transition: 'all 0.2s',
                }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(200,170,120,0.3)'}
                   onMouseOut={e => e.currentTarget.style.borderColor = u.hot ? 'rgba(200,170,120,0.15)' : 'rgba(255,255,255,0.05)'}
                   onClick={() => handleResume(u)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ color: '#f5f0e8', fontSize: 15, fontFamily: 'Georgia, serif', marginBottom: 4 }}>{u.challengeTitle}</h4>
                      <span style={{ color: '#5a5248', fontSize: 11 }}>{u.tier.label} · {u.durationMinutes}min</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {u.hot && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(224,160,80,0.15)', color: '#e0a050', fontWeight: 600 }}>HOT</span>}
                      <span style={{ fontSize: 14 }}>{u.tier.badge}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                    <div><span style={{ color: '#5a5248', fontSize: 10 }}>Starts</span><div style={{ color: '#c8aa78', fontSize: 13, fontWeight: 600 }}>{Math.ceil(u.startsIn / 60)}m</div></div>
                    <div><span style={{ color: '#5a5248', fontSize: 10 }}>Entry</span><div style={{ color: '#8a8078', fontSize: 13 }}>{u.tier.fee === 0 ? 'Free' : `$${u.tier.fee}`}</div></div>
                    <div><span style={{ color: '#5a5248', fontSize: 10 }}>Prize Pool</span><div style={{ color: '#7da870', fontSize: 13, fontWeight: 600 }}>${u.prizeInfo.pool.toFixed(0)}</div></div>
                    <div><span style={{ color: '#5a5248', fontSize: 10 }}>Rake</span><div style={{ color: '#5a5248', fontSize: 13 }}>{Math.round(u.tier.rake * 100)}%</div></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#5a5248', fontSize: 11 }}>{u.spotsLeft} spots left · {u.playersWaiting} waiting</span>
                    <span style={{
                      padding: '4px 12px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: walletBalance >= u.tier.fee ? 'rgba(39,174,96,0.15)' : 'rgba(200,60,60,0.15)',
                      color: walletBalance >= u.tier.fee ? '#27AE60' : '#c06050',
                      border: `1px solid ${walletBalance >= u.tier.fee ? 'rgba(39,174,96,0.2)' : 'rgba(200,60,60,0.2)'}`,
                    }}>
                      {walletBalance >= u.tier.fee ? 'Enter' : 'Need funds'} <ChevronRight size={12} style={{ verticalAlign: 'middle' }} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: RECENT RESULTS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Award size={16} color="#8a8078" />
              <h2 style={{ color: '#8a8078', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2 }}>Recent Results</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {RECENT_RESULTS.map(r => (
                <div key={r.id} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  {/* Palette strip */}
                  <div style={{ display: 'flex', height: 40 }}>
                    {r.palette.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <h4 style={{ color: '#e8e4df', fontSize: 14, fontFamily: 'Georgia, serif', marginBottom: 2 }}>{r.title}</h4>
                        <span style={{ color: '#5a5248', fontSize: 11 }}>{r.format}</span>
                      </div>
                      <div style={{
                        padding: '3px 10px', borderRadius: 12, fontWeight: 700, fontSize: 13,
                        background: r.place === 1 ? 'rgba(200,170,120,0.2)' : r.place <= 3 ? 'rgba(91,117,83,0.15)' : 'rgba(255,255,255,0.05)',
                        color: r.place === 1 ? '#c8aa78' : r.place <= 3 ? '#7da870' : '#5a5248',
                      }}>#{r.place}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#c8aa78', fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}>{r.yourScore}</span>
                        <span style={{ color: '#5a5248', fontSize: 11 }}>pts</span>
                      </div>
                      <span style={{ color: '#5a5248', fontSize: 11 }}>{r.prize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Activity feed + quick actions */}
        <div>
          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            <button onClick={() => setPage('briefs')} style={{
              width: '100%', padding: '14px 20px', borderRadius: 12,
              background: 'rgba(200,170,120,0.1)', border: '1px solid rgba(200,170,120,0.25)',
              color: '#c8aa78', fontSize: 14, cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Sparkles size={16} /> Enter New Round
            </button>
            <button onClick={() => setPage('portfolio')} style={{
              width: '100%', padding: '10px 20px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              color: '#8a8078', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Palette size={14} /> My Portfolio
            </button>
          </div>

          {/* Activity Feed */}
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 14, padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={14} color="#8a8078" />
                <span style={{ color: '#8a8078', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>Live Feed</span>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B7553', animation: 'pulse 2s infinite' }} />
            </div>
            {liveFeed.slice(0, feedVisible).map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', gap: 10, padding: '10px 0',
                borderBottom: i < feedVisible - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                animation: `slideIn 0.3s ease ${i * 0.05}s both`,
              }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#c8b89a', fontSize: 12, lineHeight: 1.5, marginBottom: 2 }}>{item.text}</p>
                  <span style={{ color: '#3a3630', fontSize: 10 }}>{item.time}</span>
                </div>
              </div>
            ))}
            {feedVisible < liveFeed.length && (
              <button onClick={() => setFeedVisible(prev => Math.min(prev + 3, liveFeed.length))} style={{
                width: '100%', padding: '10px 0', marginTop: 8, borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                color: '#5a5248', fontSize: 11, cursor: 'pointer',
              }}>
                Show more activity
              </button>
            )}
          </div>

          {/* Season Progress */}
          <div style={{
            marginTop: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 14, padding: 20,
          }}>
            <div style={{ color: '#5a5248', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Season 4 Progress</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ color: seasonInfo.color, fontFamily: 'Georgia, serif', fontSize: 22 }}>{seasonInfo.name}</span>
              <span style={{ color: '#5a5248', fontSize: 11 }}>
                {seasonInfo.points.toLocaleString()}{seasonInfo.nextTier ? ` / ${seasonInfo.nextTier.minPts.toLocaleString()} pts` : ' pts (MAX)'}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: `linear-gradient(90deg, ${seasonInfo.color}, #7da870)`,
                width: `${Math.round(seasonInfo.progress * 100)}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ color: '#4a4640', fontSize: 11, lineHeight: 1.5 }}>
              {seasonInfo.pointsToNext > 0
                ? `${seasonInfo.pointsToNext.toLocaleString()} pts to ${seasonInfo.nextTier.name}. Win more rounds to rank up!`
                : 'You reached the top tier! Defend your rank this season.'}
            </p>
            {/* Wallet quick summary */}
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ color: '#5a5248', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Balance</div>
                <div style={{ color: '#27AE60', fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>${walletBalance.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#5a5248', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>P/L</div>
                <div style={{
                  color: walletSummary.profit >= 0 ? '#27AE60' : '#c06050',
                  fontSize: 14, fontWeight: 600, fontFamily: 'monospace',
                }}>{walletSummary.profit >= 0 ? '+' : ''}${walletSummary.profit.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
