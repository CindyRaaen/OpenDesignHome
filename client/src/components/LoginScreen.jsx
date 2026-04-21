import { useState } from 'react'
import { api } from '../utils/api'

function HeroRoom() {
  return (
    <svg viewBox="0 0 300 180" className="w-full h-full">
      {/* Back wall - sage green wallpaper */}
      <rect x="30" y="0" width="240" height="110" fill="#c5d5c0" />
      <rect x="30" y="0" width="240" height="3" fill="#b5c5b0" />
      {/* Left wall */}
      <polygon points="0,0 30,0 30,110 0,180" fill="#b8c8b3" />
      {/* Right wall */}
      <polygon points="300,0 270,0 270,110 300,180" fill="#b8c8b3" />
      {/* Floor - dark walnut */}
      <polygon points="0,180 30,110 270,110 300,180" fill="#6b4226" />
      <line x1="60" y1="110" x2="30" y2="180" stroke="#5a3520" strokeWidth="1" opacity="0.5" />
      <line x1="120" y1="110" x2="110" y2="180" stroke="#5a3520" strokeWidth="1" opacity="0.5" />
      <line x1="180" y1="110" x2="190" y2="180" stroke="#5a3520" strokeWidth="1" opacity="0.5" />
      <line x1="240" y1="110" x2="270" y2="180" stroke="#5a3520" strokeWidth="1" opacity="0.5" />
      {/* Window */}
      <rect x="55" y="15" width="60" height="55" rx="1" fill="#87CEEB" stroke="#f0ebe4" strokeWidth="3" />
      <line x1="85" y1="15" x2="85" y2="70" stroke="#f0ebe4" strokeWidth="2" />
      <line x1="55" y1="42" x2="115" y2="42" stroke="#f0ebe4" strokeWidth="2" />
      <rect x="53" y="70" width="64" height="4" fill="#e0d8cc" rx="1" />
      {/* Window 2 */}
      <rect x="185" y="15" width="60" height="55" rx="1" fill="#87CEEB" stroke="#f0ebe4" strokeWidth="3" />
      <line x1="215" y1="15" x2="215" y2="70" stroke="#f0ebe4" strokeWidth="2" />
      <line x1="185" y1="42" x2="245" y2="42" stroke="#f0ebe4" strokeWidth="2" />
      <rect x="183" y="70" width="64" height="4" fill="#e0d8cc" rx="1" />
      {/* Fireplace */}
      <rect x="125" y="38" width="50" height="72" fill="#e8e0d4" stroke="#c8bfb0" strokeWidth="2" />
      <rect x="122" y="35" width="56" height="6" fill="#e0d8cc" rx="2" />
      <path d="M135,58 Q150,48 165,58 L165,110 L135,110 Z" fill="#1a1a1a" />
      <ellipse cx="150" cy="98" rx="10" ry="8" fill="#ff6b35" opacity="0.7" />
      {/* Rug - persian red */}
      <rect x="70" y="125" width="160" height="45" rx="2" fill="#8b2020" stroke="#d4a843" strokeWidth="2" />
      <rect x="76" y="130" width="148" height="35" fill="none" stroke="#d4a843" strokeWidth="1" opacity="0.3" />
      <ellipse cx="150" cy="148" rx="25" ry="12" fill="none" stroke="#d4a843" strokeWidth="1" opacity="0.25" />
      {/* Sofa - indigo */}
      <rect x="60" y="120" width="95" height="30" rx="6" fill="#4F46E5" stroke="#3730a3" strokeWidth="1" />
      <rect x="63" y="123" width="28" height="20" rx="3" fill="#5B54EB" />
      <rect x="93" y="123" width="28" height="20" rx="3" fill="#5B54EB" />
      <rect x="123" y="123" width="28" height="20" rx="3" fill="#5B54EB" />
      {/* Side table + lamp */}
      <rect x="165" y="130" width="22" height="18" rx="2" fill="#a08060" stroke="#8b7050" strokeWidth="1" />
      <line x1="176" y1="118" x2="176" y2="130" stroke="#333" strokeWidth="2" />
      <polygon points="170,118 182,118 179,112 173,112" fill="#eab308" opacity="0.8" />
      {/* Chair */}
      <rect x="200" y="122" width="35" height="30" rx="5" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="1" />
      <rect x="203" y="126" width="29" height="18" rx="3" fill="#9d6ff8" />
      {/* Plant */}
      <circle cx="248" cy="125" r="8" fill="#22c55e" opacity="0.8" />
      <circle cx="252" cy="120" r="6" fill="#16a34a" opacity="0.7" />
      <rect x="246" y="133" width="7" height="12" rx="2" fill="#a08060" />
      {/* Wall art */}
      <rect x="57" y="20" width="28" height="22" rx="1" fill="#f5f0e8" stroke="#c8bfb0" strokeWidth="2" />
      <circle cx="71" cy="28" r="4" fill="#ec4899" opacity="0.5" />
      <rect x="65" y="33" width="12" height="3" fill="#ec4899" opacity="0.3" />
      {/* Art 2 */}
      <rect x="215" y="20" width="25" height="20" rx="1" fill="#f5f0e8" stroke="#c8bfb0" strokeWidth="2" />
      <rect x="220" y="24" width="15" height="3" fill="#4F46E5" opacity="0.3" />
      <rect x="220" y="30" width="10" height="3" fill="#4F46E5" opacity="0.2" />
    </svg>
  )
}

export default function LoginScreen({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const { token, user } = await api.post(endpoint, { username, password })
      onLogin(token, user)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Hero illustration */}
        <div className="mb-4 rounded-xl overflow-hidden shadow-2xl border border-gray-700/50">
          <HeroRoom />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">OpenDesign Studio</h1>
          <p className="text-gray-600 text-xs tracking-widest uppercase mt-1 mb-3">Part of the OpenScaffold ecosystem</p>
          <p className="text-gray-400">Design rooms. Get judged by AI. Compete for real prizes.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800/80 rounded-xl p-5 shadow-xl border border-gray-700/50 space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-base"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-base"
            required
          />
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center px-3 py-2 rounded-lg">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg text-base transition"
          >
            {loading ? 'Please wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            className="w-full text-gray-400 text-sm hover:text-indigo-300 transition py-1"
          >
            {isRegister ? 'Already have an account? Sign in' : "New here? Create a free account"}
          </button>
        </form>
      </div>
    </div>
  )
}
