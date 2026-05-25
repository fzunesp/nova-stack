import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Trash, ArrowLeft, Loader2, GitMerge, FileJson,
  Hash, ArrowUp, ArrowDown, AlertTriangle, Info, CheckCircle,
  ShieldCheck, Zap, Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase'
import { useQuery } from '@tanstack/react-query'

type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea' | 'signature' | 'file' | 'heading'

interface FieldConfig {
  id: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[]
}

interface WorkflowStep {
  userId: string
  label: string
  active: boolean
}

interface FormTemplateCreatorProps {
  onSaved?: () => void
  onBack?: () => void
  initialData?: {
    id: string
    name: string
    prefix: string
    description: string
    isParallel: boolean
    webhookUrl: string
    fields: FieldConfig[]
    workflowSteps: WorkflowStep[]
  }
}

export default function FormTemplateCreator({ onSaved, onBack, initialData }: FormTemplateCreatorProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [name, setName] = useState(initialData?.name || '')
  const [prefix, setPrefix] = useState(initialData?.prefix || 'REQ')
  const [description, _setDescription] = useState(initialData?.description || '')
  const [webhookUrl, setWebhookUrl] = useState(initialData?.webhookUrl || '')
  const [isParallel, setIsParallel] = useState(initialData?.isParallel || false)
  const [fields, setFields] = useState<FieldConfig[]>(
    initialData?.fields || [{ id: 'field_1', label: 'New Field', type: 'text', required: true }]
  )
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(initialData?.workflowSteps || [])

  // Fetch users for approver selection
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-hr'],
    queryFn: () =>
      pb.collection('users').getFullList({
        filter: '(role = "hr" || role = "manager" || role = "admin") && isActive = true',
        sort: 'name',
      }),
  })

  const addField = () => {
    const newId = `field_${Date.now()}`
    setFields((prev) => [...prev, { id: newId, label: 'New Field', type: 'text', required: false }])
  }

  const removeField = (index: number) => setFields((prev) => prev.filter((_, i) => i !== index))

  const updateField = (index: number, updates: Partial<FieldConfig>) =>
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)))

  const addWorkflowStep = () => {
    if (users.length === 0) return toast.error('No users available to act as approvers')
    setWorkflowSteps((prev) => [...prev, { userId: (users[0] as any).id, label: 'Approval Step', active: true }])
  }

  const moveStep = (index: number, dir: 'up' | 'down') => {
    const steps = [...workflowSteps]
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= steps.length) return
    ;[steps[index], steps[target]] = [steps[target], steps[index]]
    setWorkflowSteps(steps)
  }

  const removeStep = (index: number) => setWorkflowSteps((prev) => prev.filter((_, i) => i !== index))

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    if (updates.userId) {
      const isDuplicate = workflowSteps.some((s, i) => s.userId === updates.userId && i !== index)
      if (isDuplicate) return toast.error('This person is already in the approval tree.')
    }
    setWorkflowSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)))
  }

  const validateAndConfirm = () => {
    if (!name.trim()) return toast.error('Process name is required')
    if (prefix.length > 3) return toast.error('Prefix must be max 3 characters')
    if (workflowSteps.length === 0) return toast.error('At least one approval step is required')
    const hasDupes = new Set(workflowSteps.map((s) => s.userId)).size !== workflowSteps.length
    if (hasDupes) return toast.error('The approval tree contains duplicate approvers.')
    setShowConfirm(true)
  }

  const handleSave = () => {
    setShowConfirm(false)
    startTransition(async () => {
      try {
        const payload = {
          name: name.trim(),
          key: name.trim().toLowerCase().replace(/\s+/g, '_'),
          prefix: prefix.toUpperCase(),
          description: description.trim(),
          isActive: true,
          fields: fields,
          workflowSteps: workflowSteps,
          isParallel,
          webhookUrl: webhookUrl.trim(),
        }

        if (initialData?.id) {
          await pb.collection('form_definitions').update(initialData.id, payload)
        } else {
          await pb.collection('form_definitions').create(payload)
        }

        toast.success(initialData ? 'Process updated!' : 'Process published!')
        onSaved?.()
      } catch (err: any) {
        toast.error(err?.message || 'Failed to save process')
      }
    })
  }

  const inactiveSteps = workflowSteps.filter((s) => !s.active)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Confirm & Publish Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Final Process Review
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Flow Strategy</span>
                <Badge className={cn('text-[10px] font-bold uppercase', isParallel ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-indigo-600')}>
                  {isParallel ? 'Parallel (Simultaneous)' : 'Sequential (Step-by-Step)'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ID Format</span>
                <span className="font-bold text-indigo-600">{prefix.toUpperCase()}-000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Form Fields</span>
                <span className="font-bold">{fields.length} fields</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approval Steps</span>
                <span className="font-bold">{workflowSteps.length} steps</span>
              </div>
            </div>
            {inactiveSteps.length > 0 && (
              <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{inactiveSteps.length} step(s) are marked as inactive and will be skipped.</p>
              </div>
            )}
            <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">Data is stored locally on this machine — Zero-Cloud.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="font-bold">Go Back</Button>
            <Button onClick={handleSave} disabled={isPending} className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Confirm & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              {initialData ? 'Edit Process' : 'New Approval Process'}
            </h2>
            <p className="text-sm text-slate-500">Design both the form and the approval tree</p>
          </div>
        </div>
        <Button onClick={validateAndConfirm} disabled={isPending} className="font-bold px-8 h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Process'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: General Info + Approval Tree */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">General Information</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Prefix (max 3 letters)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 3))}
                    className="pl-9 font-bold tracking-widest text-indigo-600"
                    placeholder="VAC"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Process Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vacation Request" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 text-amber-600">
                  <Zap className="h-3 w-3" /> n8n Webhook URL
                </Label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="font-mono text-[10px]"
                  placeholder="http://localhost:5678/webhook/..."
                />
                <p className="text-[9px] text-slate-400 italic">Triggered upon final approval.</p>
              </div>
            </CardContent>
          </Card>

          {/* Approval Tree */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-slate-700">
                <GitMerge className="h-4 w-4" />
                <span className="font-black uppercase text-xs tracking-widest">Approval Tree</span>
              </div>
              <Button onClick={addWorkflowStep} variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50">
                + Add Step
              </Button>
            </div>

            {/* Flow Mode Toggle */}
            <Card className="border border-slate-100 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Flow Mode</Label>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <Button
                    type="button"
                    variant={!isParallel ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setIsParallel(false)}
                    className={cn('flex-1 h-7 text-[10px] font-bold uppercase', !isParallel && 'bg-white shadow-sm text-indigo-600')}
                  >
                    <Layers className="h-3 w-3 mr-1" /> Sequential
                  </Button>
                  <Button
                    type="button"
                    variant={isParallel ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setIsParallel(true)}
                    className={cn('flex-1 h-7 text-[10px] font-bold uppercase', isParallel && 'bg-amber-500 text-white shadow-sm')}
                  >
                    <Zap className="h-3 w-3 mr-1" /> Parallel
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {isParallel ? 'Everyone notified at once. All must approve.' : 'Approvers notified one by one in order.'}
                </p>
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            {workflowSteps.map((step, idx) => (
              <Card key={idx} className={cn('border border-slate-100 shadow-sm', !step.active && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 mt-0.5">
                      {!isParallel && (
                        <>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300" onClick={() => moveStep(idx, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                          <div className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">{idx + 1}</div>
                          <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300" onClick={() => moveStep(idx, 'down')}><ArrowDown className="h-3 w-3" /></Button>
                        </>
                      )}
                      {isParallel && <div className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center"><Zap className="h-3 w-3" /></div>}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={step.label}
                        onChange={(e) => updateStep(idx, { label: e.target.value })}
                        className="h-7 text-xs font-bold border-none px-0 focus-visible:ring-0 uppercase"
                      />
                      <Select value={step.userId} onValueChange={(val) => updateStep(idx, { userId: val })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select approver" />
                        </SelectTrigger>
                        <SelectContent>
                          {(users as any[]).map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name} ({u.role})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`active-${idx}`}
                          checked={step.active}
                          onCheckedChange={(val) => updateStep(idx, { active: !!val })}
                        />
                        <Label htmlFor={`active-${idx}`} className="text-[10px] font-bold uppercase text-slate-500 cursor-pointer">
                          Currently Active
                        </Label>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeStep(idx)} className="h-7 w-7 text-slate-200 hover:text-red-500">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {workflowSteps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4 italic">No approval steps yet. Click + Add Step.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Form Fields */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-slate-400">
              <FileJson className="h-4 w-4" />
              <span className="font-black uppercase text-xs tracking-widest">Process Form Fields</span>
            </div>
            <Button onClick={addField} size="sm" variant="outline" className="h-8 text-[10px] font-bold border-dashed border-2 hover:border-indigo-500 px-4">
              + Add Form Field
            </Button>
          </div>

          {fields.map((field, idx) => (
            <Card key={field.id} className="border border-slate-100 shadow-sm group relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 group-hover:bg-indigo-500 transition-colors rounded-l-md" />
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Label</Label>
                        <Input value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} className="h-9 font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Type</Label>
                        <Select value={field.type} onValueChange={(val: any) => updateField(idx, { type: val })}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Short Text</SelectItem>
                            <SelectItem value="textarea">Long Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="date">Date Picker</SelectItem>
                            <SelectItem value="signature">Signature</SelectItem>
                            <SelectItem value="file">File Attachment</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="heading">Section Heading</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Options for select type */}
                    {field.type === 'select' && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Options (comma-separated)</Label>
                        <Input
                          placeholder="Option A, Option B, Option C"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                          className="h-9 font-mono text-xs"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-5 pt-1 border-t border-slate-50">
                      {field.type !== 'heading' && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`req-${field.id}`}
                            checked={!!field.required}
                            onCheckedChange={(val) => updateField(idx, { required: !!val })}
                          />
                          <Label htmlFor={`req-${field.id}`} className="text-xs font-bold text-slate-600 cursor-pointer">Required</Label>
                        </div>
                      )}
                      <div className="ml-auto text-[10px] font-mono text-slate-300">id: {field.id}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeField(idx)} className="text-slate-200 hover:text-red-500 mt-1">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {fields.length === 0 && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
              <FileJson className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No fields yet. Click + Add Form Field to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
