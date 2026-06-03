import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import pb from '@/lib/pocketbase'
import { 
  User, Users, Mail, Building2, Lock, Save, Palette, Check, 
  Loader2, FileText, Briefcase, Database, Webhook, Layers,
  Plus, Shield, HelpCircle, MessageSquare, Copy, Edit, Trash2,
  Download, Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useTheme, type ThemeName } from '@/contexts/ThemeContext'
import { Label } from '@/components/ui/label'
import { CustomFieldsTab } from '@/components/CustomFieldsTab'
import { UsersTab } from '@/components/UsersTab'
import { useEmployee } from '@/hooks/useEmployee'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const inputClass = "w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))]/20 focus:border-[rgb(var(--ns-accent))] transition-all bg-white"

const EVENT_COLORS: Record<string, string> = {
  'contact.created': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'intake.approved': 'bg-purple-50 text-purple-700 border-purple-100',
  'deal.won':        'bg-emerald-50 text-emerald-700 border-emerald-100',
  'invoice.paid':    'bg-amber-50 text-amber-700 border-amber-100',
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const { data: employee } = useEmployee()

  const personalTabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'work', label: 'Work Profile', icon: Briefcase },
  ]

  const teamTabs = isAdmin ? [
    { id: 'users', label: 'Users', icon: Users },
  ] : []

  const systemTabs = isAdmin ? [
    { id: 'custom-fields', label: 'Custom Fields', icon: Layers },
    { id: 'canned-responses', label: 'Canned Responses', icon: FileText },
    { id: 'data', label: 'Data & Export', icon: Database },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook }
  ] : [
    { id: 'canned-responses', label: 'Canned Responses', icon: FileText },
  ]
  
  const allTabs = [...personalTabs, ...teamTabs, ...systemTabs]
  type TabId = 'work' | 'security' | 'appearance' | 'canned-responses' | 'custom-fields' | 'users' | 'data' | 'webhooks'
  const [activeTab, setActiveTab] = useState<TabId>('appearance')
  
  // Profile state
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setCompany(user.companyName || '')
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await pb.collection('users').update(user.id, {
        name,
        companyName: company
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      await pb.collection('users').update(user!.id, {
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const renderNavItems = (tabsList: any[]) => {
    return tabsList.map((tab) => {
      const Icon = tab.icon
      const isActive = activeTab === tab.id
      return (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as TabId)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer",
            isActive 
              ? "text-white shadow-sm" 
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
          style={isActive ? { backgroundColor: 'rgb(var(--ns-accent))' } : undefined}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {tab.label}
        </button>
      )
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar Nav */}
      <aside className="w-56 flex-shrink-0 hidden md:block">
        <div className="sticky top-0 pt-6 px-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Shield className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Settings</p>
              </div>
              <nav className="p-2 space-y-4">
                <div className="space-y-0.5">
                  {renderNavItems(personalTabs)}
                </div>
                
                {teamTabs.length > 0 && (
                  <>
                    <div className="h-px bg-slate-100 mx-2" />
                    <div className="space-y-0.5">
                      {renderNavItems(teamTabs)}
                    </div>
                  </>
                )}

                <div className="h-px bg-slate-100 mx-2" />
                <div className="space-y-0.5">
                  {renderNavItems(systemTabs)}
                </div>
              </nav>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => navigate('/help?tab=settings')}
                  className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[rgb(var(--ns-accent))] bg-slate-50 hover:bg-[rgb(var(--ns-accent))]/10 border border-slate-200 hover:border-[rgb(var(--ns-accent))]/30 rounded-lg px-3 py-2 transition-colors w-full"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-8 py-8 max-w-5xl overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{allTabs.find((t: any) => t.id === activeTab)?.label}</h1>
          <p className="text-slate-500 mt-1">Manage your {activeTab.replace('-', ' ')} preferences and information</p>
        </div>

        <div className="min-w-0 flex-1">
          {/* Work Profile Tab */}
          {activeTab === 'work' && (
            <div className="space-y-8">
              <div id="account-information" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[rgb(var(--ns-accent))] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{user?.name || 'User'}</p>
                    <p className="text-sm text-slate-500">{user?.email || ''}</p>
                  </div>
                </div>
                <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                  <div id="full-name">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5"><User className="w-3.5 h-3.5" /> Full name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your full name" />
                  </div>
                  <div id="email-address">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5"><Mail className="w-3.5 h-3.5" /> Email address</label>
                    <input type="email" value={user?.email || ''} disabled className={`${inputClass} bg-slate-50 text-slate-400 cursor-not-allowed`} />
                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div id="company-name">
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

              <div id="official-work-profile" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" /><h3 className="font-semibold text-slate-900">Work Profile</h3></div>
                  <p className="text-sm text-slate-500 mt-1">This is your official company information.</p>
                </div>
                {employee ? (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-slate-400">Employee ID</Label>
                      <p className="text-sm font-semibold text-slate-900">{employee.employee_id || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-slate-400">Department</Label>
                      <p className="text-sm font-semibold text-slate-900">{employee.department || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-slate-400">Job Title</Label>
                      <p className="text-sm font-semibold text-slate-900">{employee.job_title || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-slate-400">Manager</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {(employee as any).expand?.managerId?.name?.charAt(0) || '?'}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{(employee as any).expand?.managerId?.name || 'No Manager'}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-slate-400">Hire Date</Label>
                      <p className="text-sm font-semibold text-slate-900">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase text-slate-400">Role Type</Label>
                      <Badge className="bg-slate-100 text-slate-600 border-none capitalize">{employee.rol_type}</Badge>
                    </div>
                    
                    <div className="col-span-2 pt-4 border-t border-slate-50">
                      <Button variant="outline" size="sm" onClick={() => navigate('/hr')} className="text-xs">
                        <Users className="w-3.5 h-3.5 mr-1.5" /> View Company Directory
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-medium">Loading your workforce record...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div id="change-password" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900">Change Password</h3>
                  <p className="text-sm text-slate-500 mt-1">Update your login credentials</p>
                </div>
                <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Current password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">New password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1.5">Confirm password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="pt-1">
                    <button type="submit" disabled={changingPassword} className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                      {changingPassword ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Accent Colour</h3>
                <p className="text-sm text-slate-500 mt-1">Personalize the application's look</p>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-4">
                  {(['indigo', 'violet', 'emerald', 'orange'] as ThemeName[]).map((tName) => (
                    <button
                      key={tName}
                      onClick={() => setTheme(tName)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer",
                        theme === tName 
                          ? "border-[rgb(var(--ns-accent))] bg-[rgb(var(--ns-accent))]/5 text-[rgb(var(--ns-accent))] ring-2 ring-[rgb(var(--ns-accent))]/10" 
                          : "border-slate-200 hover:border-slate-300 text-slate-600"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-full", tName === 'indigo' ? 'bg-indigo-600' : tName === 'violet' ? 'bg-violet-600' : tName === 'emerald' ? 'bg-emerald-600' : 'bg-orange-600')} />
                      <span className="text-sm font-semibold capitalize">{tName}</span>
                      {theme === tName && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Restored Tabs */}
          {activeTab === 'custom-fields' && isAdmin && <CustomFieldsTab />}
          
          {activeTab === 'users' && isAdmin && <UsersTab currentUserId={user?.id || ''} />}

          {activeTab === 'data' && isAdmin && <DataTab />}

          {activeTab === 'webhooks' && isAdmin && <WebhooksTab />}

          {activeTab === 'canned-responses' && (
            <div className="space-y-8">
              <TemplatesTab />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string>('email')

  // Filter/Search states
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      return await pb.collection('templates').getFullList({
        sort: '-created',
      })
    },
  })

  // Mutations
  const createTemplate = useMutation({
    mutationFn: async (data: any) => {
      return await pb.collection('templates').create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template created successfully')
      handleClose()
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create template')
    }
  })

  const updateTemplate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await pb.collection('templates').update(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template updated successfully')
      handleClose()
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update template')
    }
  })

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      return await pb.collection('templates').delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success('Template deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete template')
    }
  })

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
    setTitle('')
    setSubject('')
    setContent('')
    setCategory('email')
  }

  const handleEditInit = (tmpl: any) => {
    setEditingId(tmpl.id)
    setTitle(tmpl.title || '')
    setSubject(tmpl.subject || '')
    setContent(tmpl.content || '')
    setCategory(tmpl.category || 'email')
    setOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !category) {
      toast.error('Title, Content, and Category are required')
      return
    }

    const payload = {
      title,
      subject: ['email', 'invoice_reminder', 'proposal'].includes(category) ? subject : '',
      content,
      category,
    }

    if (editingId) {
      updateTemplate.mutate({ id: editingId, data: payload })
    } else {
      createTemplate.mutate(payload)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Template content copied to clipboard!')
  }

  // Filter templates
  const filteredTemplates = templates.filter((tmpl: any) => {
    const matchesSearch =
      tmpl.title?.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.subject?.toLowerCase().includes(search.toLowerCase()) ||
      tmpl.content?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory = activeCategory === 'all' || tmpl.category === activeCategory

    return matchesSearch && matchesCategory
  })

  const categoryColors: Record<string, string> = {
    email: 'bg-blue-50 text-blue-700 border-blue-100',
    invoice_reminder: 'bg-orange-50 text-orange-700 border-orange-100',
    proposal: 'bg-purple-50 text-purple-700 border-purple-100',
    sms: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    other: 'bg-slate-100 text-slate-600 border-slate-200',
  }

  const categoryLabels: Record<string, string> = {
    email: 'Email',
    invoice_reminder: 'Invoice Reminder',
    proposal: 'Proposal',
    sms: 'SMS',
    other: 'Other',
  }

  const categories = ['all', 'email', 'invoice_reminder', 'proposal', 'sms', 'other']

  const textareaClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400 transition-shadow min-h-[140px] resize-y font-mono text-xs'

  return (
    <div className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            Canned Responses & Templates
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Quickly copy canned messages or use them to send invoices.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-1.5 self-start bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white text-xs font-semibold px-3 py-1.5 h-8">
          <Plus className="w-3.5 h-3.5" />
          Add Template
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat === 'all' ? 'All' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400"
          />
          <span className="absolute left-2.5 top-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <FileText className="w-10 h-10 text-slate-200 mb-2" />
          <p className="text-sm font-semibold text-slate-500">No templates found</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            {search || activeCategory !== 'all'
              ? 'No templates match your filters. Try clearing your search.'
              : 'Create your first canned response template to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tmpl: any) => (
            <div key={tmpl.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group">
              <div className="p-4 space-y-3">
                {/* Card Title & Category */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-900 text-sm group-hover:text-[rgb(var(--ns-accent))] transition-colors truncate">
                    {tmpl.title}
                  </h4>
                  <Badge className={`${categoryColors[tmpl.category] || categoryColors.other} text-[9px] px-1.5 py-0.5 whitespace-nowrap`}>
                    {categoryLabels[tmpl.category] || tmpl.category}
                  </Badge>
                </div>

                {/* Subject (if applicable) */}
                {tmpl.subject && (
                  <div className="text-[11px] bg-slate-50 border border-slate-100 p-2 rounded-lg text-slate-600 font-medium truncate">
                    <span className="text-slate-400 font-semibold mr-1.5">Subject:</span>
                    {tmpl.subject}
                  </div>
                )}

                {/* Content Area */}
                <div className="relative">
                  <pre className="text-xs text-slate-500 font-mono whitespace-pre-wrap line-clamp-4 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/50 min-h-[80px] break-words">
                    {tmpl.content}
                  </pre>
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between">
                {/* Variable Placeholder Hints */}
                <div className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]" title="Supports template placeholders like {client_name}, {invoice_number}">
                  Supports {`{...}`} tags
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(tmpl.content)}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 flex items-center gap-1"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditInit(tmpl)}
                    className="h-7 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this template?')) {
                        deleteTemplate.mutate(tmpl.id)
                      }
                    }}
                    className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[rgb(var(--ns-accent))]" />
              {editingId ? 'Edit Message Template' : 'Create Message Template'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Template Title *</Label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Invoice Overdue Follow-up"
                className={inputClass}
              />
              <p className="text-[10px] text-slate-400">Descriptive name for internal search/lookup.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="invoice_reminder">Invoice Reminder</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Tags Hint */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg col-span-2 sm:col-span-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Available Auto-tags:</span>
                <span className="text-[9px] text-slate-500 font-mono leading-relaxed">
                  {`{client_name}, {invoice_number}, {invoice_amount}, {due_date}, {sender_name}, {contact_name}, {company_name}, {deal_title}`}
                </span>
              </div>
            </div>

            {/* Subject (Conditional) */}
            {['email', 'invoice_reminder', 'proposal'].includes(category) && (
              <div className="space-y-1.5">
                <Label>Email Subject Line</Label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Reminder: Invoice {invoice_number} is past due"
                  className={inputClass}
                />
              </div>
            )}

            {/* Message Body */}
            <div className="space-y-1.5">
              <Label>Message Content *</Label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your canned message content here. Use {tags} to automatically inject client or invoice variables."
                className={textareaClass}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                type="submit"
                disabled={createTemplate.isPending || updateTemplate.isPending}
                className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white"
              >
                {editingId ? 'Save Changes' : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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

function WebhooksTab() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [url, setUrl] = useState('')
  const [event, setEvent] = useState('contact.created')
  const [isActive, setIsActive] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => pb.collection('webhooks').getFullList({ sort: '-created' })
  })

  const createWebhook = useMutation({
    mutationFn: (data: { url: string; event: string; isActive: boolean }) =>
      pb.collection('webhooks').create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      setOpen(false)
      setUrl('')
      setEvent('contact.created')
      setIsActive(true)
      toast.success('Webhook created successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create webhook')
  })

  const updateWebhook = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { url: string; event: string; isActive: boolean } }) =>
      pb.collection('webhooks').update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      setEditingId(null)
      setUrl('')
      setEvent('contact.created')
      setIsActive(true)
      toast.success('Webhook updated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update webhook')
  })

  const deleteWebhook = useMutation({
    mutationFn: (id: string) => pb.collection('webhooks').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      toast.success('Webhook deleted successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete webhook')
  })

  const handleTestWebhook = async (wh: any) => {
    setTestingId(wh.id)
    try {
      const samplePayload = {
        event: wh.event,
        timestamp: new Date().toISOString(),
        isTest: true,
        payload: getSamplePayload(wh.event)
      }
      
      await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nova-CRM-Webhook-Tester/1.0'
        },
        body: JSON.stringify(samplePayload),
        mode: 'no-cors'
      })
      
      toast.success(`Simulated event sent successfully to: ${wh.url}`)
    } catch (err: any) {
      toast.error(`Webhook target unreachable: ${err.message || 'Connection refused'}`)
    } finally {
      setTestingId(null)
    }
  }

  const handleEditInit = (wh: any) => {
    setEditingId(wh.id)
    setUrl(wh.url)
    setEvent(wh.event)
    setIsActive(wh.isActive)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    
    if (editingId) {
      updateWebhook.mutate({ id: editingId, data: { url, event, isActive } })
    } else {
      createWebhook.mutate({ url, event, isActive })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Outbound Webhooks</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">Configure endpoints to receive automated POST requests on workspace events.</p>
          </div>
          <Button 
            onClick={() => { setEditingId(null); setUrl(''); setEvent('contact.created'); setIsActive(true); setOpen(true) }}
            className="flex items-center gap-1.5 text-xs h-9 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white font-medium"
          >
            <Plus className="w-4 h-4" /> Add Webhook
          </Button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            Loading webhooks...
          </div>
        ) : !webhooks || webhooks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center max-w-md mx-auto">
            <Webhook className="w-10 h-10 text-slate-200 mb-3" />
            <p className="font-medium text-slate-700">No webhooks registered</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Connect external services like n8n, Make, or custom API endpoints to trigger automated flows on contacts, won deals, paid invoices, and approvals.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {webhooks.map((wh) => (
              <div key={wh.id} className="p-5 flex items-start justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <Badge className={`${EVENT_COLORS[wh.event] || 'bg-slate-50 text-slate-700 border-slate-100'} text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider shadow-none border`}>
                      {wh.event}
                    </Badge>
                    {!wh.isActive && (
                      <Badge className="bg-slate-100 text-slate-400 border-slate-200 text-[10px] px-1.5 py-0.5 font-bold uppercase tracking-wider shadow-none border">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-1 select-all break-all w-fit max-w-full">
                    {wh.url}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestWebhook(wh)}
                    disabled={testingId === wh.id}
                    className="h-8 text-xs border-slate-200 text-slate-600 flex items-center gap-1 hover:bg-slate-100"
                  >
                    {testingId === wh.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { handleEditInit(wh); setOpen(true) }}
                    className="h-8 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { if (confirm('Delete this webhook?')) deleteWebhook.mutate(wh.id) }}
                    className="h-8 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); setEditingId(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Webhook' : 'Add Webhook'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Target URL *</Label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://n8n.yourdomain.com/webhook/..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400 transition-shadow"
              />
              <p className="text-[10px] text-slate-400">The destination URL that gets notified via POST requests with event payloads.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Trigger Event *</Label>
              <Select value={event} onValueChange={setEvent}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact.created">contact.created (Contact created)</SelectItem>
                  <SelectItem value="deal.won">deal.won (Deal stage won)</SelectItem>
                  <SelectItem value="invoice.paid">invoice.paid (Invoice approved/paid)</SelectItem>
                  <SelectItem value="intake.approved">intake.approved (Intake submission approved)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-slate-800">Active Status</Label>
                <p className="text-[10px] text-slate-400">Enable or disable this webhook trigger instantly.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-[rgb(var(--ns-accent))]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createWebhook.isPending || updateWebhook.isPending}>
                {editingId ? 'Save Changes' : 'Create Webhook'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getSamplePayload(event: string) {
  switch (event) {
    case 'contact.created':
      return { id: 'test_contact_123', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', title: 'Director', companyId: 'test_company_456' }
    case 'intake.approved':
      return { id: 'test_intake_123', name: 'Sarah Smith', email: 'sarah@example.com', type: 'demo', some_data: 'test' }
    case 'deal.won':
      return { id: 'test_deal_123', title: 'Enterprise SLA Renewal', value: 25000, stage: 'won', contactId: 'test_contact_123' }
    case 'invoice.paid':
      return { id: 'test_invoice_123', title: 'Invoice #NS-1024', invoiceNumber: 'NS-1024', amount: 8400, status: 'paid', dueDate: new Date().toISOString().split('T')[0] }
    default:
      return { msg: 'Test payload' }
  }
}
