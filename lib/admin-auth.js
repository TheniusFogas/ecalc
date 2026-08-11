/**
 * Admin session helpers — single source of truth for admin authentication.
 * Used by app/api/auth/login/route.js and app/api/[[...slug]]/route.js.
 *
 * SECURITY FIX (audit 2026-08-11):
 * - Removed the hardcoded password bypass ("Admin2026!" always worked, regardless of the real password).
 * - Removed the bug that reset the admin password to the env default on every single login attempt
 *   (meant anyone could force the password back to a known value just by POSTing to /api/auth/login).
 * - Sessions are now real: a random token stored server-side in MongoDB, handed to the browser only as
 *   an httpOnly cookie (never readable by JS, never stored in localStorage). Every mutating/sensitive
 *   admin API call must present a valid, non-expired session or gets a 401.
 */

import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const SESSION_COOKIE_NAME = 'ecalc_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// Seed the admin account ONLY if none exists yet. Never overwrites an existing password —
// that was the bug that let anyone reset the account to a predictable default.
export async function ensureAdminSeed(db) {
  const adminUsers = db.collection('adminUsers');
  const count = await adminUsers.countDocuments();
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@ecalc.ro';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // Refuse to invent a guessable default. Set ADMIN_EMAIL / ADMIN_PASSWORD in the environment
    // before the first login — this is intentional, not a bug.
    console.error('[admin-auth] Niciun cont admin nu există și ADMIN_PASSWORD nu e setat în mediu. Setează ADMIN_EMAIL/ADMIN_PASSWORD și încearcă din nou.');
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await adminUsers.insertOne({ email, password: hashedPassword, createdAt: new Date() });
}

export async function verifyCredentials(db, email, password) {
  if (!email || !password) return null;
  const admin = await db.collection('adminUsers').findOne({ email });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.password);
  return ok ? admin : null;
}

export async function createSession(db, email) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.collection('sessions').insertOne({ token, email, createdAt: new Date(), expiresAt });
  return { token, expiresAt };
}

export async function validateSession(db, token) {
  if (!token) return null;
  const session = await db.collection('sessions').findOne({ token });
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await db.collection('sessions').deleteOne({ token });
    return null;
  }
  return session;
}

export async function destroySession(db, token) {
  if (!token) return;
  await db.collection('sessions').deleteOne({ token });
}

export function setSessionCookie(response, token, expiresAt) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return response;
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return response;
}
