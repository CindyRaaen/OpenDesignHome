// ═══════════════════════════════════════════════════════════
// OPENDESIGN STUDIO — Matchmaking & Multiplayer Engine
// Supabase-backed: realtime subscriptions, player queues,
// round lifecycle, leaderboards.
// ═══════════════════════════════════════════════════════════

import { walletManager, WalletManager, ENTRY_TIERS } from './WalletEngine.js'

// ── Supabase config (uses REST API, no SDK dependency) ──
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY)

// ═══════════════════════════════════════════════════════════
// ROUND STATES
// ═══════════════════════════════════════════════════════════
export const ROUND_STATUS = {
  LOBBY: 'lobby',           // accepting entries
  COUNTDOWN: 'countdown',   // starting in 3..2..1
  ACTIVE: 'active',         // design phase in progress
  JUDGING: 'judging',       // AI judges scoring
  COMPLETE: 'complete',     // results finalized
  CANCELLED: 'cancelled',
}

// ═══════════════════════════════════════════════════════════
// MOCK OPPONENTS (used when Supabase isn't connected)
// ═══════════════════════════════════════════════════════════
const MOCK_PLAYERS = [
  { id: 'bot_1', handle: '@DesignWolf', avatar: '🐺', elo: 1420, city: 'Brooklyn', style: 'Industrial' },
  { id: 'bot_2', handle: '@VelvetRoom', avatar: '💜', elo: 1380, city: 'Portland', style: 'Maximalist' },
  { id: 'bot_3', handle: '@MinimalMind', avatar: '⬜', elo: 1510, city: 'Tokyo', style: 'Minimalist' },
  { id: 'bot_4', handle: '@CozyNest', avatar: '🪹', elo: 1290, city: 'Denver', style: 'Scandinavian' },
  { id: 'bot_5', handle: '@BoldStrokes', avatar: '🎯', elo: 1460, city: 'Miami', style: 'Art Deco' },
  { id: 'bot_6', handle: '@EarthTones', avatar: '🌿', elo: 1350, city: 'Austin', style: 'Wabi-Sabi' },
  { id: 'bot_7', handle: '@GlassHouse', avatar: '🏠', elo: 1540, city: 'Chicago', style: 'Modern' },
  { id: 'bot_8', handle: '@RetroVibes', avatar: '📻', elo: 1310, city: 'Nashville', style: 'Mid-Century' },
  { id: 'bot_9', handle: '@LuxeLayer', avatar: '✨', elo: 1480, city: 'LA', style: 'Hollywood Regency' },
  { id: 'bot_10', handle: '@ZenDen', avatar: '🧘', elo: 1400, city: 'Seattle', style: 'Japandi' },
  { id: 'bot_11', handle: '@ColorBomb', avatar: '🌈', elo: 1260, city: 'Atlanta', style: 'Eclectic' },
  { id: 'bot_12', handle: '@UrbanLoft', avatar: '🏙️', elo: 1440, city: 'NYC', style: 'Loft Industrial' },
]

