import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Inbox, Plus, Settings2, FileText, CheckCircle2, Clock, XCircle,
  ToggleLeft, ToggleRight, Pencil, Loader2, HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

// Sequence ID is now safely generated server-side in onModelBeforeCreate hook.

// ─── Main HR Page ─────────────────────────────────────────────────────────────
export function HrPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'employee' | 'admin' | 'builder'>('employee')
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)

  if (view === 'builder') {
    return (
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <FormTemplateCreator
          initialData={editingTemplate}
          onBack={() => { setEditingTemplate(null); setView('admin') }}
          onSaved={() => { setEditingTemplate(null); setView('admin') }}
        />
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Inbox className="w-6 h-6 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">HR Requests</h1>
            <p className="text-sm text-slate-500">Submit and manage HR form requests</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/help?tab=hr')}
            className="cursor-pointer flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg px-3 py-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help
          </button>
          {isApproverOrAdmin() && (
          <div className="flex gap-2">
            <Button
              variant={view === 'employee' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('employee')}
              className={view === 'employee' ? 'bg-indigo-600 text-white' : ''}
            >
              <FileText className="h-4 w-4 mr-1" /> My Requests
            </Button>
            <Button
              variant={view === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('admin')}
              className={view === 'admin' ? 'bg-indigo-600 text-white' : ''}
            >
              <Settings2 className="h-4 w-4 mr-1" /> HR Admin
            </Button>
          </div>
        )}
      </div>
    </div>

      {view === 'employee' && <EmployeeView />}
      {view === 'admin' && isApproverOrAdmin() && (
        <AdminView
          onNewTemplate={() => { setEditingTemplate(null); setView('builder') }}
          onEditTemplate={(t) => { setEditingTemplate(t); setView('builder') }}
        />
      )}
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

  return (
    <div className="space-y-8">
      {/* Form selection cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Submit a New Request</h2>
        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400 py-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading forms…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(forms as any[]).map((form) => (
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
            ))}
            {forms.length === 0 && (
              <div className="col-span-3 text-center py-12 text-slate-400">
                <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No active HR forms available.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission history */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">My Request History</h2>
        <Card className="border border-slate-100 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {(mySubmissions as any[]).length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">You haven't submitted any requests yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(mySubmissions as any[]).map((sub) => (
                  <button 
                    key={sub.id} 
                    onClick={() => navigate(`/hr/${sub.id}`)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">{sub.formattedId || sub.id.slice(0, 8)}</span>
                          <span className="font-semibold text-slate-800">{sub.expand?.formId?.name || sub.type}</span>
                        </div>
                        <p className="text-xs text-slate-400">Submitted {new Date(sub.created).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <SubmissionStatusBadge status={sub.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Form Submit Dialog */}
      <Dialog open={!!submitting} onOpenChange={(open) => { if (!open) setSubmitting(null) }}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              {submitting?.name}
            </DialogTitle>
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

// ─── Admin View: Decision Queue + Template Manager ─────────────────────────────
function AdminView({ onNewTemplate, onEditTemplate }: { onNewTemplate: () => void; onEditTemplate: (t: any) => void }) {

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['approval_tasks', 'pending'],
    queryFn: () =>
      pb.collection('approval_tasks').getFullList({
        filter: 'status = "pending"',
        // Note: submissionId.userId is a TEXT field (not a relation) so it can't be expanded.
        // Employee name is read directly from submission.name instead.
        expand: 'submissionId,submissionId.formId,assignedToId',
        sort: '-created',
      }),
  })

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
    <Tabs defaultValue="queue">
      <TabsList className="bg-slate-100">
        <TabsTrigger value="queue" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-semibold">
          Decision Queue
          {(pendingTasks as any[]).length > 0 && (
            <Badge className="ml-2 text-[10px] bg-indigo-600 text-white h-4 px-1.5">{(pendingTasks as any[]).length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="templates" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-semibold">
          Form Templates
        </TabsTrigger>
        <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 font-semibold">
          Analytics
        </TabsTrigger>
      </TabsList>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="mt-4">
        <HrAnalyticsDashboard />
      </TabsContent>

      {/* Decision Queue Tab */}
      <TabsContent value="queue" className="mt-4">
        <Card className="border border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DecisionQueue tasks={pendingTasks as any[]} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Templates Tab */}
      <TabsContent value="templates" className="mt-4">
        <Card className="border border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Active Templates</CardTitle>
            <Button size="sm" onClick={onNewTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Plus className="h-4 w-4 mr-1" /> New Template
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(templates as any[]).length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Settings2 className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">No form templates yet. Create your first one!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {(templates as any[]).map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="text-[9px] font-bold bg-slate-100 text-slate-500 border-0">{t.prefix}</Badge>
                          <span className="font-bold text-slate-800">{t.name}</span>
                          {!t.isActive && <Badge className="text-[9px] bg-slate-100 text-slate-400 border-0">Inactive</Badge>}
                        </div>
                        {t.description && <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => toggleActive.mutate({ id: t.id, isActive: t.isActive })}>
                        {t.isActive ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="font-bold text-xs text-indigo-600" onClick={() => {
                        onEditTemplate({
                          id: t.id,
                          name: t.name,
                          prefix: t.prefix,
                          description: t.description || '',
                          isParallel: t.isParallel || false,
                          webhookUrl: t.webhookUrl || '',
                          fields: Array.isArray(t.fields) ? t.fields : (() => { try { return JSON.parse(t.fields || '[]') } catch { return [] } })(),
                          workflowSteps: Array.isArray(t.workflowSteps) ? t.workflowSteps : (() => { try { return JSON.parse(t.workflowSteps || '[]') } catch { return [] } })(),
                        })
                      }}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function SubmissionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>
    case 'rejected': return <Badge className="bg-red-100 text-red-600 border-0"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    default: return <Badge className="bg-amber-100 text-amber-700 border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
  }
}
