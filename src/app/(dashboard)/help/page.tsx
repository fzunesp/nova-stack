'use client';

import React, { useState } from 'react';

type Tab = 'crm' | 'contacts' | 'deals' | 'invoices' | 'tasks' | 'intake' | 'activity' | 'kpis';

const tabs: { key: Tab; label: string }[] = [
  { key: 'crm', label: 'Command Center' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'deals', label: 'Deals' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'intake', label: 'Intake' },
  { key: 'activity', label: 'Activity' },
  { key: 'kpis', label: 'KPIs' },
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<Tab>('crm');

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
          Help &amp; Guides
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Learn how each part of Nova Stack works and how it fits into your business workflow.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-6 overflow-x-auto -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="prose prose-sm max-w-4xl">
        {activeTab === 'crm' && <CommandCenterGuide />}
        {activeTab === 'contacts' && <ContactsGuide />}
        {activeTab === 'deals' && <DealsGuide />}
        {activeTab === 'invoices' && <InvoicesGuide />}
        {activeTab === 'tasks' && <TasksGuide />}
        {activeTab === 'intake' && <IntakeGuide />}
        {activeTab === 'activity' && <ActivityGuide />}
        {activeTab === 'kpis' && <KpisGuide />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GUIDE SECTIONS                                                     */
/* ------------------------------------------------------------------ */

function CommandCenterGuide() {
  return (
    <div className="space-y-8">
      <Section title="What is the Command Center?">
        <p>
          The <strong>Command Center</strong> is your home screen. Think of it like the dashboard
          of a car — it shows you everything important at a quick glance so you know what to do next.
        </p>
        <p>
          You will see three sections here:
        </p>
        <ul>
          <li>
            <strong>Today strip</strong> — a small bar at the top that shows how many tasks are due,
            invoices are overdue, and deals need follow-up. Each number is a link you can click.
          </li>
          <li>
            <strong>Money at Risk</strong> — shows the total dollar amount tied up in overdue invoices
            and open deals. This helps you see the financial impact of inaction.
          </li>
          <li>
            <strong>Radar</strong> — a smart list that groups things into <em>Urgent</em>,
            <em>Needs Attention</em>, and <em>Opportunities</em>. It tells you exactly what to act on.
          </li>
          <li>
            <strong>KPI cards</strong> — five small cards showing Total Revenue, Outstanding money,
            Active Deals, Conversion Rate, and Pending Tasks.
          </li>
        </ul>
      </Section>

      <Section title="How to Use It">
        <ol>
          <li>Open the Command Center (it is the first item in the sidebar).</li>
          <li>Read the <strong>Today</strong> strip. If any number is above zero, click it to see what needs attention.</li>
          <li>Check the <strong>Money at Risk</strong> bar. Click &quot;overdue&quot; to see those invoices, or &quot;open deals&quot; to review your pipeline.</li>
          <li>Scroll through the <strong>Radar</strong>. Click any item to jump straight to that task, deal, or invoice.</li>
          <li>Use the <strong>KPI cards</strong> at the bottom to understand your overall business health.</li>
        </ol>
      </Section>

      <Section title="Where It Fits in the Business Flow">
        <p>
          The Command Center is the <strong>starting point</strong> of your workflow. You come here first,
          see what needs your attention, click into the relevant area, do the work, and come back.
          It connects to every other part of Nova Stack.
        </p>
      </Section>

      <Section title="Quick Tip">
        <p>
          Use the <strong>+ Contact</strong>, <strong>+ Deal</strong>, and <strong>+ Invoice</strong> buttons
          at the top of the page to quickly create new items without leaving the dashboard.
        </p>
      </Section>
    </div>
  );
}

function ContactsGuide() {
  return (
    <div className="space-y-8">
      <Section title="What Are Contacts?">
        <p>
          Contacts are the <strong>people and companies</strong> you do business with.
          Every deal, invoice, and conversation is connected to a contact.
          Think of contacts as the foundation of your CRM.
        </p>
      </Section>

      <Section title="How to Create a Contact">
        <ol>
          <li>Click <strong>Contacts</strong> in the sidebar.</li>
          <li>Click the blue <strong>Add Contact</strong> button.</li>
          <li>Fill in their name (required), email, phone, company name, and any notes.</li>
          <li>Click <strong>Save</strong>. The new contact appears in your list.</li>
        </ol>
      </Section>

      <Section title="How to View and Edit a Contact">
        <ol>
          <li>From the Contacts list, click any row to open the <strong>contact detail page</strong>.</li>
          <li>You will see their contact info, notes, and a list of all their deals.</li>
          <li>Click <strong>Edit Contact</strong> to change any details.</li>
          <li>Click <strong>Add Deal</strong> to start a new deal with this contact.</li>
        </ol>
      </Section>

      <Section title="Where Contacts Fit in the Business Flow">
        <p>
          The typical flow is: <strong>Contact → Deal → Invoice → Paid</strong>. You start by
          adding a contact, then create a deal for them, then generate an invoice from that deal,
          and finally mark it as paid. Contacts are step one.
        </p>
      </Section>

      <Section title="Quick Tip">
        <p>
          If a contact has no deals yet, the Command Center Radar will remind you under
          <strong>Opportunities</strong> — &quot;New contact — create a deal.&quot;
        </p>
      </Section>
    </div>
  );
}

function DealsGuide() {
  return (
    <div className="space-y-8">
      <Section title="What Are Deals?">
        <p>
          A <strong>Deal</strong> represents a potential sale or opportunity with a contact.
          It has a dollar value, a stage (how close it is to closing), and an expected close date.
          Deals move through stages — from <strong>lead</strong> all the way to <strong>won</strong> or <strong>lost</strong>.
        </p>
      </Section>

      <Section title="Deal Stages Explained">
        <ul>
          <li><strong>Lead</strong> — You just heard about this opportunity. Nothing has happened yet.</li>
          <li><strong>Contacted</strong> — You have reached out to the contact.</li>
          <li><strong>Quoted</strong> — You have sent a price or proposal.</li>
          <li><strong>Won</strong> — The deal is closed and you got it.</li>
          <li><strong>Lost</strong> — The deal did not work out.</li>
        </ul>
      </Section>

      <Section title="How to Create a Deal">
        <ol>
          <li>Go to <strong>Deals</strong> in the sidebar, or click <strong>Add Deal</strong> from a contact page.</li>
          <li>Click the blue <strong>Add Deal</strong> button.</li>
          <li>Enter a title (e.g., &quot;Website redesign project&quot;).</li>
          <li>Enter the dollar value (how much you will earn if you win).</li>
          <li>Choose the contact this deal belongs to.</li>
          <li>Optionally set an expected close date.</li>
          <li>Click <strong>Save</strong>.</li>
        </ol>
      </Section>

      <Section title="How to Manage a Deal">
        <ol>
          <li>Open any deal by clicking on it from the Deals list.</li>
          <li><strong>Change the stage</strong> using the dropdown next to the deal title. Move it forward as you progress.</li>
          <li>Click <strong>Edit Deal</strong> to change the title, value, or associated contact.</li>
          <li>Click <strong>Create Invoice</strong> to generate an invoice from this deal (only available when the deal has a dollar value).</li>
          <li>If an invoice already exists, the button changes to <strong>View Invoice</strong>.</li>
        </ol>
      </Section>

      <Section title="Board View">
        <p>
          Click <strong>Board View</strong> to see all your deals as cards arranged by stage.
          This is a Kanban-style view that makes it easy to see your pipeline at a glance.
          You can drag cards between columns to change stages (coming soon).
        </p>
      </Section>

      <Section title="Where Deals Fit in the Business Flow">
        <p>
          Deals sit between Contacts and Invoices. After you add a contact, you create a deal
          to track the opportunity. Once the deal is confirmed, you generate an invoice from it.
          The deal stage tells you exactly where you are in the sales process.
        </p>
      </Section>
    </div>
  );
}

function InvoicesGuide() {
  return (
    <div className="space-y-8">
      <Section title="What Are Invoices?">
        <p>
          An <strong>Invoice</strong> is a bill you send to a client. It represents money they owe you.
          Invoices go through a lifecycle: <strong>Draft → Sent → Paid</strong> (or <strong>Cancelled</strong>).
        </p>
      </Section>

      <Section title="Invoice Statuses Explained">
        <ul>
          <li><strong>Draft</strong> — Not yet sent. You can still edit or cancel it.</li>
          <li><strong>Sent</strong> — You have emailed it to the client. They have not paid yet.</li>
          <li><strong>Paid</strong> — The client has paid. This is final and cannot be undone.</li>
          <li><strong>Cancelled</strong> — The invoice is void. You cannot mark a cancelled invoice as paid.</li>
        </ul>
      </Section>

      <Section title="How to Create an Invoice from a Deal (Recommended)">
        <ol>
          <li>Go to the deal you want to bill.</li>
          <li>Make sure the deal has a dollar value.</li>
          <li>Click the blue <strong>Create Invoice</strong> button.</li>
          <li>You will be taken directly to the new invoice page.</li>
          <li>The invoice is automatically created in <strong>Draft</strong> status with the same amount as the deal.</li>
        </ol>
      </Section>

      <Section title="How to Create an Invoice Manually">
        <ol>
          <li>Click <strong>Invoices</strong> in the sidebar.</li>
          <li>Click the blue <strong>Create Invoice</strong> button.</li>
          <li>Fill in a title, amount, and optionally a due date.</li>
          <li>Click <strong>Save</strong>. You will land on the new invoice page.</li>
        </ol>
      </Section>

      <Section title="How to Manage an Invoice">
        <ol>
          <li>Open an invoice from the Invoices list.</li>
          <li><strong>Mark as Sent</strong> — available when the invoice is in Draft status. Use this after you email it.</li>
          <li><strong>Mark as Paid</strong> — use this when the client pays. Sets the paid date automatically.</li>
          <li><strong>Cancel</strong> — voids the invoice. Cannot be used on already-paid invoices.</li>
          <li><strong>Send</strong> — emails the invoice as a PDF to the associated contact (requires a contact with an email address).</li>
          <li><strong>PDF</strong> — downloads the invoice as a PDF file.</li>
        </ol>
      </Section>

      <Section title="Where Invoices Fit in the Business Flow">
        <p>
          Invoices are the final step in the revenue flow: <strong>Contact → Deal → Invoice → Paid</strong>.
          When you mark an invoice as paid, it contributes to your Total Revenue in the KPI cards
          and shows up in the Activity feed. Invoices are typically created from Deals — that way,
          the amount is already filled in and the invoice is linked to the right contact and deal.
        </p>
      </Section>

      <Section title="Where to Find Invoice Status Information">
        <ul>
          <li>The <strong>Invoices page</strong> shows all invoices in a table with color-coded status badges.</li>
          <li>The <strong>Deal page</strong> shows linked invoices under &quot;Linked Invoices.&quot;</li>
          <li>The <strong>Command Center Radar</strong> flags overdue invoices under <em>Urgent</em> and sent invoices under <em>Attention</em>.</li>
        </ul>
      </Section>
    </div>
  );
}

function TasksGuide() {
  return (
    <div className="space-y-8">
      <Section title="What Are Tasks?">
        <p>
          <strong>Tasks</strong> are to-do items that help you stay organized. Each task has a title,
          an optional description, a due date, and a status. Tasks help you remember what you need to do
          for your contacts, deals, and invoices.
        </p>
      </Section>

      <Section title="Task Statuses">
        <ul>
          <li><strong>Todo</strong> — Not started yet.</li>
          <li><strong>In Progress</strong> — You are working on it.</li>
          <li><strong>Done</strong> — Completed.</li>
        </ul>
      </Section>

      <Section title="How to Create a Task">
        <ol>
          <li>Click <strong>Tasks</strong> in the sidebar.</li>
          <li>Click <strong>Add Task</strong>.</li>
          <li>Enter a title (e.g., &quot;Follow up with Acme Corp about the proposal&quot;).</li>
          <li>Optionally add a description and a due date.</li>
          <li>Click <strong>Save</strong>.</li>
        </ol>
      </Section>

      <Section title="How to Manage Tasks">
        <ol>
          <li>On the Tasks page, you can see tasks grouped by status.</li>
          <li>Use the <strong>status dropdown</strong> on any task to change it to In Progress or Done.</li>
          <li>Click a task to edit its title, description, or due date.</li>
          <li>Overdue tasks appear in the <strong>Command Center Radar</strong> under <em>Urgent</em>.</li>
        </ol>
      </Section>

      <Section title="Where Tasks Fit in the Business Flow">
        <p>
          Tasks are the glue that connects everything. You might create a task to:
        </p>
        <ul>
          <li>Follow up on a deal that has not moved stages.</li>
          <li>Send an invoice that is still in draft.</li>
          <li>Call a new contact you just added.</li>
          <li>Check on an overdue payment.</li>
        </ul>
        <p>
          The Command Center Radar automatically pulls in overdue and upcoming tasks so you never miss a deadline.
        </p>
      </Section>
    </div>
  );
}

function IntakeGuide() {
  return (
    <div className="space-y-8">
      <Section title="What Is Intake?">
        <p>
          <strong>Intake</strong> is an inbox for external submissions. When someone fills out a form
          on your website (like a contact form), the submission lands here. You can review it and decide
          what to do next — convert it into a deal, or just mark it as reviewed.
        </p>
      </Section>

      <Section title="Submission Statuses">
        <ul>
          <li><strong>New</strong> — Just arrived. Has not been looked at yet.</li>
          <li><strong>Reviewed</strong> — You have looked at it but have not taken action yet.</li>
          <li><strong>Converted</strong> — You have turned this submission into a deal or contact.</li>
        </ul>
      </Section>

      <Section title="How Submissions Arrive">
        <p>
          Submissions come in through the API endpoint <code>POST /api/intake</code>.
          You would connect a form tool (like Fillout, Typeform, or your website) to this endpoint.
          The request must include:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm text-gray-700 mb-3">
          {`{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "I'm interested in your services"
}`}
        </div>
        <p>Testing with curl:</p>
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-300">
          {`curl -X POST http://localhost:3000/api/intake \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hello"}'`}
        </div>
      </Section>

      <Section title="How to Process Submissions">
        <ol>
          <li>Open <strong>Intake</strong> from the sidebar.</li>
          <li>You will see a table of all submissions, newest first.</li>
          <li>Click <strong>Review</strong> to mark a submission as reviewed (moves it from New to Reviewed).</li>
          <li>After reviewing, decide what to do:
            <ul>
              <li>If it is a potential client, create a <strong>Contact</strong> and a <strong>Deal</strong> for them.</li>
              <li>If it is a support request, create a <strong>Task</strong>.</li>
            </ul>
          </li>
          <li>Click <strong>Convert</strong> once you have created the necessary items. This marks the submission as done.</li>
        </ol>
      </Section>

      <Section title="Where Intake Fits in the Business Flow">
        <p>
          Intake is the <strong>entry point</strong> for leads coming from outside Nova Stack.
          The typical flow is: <strong>Submission → Review → Create Contact → Create Deal → Invoice → Paid</strong>.
          Think of Intake as your digital reception desk.
        </p>
      </Section>
    </div>
  );
}

function ActivityGuide() {
  return (
    <div className="space-y-8">
      <Section title="What Is Activity?">
        <p>
          The <strong>Activity</strong> page shows a timeline of everything that has happened in your
          Nova Stack recently. It pulls events from Deals, Invoices, and Tasks so you can see the
          full picture in one place.
        </p>
      </Section>

      <Section title="What You Will See">
        <ul>
          <li><strong>New deals</strong> — with their stage and value.</li>
          <li><strong>New invoices</strong> — with their amount and status.</li>
          <li><strong>Paid invoices</strong> — marked with a green &quot;Paid&quot; badge.</li>
          <li><strong>Completed tasks</strong> — marked with a green &quot;Done&quot; badge.</li>
        </ul>
        <p>Each item shows how long ago it happened (e.g., &quot;5m ago&quot;, &quot;2d ago&quot;).</p>
      </Section>

      <Section title="How to Use the Activity Page">
        <ol>
          <li>Open <strong>Activity</strong> from the sidebar.</li>
          <li>Scroll through the timeline to see recent events.</li>
          <li>Use the badges to quickly identify what type of event each item is.</li>
          <li>This is a read-only view — no actions can be taken from here. Click into the relevant section (Deals, Invoices, Tasks) to take action.</li>
        </ol>
      </Section>

      <Section title="Where Activity Fits in the Business Flow">
        <p>
          The Activity page is the <strong>audit trail</strong> of your business. It helps you
          answer questions like &quot;When did I send that invoice?&quot; or &quot;What deals closed this week?&quot;
          It does not replace the Command Center — it complements it by giving you a chronological
          history instead of a priority-based view.
        </p>
      </Section>
    </div>
  );
}

function KpisGuide() {
  return (
    <div className="space-y-8">
      <Section title="What Are KPIs?">
        <p>
          <strong>KPIs</strong> (Key Performance Indicators) are small cards at the bottom of the
          Command Center that summarize your business health in numbers. There are five of them,
          each calculated automatically from your data.
        </p>
      </Section>

      <Section title="1. Total Revenue">
        <p className="font-semibold text-gray-900">How it is calculated:</p>
        <ul>
          <li><strong>Source:</strong> All invoices owned by you.</li>
          <li><strong>Filter:</strong> Only invoices where <code>paidAt</code> is NOT null — meaning the invoice has been marked as paid.</li>
          <li><strong>Formula:</strong> Sum of the <code>amount</code> field for all paid invoices.</li>
          <li><strong>Excludes:</strong> Draft, sent, and cancelled invoices — even if they have a dollar amount.</li>
        </ul>
        <p>
          <em>In plain English:</em> This is the total money you have actually collected. If you have three paid invoices
          of $100, $200, and $300, your Total Revenue is $600.
        </p>
      </Section>

      <Section title="2. Outstanding">
        <p className="font-semibold text-gray-900">How it is calculated:</p>
        <ul>
          <li><strong>Source:</strong> All invoices owned by you.</li>
          <li><strong>Filter:</strong> Only invoices where <code>status</code> is <code>&apos;draft&apos;</code> OR <code>&apos;sent&apos;</code>.</li>
          <li><strong>Formula:</strong> Sum of the <code>amount</code> field for all draft + sent invoices.</li>
          <li><strong>Excludes:</strong> Paid invoices (already collected) and cancelled invoices (void).</li>
        </ul>
        <p>
          <em>In plain English:</em> This is money you expect to receive but have not yet collected.
          It covers invoices you are still working on (draft) and invoices you have sent to clients (sent) that they have not paid yet.
        </p>
      </Section>

      <Section title="3. Active Deals">
        <p className="font-semibold text-gray-900">How it is calculated:</p>
        <ul>
          <li><strong>Source:</strong> All deals owned by you.</li>
          <li><strong>Filter:</strong> Only deals where <code>stage</code> (lowercased) is <code>&apos;lead&apos;</code>, <code>&apos;contacted&apos;</code>, OR <code>&apos;quoted&apos;</code>.</li>
          <li><strong>Formula:</strong> Count of deals matching the filter.</li>
          <li><strong>Excludes:</strong> Won deals (closed), lost deals (dead), and any deals not in the three active stages.</li>
        </ul>
        <p>
          <em>In plain English:</em> How many deals are currently moving through your pipeline. These are opportunities
          you should be working on. Won and lost deals do not count because they are finished.
        </p>
      </Section>

      <Section title="4. Conversion Rate">
        <p className="font-semibold text-gray-900">How it is calculated:</p>
        <ul>
          <li><strong>Source:</strong> All deals owned by you.</li>
          <li><strong>Won Deals:</strong> Count of deals where <code>stage</code> (lowercased) is <code>&apos;won&apos;</code>.</li>
          <li><strong>Total Deals:</strong> Count of all deals (any stage).</li>
          <li><strong>Formula:</strong> <code>(wonDeals &divide; totalDeals) &times; 100</code></li>
          <li><strong>If totalDeals is 0:</strong> Conversion rate is 0% (to avoid division by zero).</li>
        </ul>
        <p>
          <em>In plain English:</em> Out of all the deals you have ever created, what percentage did you win?
          If you created 10 deals total and won 4 of them, your conversion rate is 40%. This tells you how
          effective your sales process is.
        </p>
      </Section>

      <Section title="5. Pending Tasks">
        <p className="font-semibold text-gray-900">How it is calculated:</p>
        <ul>
          <li><strong>Source:</strong> All tasks owned by you.</li>
          <li><strong>Filter:</strong> Tasks where <code>status</code> is NOT <code>&apos;done&apos;</code>.</li>
          <li><strong>Formula:</strong> Count of tasks matching the filter.</li>
          <li><strong>Includes:</strong> Both &quot;todo&quot; and &quot;in progress&quot; tasks.</li>
          <li><strong>Excludes:</strong> Completed (done) tasks.</li>
        </ul>
        <p>
          <em>In plain English:</em> How many tasks you still need to complete. This is your to-do count.
        </p>
      </Section>

      <Section title="Summary Table">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-2 pr-4 font-semibold text-gray-900">KPI</th>
                <th className="py-2 pr-4 font-semibold text-gray-900">Data Source</th>
                <th className="py-2 pr-4 font-semibold text-gray-900">Filter / Condition</th>
                <th className="py-2 pr-4 font-semibold text-gray-900">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-900">Total Revenue</td>
                <td className="py-2 pr-4 text-gray-600">Invoices</td>
                <td className="py-2 pr-4 text-gray-600"><code>paidAt</code> is not null</td>
                <td className="py-2 pr-4 text-gray-600">SUM(amount)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-900">Outstanding</td>
                <td className="py-2 pr-4 text-gray-600">Invoices</td>
                <td className="py-2 pr-4 text-gray-600">status = draft OR sent</td>
                <td className="py-2 pr-4 text-gray-600">SUM(amount)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-900">Active Deals</td>
                <td className="py-2 pr-4 text-gray-600">Deals</td>
                <td className="py-2 pr-4 text-gray-600">stage = lead, contacted, or quoted</td>
                <td className="py-2 pr-4 text-gray-600">COUNT(*)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-900">Conversion Rate</td>
                <td className="py-2 pr-4 text-gray-600">Deals</td>
                <td className="py-2 pr-4 text-gray-600">stage = won &divide; all deals</td>
                <td className="py-2 pr-4 text-gray-600">(won &divide; total) &times; 100</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-gray-900">Pending Tasks</td>
                <td className="py-2 pr-4 text-gray-600">Tasks</td>
                <td className="py-2 pr-4 text-gray-600">status &ne; done</td>
                <td className="py-2 pr-4 text-gray-600">COUNT(*)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  REUSABLE SECTION                                                   */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}
