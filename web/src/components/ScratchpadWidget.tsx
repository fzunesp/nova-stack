import { useDebouncedScratchpadSave } from '@/hooks/useScratchpad'
import { Textarea } from '@/components/ui/textarea'
import { StickyNote, Loader2, Eraser, Clock } from 'lucide-react'

export function ScratchpadWidget() {
  const { content, setContent, clear, isLoading, isSaving, lastSaved } = useDebouncedScratchpadSave(1000)

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between bg-amber-100/50">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-900">Quick Notes</h3>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
          )}
          {lastSaved && !isSaving && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600">
              <Clock className="w-3 h-3" />
              Saved
            </span>
          )}
          <button
            onClick={clear}
            className="flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 px-2 py-1 rounded-md hover:bg-amber-100 transition-colors"
            title="Clear note"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 p-3 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-amber-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Jot down quick reminders, ideas, or copy-paste info here..."
            className="w-full h-full min-h-[120px] resize-none border-0 bg-transparent text-sm text-amber-950 placeholder:text-amber-300 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-relaxed"
            spellCheck={false}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-amber-100 bg-amber-100/30 flex items-center justify-between">
        <span className="text-[10px] text-amber-500">
          {content.length} characters
        </span>
        <span className="text-[10px] text-amber-400">
          Auto-saves as you type
        </span>
      </div>
    </div>
  )
}
