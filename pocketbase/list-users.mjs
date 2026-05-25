const pb = new (await import('pocketbase')).default('http://127.0.0.1:8090');

try {
    // Authenticate as admin to see all users
    await pb.admins.authWithPassword('admin@novastack.local', 'novastack123');
    const users = await pb.collection('users').getFullList();
    console.log(JSON.stringify(users, null, 2));
} catch (err) {
    console.error(err.message);
}
