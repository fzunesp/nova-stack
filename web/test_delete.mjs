import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');
  const forms = await pb.collection('form_definitions').getFullList({filter: 'name = "Test Form"'});
  for (const f of forms) {
    await pb.collection('form_definitions').delete(f.id);
    console.log('Deleted test form', f.id);
  }
}

test().catch(console.error);
