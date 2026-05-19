/**
 * fix-exp-status.mjs
 * 
 * The EXP-1779142375068 submission has both tasks approved but status is still 'pending'
 * because the tasks were set to 'completed' instead of 'approved' (old bug).
 * 
 * This script:
 * 1. Finds the EXP submission
 * 2. Checks both tasks are done
 * 3. Updates submission status to 'approved'
 * 4. Also updates both tasks to status='approved' so the UI shows them correctly
 */

import PocketBase from 'pocketbase'
const pb = new PocketBase('http://127.0.0.1:8090')

async function main() {
  await pb.admins.authWithPassword('admin@novastack.local', 'novastack123')
  console.log('Auth OK')

  // Find the EXP submission
  const subs = await pb.collection('intake_submissions').getFullList({
    filter: 'formattedId = "EXP-1779142375068"',
  })
  if (subs.length === 0) {
    // Try by formId
    const subs2 = await pb.collection('intake_submissions').getFullList({
      filter: 'formId = "cq8733gqasia0xk" && status = "pending"',
    })
    console.log('Found by formId:', subs2.map(s => s.formattedId))
    for (const sub of subs2) await fixSubmission(sub)
    return
  }
  for (const sub of subs) await fixSubmission(sub)
}

async function fixSubmission(sub) {
  console.log(`\nFixing submission ${sub.formattedId} (${sub.id}), status=${sub.status}`)
  
  const tasks = await pb.collection('approval_tasks').getFullList({
    filter: `submissionId = "${sub.id}"`,
    sort: 'stepOrder',
  })
  console.log(`Tasks:`)
  tasks.forEach(t => console.log(`  ${t.id}  ${t.stepLabel}  status=${t.status}  assignedTo=${t.assignedToId}`))

  // Fix tasks that were set to 'completed' → should be 'approved'
  for (const t of tasks) {
    if (t.status === 'completed') {
      await pb.collection('approval_tasks').update(t.id, { status: 'approved' })
      console.log(`  Fixed task ${t.id}: completed → approved`)
    }
  }

  // Reload tasks to check
  const updatedTasks = await pb.collection('approval_tasks').getFullList({
    filter: `submissionId = "${sub.id}"`,
  })
  const allApproved = updatedTasks.every(t => t.status === 'approved')
  const anyRejected = updatedTasks.some(t => t.status === 'rejected')

  if (anyRejected) {
    await pb.collection('intake_submissions').update(sub.id, { status: 'rejected' })
    console.log(`  Submission → rejected`)
  } else if (allApproved) {
    await pb.collection('intake_submissions').update(sub.id, { status: 'approved', decidedAt: new Date().toISOString() })
    console.log(`  ✅ Submission → approved`)
  } else {
    console.log(`  Submission left as pending (not all tasks resolved)`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
