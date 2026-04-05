import { useEffect, useState } from 'react'
import { Clock, Users, ChevronRight } from 'lucide-react'
import { api } from '../utils/api'

// Mini room preview SVGs for each room type
function RoomPreview({ type }) {
  if (type === 'living_room') return (
    <svg viewBox="0 0 300 180" className="w-full h-full">
      {/* Back wall */}
      <rect x="30" y="0" width="240" height="110" fill="#f5f0eb" />
      <rect x="30" y="0" width="240" height="3" fill="#e0d8cc" />
      {/* Left wall */}
      <polygon points="0,0 30,0 30,110 0,180" fill="#e8e0d8" />
      {/* Right wall */}
      <polygon points="300,0 270,0 270,110 300,180" fill="#e8e0d8" />
      {/* Floor */}
      <polygon points="0,180 30,110 270,110 300,180" fill="#d4a86a" />
      <line x1="60" y1="110" x2="30" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      <line x1="120" y1="110" x2="110" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      <line x1="180" y1="110" x2="190" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      <line x1="240" y1="110" x2="270" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      {/* Window left */}
      <rect x="50" y="18" width="55" height="55" rx="1" fill="#87CEEB" stroke="#f0ebe4" strokeWidth="3" />
      <line x1="77.5" y1="18" x2="77.5" y2="73" stroke="#f0ebe4" strokeWidth="2" />
      <line x1="50" y1="45" x2="105" y2="45" stroke="#f0ebe4" strokeWidth="2" />
      <rect x="48" y="73" width="59" height="4" fill="#e0d8cc" rx="1" />
      {/* Window right */}
      <rect x="195" y="18" width="55" height="55" rx="1" fill="#87CEEB" stroke="#f0ebe4" strokeWidth="3" />
      <line x1="222.5" y1="18" x2="222.5" y2="73" stroke="#f0ebe4" strokeWidth="2" />
      <line x1="195" y1="45" x2="250" y2="45" stroke="#f0ebe4" strokeWidth="2" />
      <rect x="193" y="73" width="59" height="4" fill="#e0d8cc" rx="1" />
      {/* Fireplace */}
      <rect x="125" y="40" width="50" height="70" fill="#e8e0d4" stroke="#c8bfb0" strokeWidth="2" />
      <rect x="122" y="37" width="56" height="6" fill="#e0d8cc" rx="2" />
      <path d="M135,60 Q150,50 165,60 L165,110 L135,110 Z" fill="#1a1a1a" />
      <ellipse cx="150" cy="100" rx="10" ry="8" fill="#ff6b35" opacity="0.7" />
      {/* Sofa placeholder - dashed */}
      <rect x="55" y="125" width="90" height="35" rx="4" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
      <text x="100" y="146" textAnchor="middle" fill="#4F46E5" fontSize="10" opacity="0.6">sofa</text>
      {/* Chair placeholder */}
      <rect x="185" y="120" width="40" height="35" rx="4" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
      <text x="205" y="141" textAnchor="middle" fill="#4F46E5" fontSize="9" opacity="0.6">chair</text>
    </svg>
  )

  if (type === 'bedroom') return (
    <svg viewBox="0 0 300 180" className="w-full h-full">
      <rect x="30" y="0" width="240" height="110" fill="#f0d4d4" />
      <rect x="30" y="0" width="240" height="3" fill="#e0c8c8" />
      <polygon points="0,0 30,0 30,110 0,180" fill="#e8ccc8" />
      <polygon points="300,0 270,0 270,110 300,180" fill="#e8ccc8" />
      <polygon points="0,180 30,110 270,110 300,180" fill="#d4a86a" />
      <line x1="60" y1="110" x2="30" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      <line x1="120" y1="110" x2="110" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      <line x1="180" y1="110" x2="190" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      <line x1="240" y1="110" x2="270" y2="180" stroke="#c49a5c" strokeWidth="1" opacity="0.4" />
      {/* Windows */}
      <rect x="55" y="18" width="50" height="50" rx="1" fill="#87CEEB" stroke="#f0ebe4" strokeWidth="3" />
      <line x1="80" y1="18" x2="80" y2="68" stroke="#f0ebe4" strokeWidth="2" />
      <rect x="195" y="18" width="50" height="50" rx="1" fill="#87CEEB" stroke="#f0ebe4" strokeWidth="3" />
      <line x1="220" y1="18" x2="220" y2="68" stroke="#f0ebe4" strokeWidth="2" />
      {/* Bed placeholder */}
      <rect x="80" y="115" width="100" height="55" rx="4" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
      <text x="130" y="146" textAnchor="middle" fill="#4F46E5" fontSize="11" opacity="0.6">bed</text>
      {/* Nightstand placeholders */}
      <rect x="45" y="130" width="28" height="25" rx="3" fill="none" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
      <rect x="187" y="130" width="28" height="25" rx="3" fill="none" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
      {/* Wall art placeholder */}
      <rect x="115" y="15" width="42" height="32" rx="1" fill="none" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
    </svg>
  )

  // Kitchen
  return (
    <svg viewBox="0 0 300 180" className="w-full h-full">
      <rect x="30" y="0" width="240" height="110" fill="#f5f0eb" />
      <rect x="30" y="0" width="240" height="3" fill="#e0d8cc" />
      <polygon points="0,0 30,0 30,110 0,180" fill="#e8e0d8" />
      <polygon points="300,0 270,0 270,110 300,180" fill="#e8e0d8" />
      <polygon points="0,180 30,110 270,110 300,180" fill="#e8e4e0" />
      <line x1="80" y1="110" x2="65" y2="180" stroke="#d0ccc5" strokeWidth="1" opacity="0.5" />
      <line x1="150" y1="110" x2="150" y2="180" stroke="#d0ccc5" strokeWidth="1" opacity="0.5" />
      <line x1="220" y1="110" x2="235" y2="180" stroke="#d0ccc5" strokeWidth="1" opacity="0.5" />
      {/* Window */}
      <rect x="100" y="15" width="70" height="50" rx="1" fill="#87CEEB" stroke="#f0ebe4" strokeWidth="3" />
      <line x1="135" y1="15" x2="135" y2="65" stroke="#f0ebe4" strokeWidth="2" />
      <rect x="98" y="65" width="74" height="4" fill="#e0d8cc" rx="1" />
      {/* Counter along right wall */}
      <rect x="220" y="25" width="45" height="85" fill="#a08060" stroke="#8b7050" strokeWidth="1" />
      <rect x="225" y="40" width="15" height="12" rx="2" fill="#87CEEB" opacity="0.6" />
      <rect x="225" y="70" width="15" height="15" rx="2" fill="#444" />
      <circle cx="232" cy="77" r="3" fill="#666" />
      {/* Table placeholder */}
      <rect x="60" y="125" width="80" height="40" rx="4" fill="none" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
      <text x="100" y="149" textAnchor="middle" fill="#4F46E5" fontSize="10" opacity="0.6">table</text>
      {/* Chair placeholders */}
      <rect x="45" y="128" width="18" height="22" rx="3" fill="none" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
      <rect x="140" y="128" width="18" height="22" rx="3" fill="none" stroke="#4F46E5" strokeWidth="1" strokeDasharray="3,2" opacity="0.4" />
    </svg>
  )
}

