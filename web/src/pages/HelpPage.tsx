import { useState } from 'react'
import {
  LayoutDashboard, Users, CheckSquare, FileText, Inbox,
  HelpCircle, TrendingUp, ChevronRight,
} from 'lucide-react'

const sections = [
  { id: 'overview', label: 'Overview', icon: HelpCircle },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'intake', label: 'Intake', icon: Inbox },
  { id: 'kpis', label: 'KPI Reference', icon: TrendingUp },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-800">
      {children}
    </div>
  )
}

function KpiTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="px-4 py-2.5 font-semibold text-slate-700">KPI</th>
            <th className="px-4 py-2.5 font-semibold text-slate-700">Data Source</th>
            <th className="px-4 py-2.5 font-semibold text-slate-700">Filter / Condition</th>
            <th className="px-4 py-2.5 font-semibold text-slate-700">Operation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            ['Total Revenue', 'Invoices', 'status = paid', 'SUM(amount)'],
            ['Outstanding', 'Invoices', 'status = draft OR sent', 'SUM(amount)'],
            ['Active Deals', 'Deals', 'stage = lead, contacted, or quoted', 'COUNT(*)'],
            ['Conversion Rate', 'Deals', 'stage = won ÷ all deals', '(won ÷ total) × 100'],
            ['Pending Tasks', 'Tasks', 'status ≠ done', 'COUNT(*)'],
          ].map(([kpi, source, filter, op]) => (
            <tr key={kpi} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-medium text-slate-900">{kpi}</td>
              <td className="px-4 py-2.5 text-slate-600">{source}</td>
              <td className="px-4 py-2.5 text-slate-600">{filter}</td>
              <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{op}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const content: Record<string, React.ReactNode> = {
  overview: (
    <>
      <Section title="Welcome to NovaStack">
        <p>
          NovaStack is a self-hosted business operations suite. It gives you a single workspace to
          manage your <strong>contacts and deals (CRM)</strong>, <strong>tasks</strong>,{' '}
          <strong>invoices</strong>, and <strong>client intake submissions</strong> — all running
          on your own hardware with no subscriptions and no vendor lock-in.
        </p>
        <Callout>
          Your data is stored locally in PocketBase. Nothing leaves your server.
        </Callout>
      </Section>
      <Section title="How the app is structured">
        <ul className="space-y-2">
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" /><span><strong>Dashboard</strong> — Command Center showing what needs your attention right now.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" /><span><strong>CRM</strong> — Contacts and deals pipeline.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" /><span><strong>Tasks</strong> — Personal and work task management.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" /><span><strong>Invoices</strong> — Billing and payment tracking.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" /><span><strong>Intake</strong> — Capture new client enquiries and route them to deals.</span></li>
        </ul>
      </Section>
    </>
  ),

  dashboard: (
    <>
      <Section title="What is the Dashboard?">
        <p>
          The Dashboard (Command Center) is your daily starting point. It does not show every record
          in the system — it surfaces only what needs your attention right now: overdue invoices,
          open tasks, deals that have gone cold, and new intake submissions.
        </p>
      </Section>
      <Section title="Today Strip">
        <p>
          The strip at the top of the dashboard gives you a one-line summary of the day: how many
          tasks are overdue, how many invoices are unpaid, and whether you have new intake submissions.
          It is designed to be read in under five seconds.
        </p>
      </Section>
      <Section title="My Signals">
        <p>
          Signals are smart nudges — tasks that are overdue or due today, deals that haven't moved
          in a while, and intake submissions waiting to be reviewed. They are sorted by urgency.
        </p>
        <Callout>
          If your Signals panel is empty, you are on top of everything. That is the goal.
        </Callout>
      </Section>
      <Section title="Money at Risk">
        <p>
          This strip shows invoices that are sent but unpaid beyond their due date. These are real
          dollars you are owed but have not collected. The longer they sit, the harder they are to
          collect.
        </p>
      </Section>
      <Section title="Business Radar">
        <p>
          The radar chart is a health check across five dimensions: Revenue, Pipeline, Tasks,
          Conversion, and Intake. A balanced radar means the business is well-rounded. A spike in
          one area and a collapse in another tells you where to focus.
        </p>
      </Section>
    </>
  ),

  crm: (
    <>
      <Section title="What is the CRM?">
        <p>
          The CRM has two parts: <strong>Contacts</strong> and <strong>Deals</strong>. Contacts are
          the people and companies you work with. Deals are the opportunities you are trying to win.
        </p>
      </Section>
      <Section title="Contacts">
        <p>
          Each contact stores a name, email, phone number, company, and optional notes. You can search,
          sort, add, edit, and delete contacts from the Contacts tab. Use the search bar to quickly
          find a specific person.
        </p>
      </Section>
      <Section title="Deals & Pipeline Stages">
        <p>Every deal moves through five stages:</p>
        <ul className="space-y-1.5 mt-2">
          {[
            ['Lead', 'A new potential opportunity, not yet contacted.'],
            ['Contacted', 'You have reached out and started a conversation.'],
            ['Quoted', 'You have sent a proposal or quote.'],
            ['Won', 'The deal closed successfully.'],
            ['Lost', 'The deal did not close.'],
          ].map(([stage, desc]) => (
            <li key={stage} className="flex items-start gap-2">
              <span className="font-semibold text-slate-800 w-20 flex-shrink-0">{stage}</span>
              <span>{desc}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  ),

  tasks: (
    <>
      <Section title="What are Tasks?">
        <p>
          Tasks are action items you need to complete. Each task has a title, an optional description,
          a status, and an optional due date.
        </p>
      </Section>
      <Section title="Task Statuses">
        <ul className="space-y-2">
          <li className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-slate-300 flex-shrink-0" /><span><strong>To Do</strong> — Not started yet.</span></li>
          <li className="flex items-center gap-2"><span className="w-3 h-3 rounded border-2 border-blue-500 flex-shrink-0" /><span><strong>In Progress</strong> — Currently being worked on.</span></li>
          <li className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 border-2 border-green-500 flex-shrink-0" /><span><strong>Done</strong> — Completed.</span></li>
        </ul>
      </Section>
      <Section title="Quick Status Toggle">
        <p>
          The circular button at the start of each task row is a <strong>quick status toggle</strong>.
          Clicking it cycles the task from <em>To Do → In Progress → Done → To Do</em>. You do not
          need to open the edit dialog just to mark something complete.
        </p>
        <Callout>
          Green filled circle = Done. Blue outline = In Progress. Gray outline = To Do.
        </Callout>
      </Section>
    </>
  ),

  invoices: (
    <>
      <Section title="What are Invoices?">
        <p>
          Invoices track money owed to you. Each invoice has a title, amount, status, and optional
          due date. The Invoices page shows summary cards at the top for Outstanding and Paid totals.
        </p>
      </Section>
      <Section title="Invoice Statuses">
        <ul className="space-y-1.5">
          {[
            ['Draft', 'Created but not yet sent to the client.'],
            ['Sent', 'Sent to the client and awaiting payment.'],
            ['Paid', 'Payment received.'],
            ['Cancelled', 'Voided — no longer expected to be paid.'],
          ].map(([s, d]) => (
            <li key={s} className="flex items-start gap-2">
              <span className="font-semibold text-slate-800 w-20 flex-shrink-0">{s}</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Outstanding vs Paid">
        <p>
          <strong>Outstanding</strong> = sum of all Draft + Sent invoices. This is money you expect
          to receive. <strong>Paid</strong> = sum of all invoices marked as Paid. This is money
          you have already collected.
        </p>
      </Section>
    </>
  ),

  intake: (
    <>
      <Section title="What is Intake?">
        <p>
          Intake is a form submission queue. It captures new client enquiries — name, email, message,
          and budget — and holds them for review. Think of it as your inbound lead funnel.
        </p>
      </Section>
      <Section title="Intake Statuses">
        <ul className="space-y-1.5">
          {[
            ['New', 'Just received — needs to be reviewed.'],
            ['In Review', 'Being assessed.'],
            ['Approved', 'Accepted — follow-up in progress.'],
            ['Rejected', 'Not a fit.'],
            ['Converted', 'Turned into a CRM deal.'],
          ].map(([s, d]) => (
            <li key={s} className="flex items-start gap-2">
              <span className="font-semibold text-slate-800 w-24 flex-shrink-0">{s}</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Callout>
        An approved intake should be manually converted to a Deal in the CRM to keep your pipeline up to date.
      </Callout>
    </>
  ),

  kpis: (
    <>
      <Section title="KPI Reference">
        <p>
          The five KPI cards at the bottom of the Dashboard are calculated automatically from your
          live data. Here is exactly how each one works:
        </p>
      </Section>
      <Section title="1. Total Revenue">
        <p>Sum of all invoices with status <code className="bg-slate-100 px-1 rounded text-xs">paid</code>. This is money you have actually collected — drafts and sent invoices are excluded.</p>
      </Section>
      <Section title="2. Outstanding">
        <p>Sum of all invoices with status <code className="bg-slate-100 px-1 rounded text-xs">draft</code> or <code className="bg-slate-100 px-1 rounded text-xs">sent</code>. This is money you expect to receive but have not yet collected.</p>
      </Section>
      <Section title="3. Active Deals">
        <p>Count of deals where stage is <code className="bg-slate-100 px-1 rounded text-xs">lead</code>, <code className="bg-slate-100 px-1 rounded text-xs">contacted</code>, or <code className="bg-slate-100 px-1 rounded text-xs">quoted</code>. Won and Lost deals are excluded.</p>
      </Section>
      <Section title="4. Conversion Rate">
        <p>
          <code className="bg-slate-100 px-1 rounded text-xs">(won deals ÷ total deals) × 100</code>. If you have created 10 deals and won 4, your conversion rate is 40%.
        </p>
      </Section>
      <Section title="5. Pending Tasks">
        <p>Count of all tasks where status is not <code className="bg-slate-100 px-1 rounded text-xs">done</code>. Includes both To Do and In Progress tasks.</p>
      </Section>
      <KpiTable />
    </>
  ),
}

export function HelpPage() {
  const [active, setActive] = useState('overview')

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar nav */}
      <aside className="w-48 flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-0">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Help Center</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                  active === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-2xl">
          {content[active]}
        </div>
      </div>
    </div>
  )
}
