/**
 * fix-exp-approver.mjs
 * 
 * 1. Updates the active EXP form's workflowSteps to include Demo User 1
 *    as an approver (parallel with System Admin / Sara as HR reviewer)
 * 2. Backfills missing approval_tasks for Sara's pending EXP submission
 *
 * Run: node fix-exp-approver.mjs
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')
const SUPERUSER_EMAIL = 'admin@novastack.local'
const SUPERUSER_PASS  = 'novastack123'

// Known IDs from the DB
const EXP_FORM_ID     = 'cq8733gqasia0xk'  // active parallel EXP form
const DEMO1_ID        = '69elz6jt9wvrcfo'   // Demo User 1 (admin)
const SARA_ID         = 'ztb2cwdl36kgdud'   // Sarah Jenkins (HR)

async function main() {
  console.log('Authenticating as superuser...')
  await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS)
  console.log('  OK')

  // Show all users
  const users = await pb.collection('users').getFullList({ sort: 'name' })
  console.log('\nAll users:')
  users.forEach(u => console.log(`  ${u.id}  ${u.name}  role=${u.role}`))

  // 1. Update EXP form workflowSteps to use Demo User 1 + Sara as parallel approvers
  const expForm = await pb.collection('form_definitions').getOne(EXP_FORM_ID)
  console.log(`\nCurrent EXP workflowSteps:`)
  console.log(JSON.stringify(expForm.workflowSteps, null, 2))

  const newSteps = [
    { id: 's1', active: true, label: 'Manager Approval', userId: DEMO1_ID },
    { id: 's2', active: true, label: 'HR Review',        userId: SARA_ID  },
  ]
  await pb.collection('form_definitions').update(EXP_FORM_ID, { workflowSteps: newSteps })
  console.log(`\n✅ Updated EXP workflowSteps — Demo User 1 + Sara as parallel approvers`)

  // 2. Find Sara's pending EXP submissions (formId = EXP_FORM_ID, status = 'pending')
  const expSubs = await pb.collection('intake_submissions').getFullList({
    filter: `formId = "${EXP_FORM_ID}" && status = "pending"`,
    sort: 'created',
  })
  console.log(`\nFound ${expSubs.length} pending EXP submission(s):`)
  expSubs.forEach(s => console.log(`  ${s.formattedId || s.id}  userId=${s.userId}  name=${s.name}`))

  if (expSubs.length === 0) {
    console.log('\nNo pending EXP submissions — nothing to backfill.')
    process.exit(0)
  }

  // 3. For each EXP submission, check and backfill approval_tasks
  const allTasks = await pb.collection('approval_tasks').getFullList({ sort: 'created' })

  for (const sub of expSubs) {
    const existingTasks = allTasks.filter(t => t.submissionId === sub.id)
    console.log(`\n${sub.formattedId || sub.id}: ${existingTasks.length} existing task(s)`)

    if (existingTasks.length === 0) {
      // Parallel mode: create BOTH tasks
      console.log(`  → Creating parallel tasks (Demo User 1 + Sara)...`)
      for (const step of newSteps) {
        const t = await pb.collection('approval_tasks').create({
          submissionId: sub.id,
          assignedToId: step.userId,
          stepLabel:    step.label,
          stepOrder:    newSteps.indexOf(step),
          isActive:     true,
          status:       'pending',
        })
        const approver = users.find(u => u.id === step.userId)?.name || step.userId
        console.log(`  ✅ Created task ${t.id} for ${approver}`)
      }
    } else {
      console.log(`  Tasks already exist — skipping`)
      existingTasks.forEach(t => {
        const approver = users.find(u => u.id === t.assignedToId)?.name || t.assignedToId
        console.log(`    ${t.id}  →  ${approver}  status=${t.status}`)
      })
    }
  }

  console.log('\n✅ Done! Demo User 1 and Sara should both see the EXP request in their queues.')
}

main().catch(err => { console.error(err); process.exit(1) })
