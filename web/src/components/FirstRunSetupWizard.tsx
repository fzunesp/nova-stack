import { useState } from 'react'
import { Sparkles, Building2, User, Check, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase'
import { useTheme, type ThemeName } from '@/contexts/ThemeContext'
import { toast } from 'sonner'

const THEMES: { id: ThemeName; label: string; description: string; hex: string; hexDark: string }[] = [
  { id: 'indigo', label: 'Indigo', description: 'Classic & trustworthy', hex: '#4f46e5', hexDark: '#4338ca' },
  { id: 'violet', label: 'Violet', description: 'Bold & premium', hex: '#7c3aed', hexDark: '#6d28d9' },
  { id: 'emerald', label: 'Emerald', description: 'Fresh & distinctive', hex: '#10b981', hexDark: '#059669' },
  { id: 'orange', label: 'Orange', description: 'Warm & energetic', hex: '#ea580c', hexDark: '#c2410c' },
]

export function FirstRunSetupWizard({ user, onComplete }: { user: any; onComplete: () => void }) {
  const { theme, setTheme } = useTheme()
  const [step, setStep] = useState(1)
  const [adminName, setAdminName] = useState(user?.name || '')
  const [companyName, setCompanyName] = useState(user?.companyName || '')
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(theme)
  const [loading, setLoading] = useState(false)

  const handleNext = () => {
    if (step === 1 && !adminName.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (step === 2 && !companyName.trim()) {
      toast.error('Please enter your company name')
      return
    }
    setStep(prev => prev + 1)
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const handleThemeSelect = (themeId: ThemeName) => {
    setSelectedTheme(themeId)
    setTheme(themeId) // Instantly preview!
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      // 1. Update the user in PocketBase
      await pb.collection('users').update(user.id, {
        name: adminName,
        companyName: companyName,
      })

      // 2. Set Theme permanently
      setTheme(selectedTheme)

      // 3. Mark in localStorage
      localStorage.setItem(`novastack_first_run_completed_${user.id}`, 'true')
      
      toast.success('Workspace setup successfully initialized!')
      onComplete()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete workspace setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white/90 border border-slate-200/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-all relative">
        {/* Animated Accent bar */}
        <div 
          className="h-1.5 transition-all duration-500" 
          style={{ 
            backgroundColor: THEMES.find(t => t.id === selectedTheme)?.hex || '#4f46e5',
            width: `${(step / 3) * 100}%` 
          }} 
        />

        <div className="p-8 flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">Set up your Workspace</h2>
              <p className="text-xs text-slate-500 mt-0.5">Step {step} of 3: {step === 1 ? 'Personalize Profile' : step === 2 ? 'Company Details' : 'Choose Brand Accent'}</p>
            </div>
          </div>

          {/* Steps Content */}
          <div className="min-h-[160px] flex flex-col justify-center">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">What is your name?</p>
                  <p className="text-xs text-slate-400">This will be shown on dashboards, tasks, and audit logs.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminName" className="text-xs font-semibold text-slate-500">Your Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Alexander Wright"
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">What is your company's name?</p>
                  <p className="text-xs text-slate-400">Used for generating client invoices and branded documents.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs font-semibold text-slate-500">Company / Organization</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Innovations Ltd"
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">Select your workspace color scheme</p>
                  <p className="text-xs text-slate-400">Choose a brand accent that matches your organization.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {THEMES.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      type="button"
                      onClick={() => handleThemeSelect(themeOption.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        selectedTheme === themeOption.id
                          ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white"
                        style={{ backgroundColor: themeOption.hex }}
                      >
                        {selectedTheme === themeOption.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">{themeOption.label}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{themeOption.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            ) : (
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">Nova Stack CRM</span>
            )}
          </div>

          <div>
            {step < 3 ? (
              <Button
                size="sm"
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5 shadow-sm"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finalizing...
                  </>
                ) : (
                  <>
                    Launch Workspace <Sparkles className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
