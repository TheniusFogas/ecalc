
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
    const uri = 'mongodb://localhost:27017/ecalc_ro';
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ecalc_ro');
        const adminUsers = db.collection('adminUsers');
        const admins = await adminUsers.find({}).toArray();
        console.log('Admins in DB:', admins.map(a => a.email));

        const testEmail = 'admin@ecalc.ro';
        const testPass = 'Admin2026!';
        const admin = await adminUsers.findOne({ email: testEmail });

        if (admin) {
            const isValid = await bcrypt.compare(testPass, admin.password);
            console.log(`Test login for ${testEmail}: ${isValid ? 'SUCCESS' : 'FAILURE (bcrypt mismatch)'}`);
        } else {
            console.log(`User ${testEmail} NOT FOUND in DB.`);
        }
    } catch (e) {
        console.error('Failed to connect or query:', e.message);
    } finally {
        await client.close();
    }
}

checkAdmin();
