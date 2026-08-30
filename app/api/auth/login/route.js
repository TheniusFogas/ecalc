
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { ensureAdminSeed, verifyCredentials, createSession, setSessionCookie } from '@/lib/admin-auth';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ecalc_ro';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = await MongoClient.connect(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
  });
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// POST /api/auth/login
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    await ensureAdminSeed(db);

    const body = await request.json();
    const { email, password } = body;

    const admin = await verifyCredentials(db, email, password);
    if (!admin) {
      return NextResponse.json({ error: 'Credențiale invalide' }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(db, admin.email);
    const res = NextResponse.json({ success: true, email: admin.email });
    return setSessionCookie(res, token, expiresAt);
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Eroare la autentificare' }, { status: 500 });
  }
}
