import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import pb from '@/lib/pocketbase'
import { User, Mail, Building2, Lock, Save, Palette, Check } from 'lucide-react'
import { useTheme, type ThemeName } from '@/contexts/ThemeContext'

const THEMES: { id: ThemeName; label: string; description: string; hex: string; hexDark: string }[] = [
  { id: 'indigo', label: 'Indigo', description: 'Classic & trustworthy', hex: '#4f46e5', hexDark: '#4338ca' },
  { id: 'violet', label: 'Violet', description: 'Bold & premium', hex: '#7c3aed', hexDark: '#6d28d9' },
  { id: 'emerald', label: 'Emerald', description: 'Fresh & distinctive', hex: '#10b981', hexDark: '#059669' },
  { id: 'orange', label: 'Orange', description: 'Warm & energetic', hex: '#ea580c', hexDark: '#c2410c' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState((user as any)?.name || '')
  const [company, setCompany] = useState((user as any)?.companyName || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await pb.collection('users').update((user as any).id, { name, companyName: company })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      await pb.collection('users').update((user as any).id, {
        oldPassword: currentPassword, password: newPassword, passwordConfirm: confirmPassword,
      })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'appearance', label: 'Appearance' },
  ] as const

  const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400 transition-shadow'

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[rgb(var(--ns-accent))] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {(user as any)?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{(user as any)?.name || 'User'}</p>
              <p className="text-sm text-slate-500">{(user as any)?.email || ''}</p>
            </div>
          </div>
          <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5"><User className="w-3.5 h-3.5" /> Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5"><Mail className="w-3.5 h-3.5" /> Email address</label>
              <input type="email" value={(user as any)?.email || ''} disabled className={`${inputClass} bg-slate-50 text-slate-400 cursor-not-allowed`} />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5"><Building2 className="w-3.5 h-3.5" /> Company name</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} placeholder="Your company" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Saved!</span>}
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-slate-400" /><h3 className="font-semibold text-slate-900">Change password</h3></div>
            <p className="text-sm text-slate-500 mt-1">Use a strong password you don't use elsewhere.</p>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            {pwError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{pwError}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputClass} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm">
                <Lock className="w-3.5 h-3.5" />
                {saving ? 'Updating...' : 'Update password'}
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">✓ Updated!</span>}
            </div>
          </form>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2"><Palette className="w-4 h-4 text-slate-400" /><h3 className="font-semibold text-slate-900">Accent colour</h3></div>
              <p className="text-sm text-slate-500 mt-1">Changes the sidebar highlight, buttons, and interactive elements across the entire app.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      theme === t.id ? 'border-[rgb(var(--ns-accent))] bg-slate-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Colour swatch */}
                    <div className="flex-shrink-0 flex gap-1">
                      <div className="w-8 h-8 rounded-lg shadow-sm" style={{ backgroundColor: t.hex }} />
                      <div className="w-3 h-8 rounded-r-lg shadow-sm" style={{ backgroundColor: t.hexDark }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                      <p className="text-xs text-slate-500">{t.description}</p>
                    </div>
                    {theme === t.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: t.hex }}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">Your preference is saved automatically and persists between sessions.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
