import PocketBase from 'pocketbase';
import fetch from 'node-fetch';

// Mock global fetch for Node.js if needed (PocketBase SDK uses it)
if (!global.fetch) {
  global.fetch = fetch;
}

const pb = new PocketBase('http://localhost:8090');

async function run() {
  try {
    console.log('--- PocketBase API Debug ---');
    
    // 1. Authenticate as admin
    const authData = await pb.collection('_superusers').authWithPassword('admin@novastack.local', 'novastack123');
    console.log('Authenticated as:', authData.record.email);

    // 2. Try to create a contact with custom fields
    const testData = {
      name: 'API Debug Contact ' + Date.now(),
      email: 'api-debug@example.com',
      customFields: {
        vip_status: 'Debug Platinum'
      }
    };

    console.log('Attempting to create contact with:', JSON.stringify(testData, null, 2));
    
    try {
      const record = await pb.collection('contacts').create(testData);
      console.log('Successfully created record:', record.id);
      console.log('Record customFields:', JSON.stringify(record.customFields, null, 2));
      
      // 3. Verify retrieval
      const fetched = await pb.collection('contacts').getOne(record.id);
      console.log('Fetched record customFields:', JSON.stringify(fetched.customFields, null, 2));
      
    } catch (err) {
      console.error('API Error during create:');
      console.error('Message:', err.message);
      console.error('Data:', JSON.stringify(err.data, null, 2));
      console.error('Response Status:', err.status);
    }

  } catch (err) {
    console.error('General Error:', err);
  }
}

run();
