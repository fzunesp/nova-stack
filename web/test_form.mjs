import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');
  const form = await pb.collection('form_definitions').getOne('pc7y4s4qk51y5ia');
  console.log(JSON.stringify(form.workflowSteps, null, 2));
}

test().catch(console.error);
