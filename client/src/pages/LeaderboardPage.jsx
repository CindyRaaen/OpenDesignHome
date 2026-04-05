import { useEffect, useState } from 'react'
import { Crown, Award } from 'lucide-react'
import { api } from '../utils/api'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [timeframe, setTimeframe] = useState('weekly')
  const [loading, setLoading] = useState(true)
  const [currentUserRank, setCurrentUserRank] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/leaderboard?timeframe=${timeframe}`)
      .then((data) => {
        setLeaderboard(data.entries || [])
        setCurrentUserRank(data.userRank || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [timeframe])

  const getRankMedal = (rank) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-indigo-400">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-400">Leaderboard</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-4 py-2 rounded font-semibold transition ${timeframe === 'weekly' ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('alltime')}
            className={`px-4 py-2 rounded font-semibold transition ${timeframe === 'alltime' ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            All Time
          </button>
        </div>
      </div>

      {currentUserRank && (
        <div className="bg-indigo-900 border-2 border-indigo-500 rounded-lg p-6 mb-8">
          <p className="text-sm text-indigo-200 mb-2">Your Rank</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-2xl font-bold text-white">#{currentUserRank.rank}</p>
              <p className="text-gray-300">{currentUserRank.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-indigo-400">{currentUserRank.score}</p>
              <p className="text-indigo-200 text-sm">points</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-indigo-400 font-semibold">Rank</th>
              <th className="px-6 py-4 text-left text-indigo-400 font-semibold">Name</th>
              <th className="px-6 py-4 text-right text-indigo-400 font-semibold">Score</th>
              <th className="px-6 py-4 text-right text-indigo-400 font-semibold">Designs</th>
              <th className="px-6 py-4 text-right text-indigo-400 font-semibold">Avg Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {leaderboard.map((entry) => (
              <tr
                key={entry.id}
                className={`transition ${entry.isCurrentUser ? 'bg-indigo-900/30' : 'hover:bg-gray-700/50'}`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {entry.rank <= 3 ? (
                      <span className="text-2xl">{getRankMedal(entry.rank)}</span>
                    ) : (
                      <span className="text-lg font-bold text-indigo-400">#{entry.rank}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className={`font-semibold ${entry.isCurrentUser ? 'text-indigo-400' : 'text-white'}`}>
                      {entry.name}
                    </p>
                    {entry.isCurrentUser && (
                      <p className="text-xs text-indigo-300">(You)</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-lg font-bold text-indigo-400">{entry.score.toLocaleString()}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-white">{entry.designCount}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-white">{entry.avgRating.toFixed(1)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaderboard.length === 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400">No leaderboard data available yet.</p>
        </div>
      )}
    </div>
  )
}

function Star({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 2L15.09 10.26H24L17.45 15.37L19.54 23.63L12 18.52L4.46 23.63L6.55 15.37L0 10.26H8.91L12 2Z" />
    </svg>
  )
}