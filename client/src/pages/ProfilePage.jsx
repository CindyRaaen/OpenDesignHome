import { useState, useEffect } from 'react'
import { Save, Star, Zap } from 'lucide-react'
import { api } from '../utils/api'

export default function ProfilePage({ user, setUser }) {
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({
    designs: 0,
    wins: 0,
    votes: 0,
    reputation: 0,
  })
  const [badges, setBadges] = useState([])

  useEffect(() => {
    api.get('/api/profile/stats')
      .then(setStats)
      .catch(console.error)
  }, [])

  useEffect(() => {
    api.get('/api/profile/badges')
      .then(setBadges)
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.patch('/api/profile', {
        displayName,
        bio,
      })
      setUser(updated)
      setEditing(false)
    } catch (err) {
      alert('Error saving profile: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName || '')
    setBio(user?.bio || '')
    setEditing(false)
  }

  const getInitial = () => {
    return (displayName || 'D').charAt(0).toUpperCase()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-indigo-400 mb-8">Profile</h1>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-white">{getInitial()}</span>
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none h-20"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition flex items-center gap-2"
                  >
                    <Save size={18} />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>
                {bio && (
                  <p className="text-gray-300 mb-4">{bio}</p>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Designs</p>
          <p className="text-3xl font-bold text-indigo-400">{stats.designs}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Challenge Wins</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.wins}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Votes Cast</p>
          <p className="text-3xl font-bold text-blue-400">{stats.votes}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400 text-sm mb-2">Reputation</p>
          <p className="text-3xl font-bold text-purple-400">{stats.reputation}</p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h3 className="text-lg font-bold text-white mb-6">Badges & Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div key={badge.id} className="bg-gray-700 rounded-lg p-4 text-center hover:bg-gray-600 transition">
                <p className="text-3xl mb-2">{badge.emoji}</p>
                <p className="font-semibold text-white text-sm">{badge.name}</p>
                <p className="text-gray-400 text-xs mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}