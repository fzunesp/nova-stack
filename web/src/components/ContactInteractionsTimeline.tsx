import { useState } from 'react'
import { Phone, Mail, MessageSquare, StickyNote, MessageCircle, FileText, Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  useContactInteractions,
  useCreateInteraction,
  useUpdateInteraction,
  useDeleteInteraction,
} from '@/hooks/useContactInteractions'
import type { InteractionType } from '@/services/types'

const TYPE_CONFIG: Record<InteractionType, { label: string; icon: typeof Phone; color: string }> = {
  call: { label: 'Call', icon: Phone, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  email: { label: 'Email', icon: Mail, color: 'bg-violet-50 text-violet-700 border-violet-200' },
  meeting: { label: 'Meeting', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  note: { label: 'Note', icon: StickyNote, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  proposal: { label: 'Proposal', icon: FileText, color: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const TYPE_OPTIONS: InteractionType[] = ['call', 'email', 'meeting', 'note', 'sms', 'proposal']

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function ContactInteractionsTimeline({ contactId }: { contactId: string }) {
  const { data: interactions, isLoading } = useContactInteractions(contactId)
  const createMutation = useCreateInteraction()
  const updateMutation = useUpdateInteraction()
  const deleteMutation = useDeleteInteraction()
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<InteractionType>('note')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleAdd = async () => {
    if (!newContent.trim()) return
    try {
      await createMutation.mutateAsync({ contactId, content: newContent.trim(), type: newType })
      setNewContent('')
      setNewType('note')
      toast.success('Interaction logged')
    } catch {
      toast.error('Failed to log interaction')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return
    try {
      await updateMutation.mutateAsync({ id, content: editContent.trim(), contactId })
      setEditingId(null)
      toast.success('Updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, contactId })
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {(!interactions || interactions.length === 0) ? (
        <p className="text-xs text-slate-400 italic py-2">No interactions yet.</p>
      ) : (
        <div className="border-l-2 border-slate-100 pl-4 space-y-4">
          {interactions!.map((entry) => {
            const config = TYPE_CONFIG[entry.type]
            const Icon = config.icon
            const isEditing = editingId === entry.id

            return (
              <div key={entry.id} className="relative pl-6">
                <div className="absolute -left-[29px] top-0 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                  <Icon className="w-2.5 h-2.5 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.created && formatTime(entry.created)}</span>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="text-xs min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => handleUpdate(entry.id)}>
                        <Check className="w-3 h-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={() => {
                          setEditingId(entry.id)
                          setEditContent(entry.content)
                        }}
                      >
                        <Pencil className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="pt-3 border-t border-slate-100">
        <div className="flex gap-2 mb-2">
          {TYPE_OPTIONS.map((t) => {
            const config = TYPE_CONFIG[t]
            const Icon = config.icon
            return (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border transition-colors ${
                  newType === t
                    ? `${config.color} ring-1 ring-offset-0`
                    : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a note, log a call, or describe an interaction..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="text-xs min-h-[60px] flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleAdd()
              }
            }}
          />
          <Button
            size="sm"
            className="h-auto px-3 self-end"
            onClick={handleAdd}
            disabled={!newContent.trim() || createMutation.isPending}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">Ctrl+Enter to submit</p>
      </div>
    </div>
  )
}
