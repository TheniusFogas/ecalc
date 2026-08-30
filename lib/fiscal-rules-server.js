/**
 * Server-only fiscal rules fetch — used by Server Components that need to render REAL
 * computed numbers into the initial HTML response.
 *
 * WHY THIS EXISTS (audit 2026-08-11): the salary calculator pages were 'use client' and fetched
 * fiscal rules in a useEffect, so the HTML sent on the first request contained nothing but a
 * loading spinner — confirmed empirically on production (curl showed "Se încarcă regulile
 * fiscale..." and nothing else). Neither Googlebot's first crawl pass nor any AI crawler (most
 * don't run JavaScript at all) ever saw an actual number. This helper lets a plain Server
 * Component fetch the same `fiscal_rules` data directly and compute a real result server-side,
 * additively — it does NOT touch the existing interactive client calculator or its API route.
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ecalc_ro';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  if (!uri) return { client: null, db: null };
  try {
    const client = await MongoClient.connect(uri, { maxPoolSize: 5 });
    const db = client.db(dbName);
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (error) {
    console.error('[fiscal-rules-server] Conexiune eșuată la MongoDB:', error.message);
    return { client: null, db: null };
  }
}

// Returns the fiscal_rules document for a year, or null if unavailable (DB down, year not
// configured, etc). Callers MUST handle null gracefully — never throw a page 500 over this,
// it's an enhancement, not a hard dependency for rendering the page.
export async function getFiscalRulesServer(year) {
  try {
    const { db } = await connectToDatabase();
    if (!db) return null;
    const requestedYear = parseInt(year, 10);
    if (Number.isNaN(requestedYear)) return null;
    const rules = await db
      .collection('fiscal_rules')
      .find({ year: requestedYear })
      .sort({ effectiveDate: -1 })
      .limit(1)
      .toArray();
    return rules[0] || null;
  } catch (error) {
    console.error('[fiscal-rules-server] Nu am putut încărca regulile fiscale:', error.message);
    return null;
  }
}
