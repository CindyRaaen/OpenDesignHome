import { useEffect, useState, lazy, Suspense } from 'react'
import { api } from './utils/api'
import Layout from './components/Layout'
import LoginScreen from './components/LoginScreen'

const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const DesignEditorPage = lazy(() => import('./pages/DesignEditorPage'))
const VotingPage = lazy(() => import('./pages/VotingPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const FurnitureCatalogPage = lazy(() => import('./pages/FurnitureCatalogPage'))

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('odh_token'))
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('challenges')
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    api.get('/api/auth/me')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('odh_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const handleLogin = (newToken, userData) => {
    localStorage.setItem('odh_token', newToken)
    setToken(newToken)
    setUser(userData)
    setPage('challenges')
  }

  const handleLogout = () => {
    localStorage.removeItem('odh_token')
    setToken(null)
    setUser(null)
    setPage('challenges')
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900"><div className="text-indigo-500">Loading...</div></div>
  }

  const renderPage = () => {
    switch (page) {
      case 'challenges':
        return <ChallengesPage setPage={setPage} setSelectedChallenge={setSelectedChallenge} />
      case 'design-editor':
        return <DesignEditorPage challenge={selectedChallenge} setPage={setPage} />
      case 'voting':
        return <VotingPage />
      case 'leaderboard':
        return <LeaderboardPage />
      case 'profile':
        return <ProfilePage user={user} setUser={setUser} />
      case 'catalog':
        return <FurnitureCatalogPage />
      default:
        return <ChallengesPage />
    }
  }

  return (
    <Layout page={page} setPage={setPage} user={user} onLogout={handleLogout}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-indigo-500">Loading page...</div></div>}>
        {renderPage()}
      </Suspense>
    </Layout>
  )
}