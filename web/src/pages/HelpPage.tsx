import { useState } from 'react'
import {
  LayoutDashboard, Users, CheckSquare, FileText, Inbox,
  HelpCircle, TrendingUp, ChevronRight, Briefcase, Webhook,
} from 'lucide-react'

const sections = [
  { id: 'overview', label: 'Overview', icon: HelpCircle },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'intake', label: 'Intake', icon: Inbox },
  { id: 'hr', label: 'HR Operations', icon: Briefcase },
  { id: 'webhooks', label: 'Webhooks & APIs', icon: Webhook },
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
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 border-l-4" style={{ borderLeftColor: 'rgb(var(--ns-accent))' }}>
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
      <Section title="Keyboard-Driven Global Search">
        <p>
          Press <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono font-bold shadow-sm">Ctrl + K</kbd> (or <kbd className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs font-mono font-bold shadow-sm">⌘ + K</kbd> on macOS) at any time to activate the **Global Search Dialog**. It instantly queries across all 7 operational collections (Companies, Contacts, Deals, Tasks, Invoices, Products, and Intake Submissions) in real-time, allowing you to deep-link directly to any record instantly.
        </p>
      </Section>
      <Section title="Workspace Setup Onboarding">
        <p>
          Upon launching Nova Stack for the first time, administrators are welcomed by a step-by-step 
          <strong> Workspace Onboarding Wizard</strong>. This wizard configures:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Profile personalization:</strong> Set the administrator's display name.</li>
          <li><strong>Organization details:</strong> Establish your company name used on pre-populated documents.</li>
          <li><strong>Brand accents:</strong> Select from 4 premium color palettes (Indigo, Violet, Emerald, Orange) to color the workspace.</li>
        </ul>
      </Section>
      <Section title="How the app is structured">
        <ul className="space-y-2">
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} /><span><strong>Dashboard</strong> — Command Center showing what needs your attention right now.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} /><span><strong>CRM</strong> — Contacts and deals pipeline.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} /><span><strong>Tasks</strong> — Personal and work task management.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} /><span><strong>Invoices</strong> — Billing and payment tracking.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} /><span><strong>Intake</strong> — Capture new client enquiries and route them to deals.</span></li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} /><span><strong>HR Operations</strong> — Process team leave, reimbursements, and equipment requests.</span></li>
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
      <Section title="Real-Time Notification Bell">
        <p>
          Located in the top header, the **Notification Center** connects via a persistent Server-Sent Events (SSE) connection to PocketBase. It automatically watches the database for any tasks, deals, invoices, or approvals assigned directly to you, notifying you instantly with badge counts and deep-linkable event logs.
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
          the people you work with, organized under their parent accounts (Companies). Deals are the pipeline opportunities you are trying to win.
        </p>
      </Section>
      <Section title="Account-Centricity & Timelines">
        <p>
          All contacts, deals, invoices, and tasks are linked directly to their **Company** profiles.
          Opening a Company details view displays a beautiful **Unified Activity Timeline** that pulls all related actions (emails, deals, invoices, and completed tasks) and sorts them chronologically to give you a single source of truth for the account's entire history.
        </p>
      </Section>
      <Section title="Intake to Deal Conversion">
        <p>
          When an intake submission is marked as <strong>Approved</strong>, a single-click <strong>Convert to Deal</strong> button appears. This action automatically:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Registers or links the contact in the CRM.</li>
          <li>Initializes a new CRM deal pre-filled with the title, message, and proposed budget.</li>
          <li>Bidirectionally links the intake and deal so operators can trace the origins of the opportunity.</li>
        </ul>
      </Section>
      <Section title="Deal to Invoice Quick-Create">
        <p>
          Once an opportunity transitions to the <span className="font-semibold text-emerald-600">Won</span> stage in your pipeline, click the <strong>Create Invoice</strong> button to instantly spin up a pre-filled client invoice draft, saving you manual entry time.
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
      <Section title="PDF Generation & Exports">
        <p>
          You can generate and download beautiful, clean PDF client invoices at any time by clicking the 
          <strong> Download PDF</strong> button on any invoice detail page or overview row. PDF files are compiled entirely in the browser using the client-side `jsPDF` libraries, styling your line items, taxes, totals, and business branding with high visual precision.
        </p>
      </Section>
      <Section title="Invoice Email Deliverability">
        <p>
          Click the <strong>Send Invoice</strong> button to launch an outbound SMTP delivery. The PocketBase backend intercepts this call to pre-render the invoice into an elegant HTML email, dispatching it directly to the customer's email address and updating the status to **Sent**.
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

  hr: (
    <>
      <Section title="What is HR Operations?">
        <p>
          HR Operations is a custom internal service desk designed to handle internal team requests.
          Instead of dealing with spreadsheets or messy email chains, team members submit digital forms that are dynamically routed to qualified approvers based on custom workflow rules.
        </p>
      </Section>
      <Section title="Pre-Built HR Workflows">
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} />
            <span>
              <strong>Vacation Requests</strong> — Enables employees to select start and end dates. The system automatically computes the total working days and routes it to HR/Admins.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} />
            <span>
              <strong>Expense Reimbursements</strong> — Tracks standard and custom expense claims. Requires uploading a proof of purchase or receipt alongside expense amount and category.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} />
            <span>
              <strong>Hardware Requests</strong> — Facilitates hardware provisioning. Team members can request new laptops, monitors, or peripherals with justification and estimated budget.
            </span>
          </li>
        </ul>
      </Section>
      <Section title="Dynamic Form Builder">
        <p>
          All HR forms are fully dynamic and rendered on-the-fly from JSON templates stored in the 
          <code className="bg-slate-100 px-1 rounded text-xs">form_definitions</code> table. Admins can build and customize form layouts (inputs, select menus, date-pickers, textareas) and assign structural validation rules without touching any code.
        </p>
      </Section>
      <Section title="State Machine & Parallel Approvals">
        <p>
          Once a request is submitted, the PocketBase backend JSVM hooks (<code className="bg-slate-100 px-1 rounded text-xs">intake_on_create.pb.js</code> and <code className="bg-slate-100 px-1 rounded text-xs">task_on_update.pb.js</code>) automatically:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 mt-2">
          <li>Create child approval task records assigned to HR managers.</li>
          <li>Send real-time alerts to the assigned approvers' notifications.</li>
          <li>Aggregate decisions: when an approver acts, the task status changes, triggering a cascade check. Once all tasks are approved, the parent request transitions to <span className="font-semibold text-emerald-600">Approved</span>. If any approver rejects, it immediately flips the parent request to <span className="font-semibold text-red-600">Rejected</span> and cancels outstanding tasks.</li>
        </ol>
      </Section>
      <Callout>
        To manage templates or review pending decisions, Admins and HR reps can visit the <strong>HR Hub</strong> in the main navigation.
      </Callout>
    </>
  ),

  webhooks: (
    <>
      <Section title="What is the Webhook System?">
        <p>
          The outbound webhook system enables real-time synchronization between Nova Stack and external automation tools (such as **n8n**, **Zapier**, or custom APIs).
          Whenever key actions happen in your database, Nova Stack dispatches secure, standardized JSON POST payloads asynchronously to your registered URLs.
        </p>
      </Section>
      <Section title="Supported Event Triggers">
        <p>You can subscribe webhook endpoints to any of the following active workspace events:</p>
        <ul className="space-y-3 mt-2">
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} />
            <span>
              <strong>deal.won</strong> — Dispatched instantly when a CRM deal's stage is transitioned to <em>won</em>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} />
            <span>
              <strong>invoice.paid</strong> — Dispatched when a client invoice transitions to <em>paid</em>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} />
            <span>
              <strong>intake.approved</strong> — Dispatched when a general, vacation, expense, or hardware intake submission status is set to <em>approved</em>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--ns-accent))' }} />
            <span>
              <strong>contact.created</strong> — Dispatched when a new customer contact is registered in the database.
            </span>
          </li>
        </ul>
      </Section>
      <Section title="n8n Integration Architecture">
        <p>
          Following our product philosophy, **Nova Stack** operates as your private local source of truth, while **n8n** handles complex orchestrations. By pointing webhooks to n8n triggers, you can build rich custom workflows such as:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5 mt-2">
          <li>Posting a celebration message to your team's Slack channel on <code className="bg-slate-100 px-1 rounded text-xs">deal.won</code>.</li>
          <li>Sending automated onboarding documents via Gmail when <code className="bg-slate-100 px-1 rounded text-xs">contact.created</code> fires.</li>
          <li>Logging invoice details into Google Sheets or QuickBooks on <code className="bg-slate-100 px-1 rounded text-xs">invoice.paid</code>.</li>
        </ol>
      </Section>
      <Callout>
        Webhook endpoints can be registered and toggled active/inactive by Administrators under **Settings &gt; Webhooks**.
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all cursor-pointer ${
                  active === s.id
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={active === s.id ? { backgroundColor: 'rgb(var(--ns-accent))' } : undefined}
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
