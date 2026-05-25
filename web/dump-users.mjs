const pb = new (await import('pocketbase')).default('http://127.0.0.1:8090');

try {
    await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');
    const users = await pb.collection('users').getFullList({
        fields: 'id,email,role,isActive'
    });
    console.log(JSON.stringify(users, null, 2));
} catch (err) {
    console.error('Error:', err.message);
}
