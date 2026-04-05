import { useState, useEffect } from 'react'
import { Menu, X, Trophy, Paintbrush, ThumbsUp, Medal, Sofa, User, LogOut, Home } from 'lucide-react'

export default function Layout({ page, setPage, user, onLogout, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const navItems = [
    { id: 'challenges', icon: Trophy, label: 'Challenges' },
    { id: 'voting', icon: ThumbsUp, label: 'Vote' },
    { id: 'leaderboard', icon: Medal, label: 'Leaders' },
    { id: 'catalog', icon: Sofa, label: 'Browse' },
    { id: 'profile', icon: User, label: 'Profile' },
  ]

  const handleNavClick = (id) => {
    setPage(id)
    setIsMobileMenuOpen(false)
  }

  const NavLink = ({ item }) => (
    <button
      onClick={() => handleNavClick(item.id)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition w-full ${
        page === item.id
          ? 'bg-indigo-500/20 text-indigo-400'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <item.icon size={18} />
      <span className="font-medium text-sm">{item.label}</span>
    </button>
  )

  const displayName = user?.name || user?.username || 'Designer'

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        {/* Mobile top bar */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex justify-between items-center sticky top-0 z-40">
          <button onClick={() => setPage('challenges')} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Home size={14} className="text-white" />
            </div>
            <span className="font-bold text-base text-white">Open Design Home</span>
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 hover:text-white p-1"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {isMobileMenuOpen && (
          <div className="bg-gray-800 border-b border-gray-700 p-3 space-y-1 absolute top-14 left-0 right-0 z-30 shadow-xl">
            <div className="px-4 py-2 mb-1">
              <p className="text-white font-medium text-sm">{displayName}</p>
              <p className="text-gray-500 text-xs">@{user?.username}</p>
            </div>
            {navItems.map((item) => (
              <NavLink key={item.id} item={item} />
            ))}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition"
            >
              <LogOut size={18} />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        )}

        <main className="flex-1 overflow-auto pb-20">
          {children}
        </main>

        {/* Bottom tab bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-1 py-1.5 flex justify-around safe-area-bottom">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition min-w-0 ${
                page === item.id ? 'text-indigo-400' : 'text-gray-500'
              }`}
            >
              <item.icon size={19} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    )
  }

  // Desktop layout
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 p-4 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <button onClick={() => setPage('challenges')} className="flex items-center gap-2.5 mb-6 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Home size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight">Open Design Home</h1>
          </div>
        </button>

        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>

        <div className="border-t border-gray-800 pt-3 mt-3">
          <div className="px-3 mb-2">
            <p className="text-white font-medium text-sm">{displayName}</p>
            <p className="text-gray-500 text-xs">@{user?.username}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-white transition w-full"
          >
            <LogOut size={16} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
