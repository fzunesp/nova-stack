import { useDebouncedScratchpadSave } from '@/hooks/useScratchpad'
import { Textarea } from '@/components/ui/textarea'
import { StickyNote, Loader2, Eraser, Clock, Palette } from 'lucide-react'
import { useState } from 'react'

export function ScratchpadWidget() {
  const { content, setContent, clear, isLoading, isSaving, lastSaved, selectedColor, setSelectedColor, stickyColors } = useDebouncedScratchpadSave(1000)
  const [showColors, setShowColors] = useState(false)

  return (
    <div className="relative group">
      {/* Sticky note body */}
      <div
        className="relative rounded-sm shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col h-full"
        style={{ backgroundColor: selectedColor.bg, transform: 'rotate(-0.5deg)' }}
      >
        {/* Curled bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[24px] border-r-[24px] border-b-transparent border-r-[rgba(0,0,0,0.06)]" />
          <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[24px] border-r-[24px] border-b-transparent border-r-[rgba(0,0,0,0.03)]" style={{ filter: 'drop-shadow(-1px -1px 1px rgba(0,0,0,0.05))' }} />
        </div>

        {/* Subtle paper texture gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${selectedColor.border}60` }}>
          <div className="flex items-center gap-2">
            <StickyNote className="w-3.5 h-3.5" style={{ color: `${selectedColor.border}cc` }} />
            <h3 className="text-xs font-bold tracking-wide" style={{ color: `${selectedColor.border}dd` }}>Quick Notes</h3>
          </div>
          <div className="flex items-center gap-1">
            {isSaving && (
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: `${selectedColor.border}aa` }} />
            )}
            {lastSaved && !isSaving && (
              <span className="flex items-center gap-1 text-[10px]" style={{ color: `${selectedColor.border}88` }}>
                <Clock className="w-3 h-3" />
                Saved
              </span>
            )}
            <button
              onClick={clear}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded hover:bg-black/10 transition-colors"
              style={{ color: '#374151' }}
              title="Clear note"
            >
              <Eraser className="w-3 h-3" />
              Clear
            </button>
            <div className="relative">
              <button
                onClick={() => setShowColors(!showColors)}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded hover:bg-black/10 transition-colors"
                style={{ color: '#374151' }}
                title="Change color"
              >
                <Palette className="w-3 h-3" />
              </button>
              {showColors && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColors(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-slate-200 p-2 w-40">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-1.5">Note Color</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {stickyColors.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => { setSelectedColor(c); setShowColors(false) }}
                          className="w-10 h-10 rounded-md border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: c.bg,
                            borderColor: selectedColor.name === c.name ? c.border : 'transparent',
                            boxShadow: selectedColor.name === c.name ? `0 0 0 2px ${c.border}40` : 'none',
                          }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative flex-1 p-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full" style={{ color: `${selectedColor.border}88` }}>
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Jot down quick reminders, ideas, or copy-paste info here..."
              className="w-full h-full min-h-[120px] resize-none border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 p-0 leading-relaxed font-normal"
              style={{ color: `${selectedColor.border}ee`, fontFamily: 'system-ui, -apple-system, sans-serif' }}
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="relative px-4 py-1.5 flex items-center justify-between" style={{ borderTop: `1px solid ${selectedColor.border}60` }}>
          <span className="text-[10px]" style={{ color: '#374151' }}>
            {content.length} characters
          </span>
          <span className="text-[10px]" style={{ color: '#6b7280' }}>
            Auto-saves
          </span>
        </div>
      </div>

      {/* Hover lift effect */}
      <div
        className="absolute inset-0 rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ transform: 'rotate(-0.5deg)' }}
      />
    </div>
  )
}
