import { useParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import pb from '@/lib/pocketbase'
import { Inbox, ArrowLeft, Clock, CheckCircle2, XCircle, FileText, User, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function HrSubmissionPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['intake_submission', id],
    queryFn: async () => {
      return pb.collection('intake_submissions').getOne(id!, {
        expand: 'formId,userId',
      })
    },
    enabled: !!id,
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['approval_tasks', 'submission', id],
    queryFn: () => pb.collection('approval_tasks').getFullList({
      filter: `submissionId = "${id}"`,
      expand: 'assignedToId',
      sort: 'stepOrder',
    }),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading submission details...</div>
  if (!submission) return <div className="p-8 text-center text-slate-400">Submission not found.</div>

  const formDef = submission.expand?.formId as any
  const employee = submission.expand?.userId as any
  const formFields = (() => {
    try {
      return JSON.parse(formDef?.fields || '[]')
    } catch {
      return []
    }
  })()
  const details = (() => {
    try {
      return JSON.parse(submission.details || '{}')
    } catch {
      return {}
    }
  })()

  const getFieldLabel = (name: string) => {
    const field = formFields.find((f: any) => f.name === name)
    return field ? field.label : name
  }

  const renderValue = (name: string, value: any) => {
    const field = formFields.find((f: any) => f.name === name)
    if (!field) return String(value)
    if (field.type === 'signature' && typeof value === 'string') {
      return <img src={value} alt="Signature" className="h-12 border border-slate-200 rounded p-1 bg-white" />
    }
    if (field.type === 'file' && Array.isArray(value)) {
      return (
        <div className="flex flex-col gap-1">
          {value.map((file: any, idx: number) => (
            <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">
              {file.name}
            </a>
          ))}
        </div>
      )
    }
    return String(value)
  }

  // Build horizontal progress steps
  const progressSteps = [
    { label: 'Submitted', icon: User, status: 'done' as const, date: submission.created },
    ...(tasks as any[]).map((task: any) => ({
      label: task.stepLabel,
      icon: User,
      status: task.status === 'approved' ? 'done' as const :
              task.status === 'rejected' ? 'rejected' as const :
              task.isActive ? 'current' as const : 'waiting' as const,
      date: task.completedAt || task.created,
      assignee: task.expand?.assignedToId?.name,
      comment: task.comment,
    })),
  ]

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/hr')} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <button onClick={() => navigate('/hr')} className="hover:text-indigo-600 transition-colors">HR</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600">{formDef?.name || submission.type}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Inbox className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{formDef?.name || submission.type}</h1>
                <Badge className="font-mono text-[10px] bg-slate-100 text-indigo-700">{submission.formattedId}</Badge>
              </div>
              <p className="text-sm text-slate-500">Submitted by {employee?.name || submission.name} on {new Date(submission.created).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      {/* Horizontal Approval Progress Bar */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Approval Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-start">
            {progressSteps.map((step: any, idx) => {
              const isLast = idx === progressSteps.length - 1
              return (
                <div key={idx} className="flex-1 flex items-start">
                  <div className="flex flex-col items-center flex-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      step.status === 'done' ? 'bg-emerald-100 text-emerald-600' :
                      step.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      step.status === 'current' ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' :
                      'bg-slate-100 text-slate-300'
                    )}>
                      {step.status === 'done' ? <CheckCircle2 className="h-4 w-4" /> :
                       step.status === 'rejected' ? <XCircle className="h-4 w-4" /> :
                       step.status === 'current' ? <Clock className="h-4 w-4" /> :
                       <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold mt-2 text-center",
                      step.status === 'done' ? 'text-emerald-700' :
                      step.status === 'rejected' ? 'text-red-600' :
                      step.status === 'current' ? 'text-amber-700' :
                      'text-slate-400'
                    )}>{step.label}</p>
                    {step.assignee && (
                      <p className="text-[9px] text-slate-400 text-center mt-0.5">{step.assignee}</p>
                    )}
                    {step.status === 'rejected' && step.comment && (
                      <p className="text-[9px] text-red-400 italic text-center mt-1 max-w-[120px]">"{step.comment}"</p>
                    )}
                    {step.status === 'done' && step.date && (
                      <p className="text-[9px] text-slate-400 text-center mt-0.5">{new Date(step.date).toLocaleDateString()}</p>
                    )}
                  </div>
                  {!isLast && (
                    <div className="flex-1 flex items-center pt-4">
                      <div className={cn(
                        "w-full h-0.5",
                        step.status === 'done' ? 'bg-emerald-200' :
                        step.status === 'rejected' ? 'bg-red-200' :
                        'bg-slate-200'
                      )} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Request Details */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Request Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-start justify-between px-6 py-4 gap-2">
                <span className="text-sm font-semibold text-slate-600 sm:w-1/3">{getFieldLabel(key)}</span>
                <div className="text-sm text-slate-800 sm:w-2/3">{renderValue(key, value)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="border border-slate-100 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-4">
            {/* Submitted event */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Request Submitted</p>
                <p className="text-xs text-slate-400">{new Date(submission.created).toLocaleString()}</p>
              </div>
            </div>

            {/* Task events */}
            {(tasks as any[]).map((task: any) => (
              <div key={task.id} className="flex gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  task.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                  task.status === 'rejected' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                )}>
                  {task.status === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                   task.status === 'rejected' ? <XCircle className="h-3.5 w-3.5" /> :
                   <Clock className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      {task.expand?.assignedToId?.name || 'Unknown'}
                    </p>
                    <TaskStatusBadge status={task.status} active={task.isActive} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{task.stepLabel}</p>
                  {task.completedAt && (
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(task.completedAt).toLocaleString()}</p>
                  )}
                  {task.comment && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-md text-xs text-slate-600 italic border border-slate-100">
                      "{task.comment}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SubmissionStatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 border-0"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approved</Badge>
  if (status === 'rejected') return <Badge className="bg-red-100 text-red-600 text-xs px-3 py-1 border-0"><XCircle className="h-3.5 w-3.5 mr-1" />Rejected</Badge>
  return <Badge className="bg-amber-100 text-amber-700 text-xs px-3 py-1 border-0"><Clock className="h-3.5 w-3.5 mr-1" />Pending</Badge>
}

function TaskStatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) return <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Skipped</span>
  if (status === 'pending') return <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Pending</span>
  if (status === 'approved') return <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Approved</span>
  if (status === 'rejected') return <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Rejected</span>
  return <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{status}</span>
}
