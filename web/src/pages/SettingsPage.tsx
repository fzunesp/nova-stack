import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import pb from '@/lib/pocketbase'
import { User, Mail, Building2, Lock, Save, Palette, Check, Shield, Trash2, UserPlus, Loader2, Database, Download } from 'lucide-react'
import { useTheme, type ThemeName } from '@/contexts/ThemeContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const THEMES: { id: ThemeName; label: string; description: string; hex: string; hexDark: string }[] = [
  { id: 'indigo', label: 'Indigo', description: 'Classic & trustworthy', hex: '#4f46e5', hexDark: '#4338ca' },
  { id: 'violet', label: 'Violet', description: 'Bold & premium', hex: '#7c3aed', hexDark: '#6d28d9' },
  { id: 'emerald', label: 'Emerald', description: 'Fresh & distinctive', hex: '#10b981', hexDark: '#059669' },
  { id: 'orange', label: 'Orange', description: 'Warm & energetic', hex: '#ea580c', hexDark: '#c2410c' },
]

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-100',
  hr:    'bg-amber-50 text-amber-700 border-amber-100',
  user:  'bg-slate-100 text-slate-600 border-slate-200',
}

export function SettingsPage() {
  const { user, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'appearance', label: 'Appearance' },
    ...(isAdmin ? [
      { id: 'users', label: 'Users' },
      { id: 'data', label: 'Data & Export' }
    ] : []),
  ] as const
  type TabId = typeof tabs[number]['id']

  const [activeTab, setActiveTab] = useState<TabId>('profile')
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
            onClick={() => setActiveTab(tab.id as TabId)}
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

      {/* Users Tab — Admin Only */}
      {activeTab === 'users' && isAdmin && <UsersTab currentUserId={(user as any)?.id} />}

      {/* Data Tab — Admin Only */}
      {activeTab === 'data' && isAdmin && <DataTab />}
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'hr' | 'user'>('user')
  const [invitePassword, setInvitePassword] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => pb.collection('users').getFullList({ sort: 'name' }),
  })

  const createUser = useMutation({
    mutationFn: () =>
      pb.collection('users').create({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        password: invitePassword,
        passwordConfirm: invitePassword,
        emailVisibility: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setInviteOpen(false)
      setInviteEmail(''); setInviteName(''); setInvitePassword(''); setInviteRole('user')
      toast.success('User created successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create user'),
  })

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      pb.collection('users').update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Role updated')
    },
    onError: () => toast.error('Failed to update role'),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => pb.collection('users').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User removed')
    },
    onError: () => toast.error('Failed to remove user'),
  })

  const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">User Management</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">Add, manage roles, and remove workspace members.</p>
          </div>
          <Button onClick={() => setInviteOpen(true)} size="sm" className="flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" /> Add User
          </Button>
        </div>

        {/* User List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {(users || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[rgb(var(--ns-accent))] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {u.name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{u.name || '—'}</span>
                    {u.id === currentUserId && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">You</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>

                {/* Role badge + selector */}
                <div className="flex items-center gap-2">
                  <Badge className={`${ROLE_COLORS[u.role] || ROLE_COLORS.user} text-[10px] px-2 py-0.5 capitalize font-semibold`}>
                    {u.role || 'user'}
                  </Badge>
                  {u.id !== currentUserId && (
                    <Select
                      value={u.role || 'user'}
                      onValueChange={(val) => changeRole.mutate({ id: u.id, role: val })}
                    >
                      <SelectTrigger className="h-7 text-xs w-24 border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Delete — cannot delete self */}
                {u.id !== currentUserId && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${u.name || u.email} from the workspace?`)) {
                        deleteUser.mutate(u.id)
                      }
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                    title="Remove user"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Role legend */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Role permissions</p>
          <div className="space-y-1 text-xs text-slate-500">
            <p><span className="font-semibold text-red-600">Admin</span> — Full access, user management, all settings</p>
            <p><span className="font-semibold text-amber-600">HR</span> — Standard access + Intake approvals + Activity Feed</p>
            <p><span className="font-semibold text-slate-600">User</span> — CRM, Tasks, Invoices, personal Dashboard</p>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add New User
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createUser.mutate() }}
            className="space-y-4 pt-1"
          >
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                placeholder="Jane Smith"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="jane@company.com"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password *</Label>
              <input
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                minLength={8}
                className={inputClass}
              />
              <p className="text-xs text-slate-400">Share this password with the user. They can change it in Settings.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User — Standard access</SelectItem>
                  <SelectItem value="hr">HR — Standard + Intake approvals</SelectItem>
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Data & Export Tab ────────────────────────────────────────────────────────

function DataTab() {
  const [exporting, setExporting] = useState<string | null>(null)
  const [backingUp, setBackingUp] = useState(false)

  // Fetch last backup info
  const { data: backups, isLoading: backupsLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      try {
        return await pb.backups.getFullList()
      } catch (err) {
        return [] // Silently fail if not superuser
      }
    },
    retry: false,
  })

  const lastBackup = backups?.[0]

  const handleBackup = async () => {
    setBackingUp(true)
    try {
      const res = await fetch(`${pb.baseUrl}/api/app-backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pb.authStore.token}`
        }
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to download backup')
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Provide a reasonable filename based on content disposition or fallback
      const contentDisposition = res.headers.get('content-disposition')
      let filename = `nova_stack_backup_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.db`
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '')
      } else if (res.headers.get('content-type')?.includes('zip')) {
        filename = filename.replace('.db', '.zip')
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Backup created and downloaded')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to download backup.')
    } finally {
      setBackingUp(false)
    }
  }

  const handleExport = async (collection: string, label: string) => {
    setExporting(collection)
    try {
      const records = await pb.collection(collection).getFullList()
      if (!records.length) {
        toast.error(`No records found for ${label}`)
        return
      }

      // Extract headers from first record, excluding system fields
      const excludeKeys = ['collectionId', 'collectionName', 'expand']
      const headers = Object.keys(records[0]).filter(k => !excludeKeys.includes(k))
      
      const csvContent = [
        headers.join(','),
        ...records.map(r => headers.map(h => {
          let val = r[h]
          if (typeof val === 'object') val = JSON.stringify(val)
          return `"${String(val || '').replace(/"/g, '""')}"`
        }).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nova_${collection}_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      toast.success(`${label} exported successfully`)
    } catch (err: any) {
      toast.error(err.message || `Failed to export ${label}`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Backup Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-900">System Backup</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">Generate and download a full snapshot of your database and files.</p>
        </div>
        
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Full System Backup</p>
            {backupsLoading ? (
              <p className="text-xs text-slate-400 mt-1">Checking backup status...</p>
            ) : lastBackup ? (
              <p className="text-xs text-slate-400 mt-1">
                Last backup: {new Date(lastBackup.modified).toLocaleString()} ({Math.round(lastBackup.size / 1024 / 1024)} MB)
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">No recent backups found</p>
            )}
          </div>
          <Button 
            onClick={handleBackup} 
            disabled={backingUp}
            className="flex items-center gap-2"
          >
            {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {backingUp ? 'Generating...' : 'Download Backup'}
          </Button>
        </div>
      </div>

      {/* CSV Export Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Data Export (CSV)</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">Export your workspace data to CSV format for external analysis.</p>
        </div>
        
        <div className="divide-y divide-slate-100">
          {[
            { id: 'contacts', label: 'Contacts', count: 'All contacts' },
            { id: 'deals', label: 'Deals', count: 'All pipelines' },
            { id: 'invoices', label: 'Invoices', count: 'Including line items JSON' },
          ].map((item) => (
            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-400 mt-1">{item.count}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport(item.id, item.label)}
                disabled={exporting === item.id}
                className="flex items-center gap-2"
              >
                {exporting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export CSV
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

