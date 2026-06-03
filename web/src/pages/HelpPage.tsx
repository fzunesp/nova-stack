import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import {
  LayoutDashboard, Users, CheckSquare, FileText, Inbox,
  HelpCircle, TrendingUp, ChevronRight, Briefcase,
  Search, Keyboard, ArrowUpRight, BookOpen, Building2, Package, Settings, Zap,
  Send, Download, ShieldCheck, StickyNote, Bell, Plus, Kanban, List,
  Palette, Database, Webhook, MessageSquare, Layers, UserPlus,
  Laptop, Smartphone, Key, Lock, Shield, Copy, Edit, Trash2, Play, Loader2, LayoutList, LayoutGrid
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const sections = [
  { id: 'overview', label: 'Overview', icon: HelpCircle },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'navigation', label: 'Search & Nav', icon: Search },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'deals', label: 'Deals', icon: TrendingUp },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'intake', label: 'Intake', icon: Inbox },
  { id: 'hr', label: 'HR (Employees)', icon: Users },
  { id: 'requests', label: 'Requests', icon: Briefcase },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'tips', label: 'Tips & Shortcuts', icon: Zap },
]

const sectionHeadings: Record<string, string[]> = {
  overview: ['What is NovaStack?', 'Your First 5 Minutes', 'How Data Flows Between Screens'],
  dashboard: ['Your Daily Command Center', 'Today Strip', 'Quick Notes (Scratchpad)', 'My Work Queue', 'Money at Risk', 'Business Radar', 'Activity Feed', 'Business KPIs'],
  navigation: ['The Sidebar', 'Global Search (⌘K)', 'Notifications', 'Quick Create', 'Collapsible Sidebar'],
  companies: ['What are Companies?', 'Adding a Company', 'Column Picker', 'Dynamic Custom Fields', 'Company Timeline'],
  contacts: ['What are Contacts?', 'Adding a Contact', 'Contact Profile & Timeline', 'Column Picker'],
  deals: ['What are Deals?', 'The 5 Pipeline Stages', 'Kanban Board View', 'List View & Column Picker', 'Converting Intake to Deals'],
  tasks: ['What are Tasks?', 'Task Statuses & Quick Toggle', 'Kanban Board View', 'Linking Tasks to Contacts & Deals'],
  invoices: ['What are Invoices?', 'Creating an Invoice with Line Items', 'Sending Invoices & PDFs', 'Expandable Row Details', 'Invoice Status Flow'],
  products: ['What are Products?', 'Adding Products', 'Using Products in Invoices'],
  intake: ['What is Intake?', 'Intake Statuses', 'Decision Workflow', 'Converting to a Deal'],
  hr: ['Employee Directory', 'List & Card Views', 'Onboarding New Staff', 'App Access Control', 'Device Entitlements', 'Password Management', 'Private Employee Data'],
  requests: ['What are Requests?', 'Submitting a Request', 'My Request History', 'Approvals Queue', 'Form Builder', 'HR Analytics'],
  settings: ['Work Profile', 'Security', 'Appearance (Themes)', 'Users & Roles', 'Custom Fields', 'Canned Responses', 'Data & Export', 'Webhooks'],
  tips: ['Keyboard Shortcuts', 'Column Picker', 'View Persistence', 'Common Workflows', 'Pro Tips'],
}

/* ─── UI Components ───────────────────────────────────────────────────────── */

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="mb-10 scroll-mt-20" id={id}>
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b-2 border-slate-100 flex items-center gap-2">
        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'rgb(var(--ns-accent))' }} />
        {title}
      </h2>
      <div className="text-sm text-slate-700 leading-relaxed space-y-4">{children}</div>
    </div>
  )
}

function Callout({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'tip' | 'warning' }) {
  const styles = {
    info: 'bg-indigo-50/50 border-indigo-200 text-indigo-900',
    tip: 'bg-emerald-50/50 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/50 border-amber-200 text-amber-900',
  }
  return (
    <div className={`rounded-xl px-5 py-4 text-sm border-l-4 ${styles[variant]}`} style={{ borderLeftColor: 'rgb(var(--ns-accent))' }}>
      <div className="flex items-start gap-3">
        <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-60" />
        <div>{children}</div>
      </div>
    </div>
  )
}

/* ─── Visual Aid Components (Pure CSS/Tailwind) ─────────────────────────── */

function PipelineDiagram() {
  const stages = [
    { label: 'Lead', color: 'bg-blue-50 text-blue-700 border-blue-200', arrow: true },
    { label: 'Contacted', color: 'bg-amber-50 text-amber-700 border-amber-200', arrow: true },
    { label: 'Quoted', color: 'bg-purple-50 text-purple-700 border-purple-200', arrow: true },
    { label: 'Won', color: 'bg-green-50 text-green-700 border-green-200', arrow: true },
    { label: 'Lost', color: 'bg-red-50 text-red-700 border-red-200', arrow: false },
  ]
  return (
    <div className="flex items-center flex-wrap gap-2 my-4">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${s.color}`}>{s.label}</span>
          {s.arrow && <ChevronRight className="w-4 h-4 text-slate-300" />}
        </div>
      ))}
    </div>
  )
}

function InvoiceStatusFlow() {
  return (
    <div className="flex items-center gap-2 my-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
      {[
        { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300' },
        { label: 'Active', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Pending Payment', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        { label: 'Paid', color: 'bg-green-50 text-green-700 border-green-200' },
      ].map((s, i, arr) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${s.color}`}>{s.label}</span>
          {i < arr.length - 1 && <div className="w-8 h-0.5 bg-slate-200" />}
        </div>
      ))}
      <span className="ml-2 text-xs text-slate-400">or <span className="font-bold text-red-600">Cancelled</span></span>
    </div>
  )
}

