import React, { useState, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Check, X, Eye, Timer, ArrowUpDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type SortKey = 'formattedId' | 'date' | 'employee'

interface DecisionQueueProps {
  tasks: any[]
}

export default function DecisionQueue({ tasks: initialTasks }: DecisionQueueProps) {
  const queryClient = useQueryClient()
  const currentUserId = pb.authStore.record?.id

  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' })
  const [comment, setComment] = useState('')
  const [confirm, setConfirm] = useState<{
    open: boolean
    type: 'approved' | 'rejected' | null
    taskId: string | null
    submissionId: string | null
    formattedId: string
  }>({ open: false, type: null, taskId: null, submissionId: null, formattedId: '' })

  const handleSort = (key: SortKey) =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }))

  // Group tasks by submissionId, sort within groups by stepOrder
  const groups = useMemo(() => {
    const map: Record<string, any[]> = {}
    initialTasks.forEach((task) => {
      if (!map[task.submissionId]) map[task.submissionId] = []
      map[task.submissionId].push(task)
    })
    const list = Object.values(map).map((groupTasks) => {
      groupTasks.sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0))
      return {
        submissionId: groupTasks[0].submissionId,
        formattedId: groupTasks[0].expand?.submissionId?.formattedId || groupTasks[0].submissionId,
        // submission.name is stored at create time — userId is text, can't be expanded
        employeeName: groupTasks[0].expand?.submissionId?.name || groupTasks[0].expand?.submissionId?.email || 'Unknown',
        formName: groupTasks[0].expand?.submissionId?.expand?.formId?.name || 'Unknown Form',
        createdAt: new Date(groupTasks[0].expand?.submissionId?.created || groupTasks[0].created),
        finalStatus: groupTasks[0].expand?.submissionId?.status || 'pending',
        tasks: groupTasks,
      }
    })

    list.sort((a, b) => {
      let cmp = 0
      if (sort.key === 'formattedId') cmp = a.formattedId.localeCompare(b.formattedId)
      if (sort.key === 'employee') cmp = a.employeeName.localeCompare(b.employeeName)
      if (sort.key === 'date') cmp = a.createdAt.getTime() - b.createdAt.getTime()
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [initialTasks, sort])

  const decisionMutation = useMutation({
    mutationFn: async ({ submissionId, taskId, type, comment }: {
      submissionId: string; taskId: string; type: 'approved' | 'rejected'; comment: string
    }) => {
      // Set status to the actual decision ('approved' or 'rejected') so the
      // backend JSVM hook (task_on_update.pb.js) fires and advances the workflow.
      await pb.collection('approval_tasks').update(taskId, {
        status: type,
        comment: comment || null,
        completedAt: new Date().toISOString(),
      })

      // Note: Advancing to next step, completing the submission, or rejection
      // cascade is handled by the backend hook in task_on_update.pb.js.
    },

    onSuccess: (_, { formattedId, type }) => {
      toast.success(`Request ${formattedId} ${type}`)
      setComment('')
      setConfirm({ open: false, type: null, taskId: null, submissionId: null, formattedId: '' })
      queryClient.invalidateQueries({ queryKey: ['approval_tasks'] })
      queryClient.invalidateQueries({ queryKey: ['intake_submissions'] })
    },
    onError: () => toast.error('Action failed. Please try again.'),
  })

  return (
    <>
      {/* Confirm Dialog */}
      <Dialog open={confirm.open} onOpenChange={(open) => !decisionMutation.isPending && setConfirm((p) => ({ ...p, open }))}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className={cn(confirm.type === 'approved' ? 'text-emerald-700' : 'text-red-600')}>
              {confirm.type === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to <strong>{confirm.type}</strong> request <span className="font-mono font-bold text-indigo-600">{confirm.formattedId}</span>?
          </p>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decision Note (optional)</Label>
            <Textarea
              placeholder={`Add a note for ${confirm.type === 'approved' ? 'approval' : 'rejection'}…`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              disabled={decisionMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm((p) => ({ ...p, open: false }))}>Cancel</Button>
            <Button
              onClick={() => decisionMutation.mutate({
                submissionId: confirm.submissionId!,
                taskId: confirm.taskId!,
                type: confirm.type!,
                comment,
              })}
              disabled={decisionMutation.isPending}
              className={cn('font-bold', confirm.type === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white')}
            >
              {decisionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {confirm.type === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Check className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No pending decisions. All caught up!</p>
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="px-6 py-4">
                <Button variant="ghost" size="sm" onClick={() => handleSort('formattedId')} className="font-bold text-slate-400 uppercase text-[10px] tracking-widest gap-1 p-0 h-auto hover:bg-transparent hover:text-indigo-600">
                  Request ID <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="px-6 py-4">
                <Button variant="ghost" size="sm" onClick={() => handleSort('date')} className="font-bold text-slate-400 uppercase text-[10px] tracking-widest gap-1 p-0 h-auto hover:bg-transparent hover:text-indigo-600">
                  Submitted <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="px-6 py-4">
                <Button variant="ghost" size="sm" onClick={() => handleSort('employee')} className="font-bold text-slate-400 uppercase text-[10px] tracking-widest gap-1 p-0 h-auto hover:bg-transparent hover:text-indigo-600">
                  Employee <ArrowUpDown className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Approver</TableHead>
              <TableHead className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Waiting</TableHead>
              <TableHead className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Final Status</TableHead>
              <TableHead className="px-6 py-4 text-right font-bold text-slate-400 uppercase text-[10px] tracking-widest">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <React.Fragment key={group.submissionId}>
                {group.tasks.map((task: any, idx: number) => {
                  const canAct = task.assignedToId === currentUserId && task.status === 'pending' && task.isActive
                  return (
                    <TableRow key={task.id} className={cn('border-b border-slate-50 transition-colors', !task.isActive && 'opacity-40 grayscale', idx > 0 && 'bg-slate-50/20')}>
                      <TableCell className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">
                        {idx === 0 ? group.formattedId : ''}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {idx === 0 && (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600">{group.createdAt.toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-400">{group.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {idx === 0 && (
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{group.employeeName}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-medium">{group.formName}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {(task.expand?.assignedToId?.name || '?').charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-600">{task.expand?.assignedToId?.name || 'Unassigned'}</span>
                            <span className="text-[9px] font-black uppercase text-slate-400">{task.stepLabel}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <DurationBadge createdAt={task.created} completedAt={task.completedAt} />
                        <TaskStatusBadge status={task.status} active={task.isActive} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        {idx === 0 && <FinalStatusBadge status={group.finalStatus} />}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {canAct && (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-slate-200 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => setConfirm({ open: true, type: 'approved', taskId: task.id, submissionId: task.submissionId, formattedId: group.formattedId })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-slate-200 text-red-500 hover:bg-red-50"
                                onClick={() => setConfirm({ open: true, type: 'rejected', taskId: task.id, submissionId: task.submissionId, formattedId: group.formattedId })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="h-2 bg-slate-50/50 hover:bg-slate-50/50 border-none" aria-hidden="true">
                  <TableCell colSpan={7} className="p-0 border-none" />
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}

function DurationBadge({ createdAt, completedAt }: { createdAt: string; completedAt?: string }) {
  const start = new Date(createdAt)
  const end = completedAt ? new Date(completedAt) : new Date()
  const ms = end.getTime() - start.getTime()
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(ms / 3600000)
  const days = Math.floor(ms / 86400000)
  let text = mins < 60 ? `${mins}m` : hours < 24 ? `${hours}h` : `${days}d`
  const color = days >= 1 ? 'text-red-500 font-black' : hours >= 4 ? 'text-amber-500 font-bold' : 'text-slate-400'
  return (
    <div className={cn('flex items-center gap-1 text-[11px] mb-1 justify-center', color)}>
      <Timer className="h-3 w-3" /><span>{text}</span>
    </div>
  )
}

function TaskStatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) return <Badge className="bg-slate-100 text-slate-300 uppercase text-[8px] font-bold px-1.5 py-0">Skipped</Badge>
  if (status === 'pending') return <Badge className="bg-amber-100 text-amber-700 uppercase text-[8px] font-bold px-1.5 py-0">Pending</Badge>
  if (status === 'rejected') return <Badge className="bg-red-100 text-red-600 uppercase text-[8px] font-bold px-1.5 py-0">Rejected</Badge>
  if (status === 'approved') return <Badge className="bg-emerald-100 text-emerald-700 uppercase text-[8px] font-bold px-1.5 py-0">Approved</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 uppercase text-[8px] font-bold px-1.5 py-0">Resolved</Badge>
}

function FinalStatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-emerald-500 text-white uppercase text-[9px] font-black px-2 py-0.5">Approved</Badge>
  if (status === 'rejected') return <Badge className="bg-red-500 text-white uppercase text-[9px] font-black px-2 py-0.5">Rejected</Badge>
  return <Badge className="bg-slate-100 text-slate-500 uppercase text-[9px] font-black px-2 py-0.5 border border-slate-200">Processing</Badge>
}
