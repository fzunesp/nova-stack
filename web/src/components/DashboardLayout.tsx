import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, CheckSquare, FileText, Inbox, Settings,
  LogOut, Menu, X, Users, Search, Bell, Plus, HelpCircle,
  ChevronLeft, ChevronRight, ChevronDown, Briefcase,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const navSections = [
  {
    label: 'WORKSPACE',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/crm', icon: Users, label: 'CRM' },
      { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/invoices', icon: FileText, label: 'Invoices' },
      { to: '/intake', icon: Inbox, label: 'Intake' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
      { to: '/help', icon: HelpCircle, label: 'Help' },
    ],
  },
]

const quickCreateItems = [
  { label: 'Task', icon: CheckSquare, path: '/tasks', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { label: 'Invoice', icon: FileText, path: '/invoices', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { label: 'Contact', icon: Users, path: '/crm', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', tab: 'contacts' },
  { label: 'Deal', icon: Briefcase, path: '/crm', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', tab: 'deals' },
  { label: 'Intake', icon: Inbox, path: '/intake', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
]

const Logo = () => (
  <div className="w-8 h-8 bg-[rgb(var(--ns-accent))] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  </div>
)

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const quickCreateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setQuickCreateOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const handleQuickCreate = (item: typeof quickCreateItems[0]) => {
    setQuickCreateOpen(false)
    const state: Record<string, unknown> = { openCreate: true }
    if (item.tab) state.tab = item.tab
    navigate(item.path, { state })
  }

  const currentPage = navSections
    .flatMap((s) => s.items)
    .find((item) => location.pathname.startsWith(item.to))?.label || 'Dashboard'

  const userInitial = (user as any)?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-all duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${collapsed ? 'w-16' : 'w-60'}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-slate-800 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {collapsed ? (
            <Logo />
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <Logo />
                <span className="text-[15px] font-semibold text-white tracking-tight">NovaStack</span>
              </div>
              <button className="lg:hidden p-1 rounded-md hover:bg-slate-800 text-slate-400" onClick={() => setSidebarOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-5 overflow-y-auto space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center px-2' : 'px-3'} ${isActive ? 'bg-[rgb(var(--ns-accent))] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
                    }
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="px-2 pb-2 hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-full flex items-center gap-2 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors ${collapsed ? 'justify-center px-2' : 'px-3'}`}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>

        {/* User section */}
        <div className="p-2 border-t border-slate-800 flex-shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--ns-accent))] flex items-center justify-center text-white text-xs font-bold">{userInitial}</div>
              <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400" title="Sign out">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--ns-accent))] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{userInitial}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{(user as any)?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{(user as any)?.email || ''}</p>
              </div>
              <button onClick={handleLogout} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-slate-700 transition-all" title="Sign out">
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-500" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-[15px] font-semibold text-slate-900">{currentPage}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input className="bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none w-36" placeholder="Search..." />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[rgb(var(--ns-accent))] rounded-full" />
            </button>
            {/* Quick-create dropdown */}
            <div ref={quickCreateRef} className="relative">
              <button
                onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                className="flex items-center gap-1.5 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
                <ChevronDown className="w-3 h-3 hidden sm:block opacity-70" />
              </button>
              {quickCreateOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                  <p className="px-3 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Create new</p>
                  {quickCreateItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleQuickCreate(item)}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 transition-colors text-left"
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${item.iconBg}`}>
                        <item.icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                      </span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
