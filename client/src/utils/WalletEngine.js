// ═══════════════════════════════════════════════════════════
// OPENDESIGN STUDIO — Wallet & Economy Engine
// Simulated entry fees, prize pools, rake, and player wallets.
// Mock mode — flip STRIPE_LIVE to connect real payments later.
// ═══════════════════════════════════════════════════════════

const STRIPE_LIVE = false // flip to true when Stripe is wired

// ── Entry Fee Tiers ──
export const ENTRY_TIERS = [
  { id: 'free',    label: 'Free Play',     fee: 0,    prizePool: 0,     rake: 0,    color: '#95A5A6', badge: '🎨' },
  { id: 'micro',   label: 'Micro',         fee: 1,    prizePool: 7,     rake: 0.25, color: '#27AE60', badge: '🪙' },
  { id: 'casual',  label: 'Casual',        fee: 5,    prizePool: 38,    rake: 0.20, color: '#2E86C1', badge: '💎' },
  { id: 'mid',     label: 'Mid Stakes',    fee: 10,   prizePool: 80,    rake: 0.20, color: '#8E44AD', badge: '🔥' },
  { id: 'high',    label: 'High Stakes',   fee: 25,   prizePool: 200,   rake: 0.20, color: '#E67E22', badge: '⚡' },
  { id: 'premium', label: 'Premium',       fee: 50,   prizePool: 425,   rake: 0.15, color: '#C0392B', badge: '👑' },
  { id: 'elite',   label: 'Elite',         fee: 100,  prizePool: 875,   rake: 0.125,color: '#F1C40F', badge: '🏆' },
  { id: 'champ',   label: 'Championship',  fee: 250,  prizePool: 2250,  rake: 0.10, color: '#1A1A1A', badge: '💫' },
]

// ── Prize Distribution (% of pool) ──
export const PRIZE_SPLITS = {
  2:  [1.0],                           // heads-up: winner takes all
  4:  [0.65, 0.35],                    // top 2 paid
  8:  [0.50, 0.30, 0.20],             // top 3 paid
  10: [0.45, 0.25, 0.15, 0.10, 0.05], // top 5 paid
  20: [0.35, 0.20, 0.15, 0.10, 0.08, 0.06, 0.04, 0.02], // top 8 paid
}

function getPrizeSplit(playerCount) {
  const sizes = Object.keys(PRIZE_SPLITS).map(Number).sort((a,b) => a-b)
  for (const size of sizes) {
    if (playerCount <= size) return PRIZE_SPLITS[size]
  }
  return PRIZE_SPLITS[20] // fallback to largest
}

// ── Revenue Streams ──
export const REVENUE_STREAMS = {
  rake: { label: 'Platform Rake', description: '10–25% of entry fees', active: true },
  sponsored: { label: 'Sponsored Challenges', description: 'Brands fund prize pools + feature products', active: true },
  affiliate: { label: 'Affiliate Revenue', description: '5–12% commission on furniture purchases', active: true },
  premium: { label: 'Premium Packs', description: 'Exclusive furniture, materials, and color palettes', active: false },
  season: { label: 'Season Pass', description: '$9.99/mo for bonus XP, exclusive rounds, analytics', active: false },
}

// ═══════════════════════════════════════════════════════════
// PLAYER WALLET (client-side mock, Supabase-ready)
// ═══════════════════════════════════════════════════════════
const WALLET_KEY = 'ods_wallet'

function loadWallet() {
  try {
    const stored = localStorage.getItem(WALLET_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return defaultWallet()
}

function defaultWallet() {
  return {
    balance: 50.00,       // starting balance for new players
    totalDeposited: 50.00,
    totalWon: 0,
    totalSpent: 0,
    totalRake: 0,
    transactions: [
      { id: 'tx_welcome', type: 'deposit', amount: 50.00, label: 'Welcome bonus', ts: Date.now() }
    ],
  }
}

function saveWallet(wallet) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet))
}

class WalletManager {
  constructor() {
    this.wallet = loadWallet()
    this.listeners = new Set()
  }

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn) }
  notify() { this.listeners.forEach(fn => fn({ ...this.wallet })) }

  get balance() { return this.wallet.balance }
  get transactions() { return [...this.wallet.transactions] }

  canAfford(amount) { return this.wallet.balance >= amount }

  /**
   * Deduct entry fee. Returns transaction or null if insufficient funds.
   */
  payEntryFee(tierId, roundId) {
    const tier = ENTRY_TIERS.find(t => t.id === tierId)
    if (!tier || tier.fee === 0) return { id: `tx_${Date.now()}`, type: 'entry', amount: 0, label: `Free entry: ${roundId}`, ts: Date.now() }
    if (!this.canAfford(tier.fee)) return null

    const tx = {
      id: `tx_${Date.now()}`,
      type: 'entry',
      amount: -tier.fee,
      label: `${tier.label} entry: ${roundId}`,
      tierId,
      roundId,
      ts: Date.now(),
    }
    this.wallet.balance -= tier.fee
    this.wallet.totalSpent += tier.fee
    this.wallet.totalRake += tier.fee * tier.rake
    this.wallet.transactions.unshift(tx)
    saveWallet(this.wallet)
    this.notify()
    return tx
  }

  /**
   * Award prize winnings.
   */
  awardPrize(amount, roundId, placement) {
    const tx = {
      id: `tx_${Date.now()}`,
      type: 'prize',
      amount: amount,
      label: `#${placement} prize: ${roundId}`,
      roundId,
      placement,
      ts: Date.now(),
    }
    this.wallet.balance += amount
    this.wallet.totalWon += amount
    this.wallet.transactions.unshift(tx)
    saveWallet(this.wallet)
    this.notify()
    return tx
  }

  /**
   * Add funds (mock deposit).
   */
  deposit(amount, label = 'Deposit') {
    const tx = {
      id: `tx_${Date.now()}`,
      type: 'deposit',
      amount: amount,
      label,
      ts: Date.now(),
    }
    this.wallet.balance += amount
    this.wallet.totalDeposited += amount
    this.wallet.transactions.unshift(tx)
    saveWallet(this.wallet)
    this.notify()
    return tx
  }

  /**
   * Calculate prize pool for a round.
   */
  static calculatePrizePool(tierId, playerCount) {
    const tier = ENTRY_TIERS.find(t => t.id === tierId)
    if (!tier) return { pool: 0, payouts: [], rake: 0 }

    const grossPool = tier.fee * playerCount
    const rake = grossPool * tier.rake
    const netPool = grossPool - rake
    const splits = getPrizeSplit(playerCount)
    const payouts = splits.map((pct, i) => ({
      place: i + 1,
      amount: Math.round(netPool * pct * 100) / 100,
      pct: Math.round(pct * 100),
    }))

    return { pool: netPool, grossPool, rake, payouts, tier }
  }

  /**
   * Get wallet summary for UI.
   */
  getSummary() {
    return {
      balance: this.wallet.balance,
      totalWon: this.wallet.totalWon,
      totalSpent: this.wallet.totalSpent,
      profit: this.wallet.totalWon - this.wallet.totalSpent,
      recentTransactions: this.wallet.transactions.slice(0, 10),
    }
  }

  /**
   * Reset wallet (for testing).
   */
  reset() {
    this.wallet = defaultWallet()
    saveWallet(this.wallet)
    this.notify()
  }
}

export { WalletManager }
export const walletManager = new WalletManager()
export default { ENTRY_TIERS, PRIZE_SPLITS, REVENUE_STREAMS, WalletManager, walletManager }
