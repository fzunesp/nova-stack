import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import {
  LayoutDashboard, Users, CheckSquare, FileText, Inbox,
  HelpCircle, TrendingUp, ChevronRight, Briefcase,
  Search, Keyboard, ArrowUpRight, BookOpen, Building2, Package, Settings, Zap,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

const sections = [
  { id: 'overview', label: 'Overview', icon: HelpCircle },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'deals', label: 'Deals', icon: TrendingUp },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'intake', label: 'Intake', icon: Inbox },
  { id: 'hr', label: 'HR Operations', icon: Briefcase },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'tips', label: 'Tips & Shortcuts', icon: Zap },
]

const sectionHeadings: Record<string, string[]> = {
  overview: ['What is NovaStack?', 'Your First 5 Minutes', 'How Data Flows Between Screens'],
  dashboard: ['Your Daily Command Center', 'Today Strip', 'Quick Notes', 'My Work Queue', 'Money at Risk', 'Business Radar'],
  companies: ['What are Companies?', 'Adding a Company', 'Company Timeline'],
  contacts: ['What are Contacts?', 'Adding a Contact', 'Contact Profile & Timeline'],
  deals: ['What are Deals?', 'The 5 Pipeline Stages', 'Kanban Board View', 'Converting Intake to Deals'],
  tasks: ['What are Tasks?', 'Task Statuses', 'Quick Status Toggle'],
  invoices: ['What are Invoices?', 'Creating an Invoice', 'Invoice Status Flow', 'Sending & PDFs'],
  products: ['What are Products?', 'Adding Products', 'Using Products on Invoices'],
  intake: ['What is Intake?', 'Intake Statuses', 'Converting to a Deal'],
  hr: ['What is HR Operations?', 'Submitting a Request', 'Approval Flow'],
  settings: ['Profile & Security', 'Appearance', 'Templates', 'Users & Permissions', 'Webhooks'],
  tips: ['Keyboard Shortcuts', 'Common Workflows', 'Pro Tips'],
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

function ApprovalFlowDiagram() {
  return (
    <div className="flex flex-col items-center gap-3 my-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
      <div className="flex items-center gap-4">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">Submit Request</div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2 text-xs font-bold text-indigo-700">HR Review</div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-xs font-bold text-emerald-700">Approved</div>
      </div>
      <div className="text-xs text-slate-400 mt-1">If rejected at any step → goes back to the submitter with notes</div>
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

/* ─── Content ───────────────────────────────────────────────────────────── */

const content: Record<string, React.ReactNode> = {
  overview: (
    <>
      <Section title="What is NovaStack?" id="what-is-novastack">
        <p>
          <strong>NovaStack is a business operations suite</strong> that helps you manage your clients, sales, tasks, and money — all in one place. Think of it as a digital filing cabinet and assistant for your business.
        </p>
        <p>
          Instead of juggling spreadsheets, sticky notes, and five different apps, NovaStack puts everything in a single workspace:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Companies</strong> — Your customer accounts (like folders for each client)</li>
          <li><strong>Contacts</strong> — The actual people you talk to at those companies</li>
          <li><strong>Deals</strong> — Sales opportunities you're working to close</li>
          <li><strong>Tasks</strong> — Your to-do list, linked to contacts and deals</li>
          <li><strong>Invoices</strong> — Bills you send to get paid</li>
          <li><strong>Intake</strong> — New leads that come in through forms</li>
          <li><strong>HR Operations</strong> — Team requests like vacation or expenses</li>
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
          The <strong>Dashboard</strong> is your home screen — the first thing you see when you log in. Think of it like the dashboard in your car: it shows you the important stuff at a glance, and warns you when something needs attention.
        </p>
        <p>
          Unlike other screens that show <em>all</em> your records, the Dashboard only shows what needs your attention <strong>right now</strong>.
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

      <Section title="Quick Notes" id="quick-notes">
        <p>
          Right below the Today Strip is a yellow sticky-note box. This is your scratchpad — a place to jot down anything: phone numbers, reminders, ideas, copy-pasted text from emails.
        </p>
        <p>
          <strong>It auto-saves.</strong> Just type and it saves to your account automatically after you stop typing for a second. Come back tomorrow and your note is still there.
        </p>
        <p>
          There's no "submit" button and no formatting. It's just a simple notepad. Click <strong>Clear</strong> to wipe it clean.
        </p>
      </Section>

      <Section title="My Work Queue" id="my-work-queue">
        <p>
          The Work Queue is a smart list of things that need action. It's split into three buckets:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
          {[
            ['Needs Attention', 'Tasks overdue, deals gone cold, intake not reviewed. These are urgent.', 'bg-red-50 text-red-700 border-red-200'],
            ['Recently Updated', 'Things that changed in the last few days. Good for catching up.', 'bg-blue-50 text-blue-700 border-blue-200'],
            ['Waiting', 'Items where you are waiting on someone else. Not urgent, but track them.', 'bg-slate-50 text-slate-700 border-slate-200'],
          ].map(([title, desc, color]) => (
            <div key={title} className={`rounded-lg border p-3 ${color}`}>
              <span className="text-xs font-bold">{title}</span>
              <p className="text-xs mt-1 opacity-80">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Money at Risk" id="money-at-risk">
        <p>
          This section shows invoices you've sent but haven't been paid yet — <strong>and they're past their due date</strong>. This is real money you should have in your bank account but don't.
        </p>
        <Callout variant="warning">
          The longer an invoice sits unpaid, the harder it is to collect. Use this strip to know exactly who to follow up with.
        </Callout>
      </Section>

      <Section title="Business Radar" id="business-radar">
        <p>
          The radar chart is a health check. It scores your business across five dimensions:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Revenue</strong> — Money you've collected</li>
          <li><strong>Pipeline</strong> — Value of deals in progress</li>
          <li><strong>Tasks</strong> — How on top of your work you are</li>
          <li><strong>Conversion</strong> — How often you win deals</li>
          <li><strong>Intake</strong> — New leads coming in</li>
        </ul>
        <p>
          A balanced shape means your business is healthy. If one area is tiny and another is huge, that tells you where to focus.
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
        <p>
          For example, "Acme Corporation" might have:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>3 contacts (John, Sarah, Mike)</li>
          <li>2 active deals (Website redesign, Consulting retainer)</li>
          <li>5 past invoices (3 paid, 2 pending)</li>
          <li>12 completed tasks</li>
        </ul>
      </Section>

      <Section title="Adding a Company" id="adding-a-company">
        <p>
          Go to the <strong>Companies</strong> page and click <strong>Add Company</strong>. Fill in:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Name</strong> — The business name (e.g., "Acme Corporation")</li>
          <li><strong>Industry</strong> — What they do (optional)</li>
          <li><strong>Address</strong> — Their physical address (optional)</li>
          <li><strong>Notes</strong> — Anything else you want to remember</li>
        </ul>
        <Callout variant="info">
          You don't need every detail right away. You can always come back and fill in more info later.
        </Callout>
      </Section>

      <Section title="Company Timeline" id="company-timeline">
        <p>
          When you click on a company, you see a <strong>timeline</strong> showing every interaction: when contacts were added, deals created, invoices sent, and tasks completed. It's like a history book for that account.
        </p>
        <p>
          This is useful when you're about to call a client and need to quickly remember: "What have we done for them? What deals are open? Did they pay the last invoice?"
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
        </ul>
        <Callout variant="tip">
          You can add contacts without a company, but it's better to create the company first. It keeps everything organized.
        </Callout>
      </Section>

      <Section title="Adding a Contact" id="adding-a-contact">
        <p>
          Go to <strong>CRM → Contacts</strong> and click <strong>Add Contact</strong>. The only required fields are <strong>Name</strong> and <strong>Email</strong>. Everything else is optional.
        </p>
        <p>
          The contact list is grouped by company, so all people from the same business appear together.
        </p>
      </Section>

      <Section title="Contact Profile & Timeline" id="contact-profile-and-timeline">
        <p>
          Clicking a contact opens their profile — a full-screen view with two panels:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Left Panel: Profile Card</h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              <li>Big avatar with their initial</li>
              <li>Name, title, and company</li>
              <li>Quick stats: open deals, pending tasks, days since last contact</li>
              <li>Quick actions: Email, Call, Edit, Add Deal</li>
              <li>Active deals list</li>
            </ul>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Right Panel: Activity Timeline</h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
              <li>Every interaction in one feed</li>
              <li>Manual notes (calls, emails, meetings)</li>
              <li>Auto-generated events (deals, invoices, tasks)</li>
              <li>Filter by type (All, Notes, Calls, Deals...)</li>
              <li>Add new interactions at the bottom</li>
            </ul>
          </div>
        </div>
        <Callout variant="info">
          The timeline combines <strong>things you typed</strong> (like "Had a great call, they're interested") with <strong>things the system knows</strong> (like "Deal created: $5,000"). Everything is in one chronological feed.
        </Callout>
      </Section>
    </>
  ),

  deals: (
    <>
      <Section title="What are Deals?" id="what-are-deals">
        <p>
          <strong>Deals are sales opportunities.</strong> They're the things you're trying to sell. Each deal has a title, a value (how much money it's worth), and a stage (how close you are to closing it).
        </p>
        <p>
          For example: "Website Redesign for Acme Corp — $12,000 — Quoted" means you've sent a proposal for a $12,000 website project, and you're waiting for them to say yes.
        </p>
        <p>
          Deals can be linked to a contact and a company, so you always know who you're selling to.
        </p>
      </Section>

      <Section title="The 5 Pipeline Stages" id="the-5-pipeline-stages">
        <p>Every deal moves through five stages. Think of it like a conveyor belt:</p>
        <PipelineDiagram />
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>Lead</strong> — You just heard about this opportunity. You haven't talked to them yet.</li>
          <li><strong>Contacted</strong> — You reached out. Maybe you sent an email or had a first call.</li>
          <li><strong>Quoted</strong> — You sent a proposal or quote with a price.</li>
          <li><strong>Won</strong> — They said yes! This deal is closed.</li>
          <li><strong>Lost</strong> — They said no, or it went cold. Don't worry, it happens.</li>
        </ul>
        <Callout variant="tip">
          Only <strong>Lead, Contacted, and Quoted</strong> count as "active deals." Once a deal is Won or Lost, it no longer shows up in your active pipeline count.
        </Callout>
      </Section>

      <Section title="Kanban Board View" id="kanban-board-view">
        <p>
          In the CRM, you can switch from a <strong>List View</strong> (rows in a table) to a <strong>Kanban Board</strong> (columns on a whiteboard). The Kanban view shows your deals as cards you can drag between columns.
        </p>
        <KanbanMiniDiagram />
        <p>
          <strong>To move a deal:</strong> Click and drag the card from one column to another. The stage updates automatically. You can also click the pencil icon on any card to edit it, or the trash icon to delete it.
        </p>
        <p>
          Each column header shows the total value of deals in that stage, so you can see how much potential money is in your pipeline at a glance.
        </p>
      </Section>

      <Section title="Converting Intake to Deals" id="converting-intake-to-deals">
        <p>
          When someone fills out your Intake form (like a "Contact Us" or "Get a Quote" form on your website), their submission lands in <strong>Intake</strong>. If it looks like a real opportunity, you can <strong>approve</strong> it.
        </p>
        <p>
          Once approved, a <strong>"Convert to Deal"</strong> button appears. Clicking it does three things automatically:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Creates a new Contact (if they don't exist yet)</li>
          <li>Creates a new Deal with the title and budget pre-filled</li>
          <li>Links the Intake submission to the Deal so you can trace where it came from</li>
        </ol>
        <Callout variant="tip">
          This saves you from typing the same information twice. The system copies the name, email, message, and proposed budget from the Intake form into the new Contact and Deal.
        </Callout>
      </Section>
    </>
  ),

  tasks: (
    <>
      <Section title="What are Tasks?" id="what-are-tasks">
        <p>
          <strong>Tasks are your to-do list.</strong> Each task has a title, an optional description, and a status. You can also add a due date, link it to a contact, and link it to a deal.
        </p>
        <p>
          Tasks appear in your Dashboard's "My Work Queue" if they're overdue or due soon. They're also linked to contacts and deals, so when you look at a contact's timeline, you see all the follow-up tasks you did (or didn't do) for them.
        </p>
      </Section>

      <Section title="Task Statuses" id="task-statuses">
        <p>Every task is in one of four states:</p>
        <TaskStatusCycle />
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>To Do</strong> — Not started. The circle is empty/gray.</li>
          <li><strong>In Progress</strong> — You're working on it. The circle is blue and empty.</li>
          <li><strong>Waiting</strong> — Blocked or pending someone else. The circle is amber.</li>
          <li><strong>Done</strong> — Completed. The circle is filled green.</li>
        </ul>
      </Section>

      <Section title="Quick Status Toggle" id="quick-status-toggle">
        <p>
          You don't need to open the edit dialog just to mark a task complete. Every task row has a <strong>circular button</strong> on the left side. Click it once and it cycles through the statuses:
        </p>
        <p className="text-center font-mono text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
          To Do → In Progress → Waiting → Done → To Do
        </p>
        <Callout variant="info">
          This is the fastest way to update tasks. Just click the circle. If you need to change the due date, description, or linked contact, then open the edit dialog.
        </Callout>
      </Section>
    </>
  ),

  invoices: (
    <>
      <Section title="What are Invoices?" id="what-are-invoices">
        <p>
          <strong>Invoices are how you get paid.</strong> Think of them as bills you send to your clients. Each invoice has a title (like "Website Design — Phase 1"), a list of line items (what you did and how much each costs), a total amount, and a status.
        </p>
        <p>
          When you win a deal, the next step is usually to create an invoice. NovaStack lets you do this in one click from the deal page.
        </p>
      </Section>

      <Section title="Creating an Invoice" id="creating-an-invoice">
        <p>
          Go to <strong>Invoices</strong> and click <strong>Add Invoice</strong>. You can also create one directly from a Won deal.
        </p>
        <p>Each invoice has:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Title</strong> — What this invoice is for</li>
          <li><strong>Client</strong> — Who you're billing (linked to a contact)</li>
          <li><strong>Line items</strong> — A list of products/services with quantities and prices</li>
          <li><strong>Due date</strong> — When payment is expected</li>
          <li><strong>Notes</strong> — Any extra info for the client</li>
        </ul>
        <Callout variant="tip">
          Use the <strong>Products</strong> catalog to pre-fill line items. Instead of typing "Website Design - $500" every time, add it as a Product and just select it from the dropdown.
        </Callout>
      </Section>

      <Section title="Invoice Status Flow" id="invoice-status-flow">
        <p>Every invoice goes through a simple flow:</p>
        <InvoiceStatusFlow />
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>Draft</strong> — You're still writing it. The client hasn't seen it.</li>
          <li><strong>Active</strong> — The invoice is live and ready to be sent.</li>
          <li><strong>Pending Payment</strong> — You've sent it to the client and are waiting for payment.</li>
          <li><strong>Paid</strong> — They paid you. Mark it as paid to update your revenue numbers.</li>
          <li><strong>Cancelled</strong> — Something went wrong. This voids the invoice.</li>
        </ul>
        <Callout variant="warning">
          <strong>Outstanding</strong> money = all Active + Pending Payment invoices. This is money you're expecting but haven't received yet. Keep an eye on this number.
        </Callout>
      </Section>

      <Section title="Sending & PDFs" id="sending-and-pdfs">
        <p>
          Once an invoice is ready, you have two options:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Send by Email</h4>
            <p className="text-xs text-slate-600">
              Click <strong>Send Invoice</strong> to dispatch it via SMTP. The system converts your invoice into a clean HTML email and sends it to the client's email address. The status automatically changes to <strong>Pending Payment</strong>.
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Download PDF</h4>
            <p className="text-xs text-slate-600">
              Click <strong>Download PDF</strong> to generate a professional PDF invoice on your computer. You can then attach it to your own email or print it.
            </p>
          </div>
        </div>
      </Section>
    </>
  ),

  products: (
    <>
      <Section title="What are Products?" id="what-are-products">
        <p>
          <strong>Products are things you sell.</strong> They live in a catalog so you don't have to retype the same information every time you create an invoice.
        </p>
        <p>
          For example, if you sell "Website Design" for $500 and "SEO Package" for $300, add them as Products. Then when you create an invoice, just pick them from a dropdown.
        </p>
      </Section>

      <Section title="Adding Products" id="adding-products">
        <p>
          Go to <strong>Products</strong> and click <strong>Add Product</strong>. Each product has:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Name</strong> — What you call it (e.g., "Consulting Hour")</li>
          <li><strong>Description</strong> — Optional details</li>
          <li><strong>Price</strong> — How much it costs</li>
          <li><strong>SKU</strong> — A code you make up (optional)</li>
          <li><strong>Status</strong> — Active (shows in dropdown) or Archived (hidden)</li>
        </ul>
      </Section>

      <Section title="Using Products on Invoices" id="using-products-on-invoices">
        <p>
          When creating or editing an invoice, there's a <strong>Add Line Item</strong> section. Instead of typing the name and price manually, select a Product from the dropdown. The name and price fill in automatically. You can still change the quantity or add a discount.
        </p>
        <Callout variant="info">
          Products are optional. You can always type line items manually if you prefer. Products just save time when you bill for the same things repeatedly.
        </Callout>
      </Section>
    </>
  ),

  intake: (
    <>
      <Section title="What is Intake?" id="what-is-intake">
        <p>
          <strong>Intake is your lead inbox.</strong> When someone fills out a form on your website (like "Contact Us" or "Request a Quote"), their submission lands here.
        </p>
        <p>
          Think of Intake like your email inbox, but specifically for new business opportunities. You review each submission, decide if it's a real opportunity, and either approve it or reject it.
        </p>
      </Section>

      <Section title="Intake Statuses" id="intake-statuses">
        <p>Every submission goes through these stages:</p>
        <IntakeFlowDiagram />
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li><strong>New</strong> — Just came in. You haven't looked at it yet.</li>
          <li><strong>In Review</strong> — You're looking at it, deciding what to do.</li>
          <li><strong>Approved</strong> — It's a real opportunity. Time to turn it into a contact and deal.</li>
          <li><strong>Rejected</strong> — Not a fit. Maybe it was spam or outside your scope.</li>
          <li><strong>Converted to Deal</strong> — You already turned it into a CRM deal.</li>
        </ul>
      </Section>

      <Section title="Converting to a Deal" id="converting-to-a-deal">
        <p>
          When you approve an intake submission, a <strong>"Convert to Deal"</strong> button appears. Clicking it:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Creates a Contact with the person's name and email</li>
          <li>Creates a Deal with the title and budget from the form</li>
          <li>Links everything together so you can trace the lead back to its source</li>
        </ol>
        <Callout variant="warning">
          <strong>Don't forget to convert!</strong> Approved intake submissions sitting around don't help your business. The real value comes from turning them into contacts and deals so they enter your sales pipeline.
        </Callout>
      </Section>
    </>
  ),

  hr: (
    <>
      <Section title="What is HR Operations?" id="what-is-hr-operations">
        <p>
          <strong>HR Operations is an internal request system.</strong> It's for your team to ask for things: vacation time, expense reimbursements, new equipment, etc.
        </p>
        <p>
          Instead of sending emails or Slack messages that get lost, team members fill out a form. The form gets routed to the right approver (usually a manager or HR person), who can approve or reject it with comments.
        </p>
        <p>
          Everything is tracked, so you can always see who requested what, when, and what the decision was.
        </p>
      </Section>

      <Section title="Submitting a Request" id="submitting-a-request">
        <p>
          Go to <strong>HR</strong> and pick a form template (like "Vacation Request" or "Expense Reimbursement"). Fill out the fields and submit.
        </p>
        <p>
          The form will ask for different things depending on the type:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Vacation</strong> — Start date, end date, reason</li>
          <li><strong>Expense</strong> — Amount, category, receipt upload, description</li>
          <li><strong>Hardware</strong> — Item requested, justification, estimated cost</li>
        </ul>
        <Callout variant="tip">
          Upload receipts as images or PDFs. The system stores them with your request so approvers can verify the expense.
        </Callout>
      </Section>

      <Section title="Approval Flow" id="approval-flow">
        <p>
          After you submit, here's what happens:
        </p>
        <ApprovalFlowDiagram />
        <ol className="list-decimal pl-5 space-y-1.5 mt-2">
          <li><strong>You submit</strong> — Your request is created with status "Pending"</li>
          <li><strong>HR/Manager review</strong> — An approver is assigned. They get a notification.</li>
          <li><strong>Decision</strong> — They approve (status becomes "Approved") or reject (status becomes "Rejected" with a reason).</li>
        </ol>
        <p>
          Some requests need multiple approvers. The system waits for everyone to approve before marking it fully approved. If <strong>anyone</strong> rejects it, the whole request is rejected.
        </p>
        <Callout variant="info">
          Admins can create custom form templates. Go to <strong>HR → Builder</strong> to design new forms with different fields and validation rules.
        </Callout>
      </Section>
    </>
  ),

  settings: (
    <>
      <Section title="Profile & Security" id="profile-and-security">
        <p>
          The <strong>Settings</strong> page is where you control your account. Click <strong>Profile</strong> to change your display name and company name. Your email is read-only — it can't be changed here.
        </p>
        <p>
          Click <strong>Security</strong> to change your password. You'll need your current password to set a new one.
        </p>
      </Section>

      <Section title="Appearance" id="appearance">
        <p>
          NovaStack comes with four color themes. Pick the one you like:
        </p>
        <div className="flex items-center gap-3 my-4">
          {[
            ['Indigo', 'bg-indigo-500'],
            ['Violet', 'bg-violet-500'],
            ['Emerald', 'bg-emerald-500'],
            ['Orange', 'bg-orange-500'],
          ].map(([name, color]) => (
            <div key={name} className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
              <div className={`w-4 h-4 rounded-full ${color}`} />
              <span className="text-xs font-medium text-slate-700">{name}</span>
            </div>
          ))}
        </div>
        <p>
          This changes the accent color used across the app — buttons, active states, timeline markers, and highlights.
        </p>
      </Section>

      <Section title="Templates" id="templates">
        <p>
          <strong>Templates</strong> are pre-written messages you can copy and paste. They're useful for emails and SMS messages you send repeatedly.
        </p>
        <p>
          For example, you might create templates like:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>"Invoice Overdue Reminder" — polite nudge for late payments</li>
          <li>"Thank You for Your Business" — follow-up after a deal closes</li>
          <li>"Project Kickoff" — introductory email when starting work</li>
        </ul>
        <p>
          When sending an invoice, you can pick a template and the system pre-fills the email subject and body.
        </p>
        <Callout variant="tip">
          Templates save you from writing the same email 50 times. Spend 10 minutes setting them up, save hours later.
        </Callout>
      </Section>

      <Section title="Users & Permissions" id="users-and-permissions">
        <p>
          <strong>(Admin only)</strong> If you're an admin, you can invite team members, change their roles, and remove users.
        </p>
        <p>There are three roles:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
          {[
            ['Admin', 'Full access to everything. Can invite users, change settings, and see all data.', 'bg-indigo-50 text-indigo-700 border-indigo-200'],
            ['HR', 'Can manage HR forms and approve requests. Can see team data but not admin settings.', 'bg-amber-50 text-amber-700 border-amber-200'],
            ['User', 'Standard access. Can create contacts, deals, tasks, and invoices. Cannot access admin settings.', 'bg-slate-50 text-slate-700 border-slate-200'],
          ].map(([role, desc, color]) => (
            <div key={role} className={`rounded-lg border p-3 ${color}`}>
              <span className="text-xs font-bold">{role}</span>
              <p className="text-xs mt-1 opacity-80">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Webhooks" id="webhooks">
        <p>
          <strong>(Admin only)</strong> Webhooks let NovaStack talk to other apps automatically. When something happens in NovaStack (like winning a deal), it can send a message to another app (like Slack or Zapier).
        </p>
        <p>
          Think of webhooks like automatic text messages NovaStack sends to your other tools. For example:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>When a deal is won → post a celebration message in Slack</li>
          <li>When an invoice is paid → log it in a Google Sheet</li>
          <li>When a new contact is created → send a welcome email via Zapier</li>
        </ul>
        <Callout variant="info">
          Webhooks are for advanced users. If you've never heard of Zapier or n8n, you probably don't need this yet. Focus on the core features first.
        </Callout>
      </Section>
    </>
  ),

  tips: (
    <>
      <Section title="Keyboard Shortcuts" id="keyboard-shortcuts">
        <p>These work from anywhere in the app:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-4">
          {[
            ['Ctrl + K (or ⌘ + K)', 'Open Global Search — find any contact, deal, invoice, or task instantly'],
            ['Ctrl + Enter', "Submit forms — when you're typing in a text box, this submits instead of adding a new line"],
            ['Esc', 'Close dialogs — press Escape to close any popup or detail view'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-start gap-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
              <kbd className="bg-white border border-slate-300 px-2 py-1 rounded text-xs font-mono font-bold shadow-sm flex-shrink-0">{key}</kbd>
              <span className="text-xs text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Common Workflows" id="common-workflows">
        <p>Here are the most common sequences of actions users take:</p>

        <div className="space-y-4 mt-3">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Workflow 1: New Lead → Deal → Invoice</h4>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
              <li>Someone fills out your Intake form → submission appears in <strong>Intake</strong></li>
              <li>You review and move it to <strong>In Review</strong></li>
              <li>Click <strong>Approve</strong> → then <strong>Convert to Deal</strong> → creates Contact + Deal in CRM</li>
              <li>Work the deal through pipeline stages (Lead → Contacted → Quoted → Won)</li>
              <li>When deal is <strong>Won</strong>, click <strong>Create Invoice</strong></li>
              <li>Send the invoice to client (status → Pending Payment)</li>
              <li>When paid, mark invoice as <strong>Paid</strong></li>
            </ol>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Workflow 2: Follow-up on a Contact</h4>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
              <li>Go to <strong>CRM → Contacts</strong> and find the person</li>
              <li>Click their name to open the <strong>Contact Profile</strong></li>
              <li>Check the <strong>Timeline</strong> — see last interaction, open deals, unpaid invoices</li>
              <li>Log a new interaction: "Called John, discussed Q3 budget"</li>
              <li>Create a <strong>Task</strong>: "Send proposal by Friday"</li>
              <li>Link the task to this contact so it appears in their timeline</li>
            </ol>
          </div>
        </div>
      </Section>

      <Section title="Pro Tips" id="pro-tips">
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <Zap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-900">
              <strong>Use the Kanban board for weekly reviews.</strong> Every Monday, open CRM → Deals → Board View. Drag deals to the correct stage. This 5-minute ritual keeps your pipeline honest.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
            <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <strong>Link everything.</strong> When you create a task, link it to a contact and a deal. When you create an invoice, link it to a deal. This makes your timelines rich and useful.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
            <Zap className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-900">
              <strong>Set up templates early.</strong> Before you send your first invoice, create 2-3 email templates. You'll use them dozens of times.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100">
            <Zap className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-purple-900">
              <strong>Use the Quick Notes.</strong> The yellow scratchpad on your Dashboard is perfect for parking ideas. "Follow up with Sarah about contract" — jot it there, then turn it into a proper Task when you have time.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100">
            <Zap className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-rose-900">
              <strong>Don't let deals go stale.</strong> If a deal sits in "Contacted" for 30 days, it's probably dead. Either move it forward or mark it Lost. A clean pipeline is more useful than a big one.
            </div>
          </div>
        </div>
      </Section>
    </>
  ),
}

/* ─── Page Shell (unchanged UI structure) ───────────────────────────────── */

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
