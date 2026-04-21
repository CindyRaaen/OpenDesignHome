import { useEffect, useState, lazy, Suspense } from 'react'
import { api } from './utils/api'
import Layout from './components/Layout'
import LoginScreen from './components/LoginScreen'

// ── New elevated game pages ──
const StudioPage = lazy(() => import('./pages/StudioPage'))
const BriefsPage = lazy(() => import('./pages/BriefsPage'))
const ChallengeFlow = lazy(() => import('./pages/ChallengeFlow'))
const JuryPage = lazy(() => import('./pages/JuryPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const MyDesignsPage = lazy(() => import('./pages/MyDesignsPage'))

// ── Legacy pages (still accessible if needed) ──
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const DesignEditorPage = lazy(() => import('./pages/DesignEditorPage'))
const VotingPage = lazy(() => import('./pages/VotingPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const FurnitureCatalogPage = lazy(() => import('./pages/FurnitureCatalogPage'))
const FloorPlanPage = lazy(() => import('./pages/FloorPlanPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const RoomViewerPage = lazy(() => import('./pages/RoomViewerPage'))
const WelcomeOnboarding = lazy(() => import('./pages/WelcomeOnboarding'))
const Test3DPage = lazy(() => import('./pages/Test3DPage'))

// Dev mode — skip auth entirely
const DEV_MODE = true
const DEV_USER = { id: 1, username: 'designer', name: 'Designer' }

export default function App() {
  const [token, setToken] = useState(() => DEV_MODE ? 'dev' : localStorage.getItem('odh_token'))
  const [user, setUser] = useState(DEV_MODE ? DEV_USER : null)
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return hash || 'studio'
  })
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [loading, setLoading] = useState(DEV_MODE ? false : !!token)
  const [playerProfile, setPlayerProfile] = useState(null)  // null = show onboarding

  useEffect(() => {
    if (DEV_MODE || !token) return
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
    setPage('studio')
  }

  const handleLogout = () => {
    if (DEV_MODE) return
    localStorage.removeItem('odh_token')
    setToken(null)
    setUser(null)
    setPage('studio')
  }

  if (!DEV_MODE && !token) {
    return <LoginScreen onLogin={handleLogin} />
  }

  // First-time user experience — show onboarding before anything else
  // Skip onboarding for test-3d page
  if (!playerProfile && page !== 'test-3d') {
    return (
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1a1612' }}>
          <div style={{ color: '#c8aa78', fontFamily: 'Georgia, serif' }}>Loading...</div>
        </div>
      }>
        <WelcomeOnboarding onComplete={(profile) => {
          setPlayerProfile(profile);
          setUser({ ...DEV_USER, ...profile, name: profile.handle });
          setPage('studio');
        }} />
      </Suspense>
    );
  }

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
        <div style={{ color: '#c8aa78', fontFamily: 'Georgia, serif' }}>Loading...</div>
      </div>
    )
  }

  const renderPage = () => {
    switch (page) {
      // ── New elevated game loop ──
      case 'studio':
        return <StudioPage setPage={setPage} setActiveChallenge={setActiveChallenge} />
      case 'briefs':
        return <BriefsPage setPage={setPage} setActiveChallenge={setActiveChallenge} />
      case 'challenge-flow':
        return <ChallengeFlow key={activeChallenge?.id || 'default'} challenge={activeChallenge} setPage={setPage} />
      case 'jury':
        return <JuryPage />
      case 'community':
        return <CommunityPage />
      case 'portfolio':
        return <PortfolioPage user={user} />
      case 'my-designs':
        return <MyDesignsPage setPage={setPage} setActiveChallenge={setActiveChallenge} />

      // ── Legacy pages (still accessible) ──
      case 'challenges':
        return <ChallengesPage setPage={setPage} setSelectedChallenge={setActiveChallenge} />
      case 'design-editor':
        return <DesignEditorPage challenge={activeChallenge} setPage={setPage} />
      case 'voting':
        return <VotingPage />
      case 'leaderboard':
        return <LeaderboardPage />
      case 'profile':
        return <ProfilePage user={user} setUser={setUser} />
      case 'catalog':
        return <FurnitureCatalogPage />
      case 'floor-plan':
        return <FloorPlanPage setPage={setPage} />
      case 'products':
        return <ProductsPage />
      case 'room-viewer':
        return <RoomViewerPage setPage={setPage} />
      case 'test-3d':
        return <Test3DPage />
      default:
        return <StudioPage setPage={setPage} setActiveChallenge={setActiveChallenge} />
    }
  }

  return (
    <Layout page={page} setPage={setPage} user={user} onLogout={handleLogout}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
          <div style={{ color: '#c8aa78', fontFamily: 'Georgia, serif', fontSize: 14 }}>Loading...</div>
        </div>
      }>
        {renderPage()}
      </Suspense>
    </Layout>
  )
}