export default function ChallengesPage({ setPage, setSelectedChallenge }) {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/api/challenges')
      .then(setChallenges)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getDifficultyStyle = (d) => {
    if (d === 'casual') return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Casual' }
    if (d === 'intermediate') return { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Intermediate' }
    if (d === 'expert') return { bg: 'bg-red-500/15', text: 'text-red-400', label: 'Expert' }
    return { bg: 'bg-gray-700', text: 'text-gray-300', label: d }
  }

  const getTimeRemaining = (endsAt) => {
    const ms = new Date(endsAt) - new Date()
    if (ms <= 0) return 'Ended'
    const hours = Math.floor(ms / 3600000)
    if (hours >= 24) return Math.floor(hours / 24) + 'd left'
    return hours + 'h left'
  }

  const handleEnter = (challenge) => {
    if (setSelectedChallenge) setSelectedChallenge(challenge)
    if (setPage) setPage('design-editor')
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-indigo-400 mt-3 text-sm">Loading challenges...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Design Challenges</h1>
        <p className="text-gray-400 text-sm mt-1">Pick a room, design it your way, compete for votes</p>
      </div>

      {challenges.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-gray-300 text-lg mb-1">No active challenges</p>
          <p className="text-gray-500 text-sm">New challenges drop every week — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((c) => {
            const diff = getDifficultyStyle(c.difficulty)
            return (
              <button
                key={c.id}
                onClick={() => handleEnter(c)}
                className="w-full bg-gray-800/70 border border-gray-700 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:bg-gray-800 transition-all group text-left"
              >
                {/* Room preview */}
                <div className="relative bg-gradient-to-b from-gray-700/30 to-gray-800/30 overflow-hidden" style={{ height: '160px' }}>
                  <div className="absolute inset-0 p-2">
                    <RoomPreview type={c.room_type} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
                  {/* Time badge */}
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock size={11} /> {getTimeRemaining(c.ends_at)}
                  </div>
                  {/* Difficulty badge */}
                  <div className={`absolute top-2.5 left-2.5 ${diff.bg} backdrop-blur-sm ${diff.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>
                    {diff.label}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition truncate">{c.title}</h2>
                    <p className="text-gray-400 text-sm mt-0.5">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="capitalize">{(c.room_type || '').replace('_', ' ')}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {c.entry_count || 0} entries</span>
                      {c.theme && <><span>·</span><span className="capitalize">{c.theme} theme</span></>}
                    </div>
                  </div>
                  <div className="bg-indigo-500 group-hover:bg-indigo-400 text-white rounded-full p-2 transition shrink-0">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
