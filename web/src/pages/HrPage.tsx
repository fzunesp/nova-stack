import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Inbox, Plus, Settings2, FileText, CheckCircle2, Clock, XCircle,
  Pencil, Loader2, HelpCircle,
  BarChart3, ChevronRight, LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import { DynamicFormRenderer } from '@/components/DynamicFormRenderer'
import FormTemplateCreator from '@/components/FormTemplateCreator'
import DecisionQueue from '@/components/DecisionQueue'
import { HrAnalyticsDashboard } from '@/components/admin/HrAnalyticsDashboard'

const isApproverOrAdmin = () => {
  const role = pb.authStore.record?.role
  return role === 'admin' || role === 'hr' || role === 'manager'
}

type Section = 'requests' | 'approvals' | 'templates' | 'analytics' | 'builder'

const navSections: { id: Section; label: string; icon: typeof Inbox; adminOnly: boolean }[] = [
  { id: 'requests', label: 'My Requests', icon: LayoutDashboard, adminOnly: false },
  { id: 'approvals', label: 'Approvals', icon: Inbox, adminOnly: true },
  { id: 'templates', label: 'Templates', icon: Settings2, adminOnly: true },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
]

// ─── Main HR Page ─────────────────────────────────────────────────────────────
export function HrPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<Section>('requests')
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)

  const visibleSections = navSections.filter(s => !s.adminOnly || isApproverOrAdmin())

  if (activeSection === 'builder') {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button onClick={() => setActiveSection('templates')} className="hover:text-indigo-600 transition-colors">HR</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => setActiveSection('templates')} className="hover:text-indigo-600 transition-colors">Templates</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-medium">{editingTemplate ? 'Editing' : 'New'} Template</span>
        </div>
        <FormTemplateCreator
          initialData={editingTemplate}
          onBack={() => { setEditingTemplate(null); setActiveSection('templates') }}
          onSaved={() => { setEditingTemplate(null); setActiveSection('templates') }}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 hidden md:block">
        <div className="sticky top-0 pt-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Inbox className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">HR Operations</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {visibleSections.map(s => {
                  const Icon = s.icon
                  const isActive = activeSection === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${
                        isActive
                          ? 'text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      style={isActive ? { backgroundColor: 'rgb(var(--ns-accent))' } : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {s.label}
                    </button>
                  )
                })}
              </nav>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => navigate('/help?tab=hr')}
                  className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[rgb(var(--ns-accent))] bg-slate-50 hover:bg-[rgb(var(--ns-accent))]/10 border border-slate-200 hover:border-[rgb(var(--ns-accent))]/30 rounded-lg px-3 py-2 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 px-6 py-8 max-w-7xl overflow-auto">
        {activeSection === 'requests' && <EmployeeView />}
        {activeSection === 'approvals' && isApproverOrAdmin() && (
          <ApprovalsView />
        )}
        {activeSection === 'templates' && isApproverOrAdmin() && (
          <TemplatesView
            onNewTemplate={() => { setEditingTemplate(null); setActiveSection('builder') }}
            onEditTemplate={(t) => { setEditingTemplate(t); setActiveSection('builder') }}
          />
        )}
        {activeSection === 'analytics' && isApproverOrAdmin() && (
          <HrAnalyticsDashboard />
        )}
      </main>
    </div>
  )
}

