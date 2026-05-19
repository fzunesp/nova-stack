import PocketBase from './web/node_modules/pocketbase/dist/pocketbase.es.mjs';

const pb = new PocketBase('http://127.0.0.1:8090');

// Login as admin for ease of testing or disable rules (we'll just use admin)
await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');

async function runTests() {
  console.log("Starting HR Flow Tests...");

  // Get users for assignment
  const users = await pb.collection('users').getFullList();
  const employee = users.find(u => u.email === 'mark.sales@nova-stack.local') || users[0];
  const manager = users.find(u => u.email === 'admin@nova-stack.local') || users[1] || users[0];
  const hr = users.find(u => u.email === 'sarah.hr@nova-stack.local') || users[2] || users[0];

  // ==========================================
  // Test 5.4: Form Builder Test
  // ==========================================
  console.log("\n--- Running Test 5.4: Form Builder ---");
  const newTemplate = await pb.collection('form_definitions').create({
    name: "Remote Work Request",
    key: "remote_work_request_" + Date.now(),
    prefix: "RWR",
    description: "Request to work remotely",
    isActive: true,
    isParallel: false,
    fields: [
      { id: "1", name: "location", label: "Work Location", type: "text", required: true },
      { id: "2", name: "duration", label: "Duration", type: "select", options: ["1 day", "1 week", "Permanent"], required: true },
      { id: "3", name: "justification", label: "Justification", type: "textarea", required: true }
    ],
    workflowSteps: [
      { id: "s1", label: "Manager Review", userId: manager.id, active: true },
      { id: "s2", label: "HR Review", userId: hr.id, active: true }
    ]
  });
  console.log("Created Form Definition:", newTemplate.prefix);

  // Submit form as employee
  const submission = await pb.collection('intake_submissions').create({
    formId: newTemplate.id,
    submittedById: employee.id,
    details: {
      location: "Home Office",
      duration: "1 week",
      justification: "Need to focus on project X"
    },
    status: 'pending',
    currentStep: 0,
    formattedId: "RWR-" + Date.now()
  });
  console.log("Created Submission:", submission.formattedId);

  // Verify task was created
  let tasks = await pb.collection('approval_tasks').getFullList({ filter: `submissionId="${submission.id}"` });
  console.log(`Expected 1 task for sequential approval. Found ${tasks.length}`);
  if (tasks.length === 1 && tasks[0].assignedToId === manager.id) {
    console.log("Test 5.4 Passed.");
  } else {
    console.log("Test 5.4 Failed: Tasks=", tasks);
  }

  // ==========================================
  // Test 5.2: Parallel Approval (Expense)
  // ==========================================
  console.log("\n--- Running Test 5.2: Parallel Approval ---");
  const expTemplate = await pb.collection('form_definitions').create({
    name: "Expense Reimbursement",
    key: "expense_test_" + Date.now(),
    prefix: "EXP",
    isActive: true,
    isParallel: true,
    fields: [],
    workflowSteps: [
      { id: "s1", label: "Manager Review", userId: manager.id, active: true },
      { id: "s2", label: "HR Review", userId: hr.id, active: true }
    ]
  });

  const expSub = await pb.collection('intake_submissions').create({
    formId: expTemplate.id,
    submittedById: employee.id,
    details: { amount: 100 },
    status: 'pending',
    currentStep: 0,
    formattedId: "EXP-" + Date.now()
  });

  // Verify BOTH HR and Manager get a task
  let expTasks = await pb.collection('approval_tasks').getFullList({ filter: `submissionId="${expSub.id}"` });
  console.log(`Expected 2 tasks for parallel approval. Found ${expTasks.length}`);

  // Approve first task
  try {
    await pb.collection('approval_tasks').update(expTasks[0].id, { status: 'approved' });
  } catch (err) {
    console.error("Task Update Failed:", err.data);
  }
  let subStatus1 = await pb.collection('intake_submissions').getOne(expSub.id);
  console.log(`After 1 approval, submission status is: ${subStatus1.status}`);

  // Approve second task
  await pb.collection('approval_tasks').update(expTasks[1].id, { status: 'approved' });
  let subStatus2 = await pb.collection('intake_submissions').getOne(expSub.id);
  console.log(`After 2 approvals, submission status is: ${subStatus2.status}`);
  if (subStatus2.status === 'approved') {
    console.log("Test 5.2 Passed.");
  }

  // ==========================================
  // Test 5.3: Rejection Flow
  // ==========================================
  console.log("\n--- Running Test 5.3: Rejection Flow ---");
  const rejSub = await pb.collection('intake_submissions').create({
    formId: newTemplate.id,
    submittedById: employee.id,
    details: {},
    status: 'pending',
    currentStep: 0,
    formattedId: "RWR-REJ-" + Date.now()
  });
  
  let rejTasks = await pb.collection('approval_tasks').getFullList({ filter: `submissionId="${rejSub.id}"` });
  await pb.collection('approval_tasks').update(rejTasks[0].id, { status: 'rejected', comment: "Not enough budget" });
  
  let rejSubFinal = await pb.collection('intake_submissions').getOne(rejSub.id);
  console.log(`After rejection, submission status is: ${rejSubFinal.status}, Note: ${rejSubFinal.decisionNote}`);
  
  if (rejSubFinal.status === 'rejected') {
    console.log("Test 5.3 Passed.");
  }
}

runTests().catch(console.error);