function TaskStatusCycle() {
  return (
    <div className="flex items-center gap-3 my-4 bg-slate-50 p-4 rounded-xl border border-slate-100 justify-center">
      {[
        { label: 'To Do', dot: 'border-gray-300' },
        { label: 'In Progress', dot: 'border-blue-500' },
        { label: 'Waiting', dot: 'border-amber-500' },
        { label: 'Done', dot: 'border-green-500 bg-green-500' },
      ].map((s, i, arr) => (
        <div key={s.label} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full border-2 ${s.dot}`} />
            <span className="text-xs font-bold text-slate-700">{s.label}</span>
          </div>
          {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
        </div>
      ))}
      <span className="text-xs text-slate-400 ml-2">← click the circle to cycle</span>
    </div>
  )
}

function KanbanMiniDiagram() {
  const cols = [
    { label: 'Lead', count: 3, color: 'border-blue-200 bg-blue-50/30' },
    { label: 'Contacted', count: 2, color: 'border-amber-200 bg-amber-50/30' },
    { label: 'Quoted', count: 1, color: 'border-purple-200 bg-purple-50/30' },
    { label: 'Won', count: 1, color: 'border-green-200 bg-green-50/30' },
    { label: 'Lost', count: 0, color: 'border-red-200 bg-red-50/30' },
  ]
  return (
    <div className="grid grid-cols-5 gap-2 my-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
      {cols.map((c) => (
        <div key={c.label} className={`rounded-lg border p-2 ${c.color}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-700">{c.label}</span>
            <span className="text-[10px] text-slate-500">{c.count}</span>
          </div>
          {c.count > 0 && (
            <div className="space-y-1">
              {[...Array(Math.min(c.count, 2))].map((_, i) => (
                <div key={i} className="bg-white rounded border border-slate-200 p-1.5 text-[9px] text-slate-600 truncate shadow-sm">
                  Deal {i + 1}
                </div>
              ))}
              {c.count > 2 && <div className="text-[9px] text-slate-400 text-center">+{c.count - 2} more</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function IntakeFlowDiagram() {
  return (
    <div className="flex flex-col items-center gap-2 my-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs font-bold text-blue-700">New</div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs font-bold text-amber-700">In Review</div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs font-bold text-green-700">Approved</div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700">Converted to Deal</div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-slate-400">Alternative path:</span>
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1 text-xs font-bold text-red-700">Rejected</div>
      </div>
    </div>
  )
}

function ApprovalStepDiagram() {
  return (
    <div className="flex items-center gap-1 my-4 bg-slate-50 p-4 rounded-xl border border-slate-100 justify-center">
      {[
        { label: '1', state: 'done' },
        { label: '2', state: 'current' },
        { label: '3', state: 'waiting' },
      ].map((step, i, arr) => (
        <div key={step.label} className="flex items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
            step.state === 'done' ? 'bg-emerald-100 text-emerald-600' :
            step.state === 'current' ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-200' :
            'bg-slate-100 text-slate-300'
          }`}>
            {step.state === 'done' ? '✓' : step.label}
          </div>
          {i < arr.length - 1 && <div className={`w-6 h-0.5 ${step.state === 'done' ? 'bg-emerald-200' : 'bg-slate-200'}`} />}
        </div>
      ))}
      <span className="text-xs text-slate-400 ml-3">Multi-step approval workflow</span>
    </div>
  )
}

/* ─── Content ───────────────────────────────────────────────────────────── */

const content: Record<string, React.ReactNode> = {
  overview: (
    <>
      <Section title="What is NovaStack?" id="what-is-novastack">
        <p>
          <strong>NovaStack is a business operations suite</strong> that helps you manage your clients, sales, tasks, invoices, and team — all in one place. Think of it as a digital filing cabinet and assistant for your business.
        </p>
        <p>
          Instead of juggling spreadsheets, sticky notes, and five different apps, NovaStack puts everything in a single workspace:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Companies</strong> — Your customer accounts (like folders for each client)</li>
          <li><strong>Contacts</strong> — The actual people you talk to at those companies</li>
          <li><strong>Deals</strong> — Sales opportunities you're working to close</li>
          <li><strong>Tasks</strong> — Your to-do list, linked to contacts and deals</li>
          <li><strong>Invoices</strong> — Bills you send to get paid, with line items and PDFs</li>
          <li><strong>Products</strong> — Your services/items catalog for fast invoicing</li>
          <li><strong>Intake</strong> — New leads that come in through forms</li>
          <li><strong>HR (Employees)</strong> — Team directory and system access management</li>
          <li><strong>Requests</strong> — Team requests like vacation or expenses with approval workflows</li>
        </ul>
        <Callout variant="tip">
          <strong>Everything stays on your computer.</strong> NovaStack uses a local database called PocketBase. Your data never leaves your machine — no subscriptions, no cloud lock-in.
        </Callout>
      </Section>

      <Section title="Your First 5 Minutes" id="your-first-5-minutes">
        <p>Here's the fastest way to get value out of NovaStack:</p>
        <ol className="list-decimal pl-5 space-y-3 mt-2">
          <li>
            <strong>Add your first company</strong> — Go to <em>Companies</em> and click "Add Company." This is the account you're selling to (e.g., "Acme Corporation").
          </li>
          <li>
            <strong>Add a contact</strong> — Go to <em>CRM → Contacts</em> and add a person at that company (e.g., "John Doe, VP of Sales").
          </li>
          <li>
            <strong>Create a deal</strong> — Still in <em>CRM</em>, switch to the <em>Deals</em> tab and add an opportunity (e.g., "Website Redesign Project — $10,000").
          </li>
          <li>
            <strong>Add a task</strong> — Go to <em>Tasks</em> and create a reminder (e.g., "Follow up with John by Friday").
          </li>
          <li>
            <strong>Check your Dashboard</strong> — Go back to <em>Dashboard</em> and see everything summarized in one view.
          </li>
        </ol>
        <Callout variant="info">
          <strong>Pro tip:</strong> Press <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono font-bold">Ctrl + K</kbd> (or <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono font-bold">⌘ + K</kbd> on Mac) from anywhere to search everything instantly.
        </Callout>
      </Section>

      <Section title="How Data Flows Between Screens" id="how-data-flows-between-screens">
        <p>NovaStack's screens are connected. Here's the natural flow of information:</p>
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 my-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold">New (Intake)</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold">In Review</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold">Approved</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold">Converted to Deal</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold">Deal Won</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold">Invoice Active</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold">Invoice Paid</span>
            </div>
          </div>
        </div>
        <p>This is the full lifecycle: a stranger fills out a form, becomes a contact, turns into a deal, and eventually pays an invoice. NovaStack tracks the whole journey.</p>
      </Section>
    </>
  ),

  dashboard: (
    <>
      <Section title="Your Daily Command Center" id="your-daily-command-center">
        <p>
          The <strong>Dashboard</strong> (called "Command Center") is your home screen — the first thing you see when you log in. It shows you the important stuff at a glance, and warns you when something needs attention.
        </p>
      </Section>

      <Section title="Today Strip" id="today-strip">
        <p>
          At the very top of the Dashboard is a summary strip. It tells you, in plain numbers:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Overdue tasks</strong> — Things you promised to do but haven't done yet</li>
          <li><strong>Unpaid invoices</strong> — Money people owe you that's past due</li>
          <li><strong>New intake</strong> — New leads that just came in today</li>
          <li><strong>Deals needing attention</strong> — Opportunities that haven't moved in a while</li>
        </ul>
        <Callout variant="tip">
          The goal is to see all zeros here. If the strip is empty, you're caught up.
        </Callout>
      </Section>

      <Section title="Quick Notes (Scratchpad)" id="quick-notes-scratchpad">
        <p>
          Right below the Today Strip is a <strong>sticky-note widget</strong>. This is your scratchpad — a place to jot down anything: phone numbers, reminders, ideas, copy-pasted text from emails.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Auto-saves</strong> — Just type and it saves automatically after you stop typing for a second</li>
          <li><strong>6 color options</strong> — Click the color dots to pick yellow, pink, blue, green, purple, or orange</li>
          <li><strong>Persists across pages</strong> — Your note and color choice survive navigating to other screens</li>
          <li><strong>Clear button</strong> — Wipes the note clean when you're done</li>
        </ul>
        <div className="flex gap-2 my-3">
          {['bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200'].map((c, i) => (
            <div key={i} className={`w-6 h-6 rounded-full border-2 border-white shadow-sm ${c}`} />
          ))}
          <span className="text-xs text-slate-400 ml-2 self-center">6 sticky note colors</span>
        </div>
      </Section>

      <Section title="My Work Queue" id="my-work-queue">
        <p>
          The Work Queue is a smart list of things that need action. It's split into three buckets:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
          {[
            ['Needs Attention', 'Tasks overdue, deals gone cold, intake not reviewed.', 'bg-red-50 text-red-700 border-red-200'],
            ['Recently Updated', 'Things that changed in the last few days.', 'bg-blue-50 text-blue-700 border-blue-200'],
            ['Waiting', 'Items where you are waiting on someone else.', 'bg-slate-50 text-slate-700 border-slate-200'],
          ].map(([title, desc, color]) => (
            <div key={title} className={`rounded-lg border p-3 ${color}`}>
              <span className="text-xs font-bold">{title}</span>
              <p className="text-[11px] mt-1 opacity-80">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Money at Risk" id="money-at-risk">
        <p>
          <strong>(Admin/HR only)</strong> A warning strip that shows deals and invoices that are in danger — deals stuck in pipeline too long, or invoices overdue. Click any item to jump directly to it.
        </p>
      </Section>

      <Section title="Business Radar" id="business-radar">
        <p>
          <strong>(Admin/HR only)</strong> The radar chart scores your business across five dimensions: Revenue, Pipeline, Tasks, Conversion, and Intake. A balanced shape means your business is healthy across all areas.
        </p>
      </Section>

      <Section title="Activity Feed" id="activity-feed">
        <p>
          <strong>(Admin/HR only)</strong> The Activity Feed is a real-time stream of everything happening in NovaStack. You can see when deals are won, invoices are paid, or new employees are added.
        </p>
      </Section>

      <Section title="Business KPIs" id="business-kpis">
        <p>
          <strong>(Admin/HR only)</strong> Key Performance Indicators (KPIs) show the financial health of your business:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Total Revenue</strong> — Total money collected from paid invoices.</li>
          <li><strong>Pipeline Value</strong> — The total dollar amount of all active deals.</li>
          <li><strong>Conversion Rate</strong> — How many leads actually turn into won deals.</li>
          <li><strong>Avg Deal Size</strong> — Average value of won deals.</li>
        </ul>
      </Section>
    </>
  ),

  navigation: (
    <>
      <Section title="The Sidebar" id="the-sidebar">
        <p>
          The <strong>Sidebar</strong> is your primary way to move around NovaStack. It's split into two sections:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>WORKSPACE</strong> — Where you do your daily work: Dashboard, Companies, CRM, Tasks, Invoices, Products, Intake, HR, and Requests.</li>
          <li><strong>ACCOUNT</strong> — Where you manage Settings and get Help.</li>
        </ul>
        <p>The active page is highlighted with your chosen accent color.</p>
      </Section>

      <Section title="Global Search (⌘K)" id="global-search-k">
        <p>
          NovaStack features a powerful <strong>Global Command Center</strong>. Instead of clicking through menus, you can "teleport" to any record instantly.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-4 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold shadow-sm">Ctrl</kbd>
            <span className="text-slate-400">+</span>
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold shadow-sm">K</kbd>
          </div>
          <p className="text-xs text-slate-600 font-medium">Type 2+ characters to search contacts, deals, tasks, invoices, products, intake, and companies.</p>
        </div>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Parallel Search</strong> — Searches all 7 core modules simultaneously.</li>
          <li><strong>Keyboard Nav</strong> — Use <kbd className="text-[10px]">↑</kbd> <kbd className="text-[10px]">↓</kbd> to select and <kbd className="text-[10px]">Enter</kbd> to open.</li>
          <li><strong>Direct Links</strong> — Clicking a result opens the record directly in its module.</li>
        </ul>
      </Section>

      <Section title="Notifications" id="notifications">
        <p>
          The <strong>Bell Icon</strong> <Bell className="w-3.5 h-3.5 inline" /> in the top header alerts you when something needs your attention. A red badge shows the count of unread notifications.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Task notifications</strong> — When a task is assigned to you</li>
          <li><strong>Deal notifications</strong> — When a deal stage changes</li>
          <li><strong>Contact notifications</strong> — When a new contact is added</li>
          <li><strong>Invoice notifications</strong> — When an invoice is marked paid</li>
          <li><strong>Intake notifications</strong> — When a new submission arrives</li>
        </ul>
        <p>Click any notification to jump directly to the relevant record. Use <strong>Mark all as read</strong> or <strong>Clear all</strong> to manage your inbox.</p>
      </Section>

      <Section title="Quick Create" id="quick-create">
        <p>
          Next to the notifications bell is the <strong>New (+)</strong> button. Click it to create any record type from any screen without navigating away:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-4">
          {[
            ['Company', 'bg-indigo-100 text-indigo-600'],
            ['Contact', 'bg-blue-100 text-blue-600'],
            ['Deal', 'bg-orange-100 text-orange-600'],
            ['Task', 'bg-emerald-100 text-emerald-600'],
            ['Invoice', 'bg-violet-100 text-violet-600'],
            ['Product', 'bg-amber-100 text-amber-600'],
            ['Intake', 'bg-pink-100 text-pink-600'],
            ['Request', 'bg-slate-100 text-slate-600'],
          ].map(([label, color]) => (
            <div key={label} className={`rounded-lg p-2 text-center text-xs font-semibold ${color}`}>
              {label}
            </div>
          ))}
        </div>
        <p>Some items (like Contact or Deal) will automatically open the correct tab in the CRM.</p>
      </Section>

      <Section title="Collapsible Sidebar" id="collapsible-sidebar">
        <p>
          Click the <strong>Collapse</strong> button at the bottom of the sidebar to hide labels and get more screen space. The sidebar shrinks to icon-only mode. Hover over icons to see their names as tooltips. Click <strong>Expand</strong> to restore the full sidebar.
        </p>
      </Section>
    </>
  ),

  companies: (
    <>
      <Section title="What are Companies?" id="what-are-companies">
        <p>
          <strong>Companies are your customer accounts.</strong> Think of them as folders that hold all the information about one business you work with.
        </p>
        <p>
          Every contact, deal, invoice, and task can be linked to a company. This means when you open a company's page, you see the <strong>complete history</strong> of your relationship with them.
        </p>
      </Section>

      <Section title="Adding a Company" id="adding-a-company">
        <p>
          Go to the <strong>Companies</strong> page and click <strong>Add Company</strong>. Fill in the name, industry, website, and address. Click "Add Company" to save.
        </p>
      </Section>

      <Section title="Column Picker" id="column-picker">
        <p>
          Click the <strong>Columns</strong> button above the table to show or hide specific columns. NovaStack remembers which columns you prefer for each screen, so your layout persists across sessions.
        </p>
        <Callout variant="tip">
          The <strong>Actions</strong> column is always visible and can't be hidden — you always need access to edit and delete buttons.
        </Callout>
      </Section>

      <Section title="Dynamic Custom Fields" id="dynamic-fields">
        <p>
          Need to track something specific like "Tax ID" or "Annual Revenue"? Go to <strong>Settings → Custom Fields</strong> and add fields for Companies. They'll appear automatically on the Add/Edit Company form and as columns in the table.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Text</strong> — For names, IDs, notes</li>
          <li><strong>Number</strong> — For revenue, counts</li>
          <li><strong>Select</strong> — For dropdown choices</li>
          <li><strong>Date</strong> — For milestones</li>
          <li><strong>Checkbox</strong> — For yes/no flags</li>
        </ul>
      </Section>

      <Section title="Company Timeline" id="company-timeline">
        <p>
          When you click on a company name, you see a <strong>detail view</strong> with a timeline showing every interaction: when contacts were added, deals created, invoices sent, and tasks completed. The company stats show total revenue earned and total pipeline value for that account.
        </p>
      </Section>
    </>
  ),

  contacts: (
    <>
      <Section title="What are Contacts?" id="what-are-contacts">
        <p>
          <strong>Contacts are the actual people you work with.</strong> They belong to a Company. If "Acme Corporation" is the folder, then "John Doe, VP of Sales" is a contact inside that folder.
        </p>
        <p>
          Each contact has:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Name</strong> and <strong>job title</strong></li>
          <li><strong>Email</strong> and <strong>phone number</strong></li>
          <li><strong>Company</strong> — who they work for</li>
          <li><strong>Status</strong> — Active or Inactive</li>
          <li><strong>Notes</strong> — Free-text field for any details</li>
        </ul>
      </Section>

      <Section title="Adding a Contact" id="adding-a-contact">
        <p>
          Go to <strong>CRM → Contacts</strong> and click <strong>Add Contact</strong>. The only required fields are <strong>Name</strong> and <strong>Email</strong>. Everything else is optional. You can link them to an existing company from the dropdown.
        </p>
      </Section>

      <Section title="Contact Profile & Timeline" id="contact-profile-and-timeline">
        <p>
          Clicking a contact's name opens their profile dialog with:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Profile Card</h4>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
              <li>Avatar with their initial</li>
              <li>Quick stats: open deals, pending tasks</li>
              <li>Quick actions: Email, Call, Edit, Add Deal</li>
            </ul>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Activity Timeline</h4>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
              <li>Every interaction in one feed</li>
              <li>Manual notes (calls, emails, meetings)</li>
              <li>Auto-generated events (deals, invoices, tasks)</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Column Picker" id="contacts-column-picker">
        <p>
          The Contacts table supports a column picker. By default, you see Company, Name, Email, and Actions. You can also show <strong>Phone</strong> and <strong>Status</strong> columns, plus any custom fields you've created.
        </p>
      </Section>
    </>
  ),

  deals: (
    <>
      <Section title="What are Deals?" id="what-are-deals">
        <p>
          <strong>Deals are sales opportunities.</strong> Each deal has a title, a dollar value, a pipeline stage, and can be linked to a contact and company.
        </p>
      </Section>

      <Section title="The 5 Pipeline Stages" id="the-5-pipeline-stages">
        <p>Every deal moves through five stages:</p>
        <PipelineDiagram />
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>Lead</strong> — Initial inquiry, just discovered.</li>
          <li><strong>Contacted</strong> — First conversation started.</li>
          <li><strong>Quoted</strong> — Proposal or quote sent to the client.</li>
          <li><strong>Won</strong> — Client accepted the deal.</li>
          <li><strong>Lost</strong> — Deal closed unsuccessfully.</li>
        </ul>
      </Section>

      <Section title="Kanban Board View" id="kanban-board-view">
        <p>
          Switch to <strong>Board View</strong> by clicking the Kanban icon <Kanban className="w-3.5 h-3.5 inline" /> next to the search bar. Deals appear as cards in columns by stage. <strong>Drag and drop</strong> cards between columns to update their stage instantly.
        </p>
        <KanbanMiniDiagram />
        <p>Each card shows the deal title, linked contact, assigned owner, and value. The board view loads all deals (not paginated) for a complete pipeline overview.</p>
      </Section>

      <Section title="List View & Column Picker" id="list-view-column-picker">
        <p>
          Switch back to <strong>List View</strong> <List className="w-3.5 h-3.5 inline" /> for a traditional table. Columns include Title, Contact, Owner, Value, Stage, and Actions. Use the Column Picker to show/hide fields. Click column headers to sort.
        </p>
        <Callout variant="tip">
          Your view preference (List or Board) is saved in your browser, so it persists when you return.
        </Callout>
      </Section>

      <Section title="Converting Intake to Deals" id="converting-intake-to-deals">
        <p>
          Approved <strong>Intake</strong> submissions can be converted to deals in one click. NovaStack automatically creates a contact (if one doesn't exist) and pre-fills the deal with the intake data.
        </p>
      </Section>
    </>
  ),

  tasks: (
    <>
      <Section title="What are Tasks?" id="what-are-tasks">
        <p>
          <strong>Tasks are your to-do list.</strong> Each task can be linked to a contact, a deal, and assigned to a team member. Tasks have titles, descriptions, due dates, and statuses.
        </p>
      </Section>

      <Section title="Task Statuses & Quick Toggle" id="task-statuses">
        <p>Every task is in one of four states:</p>
        <TaskStatusCycle />
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>To Do</strong> — Gray circle. Not started yet.</li>
          <li><strong>In Progress</strong> — Blue circle. Currently being worked on.</li>
          <li><strong>Waiting</strong> — Amber circle. Blocked or waiting on someone else.</li>
          <li><strong>Done</strong> — Green check. Completed.</li>
        </ul>
        <Callout variant="tip">
          <strong>Quick toggle:</strong> Click the status circle on the left of any task row to cycle through To Do → In Progress → Done → To Do without opening the edit dialog.
        </Callout>
      </Section>

      <Section title="Kanban Board View" id="kanban-view">
        <p>
          Switch to <strong>Board View</strong> to see tasks organized by status in columns. Drag tasks between columns to change their status. Each card shows the task title, linked contact and deal, assigned person, and due date.
        </p>
        <p>The board shows four columns: <strong>To Do</strong>, <strong>In Progress</strong>, <strong>Waiting</strong>, and <strong>Done</strong>.</p>
      </Section>

      <Section title="Linking Tasks to Contacts & Deals" id="linking-tasks">
        <p>
          When creating or editing a task, you <strong>must</strong> link it to both a contact and a deal. This ensures every task is tied to a specific business context. In the table view, clicking the contact or deal name navigates directly to that record.
        </p>
      </Section>
    </>
  ),

  invoices: (
    <>
      <Section title="What are Invoices?" id="what-are-invoices">
        <p>
          <strong>Invoices are bills you send to clients.</strong> They support line items (multiple products/services per invoice), automatic total calculation, PDF generation, and email sending with templates.
        </p>
      </Section>

      <Section title="Creating an Invoice with Line Items" id="creating-an-invoice">
        <p>
          Click <strong>Add Invoice</strong> and fill in:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Title</strong> — e.g., "Website Redesign - Final Payment"</li>
          <li><strong>Deal / Project</strong> — Link to an existing deal (required)</li>
          <li><strong>Due Date</strong> — When payment is expected</li>
          <li><strong>Status</strong> — Draft, Active, Pending Payment, Paid, or Cancelled</li>
        </ul>
        <p>
          <strong>Line Items:</strong> Add products from your catalog or create custom items. Each line item has a product, quantity, and price. The total invoice amount is calculated automatically.
        </p>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 my-3">
          <p className="text-[11px] font-bold text-slate-700 mb-2">Example Line Item:</p>
          <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
            <span>Web Design Service</span>
            <span>Qty: 1</span>
            <span>$5,000.00</span>
            <span className="font-bold">$5,000.00</span>
          </div>
        </div>
      </Section>

      <Section title="Sending Invoices & PDFs" id="sending-and-pdfs">
        <p>
          Each invoice has action buttons in the Actions column:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Send Invoice</h4>
            <p className="text-[11px] text-slate-600">
              Available for Draft invoices. Opens a dialog where you can choose an email template, customize the subject and body, and send directly to the client's email. Uses <strong>Canned Response templates</strong> from Settings with auto-fill tags like {'{client_name}'} and {'{invoice_number}'}.
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Download PDF</h4>
            <p className="text-[11px] text-slate-600">
              Generate a professional PDF invoice for printing or manual attachment. Includes your company info, line items breakdown, and totals.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Expandable Row Details" id="expandable-row-details">
        <p>
          Click the <strong>chevron arrow</strong> <ChevronRight className="w-3.5 h-3.5 inline" /> on any invoice row to expand it and see the full line items breakdown in a mini table. The URL also updates so you can share direct links to specific invoices.
        </p>
      </Section>

      <Section title="Invoice Status Flow" id="invoice-status-flow">
        <p>Invoices move through these statuses:</p>
        <InvoiceStatusFlow />
        <p>The top of the Invoices page shows two summary cards: <strong>Outstanding</strong> (total of unpaid invoices) and <strong>Paid</strong> (total of paid invoices).</p>
      </Section>
    </>
  ),

  products: (
    <>
      <Section title="What are Products?" id="what-are-products">
        <p>
          <strong>Products are the services or items you sell.</strong> They live in a central catalog so you don't have to re-type pricing on every invoice.
        </p>
      </Section>

      <Section title="Adding Products" id="adding-products">
        <p>
          Click <strong>Add Product</strong> and fill in:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Name</strong> — Required. e.g., "Web Design Service"</li>
          <li><strong>Price ($)</strong> — Required. e.g., 5000.00</li>
          <li><strong>SKU / Item Code</strong> — Optional. e.g., "WEB-001"</li>
          <li><strong>Description</strong> — Optional details about the product</li>
        </ul>
        <p>You can mark products as <strong>Archived</strong> to hide them from new invoices while keeping historical data intact.</p>
      </Section>

      <Section title="Using Products in Invoices" id="using-products-in-invoices">
        <p>
          When creating an invoice, the line item selector pulls from your active Products catalog. Selecting a product auto-fills the name and price. You can then adjust the quantity. The total updates automatically.
        </p>
        <Callout variant="tip">
          Products with status "Archived" won't appear in the invoice line item selector, but existing invoices that used them are unaffected.
        </Callout>
      </Section>
    </>
  ),

  intake: (
    <>
      <Section title="What is Intake?" id="what-is-intake">
        <p>
          <strong>Intake is where new business starts.</strong> It collects submissions from external forms — potential clients reaching out, internal requests, or lead captures. Each submission has a name, email, message, type, and source.
        </p>
      </Section>

      <Section title="Intake Statuses" id="intake-statuses">
        <p>Every submission follows this path:</p>
        <IntakeFlowDiagram />
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>New</strong> — Unread submission, just arrived.</li>
          <li><strong>In Review</strong> — Someone is qualifying the lead.</li>
          <li><strong>Pending Decision</strong> — Under consideration.</li>
          <li><strong>Approved</strong> — Valid opportunity, ready to convert.</li>
          <li><strong>Rejected</strong> — Not a fit for your business.</li>
          <li><strong>Converted to Deal</strong> — Successfully moved to CRM.</li>
        </ul>
      </Section>

      <Section title="Decision Workflow" id="decision-workflow">
        <p>
          Click any submission to open the <strong>Intake Detail Dialog</strong>. Here you can:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Review the submitter's info, message, and submission type</li>
          <li>Write a <strong>Decision Note</strong> explaining your reasoning</li>
          <li>Click <strong>Approve</strong> or <strong>Reject</strong></li>
        </ul>
        <p>After approval, a <strong>Convert to Deal</strong> button appears. After conversion, a "View CRM Deal" link lets you jump to the new deal.</p>
      </Section>

      <Section title="Converting to a Deal" id="converting-to-a-deal">
        <p>
          When you click <strong>Convert to Deal</strong>, NovaStack:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Checks if a contact with that email already exists — if not, creates one</li>
          <li>Creates a new Deal in the "Lead" stage with the intake data</li>
          <li>Updates the intake status to "Converted" and links it to the new deal</li>
        </ol>
        <Callout variant="tip">
          This is the fastest way to turn a form submission into a trackable sales opportunity.
        </Callout>
      </Section>
    </>
  ),

  hr: (
    <>
      <Section title="Employee Directory" id="employee-directory">
        <p>
          The <strong>HR</strong> page (labeled "Employee Directory") is where you manage your team. It shows everyone who works for your company with their title, department, email, and system access status.
        </p>
      </Section>

      <Section title="List & Card Views" id="list-card-views">
        <p>
          Toggle between two views using the buttons in the filter bar:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><LayoutList className="w-3.5 h-3.5" /> List View</h4>
            <p className="text-[11px] text-slate-600">Detailed table with columns: Employee, ID, Title, Department, Status, and Actions. Sortable and searchable.</p>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5" /> Card View</h4>
            <p className="text-[11px] text-slate-600">Visual profile cards showing avatar, name, title, department, email, and status. Hover to reveal edit button.</p>
          </div>
        </div>
      </Section>

      <Section title="Onboarding New Staff" id="onboarding-new-staff">
        <p>
          Click <strong>Add Employee</strong> to open the onboarding form. It has two columns:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Left: Core Personnel</h4>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
              <li>Full Name (required)</li>
              <li>Work Email</li>
              <li>Department (dropdown)</li>
              <li>Job Title</li>
              <li>Employee ID (auto-generated)</li>
              <li>Extended custom fields</li>
            </ul>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Right: App Access Control</h4>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
              <li>Enable System Login toggle</li>
              <li>Permission Role selector</li>
              <li>Device Entitlements</li>
              <li>Password management</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="App Access Control" id="app-access-control">
        <p>
          This feature links an Employee record to a NovaStack User account. When onboarding:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Check <strong>"Enable System Login"</strong> in the onboarding form</li>
          <li>Select a <strong>Permission Role</strong>: Standard User, HR Manager, or System Admin</li>
          <li>Click "Onboard Employee" — a <strong>secure temporary password</strong> is generated and shown for 10 seconds</li>
        </ol>
        <Callout variant="warning">
          Copy the temporary password immediately! It's shown only once after creation.
        </Callout>
      </Section>

      <Section title="Device Entitlements" id="device-entitlements">
        <p>
          Control exactly <em>where</em> an employee can log in. In the App Access panel when editing an employee:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><Laptop className="w-3.5 h-3.5 inline" /> <strong>Desktop App</strong> — Web workspace access</li>
          <li><Smartphone className="w-3.5 h-3.5 inline" /> <strong>Mobile App</strong> — Phone login access</li>
        </ul>
        <p>Toggling either entitlement on automatically activates the account. Toggling both off effectively disables login.</p>
      </Section>

      <Section title="Password Management" id="password-management">
        <p>
          For employees with active system access, you can:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Reset Password</strong> — Generates a new temporary password (shown for 10 seconds)</li>
          <li><strong>Change Role</strong> — Switch between User, HR Manager, and System Admin</li>
          <li><strong>Revoke System Access</strong> — Deactivates the account (soft delete, not permanent removal)</li>
          <li><strong>Grant Access</strong> — If access was previously revoked, re-create the account</li>
        </ul>
      </Section>

      <Section title="Private Employee Data" id="private-employee-data">
        <p>
          Click the <strong>Info icon</strong> <ShieldCheck className="w-3.5 h-3.5 inline" /> on any employee to open their detail dialog. It has two tabs:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Public Info</strong> — Employee ID, Department, Status, Role Type, Work Email, Manager</li>
          <li><strong>Private Data</strong> — Secure vault for sensitive info (salaries, tax IDs, bank details)</li>
        </ul>
        <Callout variant="warning">
          Only users with the <strong>Admin</strong> or <strong>HR Manager</strong> role can view the Private Data tab.
        </Callout>
      </Section>
    </>
  ),

  requests: (
    <>
      <Section title="What are Requests?" id="what-are-requests">
        <p>
          The <strong>Requests</strong> module handles all internal operational workflows — vacation requests, expense claims, hardware requests, and more. Instead of messy email chains, everything is tracked in a structured lifecycle with approvals.
        </p>
      </Section>

      <Section title="Submitting a Request" id="submitting-a-request">
        <p>
          On the <strong>My Requests</strong> tab, you'll see form cards for each active request type (e.g., "Vacation Request," "Hardware Request"). Click a card to open the submission form.
        </p>
        <p>
          The form fields are <strong>dynamically generated</strong> from the form template defined by your admin. Fill in the fields and submit.
        </p>
        <Callout variant="tip">
          <strong>Submit on Behalf of:</strong> Managers and HR can use the dropdown at the top of the form to submit a request for another employee.
        </Callout>
      </Section>

      <Section title="My Request History" id="my-request-history">
        <p>
          Below the form cards is your <strong>Request History</strong>, grouped by status:
        </p>
        <div className="flex gap-2 my-3">
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>
          <Badge className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
        </div>
        <p>Each group is collapsible. Click any request to open its detail page at <code className="text-xs bg-slate-100 px-1 rounded">/requests/{'{id}'}</code>.</p>
        <p>Stat cards at the top show Total, Pending, Approved, and Rejected counts.</p>
      </Section>

      <Section title="Approvals Queue" id="approvals-admin-only">
        <p>
          <strong>(Admin, HR, and Manager roles only)</strong> The <strong>Approvals</strong> tab shows a Decision Queue with two sections:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Needs Your Action</strong> — Requests where you are the current approver</li>
          <li><strong>Waiting on Others</strong> — Requests in the pipeline but not assigned to you</li>
        </ul>
        <p>Each approval card shows a <strong>visual progress map</strong> — circles and lines indicating which step the request is on:</p>
        <ApprovalStepDiagram />
        <p>Click <strong>Approve</strong> or <strong>Reject</strong> to make your decision. You can add an optional decision note. Some requests require multiple approvers in sequence or parallel.</p>
      </Section>

      <Section title="Form Builder" id="form-builder">
        <p>
          <strong>(Admin, HR, and Manager roles only)</strong> The <strong>Templates</strong> tab lets you manage form templates. Click <strong>New Template</strong> to open the Form Builder where you can:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Set the template name, prefix (e.g., "VAC-" for vacations), and description</li>
          <li>Add fields: text, number, date, select, textarea, checkbox</li>
          <li>Define the <strong>Approval Workflow</strong>: who needs to approve, in what order, and whether steps are parallel or sequential</li>
          <li>Set an optional <strong>Webhook URL</strong> for external notifications</li>
          <li>Toggle templates Active/Inactive</li>
        </ul>
      </Section>

      <Section title="HR Analytics" id="hr-analytics">
        <p>
          <strong>(Admin, HR, and Manager roles only)</strong> The <strong>Analytics</strong> tab provides a dashboard with charts and metrics about request volumes, approval times, rejection rates, and team workload. Use it to identify bottlenecks and trends.
        </p>
      </Section>
    </>
  ),

  settings: (
    <>
      <Section title="Work Profile" id="work-profile">
        <p>
          The <strong>Work Profile</strong> tab shows your account information and official company record:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Account Information</strong> — Update your display name and company name. Your email cannot be changed (it's your unique login ID).</li>
          <li><strong>Work Profile</strong> — Your official employee record: Employee ID, Department, Job Title, Manager, Hire Date, and Role Type. Links to the Company Directory.</li>
        </ul>
      </Section>

      <Section title="Security" id="security">
        <p>
          Change your password by entering your <strong>current password</strong>, then your <strong>new password</strong> twice for confirmation. Your password is stored securely and never visible to anyone.
        </p>
      </Section>

      <Section title="Appearance (Themes)" id="appearance">
        <p>
          Customize NovaStack's look by choosing an <strong>accent color</strong>. This affects buttons, links, active states, and highlights throughout the app:
        </p>
        <div className="flex gap-3 my-3">
          {[
            ['Indigo', 'bg-indigo-600'],
            ['Violet', 'bg-violet-600'],
            ['Emerald', 'bg-emerald-600'],
            ['Orange', 'bg-orange-600'],
          ].map(([name, color]) => (
            <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200">
              <div className={`w-4 h-4 rounded-full ${color}`} />
              <span className="text-xs font-semibold">{name}</span>
            </div>
          ))}
        </div>
        <p>Your theme choice is saved and persists across sessions.</p>
      </Section>

      <Section title="Users & Roles" id="users-and-permissions">
        <p>
          <strong>(Admin only)</strong> Manage all system users. You can:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>View all users</strong> — See who has access and their roles</li>
          <li><strong>Change roles</strong> — Switch between Admin, HR, and User</li>
          <li><strong>Deactivate users</strong> — Remove access without deleting data</li>
        </ul>
        <p>Roles determine what features are visible: Admin sees everything, HR sees team management features, Users see only their own work.</p>
      </Section>

      <Section title="Custom Fields" id="custom-fields">
        <p>
          <strong>(Admin only)</strong> Add custom data fields to any entity. Supported field types:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Text</strong> — Simple text input</li>
          <li><strong>Number</strong> — Numeric input</li>
          <li><strong>Select</strong> — Dropdown with predefined options</li>
          <li><strong>Date</strong> — Date picker</li>
          <li><strong>Checkbox</strong> — Yes/No toggle</li>
        </ul>
        <p>Custom fields appear on Add/Edit forms and as columns in tables for: Companies, Contacts, Deals, Tasks, Invoices, Products, and Employees.</p>
      </Section>

      <Section title="Canned Responses" id="canned-responses">
        <p>
          Create reusable message templates for emails, invoice reminders, proposals, and SMS. Each template supports <strong>auto-fill tags</strong> that inject real data:
        </p>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 my-3">
          <p className="text-[10px] font-mono text-slate-600">
            {'{client_name}, {contact_name}, {company_name}, {deal_title}, {invoice_number}, {invoice_amount}, {due_date}, {sender_name}'}
          </p>
        </div>
        <p>Features: search/filter by category, copy to clipboard, edit, and delete. Templates are used when sending invoices from the Invoices page.</p>
      </Section>

      <Section title="Data & Export" id="data-and-export">
        <p>
          <strong>(Admin only)</strong> Your data belongs to you. Two export options:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>System Backup</strong> — Download a full snapshot of your database and files. Shows the last backup date and size.</li>
          <li><strong>CSV Export</strong> — Export individual collections (Contacts, Deals, Invoices) to CSV files for use in Excel or other tools.</li>
        </ul>
      </Section>

      <Section title="Webhooks" id="webhooks">
        <p>
          <strong>(Admin only)</strong> Connect NovaStack to automation tools like <strong>n8n</strong>, <strong>Make</strong>, or custom API endpoints. Configure outbound webhooks that send POST requests when events occur:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>contact.created</strong> — When a new contact is added</li>
          <li><strong>deal.won</strong> — When a deal reaches "Won" stage</li>
          <li><strong>invoice.paid</strong> — When an invoice is approved/paid</li>
          <li><strong>intake.approved</strong> — When an intake submission is approved</li>
        </ul>
        <p>Each webhook can be tested with the <strong>Test</strong> button, which sends a simulated payload to your endpoint. Toggle webhooks Active/Inactive instantly.</p>
      </Section>
    </>
  ),

  tips: (
    <>
      <Section title="Keyboard Shortcuts" id="keyboard-shortcuts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-4">
          {[
            ['Ctrl + K', 'Global Search — search everything instantly'],
            ['Ctrl + Enter', 'Submit any form'],
            ['Esc', 'Close any dialog or modal'],
            ['↑ / ↓', 'Navigate search results'],
            ['Enter', 'Open selected search result'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-600">{desc}</span>
              <kbd className="bg-white border border-slate-300 px-2 py-1 rounded text-xs font-mono font-bold shadow-sm">{key}</kbd>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Column Picker" id="column-picker-tips">
        <p>
          Every data table (Companies, Contacts, Deals, Tasks, Invoices, Products, Employees) has a <strong>Column Picker</strong> button. Use it to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Hide columns you don't need for a cleaner view</li>
          <li>Show hidden columns (like Phone, Status, or custom fields)</li>
          <li>Your preferences are saved per-screen in your browser</li>
        </ul>
        <Callout variant="tip">
          The Actions column is always visible — you always need access to edit and delete buttons.
        </Callout>
      </Section>

      <Section title="View Persistence" id="view-persistence">
        <p>
          NovaStack remembers your preferences across sessions using your browser's local storage:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>CRM tab</strong> — Whether you were on Contacts or Deals</li>
          <li><strong>Tasks view</strong> — List or Kanban board</li>
          <li><strong>Deals view</strong> — List or Kanban board</li>
          <li><strong>Column visibility</strong> — Which columns are shown per table</li>
          <li><strong>Scratchpad</strong> — Your sticky note text and color</li>
          <li><strong>Theme</strong> — Your chosen accent color</li>
        </ul>
      </Section>

      <Section title="Common Workflows" id="common-workflows">
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-700 mb-2">Lead to Cash</h4>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">Intake</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold">Approve</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-bold">Convert to Deal</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">Win Deal</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded font-bold">Create Invoice</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded font-bold">Collect Payment</span>
            </div>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-700 mb-2">Employee Onboarding</h4>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">Add Employee</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold">Enable Login</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-bold">Set Role</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">Share Temp Password</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Pro Tips" id="pro-tips">
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Quick Create from Anywhere</h4>
            <p className="text-[11px] text-emerald-600 mt-1">The <strong>New (+)</strong> button in the top header lets you create any record type without leaving your current page. Great for adding a task while reviewing a deal.</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> ID Prefixing in Requests</h4>
            <p className="text-[11px] text-blue-600 mt-1">HR forms have custom prefixes like "EXP-" for expenses or "VAC-" for vacations. This makes searching and referencing specific requests much faster.</p>
          </div>
          <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
            <h4 className="text-xs font-bold text-violet-700 flex items-center gap-2"><Palette className="w-3.5 h-3.5" /> Theme Switching</h4>
            <p className="text-[11px] text-violet-600 mt-1">Don't like the default indigo? Switch to Violet, Emerald, or Orange in <strong>Settings → Appearance</strong>. Your choice persists across sessions.</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <h4 className="text-xs font-bold text-amber-700 flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Regular Backups</h4>
            <p className="text-[11px] text-amber-600 mt-1">Go to <strong>Settings → Data & Export</strong> and click "Download Backup" regularly. This creates a full snapshot of your database that you can restore if needed.</p>
          </div>
        </div>
      </Section>
    </>
  ),
}

/* ─── Page Shell ───────────────────────────────────────────────────────── */

export function HelpPage() {
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const validTab = sections.some((s) => s.id === tabFromUrl) ? tabFromUrl! : 'overview'

  const [active, setActive] = useState(validTab)
  const [searchQuery, setSearchQuery] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const currentHeadings = sectionHeadings[active] || []

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [active])

  useEffect(() => {
    if (tabFromUrl && sections.some((s) => s.id === tabFromUrl)) {
      setActive(tabFromUrl)
    }
  }, [tabFromUrl])

  const filteredSections = searchQuery
    ? sections.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections

  return (
    <div className="flex gap-6 h-full">
      {/* LEFT SIDEBAR */}
      <aside className="w-56 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Help Center</p>
            </div>
          </div>
          <nav className="p-2 space-y-0.5">
            {filteredSections.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActive(s.id); setSearchQuery('') }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${
                  active === s.id
                    ? 'text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={active === s.id ? { backgroundColor: 'rgb(var(--ns-accent))' } : undefined}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                {s.label}
              </button>
            ))}
            {filteredSections.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-2">No sections match your search.</p>
            )}
          </nav>
        </div>
      </aside>

      {/* CENTER CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div
          ref={contentRef}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex-1 overflow-y-auto"
        >
          {content[active]}
        </div>
      </div>

      {/* RIGHT SIDEBAR TOC */}
      <aside className="w-56 flex-shrink-0 hidden xl:block">
        <div className="sticky top-0 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              On This Page
            </h4>
            <nav className="space-y-1">
              {currentHeadings.map((heading) => {
                const anchor = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                return (
                  <a
                    key={heading}
                    href={`#${anchor}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(anchor)
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className="block text-xs text-slate-500 hover:text-slate-900 transition-colors py-1 border-l-2 border-transparent hover:border-slate-300 pl-2"
                  >
                    {heading}
                  </a>
                )
              })}
            </nav>
          </div>

          {/* Keyboard Shortcuts Mini-Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Shortcuts</h4>
            </div>
            <div className="space-y-2">
              {[
                { key: 'Ctrl + K', desc: 'Global Search' },
                { key: 'Ctrl + Enter', desc: 'Submit Forms' },
                { key: 'Esc', desc: 'Close Dialogs' },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between text-sm">
                  <span className="text-xs text-slate-600">{s.desc}</span>
                  <kbd className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-slate-700 shadow-sm">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Links</h4>
            <div className="space-y-2">
              <a href="/settings" className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                <ChevronRight className="w-3 h-3" /> Settings
              </a>
              <a href="/crm/contacts" className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                <ChevronRight className="w-3 h-3" /> CRM Contacts
              </a>
              <a href="/invoices" className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-600 transition-colors">
                <ChevronRight className="w-3 h-3" /> Invoices
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
