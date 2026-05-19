/**
 * fix-vac-approver.mjs
 * 
 * 1. Authenticates as superuser
 * 2. Finds Sara by her known email
 * 3. Updates the Vacation Request form's workflowSteps to point to Sara
 * 4. Backfills missing approval_tasks for VAC-001 and VAC-002
 *
 * Run: node fix-vac-approver.mjs
 */

import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

const SUPERUSER_EMAIL = process.env.ADMIN_EMAIL || 'admin@novastack.local'
const SUPERUSER_PASS  = process.env.ADMIN_PASS  || 'novastack123'
const SARA_EMAIL      = 'sarah.hr@nova-stack.local'

async function main() {
  // 1. Auth as superuser
  console.log('Authenticating as superuser...')
  await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS)
  console.log('  Superuser auth OK')

  // 2. Find all users and identify Sara
  const allUsers = await pb.collection('users').getFullList({ sort: 'name' })
  console.log('\nAll users:')
  allUsers.forEach(u => console.log(`  ${u.id}  ${u.name}  role=${u.role}  email=${u.email}`))

  const sara = allUsers.find(u => u.email === SARA_EMAIL)
    || allUsers.find(u => u.role === 'manager' || u.role === 'hr')
  if (!sara) {
    console.error('\nERROR: Could not find Sara.')
    process.exit(1)
  }
  // Admin = any user that is NOT Sara (to detect mis-assigned tasks)
  const nonSaraIds = allUsers.filter(u => u.id !== sara.id).map(u => u.id)
  console.log(`\nUsing approver: ${sara.name} (${sara.id}, role=${sara.role})`)

  // 3. Fix the Vacation Request form's workflowSteps
  const VAC_FORM_ID = 'i6pu9pum3doj8at'
  const vacForm = await pb.collection('form_definitions').getOne(VAC_FORM_ID)
  console.log(`\nCurrent Vacation Request workflowSteps:`)
  console.log(JSON.stringify(vacForm.workflowSteps, null, 2))

  const updatedSteps = [{ active: true, label: 'Manager Approval', userId: sara.id }]
  await pb.collection('form_definitions').update(VAC_FORM_ID, { workflowSteps: updatedSteps })
  console.log(`\nUpdated workflowSteps to assign to ${sara.name} (${sara.id})`)

  // 4. Find existing VAC submissions
  const vacSubmissions = await pb.collection('intake_submissions').getFullList({
    filter: `formattedId ~ "VAC-"`,
    sort: 'created',
  })
  console.log(`\nFound ${vacSubmissions.length} VAC submission(s):`)
  vacSubmissions.forEach(s => console.log(`  ${s.formattedId} (id=${s.id}, status=${s.status})`))

  // 5. For each VAC submission, check if it has an approval_task; if not, create one
  const tasksColl = await pb.collection('approval_tasks').getFullList({ sort: 'created' })
  for (const sub of vacSubmissions) {
    const existing = tasksColl.filter(t => t.submissionId === sub.id)
    console.log(`\n${sub.formattedId}: ${existing.length} existing task(s)`)
    if (existing.length === 0) {
      console.log(`  → Creating missing approval_task assigned to ${sara.name}...`)
      const task = await pb.collection('approval_tasks').create({
        submissionId: sub.id,
        assignedToId: sara.id,
        stepLabel: 'Manager Approval',
        stepOrder: 0,
        isActive: true,
        status: 'pending',
      })
      console.log(`  ✅ Created task ${task.id}`)
    } else {
      // Check if any existing task is assigned to someone else — fix it
      for (const t of existing) {
        if (nonSaraIds.includes(t.assignedToId) && t.status === 'pending') {
          console.log(`  → Reassigning task ${t.id} (was ${t.assignedToId}) to ${sara.name}...`)
          await pb.collection('approval_tasks').update(t.id, { assignedToId: sara.id })
          console.log(`  ✅ Reassigned`)
        } else {
          console.log(`  ✓ Task ${t.id} already assigned to ${t.assignedToId} (status=${t.status})`)
        }
      }
    }
  }

  console.log('\n✅ Done! Sara should now see VAC requests in her Decision Queue.')
}

main().catch(err => { console.error(err); process.exit(1) })