// ─── Employee View: submit a new request + submission history ─────────────────
function EmployeeView() {
  const [submitting, setSubmitting] = useState<any | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['form_definitions_active'],
    queryFn: () => pb.collection('form_definitions').getFullList({ filter: 'isActive = true', sort: 'name' }),
  })

  const { data: mySubmissions = [] } = useQuery({
    queryKey: ['my_submissions'],
    queryFn: () =>
      pb.collection('intake_submissions').getFullList({
        filter: `userId = "${pb.authStore.record?.id}"`,
        sort: '-created',
        expand: 'formId',
      }),
  })

  const submitMutation = useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const form = submitting
      const formDef = await pb.collection('form_definitions').getOne(form.id)

      const submission = await pb.collection('intake_submissions').create({
        name: pb.authStore.record?.name || 'Unknown',
        email: pb.authStore.record?.email || '',
        formId: form.id,
        type: formDef.key || 'general',
        source: 'internal',
        status: 'pending',
        currentStep: 0,
        details: values,
        userId: pb.authStore.record?.id,
      })

      return submission
    },
    onSuccess: (submission: any) => {
      toast.success(`Request ${submission.formattedId || submission.id.slice(0, 8)} submitted successfully!`)
      setSubmitting(null)
      queryClient.invalidateQueries({ queryKey: ['my_submissions'] })
      queryClient.invalidateQueries({ queryKey: ['approval_tasks'] })
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to submit request'),
  })

  const parsedForm = submitting
    ? (() => {
        try { return Array.isArray(submitting.fields) ? submitting.fields : JSON.parse(submitting.fields || '[]') } catch { return [] }
      })()
    : []

  // Stats from existing data
  const subs = mySubmissions as any[]
  const pendingCount = subs.filter(s => s.status === 'pending').length
  const approvedCount = subs.filter(s => s.status === 'approved').length
  const rejectedCount = subs.filter(s => s.status === 'rejected').length

  // Group by status
  const pendingSubs = subs.filter(s => s.status === 'pending')
  const approvedSubs = subs.filter(s => s.status === 'approved')
  const rejectedSubs = subs.filter(s => s.status === 'rejected')

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      {subs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{subs.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">Approved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Rejected</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{rejectedCount}</p>
          </div>
        </div>
      )}

      {/* Form selection cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Submit a New Request</h2>
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400 py-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading forms…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(forms as any[]).map((form) => {
              return (
                <button
                  key={form.id}
                  onClick={() => setSubmitting(form)}
                  className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <Badge className="text-[9px] font-bold bg-slate-100 text-slate-500 border-0">{form.prefix}</Badge>
                  </div>
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{form.name}</h3>
                  {form.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{form.description}</p>}
                </button>
              )
            })}
            {forms.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No active HR forms available.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission history - grouped by status */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">My Request History</h2>
        {subs.length === 0 ? (
          <Card className="border border-slate-100 shadow-sm">
            <CardContent className="p-12 text-center text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-200" />
              <p className="text-sm">You haven't submitted any requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingSubs.length > 0 && (
              <StatusGroup title="Pending" count={pendingSubs.length} color="amber" submissions={pendingSubs} navigate={navigate} />
            )}
            {approvedSubs.length > 0 && (
              <StatusGroup title="Approved" count={approvedSubs.length} color="emerald" submissions={approvedSubs} navigate={navigate} />
            )}
            {rejectedSubs.length > 0 && (
              <StatusGroup title="Rejected" count={rejectedSubs.length} color="red" submissions={rejectedSubs} navigate={navigate} />
            )}
          </div>
        )}
      </div>

      {/* Dynamic Form Submit Dialog */}
      <Dialog open={!!submitting} onOpenChange={(open) => { if (!open) setSubmitting(null) }}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto" aria-describedby="form-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              {submitting?.name}
            </DialogTitle>
            <p id="form-dialog-description" className="sr-only">Submit a new {submitting?.name} request form</p>
          </DialogHeader>
          {submitting && (
            <DynamicFormRenderer
              template={{ title: submitting.name, description: submitting.description, fields: parsedForm }}
              onSubmit={(values) => submitMutation.mutate(values)}
              isSubmitting={submitMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusGroup({ title, count, color, submissions, navigate }: {
  title: string; count: number; color: string; submissions: any[]; navigate: (path: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }
  const dotMap: Record<string, string> = {
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    red: 'bg-red-400',
  }

  return (
    <Card className="border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotMap[color]}`} />
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <span className="text-xs text-slate-400">({count})</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
      </button>
      {!collapsed && (
        <div className="divide-y divide-slate-50">
          {submissions.map((sub) => (
            <button
              key={sub.id}
              onClick={() => navigate(`/hr/${sub.id}`)}
              className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-indigo-600">{sub.formattedId || sub.id.slice(0, 8)}</span>
                    <span className="font-semibold text-sm text-slate-800">{sub.expand?.formId?.name || sub.type}</span>
                  </div>
                  <p className="text-xs text-slate-400">Submitted {new Date(sub.created).toLocaleDateString()}</p>
                </div>
              </div>
              <Badge className={`${colorMap[color]} text-[10px] border-0 capitalize`}>{sub.status}</Badge>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Approvals View (HR/Admin/Manager only) ────────────────────────────────────
function ApprovalsView() {
  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['approval_tasks', 'pending'],
    queryFn: () =>
      pb.collection('approval_tasks').getFullList({
        filter: 'status = "pending"',
        expand: 'submissionId,submissionId.formId,assignedToId',
        sort: '-created',
      }),
  })

  const currentUserId = pb.authStore.record?.id

  // Group tasks by submissionId
  const groups = (pendingTasks as any[]).reduce((acc: Record<string, any[]>, task) => {
    if (!acc[task.submissionId]) acc[task.submissionId] = []
    acc[task.submissionId].push(task)
    return acc
  }, {})

  const groupList = Object.values(groups).map((groupTasks: any[]) => {
    groupTasks.sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
    return {
      submissionId: groupTasks[0].submissionId,
      formattedId: groupTasks[0].expand?.submissionId?.formattedId || groupTasks[0].submissionId,
      employeeName: groupTasks[0].expand?.submissionId?.name || groupTasks[0].expand?.submissionId?.email || 'Unknown',
      formName: groupTasks[0].expand?.submissionId?.expand?.formId?.name || 'Unknown Form',
      createdAt: new Date(groupTasks[0].expand?.submissionId?.created || groupTasks[0].created),
      finalStatus: groupTasks[0].expand?.submissionId?.status || 'pending',
      tasks: groupTasks,
    }
  })

  const myTasks = groupList.filter(g => g.tasks.some((t: any) => t.assignedToId === currentUserId && t.status === 'pending' && t.isActive))
  const otherTasks = groupList.filter(g => !g.tasks.some((t: any) => t.assignedToId === currentUserId && t.status === 'pending' && t.isActive))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Needs Your Action</h2>
        {myTasks.length === 0 ? (
          <Card className="border border-slate-100 shadow-sm">
            <CardContent className="p-12 text-center text-slate-400">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-slate-200" />
              <p className="font-medium">No pending decisions. All caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {myTasks.map(group => (
              <ApprovalCard key={group.submissionId} group={group} />
            ))}
          </div>
        )}
      </div>

      {otherTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Waiting on Others</h2>
          <Card className="border border-slate-100 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <DecisionQueue tasks={pendingTasks} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function ApprovalCard({ group }: { group: any }) {
  const queryClient = useQueryClient()
  const currentUserId = pb.authStore.record?.id
  const [comment, setComment] = useState('')
  const [confirmAction, setConfirmAction] = useState<'approved' | 'rejected' | null>(null)
  const [activeTask, setActiveTask] = useState<any>(null)

  const myTask = group.tasks.find((t: any) => t.assignedToId === currentUserId && t.status === 'pending' && t.isActive)

  const decisionMutation = useMutation({
    mutationFn: async ({ taskId, type, comment }: { taskId: string; type: 'approved' | 'rejected'; comment: string }) => {
      await pb.collection('approval_tasks').update(taskId, {
        status: type,
        comment: comment || null,
        completedAt: new Date().toISOString(),
      })
    },
    onSuccess: (_, { type }) => {
      toast.success(`Request ${group.formattedId} ${type}`)
      setComment('')
      setConfirmAction(null)
      setActiveTask(null)
      queryClient.invalidateQueries({ queryKey: ['approval_tasks'] })
      queryClient.invalidateQueries({ queryKey: ['intake_submissions'] })
      queryClient.invalidateQueries({ queryKey: ['my_submissions'] })
    },
    onError: () => toast.error('Action failed. Please try again.'),
  })

  const stepIcons = group.tasks.map((t: any, _i: number) => {
    if (t.status === 'approved') return 'done'
    if (t.status === 'rejected') return 'rejected'
    if (t.isActive && t.status === 'pending') return 'current'
    return 'waiting'
  })

  return (
    <>
      {/* Confirm Dialog */}
      {confirmAction && activeTask && (
        <Dialog open={!!confirmAction} onOpenChange={(open) => {
          if (!open && !decisionMutation.isPending) {
            setConfirmAction(null)
            setActiveTask(null)
          }
        }}>
          <DialogContent className="sm:max-w-[440px]" aria-describedby="confirm-dialog-description">
            <DialogHeader>
              <DialogTitle className={confirmAction === 'approved' ? 'text-emerald-700' : 'text-red-600'}>
                {confirmAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </DialogTitle>
            </DialogHeader>
            <p id="confirm-dialog-description" className="text-sm text-slate-600">
              Are you sure you want to <strong>{confirmAction}</strong> request{' '}
              <span className="font-mono font-bold text-indigo-600">{group.formattedId}</span>?
            </p>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decision Note (optional)</label>
              <textarea
                placeholder={`Add a note for ${confirmAction === 'approved' ? 'approval' : 'rejection'}…`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                disabled={decisionMutation.isPending}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setConfirmAction(null); setActiveTask(null) }}>Cancel</Button>
              <Button
                onClick={() => decisionMutation.mutate({ taskId: activeTask.id, type: confirmAction, comment })}
                disabled={decisionMutation.isPending}
                className={`font-bold ${confirmAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              >
                {confirmAction === 'approved' ? 'Approve' : 'Reject'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-indigo-600">{group.formattedId}</span>
                <Badge className="text-[9px] bg-slate-100 text-slate-500 border-0">{group.formName}</Badge>
              </div>
              <p className="text-sm font-semibold text-slate-800">{group.employeeName}</p>
              <p className="text-xs text-slate-400 mt-0.5">Submitted {group.createdAt.toLocaleDateString()}</p>
            </div>

            {/* Mini step progress */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {stepIcons.map((state: string, i: number) => (
                <div key={i} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    state === 'done' ? 'bg-emerald-100 text-emerald-600' :
                    state === 'rejected' ? 'bg-red-100 text-red-600' :
                    state === 'current' ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' :
                    'bg-slate-100 text-slate-300'
                  }`}>
                    {state === 'done' ? <CheckCircle2 className="h-3 w-3" /> :
                     state === 'rejected' ? <XCircle className="h-3 w-3" /> :
                     state === 'current' ? <Clock className="h-3 w-3" /> :
                     <span>{i + 1}</span>}
                  </div>
                  {i < stepIcons.length - 1 && (
                    <div className={`w-4 h-0.5 ${
                      state === 'done' ? 'bg-emerald-200' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Approver info */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                {(myTask?.expand?.assignedToId?.name || '?').charAt(0)}
              </div>
              <span className="text-xs text-slate-500">
                Waiting on <span className="font-medium text-slate-700">{myTask?.expand?.assignedToId?.name || 'Unassigned'}</span>
                {myTask?.stepLabel && <span className="text-slate-400"> — {myTask.stepLabel}</span>}
              </span>
            </div>

            {myTask && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-medium"
                  onClick={() => { setActiveTask(myTask); setConfirmAction('approved') }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-red-200 text-red-500 hover:bg-red-50 font-medium"
                  onClick={() => { setActiveTask(myTask); setConfirmAction('rejected') }}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Templates View (HR/Admin/Manager only) ────────────────────────────────────
function TemplatesView({ onNewTemplate, onEditTemplate }: { onNewTemplate: () => void; onEditTemplate: (t: any) => void }) {
  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['form_definitions'],
    queryFn: () => pb.collection('form_definitions').getFullList({ sort: 'name' }),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      pb.collection('form_definitions').update(id, { isActive: !isActive }),
    onSuccess: () => { toast.success('Template updated'); refetchTemplates() },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Form Templates</h2>
        <Button size="sm" onClick={onNewTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
          <Plus className="h-4 w-4 mr-1" /> New Template
        </Button>
      </div>

      {(templates as any[]).length === 0 ? (
        <Card className="border border-slate-100 shadow-sm">
          <CardContent className="p-12 text-center text-slate-400">
            <Settings2 className="h-8 w-8 mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No form templates yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(templates as any[]).map((t) => (
            <Card key={t.id} className={`border shadow-sm transition-all ${t.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <Badge className="text-[9px] font-bold bg-slate-100 text-slate-500 border-0">{t.prefix}</Badge>
                      <h3 className="font-bold text-sm text-slate-800 mt-0.5">{t.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive.mutate({ id: t.id, isActive: t.isActive })}
                    className={`relative w-9 h-5 rounded-full transition-colors ${t.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${t.isActive ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
                {t.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{t.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-[10px] text-slate-400">{t.isActive ? 'Active' : 'Inactive'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs font-bold text-indigo-600 px-2"
                    onClick={() => onEditTemplate({
                      id: t.id,
                      name: t.name,
                      prefix: t.prefix,
                      description: t.description || '',
                      isParallel: t.isParallel || false,
                      webhookUrl: t.webhookUrl || '',
                      fields: Array.isArray(t.fields) ? t.fields : (() => { try { return JSON.parse(t.fields || '[]') } catch { return [] } })(),
                      workflowSteps: Array.isArray(t.workflowSteps) ? t.workflowSteps : (() => { try { return JSON.parse(t.workflowSteps || '[]') } catch { return [] } })(),
                    })}
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
