
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { destroySession, clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/admin-auth';

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

// POST /api/auth/logout
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    await destroySession(db, token);
    return clearSessionCookie(NextResponse.json({ success: true }));
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Eroare la deconectare' }, { status: 500 });
  }
}
