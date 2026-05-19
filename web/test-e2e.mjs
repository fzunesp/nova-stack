import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function runE2E() {
  await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');
  
  // 1. Check if RWR form exists
  const forms = await pb.collection('form_definitions').getFullList({ filter: 'prefix = "RWR"' });
  if (forms.length === 0) {
    console.log('Error: RWR form not found');
    return;
  }
  const rwrForm = forms[0];
  console.log(`Found Form: ${rwrForm.name} (${rwrForm.id})`);

  // 2. Submit a request
  const formattedId = `RWR-TEST-${Date.now()}`;
  console.log(`Submitting new request: ${formattedId}`);
  const submission = await pb.collection('intake_submissions').create({
    name: 'End-to-End Tester',
    email: 'tester@novastack.local',
    formId: rwrForm.id,
    formattedId,
    type: rwrForm.key,
    source: 'internal',
    status: 'pending',
    currentStep: 0,
    details: {
      location: 'Home Office',
      duration: '1 week',
      justification: 'Need to focus on E2E testing'
    },
    // We use the first user we find as the submitter
    userId: (await pb.collection('users').getFirstListItem('')).id
  });
  console.log(`Created submission: ${submission.id}`);

  // Wait 1 second for the intake_on_create hook to generate tasks
  await new Promise(r => setTimeout(r, 1000));

  // 3. Fetch tasks for this submission
  const tasks = await pb.collection('approval_tasks').getFullList({
    filter: `submissionId = "${submission.id}"`,
    sort: 'stepOrder'
  });
  console.log(`Generated ${tasks.length} tasks:`);
  tasks.forEach(t => console.log(`  - Step ${t.stepOrder}: ${t.stepLabel} [${t.status}] (Active: ${t.isActive})`));

  if (tasks.length > 0) {
    // 4. Reject the first task
    const firstTask = tasks[0];
    console.log(`Rejecting first task: ${firstTask.id}`);
    await pb.collection('approval_tasks').update(firstTask.id, {
      status: 'rejected',
      comment: 'Rejected by automated E2E test',
      completedAt: new Date().toISOString()
    });

    // Wait 1 second for the task_on_update hook to process rejection
    await new Promise(r => setTimeout(r, 1000));

    // 5. Verify the cascade
    const updatedTasks = await pb.collection('approval_tasks').getFullList({
      filter: `submissionId = "${submission.id}"`,
      sort: 'stepOrder'
    });
    console.log(`\nPost-Rejection Task State:`);
    updatedTasks.forEach(t => console.log(`  - Step ${t.stepOrder}: [${t.status}] (Active: ${t.isActive})`));

    const updatedSub = await pb.collection('intake_submissions').getOne(submission.id);
    console.log(`\nFinal Submission Status: ${updatedSub.status}`);
    if (updatedSub.status === 'rejected' && updatedTasks[1].isActive === false) {
      console.log('✅ Rejection Flow Test PASSED!');
    } else {
      console.log('❌ Rejection Flow Test FAILED!');
    }
  }
}

runE2E().catch(console.error);
