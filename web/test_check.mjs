import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

async function test() {
  await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');
  const tasks = await pb.collection('approval_tasks').getFullList({sort: '-created'});
  console.log(tasks.slice(0, 5).map(x => ({id: x.id, sub: x.submissionId, status: x.status})));
}

test().catch(console.error);
