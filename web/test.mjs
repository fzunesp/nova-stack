import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');
  const res = await pb.collection('form_definitions').create({
    name: 'Test Form',
    key: 'test_form',
    prefix: 'TST',
    isParallel: false,
    fields: [{id: 't1', type: 'text', label: 'Test Label'}],
    workflowSteps: []
  });
  console.log('Created:', res.fields, typeof res.fields, Array.isArray(res.fields));
}

test().catch(console.error);
