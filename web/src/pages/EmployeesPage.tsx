import { useState } from 'react'
import { 
  Search, Plus, Pencil, Trash2, 
  LayoutList, LayoutGrid, Building2,
  Mail, ShieldCheck, UserPlus,
  Loader2, Laptop, Smartphone, Key, RefreshCw, Lock, Shield,
  CheckCircle2, Save, Info
} from 'lucide-react'
import { useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery'
import { DataTablePagination } from '@/components/DataTablePagination'
import { TableRowSkeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { DynamicCustomFieldsForm, validateCustomFields } from '@/components/DynamicCustomFieldsForm'
import { useCustomFieldDefinitions } from '@/hooks/useCustomFields'
import { useColumnPicker, type ColumnDef } from '@/hooks/useColumnPicker'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import type { EmployeeRecord } from '@/services/types'

type ViewMode = 'list' | 'card'

export function EmployeesPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const initialSearch = location.state?.search || ''
  
  const { items, totalItems, totalPages, page, perPage, search, isLoading, goToPage, updateSearch } =
    usePaginatedQuery({ 
      collection: 'employees', 
      searchFields: ['name', 'employee_id', 'work_email', 'job_title'], 
      initialSearch,
      expand: 'userId,managerId'
    })

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [detailDialog, setDetailDialog] = useState<string | null>(null)
  
  const emptyForm: Partial<EmployeeRecord> = {
    name: '',
    employee_id: '',
    work_email: '',
    job_title: '',
    department: 'Operations',
    rol_type: 'employee',
    status: 'active',
    customFields: {}
  }

  const [formData, setFormData] = useState<Partial<EmployeeRecord>>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // App Access specific state for form
  const [autoAccess, setAutoAccess] = useState(false)
  const [accessRole, setAccessRole] = useState<'user' | 'hr' | 'admin'>('user')

  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('employees')

  // Fetch linked user data when editing
  const { data: linkedUser, isLoading: userLoading } = useQuery({
    queryKey: ['user', formData.userId],
    queryFn: () => pb.collection('users').getOne(formData.userId!),
    enabled: !!formData.userId && !!editing
  })

  const standardColumns: ColumnDef[] = [
    { key: 'name', label: 'Employee', flex: true, minWidth: 220, sortField: 'name' },
    { key: 'employee_id', label: 'ID', width: 100, sortField: 'employee_id' },
    { key: 'job_title', label: 'Title', width: 150, sortField: 'job_title' },
    { key: 'department', label: 'Department', width: 130, sortField: 'department' },
    { key: 'status', label: 'Status', width: 120, sortField: 'status' },
    { key: 'actions', label: 'Actions', width: 120, alwaysVisible: true, stickyRight: true }
  ]

  const customColumns: ColumnDef[] = customFieldDefs.map((def: any) => ({
    key: def.key,
    label: def.name,
    width: 130,
    isCustom: true
  }))

  const allColumns = [...standardColumns.filter(c => !c.stickyRight), ...customColumns, ...standardColumns.filter(c => c.stickyRight)]
  const { visibleColumns } = useColumnPicker('employees', allColumns)

  // --- ACCESS MUTATIONS ---
  const grantAccess = useMutation({
    mutationFn: async ({ empId, email, name, role }: { empId: string, email: string, name: string, role: string }) => {
      const tempPassword = Math.random().toString(36).slice(-10)
      const user = await pb.collection('users').create({
        email,
        password: tempPassword,
        passwordConfirm: tempPassword,
        name,
        role,
        isActive: true,
        access_desktop: true,
        access_mobile: false,
        mustChangePassword: true,
        emailVisibility: true,
      })
      await pb.collection('employees').update(empId, { userId: user.id })
      return { user, password: tempPassword }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success(`Access granted! Temp password: ${data.password}`, { duration: 10000 })
    },
    onError: (err: any) => toast.error(err.message)
  })

  const updateAccess = useMutation({
    mutationFn: (data: any) => {
      const updateData = { ...data }
      // Auto-activate if enabling any entitlement
      if (data.access_desktop === true || data.access_mobile === true) {
        updateData.isActive = true
      }
      return pb.collection('users').update(formData.userId!, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', formData.userId] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('App access updated')
    },
    onError: (err: any) => toast.error(err.message)
  })

  const revokeAccess = useMutation({
    mutationFn: async () => {
      const uid = formData.userId
      if (!uid) return
      
      // SOFT DELETE: Deactivate instead of delete
      await pb.collection('users').update(uid, { 
        isActive: false,
        access_desktop: false,
        access_mobile: false
      })
      
      // NOTE: We no longer update employee status here. 
      // Revoking system access does not imply termination of employment.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['user', formData.userId] })
      toast.success('System access revoked (Account Deactivated)')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to revoke access')
  })

  // --- EMPLOYEE MUTATIONS ---
  const createMutation = useMutation({
    mutationFn: async (data: Partial<EmployeeRecord>) => {
      // Client-side fallback for ID if server hook is failing
      if (!data.employee_id) {
          const count = await pb.collection('employees').getList(1, 1).then(r => r.totalItems + 1001)
          data.employee_id = `EMP-${count}`
      }
      
      const record = await pb.collection('employees').create(data)
      
      if (autoAccess && data.work_email) {
        await grantAccess.mutateAsync({
          empId: record.id,
          email: data.work_email,
          name: data.name!,
          role: accessRole
        })
      }
      return record
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created')
      setCreating(false)
      setFormData(emptyForm)
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create employee'),
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmployeeRecord>) => pb.collection('employees').update(editing!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Profile updated')
      setEditing(null)
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update profile'),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCustomFields(customFieldDefs, formData.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    createMutation.mutate(formData)
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateCustomFields(customFieldDefs, formData.customFields || {})
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }
    updateMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Employee Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">{totalItems} people total</p>
        </div>
        <Button onClick={() => { setFormData(emptyForm); setAutoAccess(false); setCreating(true) }} className="bg-[rgb(var(--ns-accent))] hover:bg-[rgb(var(--ns-accent-dk))] text-white font-bold">
          <Plus className="w-4 h-4 mr-1.5" /> Add Employee
        </Button>
      </div>
      
      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search..." value={search} onChange={(e) => updateSearch(e.target.value)} className="pl-10 h-10" />
        </div>
        <div className="flex items-center border rounded-lg p-1 bg-white">
          <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md", viewMode === 'list' ? "bg-slate-100 text-indigo-600" : "text-slate-400")}><LayoutList className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('card')} className={cn("p-1.5 rounded-md", viewMode === 'card' ? "bg-slate-100 text-indigo-600" : "text-slate-400")}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50 border-b">
                <tr>
                  {visibleColumns.map(col => <th key={col.key} className={cn("px-4 py-3", col.stickyRight && "sticky right-0 bg-slate-50")}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? <TableRowSkeleton rows={8} /> : items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.map(col => {
                      const cellClass = cn("px-4 py-3.5 whitespace-nowrap", col.stickyRight && "sticky right-0 bg-white group-hover:bg-slate-50")
                      if (col.key === 'name') return (
                        <td key={col.key} className={cellClass}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold" onClick={() => setDetailDialog(item.id)}>{item.name.charAt(0)}</div>
                            <div className="min-w-0">
                              <div className="font-semibold cursor-pointer hover:text-indigo-600" onClick={() => setDetailDialog(item.id)}>{item.name}</div>
                              {item.expand?.userId?.isActive && <Badge className="text-[9px] bg-emerald-50 text-emerald-600 border-none px-1 h-3.5 mt-0.5">APP ACCESS</Badge>}
                            </div>
                          </div>
                        </td>
                      )
                      if (col.key === 'employee_id') return <td key={col.key} className={cellClass}><span className="font-mono text-xs text-slate-400">{item.employee_id || '—'}</span></td>
                      if (col.key === 'actions') return (
                        <td key={col.key} className={cellClass}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailDialog(item.id)}><Info className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setFormData({ ...item }); setEditing(item.id) }}><Pencil className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      )
                      return <td key={col.key} className={cellClass}>{String(item[col.key] || item.customFields?.[col.key] || '—')}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={goToPage} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item: any) => <EmployeeCard key={item.id} employee={item} onEdit={() => { setFormData({ ...item }); setEditing(item.id) }} onDetail={() => setDetailDialog(item.id)} />)}
        </div>
      )}

      {/* Detail Dialog */}
      {detailDialog && <EmployeeDetailDialog id={detailDialog} onClose={() => setDetailDialog(null)} onEdit={() => { const emp = items.find((i: any) => i.id === detailDialog); setFormData({ ...emp }); setEditing(detailDialog); setDetailDialog(null) }} />}

      {/* FULL INTEGRATED FORM MODAL */}
      <Dialog open={creating || !!editing} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); setFormData(emptyForm) } }}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-slate-50 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {creating ? <UserPlus className="w-5 h-5 text-indigo-600" /> : <Pencil className="w-5 h-5 text-indigo-600" />}
              {creating ? 'Onboard New Employee' : 'Edit Employee Profile'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={creating ? handleCreate : handleEdit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* COLUMN 1: PERSONNEL */}
                <div className="lg:col-span-7 space-y-8">
                  <section className="space-y-5">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Core Personnel Info</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Full Name *</Label>
                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-11" placeholder="Ted Smith" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Work Email</Label>
                        <Input type="email" value={formData.work_email} onChange={e => setFormData({ ...formData, work_email: e.target.value })} className="h-11" placeholder="ted@company.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Employee ID</Label>
                        <Input value={formData.employee_id} placeholder="Automatic Generation" disabled className="h-11 bg-slate-50 italic font-mono text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Department</Label>
                        <Select value={formData.department} onValueChange={(v) => setFormData({ ...formData, department: v as any })}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>{['Operations', 'Engineering', 'Sales', 'HR', 'Admin', 'Legal'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Job Title</Label>
                        <Input value={formData.job_title} onChange={e => setFormData({ ...formData, job_title: e.target.value })} className="h-11" placeholder="Manager" />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Extended Details</h3>
                    <DynamicCustomFieldsForm entityType="employees" values={formData.customFields || {}} onChange={(cf) => { setFormData({ ...formData, customFields: cf }); setFormErrors({}) }} errors={formErrors} />
                  </section>
                </div>

                {/* COLUMN 2: APP ACCESS */}
                <div className="lg:col-span-5 space-y-8 bg-slate-50/50 -m-8 p-8 border-l border-slate-100">
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">App Access Control</h3>
                      <Shield className="w-4 h-4 text-indigo-300" />
                    </div>

                    {creating ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl", autoAccess ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400")}><Key className="w-4 h-4" /></div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-none">Enable System Login</p>
                              <p className="text-[10px] text-slate-500 mt-1">Generate account automatically</p>
                            </div>
                          </div>
                          <Checkbox checked={autoAccess} onCheckedChange={(v) => setAutoAccess(v === true)} />
                        </div>

                        {autoAccess && (
                          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                             <div className="space-y-1.5">
                              <Label className="text-[10px] font-black uppercase text-slate-400">System Permission Role</Label>
                              <Select value={accessRole} onValueChange={(v) => setAccessRole(v as any)}>
                                <SelectTrigger className="h-10 text-xs font-semibold"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Standard User</SelectItem>
                                  <SelectItem value="hr">HR Manager</SelectItem>
                                  <SelectItem value="admin">System Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-[10px] text-indigo-600 font-medium leading-relaxed italic">
                              Note: A secure temporary password will be shown after you click "Create Employee".
                            </p>
                          </div>
                        )}
                      </div>
                    ) : !formData.userId ? (
                      <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-5 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto"><Lock className="w-8 h-8 text-slate-200" /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Access Revoked / Disabled</p>
                          <p className="text-xs text-slate-400 mt-1">This person cannot log into Flowmatica.</p>
                        </div>
                        <Button 
                          type="button" 
                          disabled={!formData.work_email || grantAccess.isPending}
                          onClick={() => grantAccess.mutate({ empId: editing!, email: formData.work_email!, name: formData.name!, role: 'user' })}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-11"
                        >
                          {grantAccess.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                          Grant Access Now
                        </Button>
                      </div>
                    ) : userLoading ? (
                      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 animate-pulse"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></div>
                    ) : linkedUser ? (
                      <div className="space-y-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between border-b pb-4">
                          <div className="flex items-center gap-2">
                            {linkedUser.isActive ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-slate-400" />}
                            <span className="text-sm font-bold text-slate-900">{linkedUser.isActive ? 'Login Active' : 'Login Deactivated'}</span>
                          </div>
                          <Badge className="bg-indigo-50 text-indigo-700 uppercase text-[10px] font-black border-none px-2 h-5">{linkedUser.role}</Badge>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Permissions Level</Label>
                          <Select value={linkedUser.role} onValueChange={(v) => updateAccess.mutate({ role: v })}>
                            <SelectTrigger className="h-9 text-xs font-bold border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Standard User</SelectItem>
                              <SelectItem value="hr">HR Manager</SelectItem>
                              <SelectItem value="admin">System Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Device Entitlements</Label>
                          <EntitlementToggle icon={Laptop} label="Desktop App" description="Web workspace access" checked={linkedUser.access_desktop} onChange={(v: boolean) => updateAccess.mutate({ access_desktop: v })} />
                          <EntitlementToggle icon={Smartphone} label="Mobile App" description="Phone login access" checked={linkedUser.access_mobile} onChange={(v: boolean) => updateAccess.mutate({ access_mobile: v })} />
                        </div>

                        <div className="pt-4 flex flex-col gap-2">
                          <Button 
                            type="button" variant="outline" size="sm" className="w-full text-xs font-bold h-9"
                            onClick={() => { if(confirm('Generate new password?')) { const p = Math.random().toString(36).slice(-10); updateAccess.mutate({ password: p, passwordConfirm: p, mustChangePassword: true }); toast.success(`Password Reset: ${p}`, { duration: 10000 }) } }}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Reset Password
                          </Button>
                          <Button 
                            type="button" variant="ghost" size="sm" className="w-full text-xs font-bold text-red-500 hover:bg-red-50 h-9"
                            onClick={() => { if(confirm('Permanently disable system access?')) revokeAccess.mutate() }}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Revoke System Access
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>
            </div>

            <DialogFooter className="px-8 py-5 border-t bg-slate-50 flex-shrink-0 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={() => { setCreating(false); setEditing(null) }} className="font-bold text-slate-500">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-8 shadow-lg shadow-indigo-200">
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (creating ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />)}
                {creating ? 'Onboard Employee' : 'Save Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EntitlementToggle({ icon: Icon, label, description, checked, onChange }: any) {
  return (
    <div className={cn("flex items-center justify-between p-3 rounded-2xl border transition-all", checked ? "bg-white border-indigo-200 shadow-sm" : "bg-slate-100/50 border-slate-100 opacity-60")}>
      <div className="flex items-center gap-3">
        <div className={cn("p-1.5 rounded-lg", checked ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-400")}><Icon className="w-4 h-4" /></div>
        <div className="min-w-0"><p className="text-[11px] font-bold text-slate-900 leading-none">{label}</p><p className="text-[10px] text-slate-400 mt-1">{description}</p></div>
      </div>
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
    </div>
  )
}

function EmployeeCard({ employee, onEdit, onDetail }: { employee: any, onEdit: () => void, onDetail: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-5 flex flex-col h-full group relative">
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-md"><Pencil className="w-3.5 h-3.5" /></button>
      </div>
      <div className="flex items-center gap-4 mb-4 cursor-pointer" onClick={onDetail}>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-lg font-bold text-indigo-600">{employee.name.charAt(0)}</div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{employee.name}</h3>
          <p className="text-xs text-slate-500 font-medium truncate">{employee.job_title || 'No Title'}</p>
        </div>
      </div>
      <div className="space-y-2.5 flex-1 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500"><Building2 className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{employee.department}</span></div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{employee.work_email || 'No Email'}</span></div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
        <Badge className={cn("text-[10px] font-bold border-none px-2 py-0.5 capitalize", employee.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{employee.status}</Badge>
        {employee.employee_id && <span className="font-mono text-[10px] text-slate-400">{employee.employee_id}</span>}
      </div>
    </div>
  )
}

function EmployeeDetailDialog({ id, onClose, onEdit }: { id: string; onClose: () => void; onEdit: () => void }) {
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public')
  const { data: employee, isLoading } = useQuery({ queryKey: ['employee', id], queryFn: () => pb.collection('employees').getOne(id, { expand: 'userId,managerId' }) })
  const { data: privateData, isLoading: privateLoading } = useQuery({ queryKey: ['employee_private', id], queryFn: async () => { try { return await pb.collection('employee_private').getFirstListItem(`employeeId = "${id}"`) } catch (err: any) { if (err.status === 404) return null; throw err } }, enabled: activeTab === 'private' })
  if (isLoading || !employee) return null
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{employee.name.charAt(0)}</div>
            <div><DialogTitle>{employee.name}</DialogTitle><p className="text-xs text-slate-500">{employee.job_title || 'No Title'}</p></div>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit} className="mr-8 h-8 text-xs font-bold"><Pencil className="w-3 h-3 mr-1.5" /> Edit Profile</Button>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex gap-6">
            <button onClick={() => setActiveTab('public')} className={cn("py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all", activeTab === 'public' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600")}>Public Info</button>
            <button onClick={() => setActiveTab('private')} className={cn("py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5", activeTab === 'private' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600")}><ShieldCheck className="w-3 h-3" /> Private Data</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'public' ? (
              <div className="grid grid-cols-2 gap-6">
                <DetailItem label="Employee ID" value={employee.employee_id} mono />
                <DetailItem label="Department" value={employee.department} badge />
                <DetailItem label="Status" value={employee.status} badge />
                <DetailItem label="Role Type" value={employee.rol_type} badge />
                <DetailItem label="Work Email" value={employee.work_email} copy />
                <DetailItem label="Manager" value={employee.expand?.managerId?.name} avatar={employee.expand?.managerId?.name?.charAt(0)} />
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">{privateLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : privateData ? <p className="text-sm font-medium">Private record exists.</p> : <p className="text-sm">No private data found.</p>}</div>
            )}
          </div>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50"><Button variant="ghost" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value, mono, badge, avatar }: any) {
  if (!value && !avatar) return <div><Label className="text-[10px] font-black uppercase text-slate-400 block mb-1">{label}</Label><span className="text-sm text-slate-300 italic">Not set</span></div>
  return (
    <div>
      <Label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">{label}</Label>
      <div className="flex items-center gap-2">
        {avatar && <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">{avatar}</div>}
        {badge ? <Badge className="bg-slate-100 text-slate-700 border-none px-2 py-0.5 text-[10px] font-bold capitalize">{String(value).replace('_', ' ')}</Badge> : <span className={cn("text-sm font-semibold text-slate-900 truncate", mono && "font-mono text-xs text-slate-500")}>{value}</span>}
      </div>
    </div>
  )
}
