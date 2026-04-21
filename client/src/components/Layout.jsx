import { useState, useEffect } from 'react'
import { Menu, X, LogOut, Briefcase, FileText, Scale, Users, User, Palette } from 'lucide-react'

export default function Layout({ page, setPage, user, onLogout, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // New elevated nav — the game loop
  const navItems = [
    { id: 'studio', icon: Briefcase, label: 'Studio' },
    { id: 'my-designs', icon: Palette, label: 'My Designs' },
    { id: 'briefs', icon: FileText, label: 'Briefs' },
    { id: 'jury', icon: Scale, label: 'Jury' },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'portfolio', icon: User, label: 'Portfolio' },
  ]

  const handleNavClick = (id) => {
    setPage(id)
    setIsMobileMenuOpen(false)
  }

  // Hide chrome when inside challenge flow
  const isFullscreen = page === 'challenge-flow'
  if (isFullscreen) return <>{children}</>

  const NavLink = ({ item }) => (
    <button
      onClick={() => handleNavClick(item.id)}
      className="nav-link"
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 10,
        width: '100%', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
        background: page === item.id ? 'rgba(200,170,120,0.12)' : 'transparent',
        color: page === item.id ? '#c8aa78' : '#6a6258',
      }}
    >
      <item.icon size={18} />
      <span style={{ fontSize: 14, fontWeight: page === item.id ? 500 : 400 }}>{item.label}</span>
    </button>
  )

  const displayName = user?.name || user?.username || 'Designer'

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0a0a0a', color: '#e8e4df' }}>
        {/* Mobile top bar */}
        <div style={{
          background: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 40
        }}>
          <button onClick={() => setPage('studio')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #c8aa78, #8B6F47)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: -0.5 }}>DS</span>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#f5f0e8' }}>Design Studio</span>
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', color: '#6a6258', cursor: 'pointer', padding: 4 }}>
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div style={{
            background: '#111', borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: 12, position: 'absolute', top: 52, left: 0, right: 0, zIndex: 30, boxShadow: '0 16px 48px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '8px 16px', marginBottom: 8 }}>
              <p style={{ color: '#e8e4df', fontSize: 14, fontWeight: 500 }}>{displayName}</p>
              <p style={{ color: '#5a5248', fontSize: 12 }}>@{user?.username}</p>
            </div>
            {navItems.map(item => <NavLink key={item.id} item={item} />)}
          </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>{children}</main>

        {/* Bottom tab bar */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '6px 4px', display: 'flex', justifyContent: 'space-around'
        }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => handleNavClick(item.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: page === item.id ? '#c8aa78' : '#4a4238', transition: 'color 0.2s'
            }}>
              <item.icon size={19} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#e8e4df' }}>
      <aside style={{
        width: 220, background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: 20, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        {/* Logo */}
        <button onClick={() => setPage('studio')} style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, padding: '4px 8px',
          background: 'none', border: 'none', cursor: 'pointer'
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #c8aa78, #8B6F47)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: -0.5 }}>DS</span>
          </div>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#f5f0e8', fontWeight: 500, lineHeight: 1.2 }}>Design</h1>
            <p style={{ fontSize: 10, color: '#5a5248', letterSpacing: 2, textTransform: 'uppercase' }}>Studio</p>
          </div>
        </button>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => <NavLink key={item.id} item={item} />)}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, marginTop: 16 }}>
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <p style={{ color: '#e8e4df', fontSize: 13, fontWeight: 500 }}>{displayName}</p>
            <p style={{ color: '#5a5248', fontSize: 11 }}>@{user?.username}</p>
          </div>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 8, width: '100%',
            background: 'transparent', border: 'none', color: '#4a4238', cursor: 'pointer', fontSize: 13
          }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
    </div>
  )
}
