
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ecalc_ro';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    const client = await MongoClient.connect(uri, {
        maxPoolSize: 5,
    });
    const db = client.db(dbName);
    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

// POST /api/auth/login
async function handleLogin(request, db) {
    try {
        const body = await request.json();
        const { email, password } = body;

        const adminUsers = db.collection('adminUsers');
        const admin = await adminUsers.findOne({ email });

        if (!admin) {
            return NextResponse.json({ error: 'Credențiale invalide' }, { status: 401 });
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Credențiale invalide' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            token: 'admin-token-' + uuidv4(),
            email: admin.email
        });
    } catch (error) {
        console.error('Error logging in:', error);
        return NextResponse.json({ error: 'Eroare la autentificare' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { db } = await connectToDatabase();
        // In Next.js app router, if this file is app/api/auth/route.js, 
        // POST to /api/auth will hit this. 
        // If the folder structure is app/api/auth/login/route.js, it's better.
        // Given the previous code handled 'auth/login' path, it suggests 
        // it might be expected to handle subpaths if it was a catch-all.
        // However, we'll keep it simple: if it's in api/auth/route.js, 
        // we'll check if the URL ends in /login.

        if (request.url.endsWith('/login')) {
            return handleLogin(request, db);
        }

        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
