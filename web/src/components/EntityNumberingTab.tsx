import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase'
import {
  Hash, Building2, CreditCard, Save, Loader2, Receipt,
  Globe, Phone, Mail, MapPin, FileText, BadgeDollarSign,
  Calendar, Percent, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ENTITY_KEYS = [
  'companies', 'contacts', 'deals', 'tasks', 'invoices',
  'products', 'intakes', 'employees',
]

const ENTITY_LABELS: Record<string, string> = {
  companies: 'Companies',
  contacts: 'Contacts',
  deals: 'Deals',
  tasks: 'Tasks',
  invoices: 'Invoices',
  products: 'Products',
  intakes: 'Intakes',
  employees: 'Employees',
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
]

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ns-accent))] focus:border-transparent bg-white placeholder-slate-400 transition-shadow'

function generatePreview(entity: string, config: any) {
  const e = config?.[entity]
  if (!e || e.enabled !== true) return '—'
  const prefix = e.prefix || ''
  const padding = e.padding || 4
  const num = String(e.nextNumber || 1)
  const padded = num.padStart(padding, '0')
  const suffix = e.suffix ? `-${e.suffix}` : ''
  return `${prefix}-${padded}${suffix}`
}

export function EntityNumberingTab() {
  // ─── Fetch all settings ─────────────────────────────────────────────
  const { data: settings, isLoading } = useQuery({
    queryKey: ['app_settings'],
    queryFn: () => pb.collection('app_settings').getFullList(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    )
  }

  return <EntityNumberingForm settings={settings || []} />
}

function EntityNumberingForm({ settings }: { settings: any[] }) {
  const queryClient = useQueryClient()

  const numbering = settings.find((s: any) => s.category === 'numbering')
  const company = settings.find((s: any) => s.category === 'company')
  const billing = settings.find((s: any) => s.category === 'billing')

  const numberingConfig = numbering?.config || {}
  const companyConfig = company?.config || {}
  const billingConfig = billing?.config || {}

  // ─── Numbering state ────────────────────────────────────────────────
  const [numberingDraft, setNumberingDraft] = useState(() => JSON.parse(JSON.stringify(numberingConfig)))

  const saveNumbering = useMutation({
    mutationFn: async () => {
      if (numbering) {
        return pb.collection('app_settings').update(numbering.id, { config: numberingDraft })
      }
      return pb.collection('app_settings').create({ category: 'numbering', config: numberingDraft })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings'] })
      queryClient.invalidateQueries({ queryKey: ['billing-settings'] })
      toast.success('Numbering configuration saved')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save numbering'),
  })

  const handleNumberingChange = (entity: string, field: string, value: any) => {
    setNumberingDraft((prev: any) => ({
      ...prev,
      [entity]: { ...(prev[entity] || {}), [field]: value },
    }))
  }

  const resetCounter = (entity: string) => {
    setNumberingDraft((prev: any) => ({
      ...prev,
      [entity]: { ...(prev[entity] || {}), nextNumber: 1 },
    }))
  }

  // ─── Company state ──────────────────────────────────────────────────
  const [companyDraft, setCompanyDraft] = useState(() => JSON.parse(JSON.stringify(companyConfig)))

  const saveCompany = useMutation({
    mutationFn: async () => {
      if (company) {
        return pb.collection('app_settings').update(company.id, { config: companyDraft })
      }
      return pb.collection('app_settings').create({ category: 'company', config: companyDraft })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings'] })
      toast.success('Company information saved')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save company info'),
  })

  // ─── Billing state ──────────────────────────────────────────────────
  const [billingDraft, setBillingDraft] = useState(() => JSON.parse(JSON.stringify(billingConfig)))

  const saveBilling = useMutation({
    mutationFn: async () => {
      if (billing) {
        return pb.collection('app_settings').update(billing.id, { config: billingDraft })
      }
      return pb.collection('app_settings').create({ category: 'billing', config: billingDraft })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_settings'] })
      toast.success('Billing configuration saved')
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save billing'),
  })

  return (
    <div className="space-y-6">

      {/* ─── Section 1: Entity Numbering ─────────────────────────────── */}
      <div id="entity-numbering" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Entity Numbering</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">Configure prefixes, padding, and suffixes for auto-generated identifiers.</p>
          </div>
          <Button
            onClick={() => saveNumbering.mutate()}
            disabled={saveNumbering.isPending}
            className="flex items-center gap-1.5"
          >
            {saveNumbering.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saveNumbering.isPending ? 'Saving...' : 'Save Numbering'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-16">Enabled</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-40">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Prefix</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-24">Padding</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Suffix</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-20">Next #</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Preview</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ENTITY_KEYS.map((key) => {
                const e = numberingDraft[key] || { enabled: false, prefix: '', padding: 4, suffix: '', nextNumber: 1 }
                return (
                  <tr key={key} className={`hover:bg-slate-50/50 transition-colors ${e.enabled !== true ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <Checkbox
                        checked={e.enabled === true}
                        onCheckedChange={(checked) => handleNumberingChange(key, 'enabled', !!checked)}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-medium text-slate-900">{ENTITY_LABELS[key]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={e.prefix || ''}
                        onChange={(ev) => handleNumberingChange(key, 'prefix', ev.target.value.toUpperCase())}
                        className={`${inputClass} w-20 text-center font-mono text-xs`}
                        placeholder="INV"
                        maxLength={6}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={String(e.padding || 4)}
                        onValueChange={(v) => handleNumberingChange(key, 'padding', parseInt(v))}
                      >
                        <SelectTrigger className="w-16 h-8 text-xs border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 digits</SelectItem>
                          <SelectItem value="4">4 digits</SelectItem>
                          <SelectItem value="5">5 digits</SelectItem>
                          <SelectItem value="6">6 digits</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={e.suffix || ''}
                        onChange={(ev) => handleNumberingChange(key, 'suffix', ev.target.value.toUpperCase())}
                        className={`${inputClass} w-20 text-center font-mono text-xs`}
                        placeholder="—"
                        maxLength={6}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={e.nextNumber || 1}
                        onChange={(ev) => handleNumberingChange(key, 'nextNumber', parseInt(ev.target.value) || 1)}
                        className={`${inputClass} w-16 text-center font-mono text-xs`}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-xs shadow-none">
                        {generatePreview(key, numberingDraft)}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => resetCounter(key)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Reset counter to 1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Section 2: Company Info ─────────────────────────────────── */}
      <div id="company-info" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Company Information</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">Your business details appear on invoices and official documents.</p>
          </div>
          <Button
            onClick={() => saveCompany.mutate()}
            disabled={saveCompany.isPending}
            className="flex items-center gap-1.5"
          >
            {saveCompany.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saveCompany.isPending ? 'Saving...' : 'Save Company'}
          </Button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-5">
          <div id="company-name">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Building2 className="w-3.5 h-3.5" /> Company name
            </Label>
            <input
              type="text"
              value={companyDraft.name || ''}
              onChange={(ev) => setCompanyDraft({ ...companyDraft, name: ev.target.value })}
              className={inputClass}
              placeholder="Acme Corporation"
            />
          </div>
          <div id="company-website">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Globe className="w-3.5 h-3.5" /> Website
            </Label>
            <input
              type="url"
              value={companyDraft.website || ''}
              onChange={(ev) => setCompanyDraft({ ...companyDraft, website: ev.target.value })}
              className={inputClass}
              placeholder="https://acme.com"
            />
          </div>
          <div id="company-email">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </Label>
            <input
              type="email"
              value={companyDraft.email || ''}
              onChange={(ev) => setCompanyDraft({ ...companyDraft, email: ev.target.value })}
              className={inputClass}
              placeholder="billing@acme.com"
            />
          </div>
          <div id="company-phone">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone
            </Label>
            <input
              type="tel"
              value={companyDraft.phone || ''}
              onChange={(ev) => setCompanyDraft({ ...companyDraft, phone: ev.target.value })}
              className={inputClass}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div id="company-address" className="col-span-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5" /> Address
            </Label>
            <input
              type="text"
              value={companyDraft.address || ''}
              onChange={(ev) => setCompanyDraft({ ...companyDraft, address: ev.target.value })}
              className={inputClass}
              placeholder="123 Main St, Suite 100, San Francisco, CA 94105"
            />
          </div>
          <div id="company-registration">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <FileText className="w-3.5 h-3.5" /> Registration number
            </Label>
            <input
              type="text"
              value={companyDraft.registration || ''}
              onChange={(ev) => setCompanyDraft({ ...companyDraft, registration: ev.target.value })}
              className={inputClass}
              placeholder="Company registration / CRN"
            />
          </div>
          <div id="company-taxId">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Receipt className="w-3.5 h-3.5" /> Tax ID / VAT
            </Label>
            <input
              type="text"
              value={companyDraft.taxId || ''}
              onChange={(ev) => setCompanyDraft({ ...companyDraft, taxId: ev.target.value })}
              className={inputClass}
              placeholder="US123456789"
            />
          </div>
        </div>
      </div>

      {/* ─── Section 3: Currency & Tax ───────────────────────────────── */}
      <div id="currency-tax" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Currency & Tax</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">Default currency, tax rate, and payment terms for invoices.</p>
          </div>
          <Button
            onClick={() => saveBilling.mutate()}
            disabled={saveBilling.isPending}
            className="flex items-center gap-1.5"
          >
            {saveBilling.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saveBilling.isPending ? 'Saving...' : 'Save Billing'}
          </Button>
        </div>

        <div className="p-6 grid grid-cols-3 gap-5">
          <div id="currency">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <BadgeDollarSign className="w-3.5 h-3.5" /> Currency
            </Label>
            <Select
              value={billingDraft.currency || 'USD'}
              onValueChange={(v) => setBillingDraft({ ...billingDraft, currency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div id="tax-rate">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Percent className="w-3.5 h-3.5" /> Tax rate (%)
            </Label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={billingDraft.tax_rate ?? 0}
              onChange={(ev) => setBillingDraft({ ...billingDraft, tax_rate: parseFloat(ev.target.value) || 0 })}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div id="payment-terms">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5" /> Payment terms (days)
            </Label>
            <input
              type="number"
              min="0"
              value={billingDraft.payment_terms_days ?? 14}
              onChange={(ev) => setBillingDraft({ ...billingDraft, payment_terms_days: parseInt(ev.target.value) || 0 })}
              className={inputClass}
              placeholder="14"
            />
          </div>
        </div>
      </div>

    </div>
  )
}
