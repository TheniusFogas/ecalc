
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/admin-auth';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ecalc_ro';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = await MongoClient.connect(uri, { maxPoolSize: 10, minPoolSize: 2 });
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// GET /api/auth/session — used by the admin dashboard on load to check for an existing session,
// instead of assuming the visitor is authenticated by default.
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await validateSession(db, token);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, email: session.email });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
