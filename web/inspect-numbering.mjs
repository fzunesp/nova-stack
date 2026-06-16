import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function main() {
  try {
    const authData = await pb.collection('users').authWithPassword('admin@nova-stack.local', 'password123');
    console.log('Authenticated as:', authData.record.email);
    
    const list = await pb.collection('app_settings').getFullList();
    const numbering = list.find(r => r.category === 'numbering');
    if (!numbering) {
      console.log('NO NUMBERING RECORD FOUND');
      return;
    }
    console.log('Numbering config (raw type):', typeof numbering.config);
    console.log('Numbering config:', JSON.stringify(numbering.config, null, 2));
    
    // Check each entity
    const entities = ['companies', 'contacts', 'deals', 'tasks', 'invoices', 'products', 'intakes', 'employees'];
    console.log('\n=== Per-entity enabled status ===');
    const config = numbering.config;
    for (const key of entities) {
      const entityConfig = config[key];
      console.log(`${key}: enabled=${entityConfig?.enabled}, raw=`, JSON.stringify(entityConfig));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