function pickMockOpponents(count = 7) {
  const shuffled = [...MOCK_PLAYERS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// ═══════════════════════════════════════════════════════════
// ROUND MANAGER
// ═══════════════════════════════════════════════════════════
let roundIdCounter = 1

export function createRound(options = {}) {
  const {
    tierId = 'casual',
    challengeTitle = 'Weekly Showdown',
    roomType = 'living_room',
    maxPlayers = 10,
    durationMinutes = 45,
  } = options

  const tier = ENTRY_TIERS.find(t => t.id === tierId) || ENTRY_TIERS[2]
  const opponents = pickMockOpponents(Math.min(maxPlayers - 1, 7))

  const round = {
    id: `round_${Date.now()}_${roundIdCounter++}`,
    status: ROUND_STATUS.LOBBY,
    tier,
    tierId,
    challengeTitle,
    roomType,
    maxPlayers,
    durationMinutes,
    durationSeconds: durationMinutes * 60,
    players: opponents.map(p => ({
      ...p,
      joined: true,
      score: 0,
      submitted: false,
      judgeScores: null,
    })),
    playerSlot: null, // filled when user joins
    prizeInfo: WalletManager.calculatePrizePool(tierId, opponents.length + 1),
    createdAt: Date.now(),
    startsAt: Date.now() + 15000, // 15s lobby countdown
    endsAt: null,
    results: null,
  }

  return round
}

/**
 * Join a round. Deducts entry fee and adds player to the round.
 */
export function joinRound(round, playerProfile) {
  if (round.status !== ROUND_STATUS.LOBBY) {
    return { success: false, error: 'Round is not accepting entries' }
  }

  // Pay entry fee
  const tx = walletManager.payEntryFee(round.tierId, round.id)
  if (!tx && round.tier.fee > 0) {
    return { success: false, error: 'Insufficient funds', needsDeposit: true }
  }

  round.playerSlot = {
    id: 'player_self',
    handle: playerProfile.handle || '@DesignDreamer',
    avatar: playerProfile.avatar || '🎨',
    elo: playerProfile.stats?.rank?.national || 1400,
    city: playerProfile.city || 'Unknown',
    style: playerProfile.designVibe || 'Modern',
    joined: true,
    score: 0,
    submitted: false,
    judgeScores: null,
  }

  // Recalculate prize pool with actual player count
  round.prizeInfo = WalletManager.calculatePrizePool(round.tierId, round.players.length + 1)

  return { success: true, transaction: tx }
}

/**
 * Start a round (transition from lobby to active).
 */
export function startRound(round) {
  round.status = ROUND_STATUS.ACTIVE
  round.startsAt = Date.now()
  round.endsAt = Date.now() + round.durationSeconds * 1000

  // Simulate bot activity (they'll "submit" at random times)
  round.players.forEach(player => {
    const submitDelay = (Math.random() * 0.7 + 0.2) * round.durationSeconds * 1000
    setTimeout(() => {
      if (round.status === ROUND_STATUS.ACTIVE) {
        player.submitted = true
        player.score = Math.round(55 + Math.random() * 40) // 55–95 range
        player.judgeScores = {
          color: Math.round(50 + Math.random() * 45),
          space: Math.round(50 + Math.random() * 45),
          vibe: Math.round(50 + Math.random() * 45),
        }
      }
    }, submitDelay)
  })

  return round
}

/**
 * Submit player's design and trigger judging.
 */
export function submitDesign(round, judgeResults, compositeScore) {
  if (!round.playerSlot) return { success: false, error: 'Not in round' }

  round.playerSlot.submitted = true
  round.playerSlot.score = compositeScore
  round.playerSlot.judgeScores = judgeResults

  // Check if all players submitted
  const allSubmitted = round.players.every(p => p.submitted) && round.playerSlot.submitted
  if (allSubmitted) {
    finalizeRound(round)
  }

  return { success: true }
}

/**
 * Finalize round: rank players, distribute prizes.
 */
export function finalizeRound(round) {
  round.status = ROUND_STATUS.COMPLETE

  // Combine all players
  const allPlayers = [...round.players]
  if (round.playerSlot) allPlayers.push(round.playerSlot)

  // Rank by score descending
  allPlayers.sort((a, b) => b.score - a.score)
  allPlayers.forEach((p, i) => { p.rank = i + 1 })

  // Distribute prizes
  const { payouts } = round.prizeInfo
  const results = allPlayers.map((player, i) => {
    const payout = payouts[i]
    const prize = payout ? payout.amount : 0

    // If this is the human player and they won a prize
    if (player.id === 'player_self' && prize > 0) {
      walletManager.awardPrize(prize, round.id, player.rank)
    }

    return {
      ...player,
      prize,
      isPlayer: player.id === 'player_self',
    }
  })

  round.results = results
  round.endsAt = Date.now()

  return results
}

// ═══════════════════════════════════════════════════════════
// LOBBY / ROUND FINDER
// Shows available rounds to join.
// ═══════════════════════════════════════════════════════════
export function getAvailableRounds() {
  // Generate a mix of rounds at different tiers
  const challenges = [
    { title: 'Cozy Living Room', roomType: 'living_room', duration: 45 },
    { title: 'Modern Kitchen', roomType: 'kitchen', duration: 30 },
    { title: 'Zen Bedroom', roomType: 'bedroom', duration: 45 },
    { title: 'Dinner Party Setup', roomType: 'dining_room', duration: 60 },
    { title: 'Small Space Challenge', roomType: 'studio', duration: 30 },
    { title: 'Spa Bathroom', roomType: 'bathroom', duration: 25 },
  ]

  const tiers = ['free', 'micro', 'casual', 'mid', 'high', 'premium']

  return challenges.map((ch, i) => {
    const tierId = tiers[i % tiers.length]
    const playerCount = Math.floor(Math.random() * 6) + 3 // 3–8 players waiting
    return {
      ...createRound({
        tierId,
        challengeTitle: ch.title,
        roomType: ch.roomType,
        durationMinutes: ch.duration,
      }),
      spotsLeft: 10 - playerCount,
      playersWaiting: playerCount,
      startsIn: Math.floor(Math.random() * 120) + 30, // 30–150 seconds
      hot: Math.random() > 0.6,
    }
  })
}

// ═══════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════
const LEADERBOARD_KEY = 'ods_leaderboard'

function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return generateMockLeaderboard()
}

function generateMockLeaderboard() {
  const allPlayers = MOCK_PLAYERS.map(p => ({
    ...p,
    wins: Math.floor(Math.random() * 30) + 5,
    losses: Math.floor(Math.random() * 20) + 3,
    totalEarnings: Math.round((Math.random() * 2000 + 100) * 100) / 100,
    seasonPoints: Math.floor(Math.random() * 3000) + 500,
    streak: Math.floor(Math.random() * 8),
  }))

  // Add player
  allPlayers.push({
    id: 'player_self',
    handle: '@DesignDreamer',
    avatar: '🎨',
    elo: 1400,
    city: 'San Francisco',
    style: 'Warm & Cozy',
    wins: 12,
    losses: 8,
    totalEarnings: walletManager.getSummary().totalWon,
    seasonPoints: 1840,
    streak: 3,
    isPlayer: true,
  })

  return allPlayers.sort((a, b) => b.seasonPoints - a.seasonPoints)
}

export function getLeaderboard(scope = 'national') {
  const board = loadLeaderboard()
  return board.map((p, i) => ({ ...p, rank: i + 1 }))
}

// ═══════════════════════════════════════════════════════════
// LIVE ACTIVITY FEED
// ═══════════════════════════════════════════════════════════
const FEED_ACTIONS = [
  '{player} just placed a {item} in their {room}',
  '{player} submitted their design — score: {score}!',
  '{player} is on a {streak}-win streak 🔥',
  '{player} won ${prize} in {tier} round',
  '{player} climbed to #{rank} on the leaderboard',
  '{player} entered a {tier} round',
  '{player} earned the "{badge}" badge',
]

export function generateActivityItem() {
  const player = MOCK_PLAYERS[Math.floor(Math.random() * MOCK_PLAYERS.length)]
  const template = FEED_ACTIONS[Math.floor(Math.random() * FEED_ACTIONS.length)]
  const items = ['Eames Chair', 'Noguchi Table', 'Arco Lamp', 'Monstera XL', 'Cloud Sofa', 'Wishbone Chair']
  const rooms = ['living room', 'bedroom', 'kitchen', 'studio']
  const badges = ['First Win', 'Hot Streak', 'Color Master', 'Space Whiz', 'Style Icon']
  const tiers = ['Casual', 'Mid Stakes', 'High Stakes', 'Premium']

  const text = template
    .replace('{player}', player.handle)
    .replace('{item}', items[Math.floor(Math.random() * items.length)])
    .replace('{room}', rooms[Math.floor(Math.random() * rooms.length)])
    .replace('{score}', Math.floor(65 + Math.random() * 30))
    .replace('{streak}', Math.floor(3 + Math.random() * 8))
    .replace('{prize}', Math.floor(10 + Math.random() * 200))
    .replace('{rank}', Math.floor(1 + Math.random() * 50))
    .replace('{tier}', tiers[Math.floor(Math.random() * tiers.length)])
    .replace('{badge}', badges[Math.floor(Math.random() * badges.length)])

  return {
    id: `feed_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    player,
    text,
    ts: Date.now(),
  }
}

// ═══════════════════════════════════════════════════════════
// SUPABASE REALTIME (when connected)
// ═══════════════════════════════════════════════════════════
export function connectRealtime(roundId, onUpdate) {
  if (!USE_SUPABASE) {
    // Mock mode: generate periodic updates
    const interval = setInterval(() => {
      onUpdate({ type: 'activity', data: generateActivityItem() })
    }, 3000 + Math.random() * 5000)
    return () => clearInterval(interval)
  }

  // Real Supabase realtime subscription
  const ws = new WebSocket(`${SUPABASE_URL.replace('https','wss')}/realtime/v1/websocket?apikey=${SUPABASE_KEY}&vsn=1.0.0`)

  ws.onopen = () => {
    ws.send(JSON.stringify({
      topic: `realtime:public:ods_rounds:id=eq.${roundId}`,
      event: 'phx_join',
      payload: {},
      ref: '1',
    }))
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.event === 'UPDATE' || msg.event === 'INSERT') {
        onUpdate({ type: 'round_update', data: msg.payload })
      }
    } catch {}
  }

  return () => ws.close()
}

// ═══════════════════════════════════════════════════════════
// SEASON SYSTEM
// ═══════════════════════════════════════════════════════════
export const SEASON_TIERS = [
  { name: 'Bronze I',    minPts: 0,    color: '#CD7F32' },
  { name: 'Bronze II',   minPts: 500,  color: '#CD7F32' },
  { name: 'Bronze III',  minPts: 1000, color: '#CD7F32' },
  { name: 'Silver I',    minPts: 1500, color: '#C0C0C0' },
  { name: 'Silver II',   minPts: 2000, color: '#C0C0C0' },
  { name: 'Silver III',  minPts: 2500, color: '#C0C0C0' },
  { name: 'Gold I',      minPts: 3000, color: '#FFD700' },
  { name: 'Gold II',     minPts: 4000, color: '#FFD700' },
  { name: 'Gold III',    minPts: 5000, color: '#FFD700' },
  { name: 'Platinum',    minPts: 7000, color: '#E5E4E2' },
  { name: 'Diamond',     minPts: 10000,color: '#B9F2FF' },
]

export function getSeasonTier(points) {
  let tier = SEASON_TIERS[0]
  for (const t of SEASON_TIERS) {
    if (points >= t.minPts) tier = t
  }
  const nextTier = SEASON_TIERS[SEASON_TIERS.indexOf(tier) + 1]
  return {
    ...tier,
    points,
    nextTier,
    progress: nextTier ? (points - tier.minPts) / (nextTier.minPts - tier.minPts) : 1.0,
    pointsToNext: nextTier ? nextTier.minPts - points : 0,
  }
}

export default {
  ROUND_STATUS, createRound, joinRound, startRound, submitDesign,
  finalizeRound, getAvailableRounds, getLeaderboard, generateActivityItem,
  connectRealtime, SEASON_TIERS, getSeasonTier,
}
