import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, Shield, UserPlus, Loader2, Edit, UserMinus, UserCheck, Eye, EyeOff, Trash2 
} from 'lucide-react'
import pb from '@/lib/pocketbase'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-100',
  hr:    'bg-amber-50 text-amber-700 border-amber-100',
  user:  'bg-slate-100 text-slate-600 border-slate-200',
}

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400'

export function UsersTab({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'hr' | 'user'>('user')
  const [invitePassword, setInvitePassword] = useState('')
  const [showInvitePassword, setShowInvitePassword] = useState(false)

  // Edit User State
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  useEffect(() => {
    if (editingUser) {
      setEditName(editingUser.name || '')
      setEditEmail(editingUser.email || '')
      setEditIsActive(editingUser.isActive)
    }
  }, [editingUser])

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => pb.collection('users').getFullList({ sort: 'name' }),
  })

  const createUser = useMutation({
    mutationFn: async () => {
      const newUser = await pb.collection('users').create({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        password: invitePassword,
        passwordConfirm: invitePassword,
        emailVisibility: true,
        isActive: true,
        mustChangePassword: true,
      })
      return { user: newUser, password: invitePassword }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setInviteOpen(false)
      
      // Send welcome email (fire and forget, don't block UI)
      pb.send('/api/send-welcome', {
        method: 'POST',
        body: { userId: data.user.id, password: data.password }
      }).catch(err => console.error('Failed to send welcome email:', err))

      setInviteEmail(''); setInviteName(''); setInvitePassword(''); setInviteRole('user')
      toast.success('User created and welcome email queued')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create user'),
  })

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const updateData = { ...data, emailVisibility: true }
      // If deactivating, revoke all entitlements to match HR view logic
      if (data.isActive === false) {
        updateData.access_desktop = false
        updateData.access_mobile = false
      }
      return pb.collection('users').update(id, updateData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['user', data.id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setEditOpen(false)
      setEditingUser(null)
      toast.success('User updated successfully')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update user'),
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

  const toggleUserStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      pb.collection('users').update(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(variables.isActive ? 'User activated' : 'User deactivated')
    },
    onError: () => toast.error('Failed to update user status'),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => pb.collection('users').delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User permanently deleted')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete user'),
  })

  const handleEditInit = (u: any) => {
    setEditingUser(u)
    setEditName(u.name || '')
    setEditEmail(u.email || '')
    setEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    updateUser.mutate({
      id: editingUser.id,
      data: { name: editName, email: editEmail, isActive: editIsActive }
    })
  }

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
          <Button onClick={() => setInviteOpen(true)} size="sm" className="flex items-center gap-1.5 bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))]">
            <UserPlus className="w-3.5 h-3.5" /> Add User
          </Button>
        </div>

        {/* User List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 rounded-lg m-6 border border-red-100">
            <p className="text-sm font-semibold text-red-600">Failed to load workspace members</p>
            <p className="text-xs text-red-500 mt-1">{(error as any).message || 'Verification failed or permission denied'}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 border-red-200 text-red-600 hover:bg-red-100"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
            >
              Retry Connection
            </Button>
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-medium text-slate-500">No workspace members found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {users.map((u: any) => (
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
                  <p className={`text-xs truncate ${!u.email ? 'text-slate-300 italic' : 'text-slate-400'}`}>
                    {u.email || '(Email Hidden)'}
                  </p>
                </div>

                {/* Role badge + selector */}
                <div className="flex items-center gap-2">
                  <Badge className={`${ROLE_COLORS[u.role] || ROLE_COLORS.user} text-[10px] px-2 py-0.5 capitalize font-semibold shadow-none border`}>
                    {u.role || 'user'}
                  </Badge>
                  
                  {/* Status Badge */}
                  <Badge className={`${u.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'} text-[10px] px-2 py-0.5 font-semibold shadow-none border`}>
                    {u.isActive ? 'Active' : 'Inactive'}
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

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditInit(u)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Edit user details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Status — cannot deactivate self */}
                  {u.id !== currentUserId && (
                    <>
                      <button
                        onClick={() => {
                          const action = u.isActive ? 'Deactivate' : 'Activate'
                          if (confirm(`${action} ${u.name || u.email}?`)) {
                            toggleUserStatus.mutate({ id: u.id, isActive: !u.isActive })
                          }
                        }}
                        className={`p-1.5 rounded-md transition-colors ${
                          u.isActive 
                            ? 'hover:bg-red-50 text-slate-300 hover:text-red-400' 
                            : 'hover:bg-green-50 text-slate-300 hover:text-green-600'
                        }`}
                        title={u.isActive ? "Deactivate user" : "Activate user"}
                      >
                        {u.isActive ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`DANGER: Permanently delete system account for ${u.name || u.email}? This cannot be undone.`)) {
                            deleteUser.mutate(u.id)
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-600 transition-colors"
                        title="Delete system account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
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

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit User Details
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="edit-isActive"
                checked={editIsActive}
                onCheckedChange={(v) => setEditIsActive(v === true)}
              />
              <Label htmlFor="edit-isActive" className="text-sm font-medium text-slate-700">
                Active — user can log in
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              <div className="relative">
                <input
                  type={showInvitePassword ? 'text' : 'password'}
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  minLength={8}
                  className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowInvitePassword(!showInvitePassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showInvitePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
