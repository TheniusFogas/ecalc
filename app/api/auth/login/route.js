
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
    maxPoolSize: 10,
    minPoolSize: 2,
  });
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

// Initialize admin users
async function initializeAdminUser(db) {
  const adminUsers = db.collection('adminUsers');
  const email = process.env.ADMIN_EMAIL || 'admin@ecalc.ro';
  const password = process.env.ADMIN_PASSWORD || 'Admin2026!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Use updateOne with upsert to ensure DB always matches .env
  await adminUsers.updateOne(
    { email },
    {
      $set: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

// POST /api/auth/login
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    await initializeAdminUser(db);

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
