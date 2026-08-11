
import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/admin-auth';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'ecalc_ro';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    if (!uri) {
        throw new Error('Please add your Mongo URI to .env');
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

// FIX (audit 2026-08-11): OUG 156/2024 eliminated the income-tax exemption and the reduced
// CAS rate for the IT / construction / agriculture sectors, effective with income from January
// 2025 — those sectors now pay the same CAS/CASS/income tax as a standard employee. The 2026
// seed below still had the OLD (pre-2025) facilities hardcoded as active, and several keys the
// engine reads (lib/salary-engine.js) were missing entirely, silently resolving to 0. Values
// below reflect current law as best understood at the time of this fix — verify against the
// Codul Fiscal / an accountant before treating this as a substitute for professional advice,
// same disclaimer the site already shows its users.
const SALARY_FIELD_DEFAULTS_2026 = {
    minimum_salary: 4050,
    average_salary: 7500,
    cas_rate: 25,
    cass_rate: 10,
    income_tax_rate: 10,
    cam_rate: 2.25,
    untaxed_amount_enabled: true,
    untaxed_amount: 300,
    meal_voucher_max: 40,
    personal_deduction_base: 810,
    personal_deduction_range: 2000,
    personal_deduction_percent: 20,
    child_deduction: 100, // 100 RON/copil, fix — nu procentual (vezi nota din admin UI)
    dependent_deduction: 100,
    // IT / Construcții / Agricultură: facilitățile fiscale au fost eliminate din ian. 2025
    // (OUG 156/2024) — sectoarele plătesc acum aceleași CAS/CASS/impozit ca regimul standard.
    it_tax_exempt: false,
    it_threshold: 10000,
    it_pilon2_optional: false,
    pilon2_rate: 0,
    construction_cas_rate: 25,
    construction_tax_exempt: false,
    construction_cass_exempt: false,
    agriculture_cas_rate: 25,
    agriculture_tax_exempt: false,
    tax_exemption_threshold: 0,
    // Fără facilitate de sector activă, minimul pe sector e minimul național.
    minimum_gross_construction: 4050,
    minimum_gross_agriculture: 4050,
    minimum_gross_it: 4050,
    youth_exemption_threshold: 0,
    youth_deduction_rate: 0,
    part_time_overtax_enabled: false,
};

const PFA_FIELD_DEFAULTS_2026 = {
    minimum_salary: 4050,
    cas_rate: 25,
    cass_rate: 10,
    income_tax_rate: 10,
    cass_min_threshold: 6,
    cass_max_threshold: 60,
    cas_min_optional: 12,
    cas_obligatory_12: 12,
    cas_obligatory_24: 24,
    norm_limit_eur: 25000,
    vat_threshold_eur: 88500,
    dividend_tax_rate: 10, // 10% din ianuarie 2025 (fost 8%)
};

// Initialize fiscal rules for multi-year architecture
async function initializeFiscalRules(db) {
    const fiscalRules = db.collection('fiscal_rules');
    const existing2026 = await fiscalRules.findOne({ year: 2026 });
    if (!existing2026) {
        await fiscalRules.insertOne({
            year: 2026,
            effectiveDate: '2026-01-01',
            salary: { ...SALARY_FIELD_DEFAULTS_2026 },
            pfa: { ...PFA_FIELD_DEFAULTS_2026 },
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    await backfillMissingFiscalFields(db);
}

// FIX (audit 2026-08-11): the old seed only ever ran ONCE per year ("if not exists") — any
// field added to the engine's logic after a year's document already existed in production
// never made it into that document, and getRule() silently returned 0/false for it. This
// backfill runs on every request (cheap — the fiscal_rules collection has one document per
// year) and fills in ONLY fields that are genuinely absent. It never overwrites a value an
// admin already configured, even one that looks wrong — that's a deliberate choice, not an
// oversight.
async function backfillMissingFiscalFields(db) {
    const fiscalRules = db.collection('fiscal_rules');
    const docs = await fiscalRules.find({}).toArray();
    for (const doc of docs) {
        const patch = {};
        const salary = doc.salary || {};
        for (const [key, value] of Object.entries(SALARY_FIELD_DEFAULTS_2026)) {
            if (salary[key] === undefined) patch[`salary.${key}`] = value;
        }
        const pfa = doc.pfa || {};
        for (const [key, value] of Object.entries(PFA_FIELD_DEFAULTS_2026)) {
            if (pfa[key] === undefined) patch[`pfa.${key}`] = value;
        }
        if (Object.keys(patch).length > 0) {
            await fiscalRules.updateOne({ _id: doc._id }, { $set: patch });
        }
    }
}

async function initializeSettings(db) {
    const settings = db.collection('settings');
    const existingSettings = await settings.findOne({ key: 'initialized' });
    if (!existingSettings) {
        await settings.insertMany([
            { key: 'initialized', value: true },
            { key: 'ad_header', value: '<div><!-- Ad Header --></div>' },
        ]);
    }
}

// GET /api/fiscal-rules/:year
async function handleFiscalRulesGet(year, db, request) {
    const requestedYear = parseInt(year);
    const rules = await db.collection('fiscal_rules')
        .find({ year: requestedYear })
        .sort({ effectiveDate: -1 })
        .toArray();

    const url = new URL(request.url);
    const showHistory = url.searchParams.get('history') === '1';

    if (rules.length > 0) {
        return NextResponse.json(showHistory ? rules : rules[0]);
    }

    return NextResponse.json({
        year: requestedYear,
        effectiveDate: `${requestedYear}-01-01`,
        salary: { minimum_salary: 0, cas_rate: 0, cass_rate: 0, income_tax_rate: 0 }
    });
}

// PUT /api/fiscal-rules/:year
async function handleFiscalRulesPut(year, request, db) {
    try {
        const body = await request.json();
        const requestedYear = parseInt(year);
        const { _id, ...updateData } = body;

        await db.collection('fiscal_rules').updateOne(
            { year: requestedYear, effectiveDate: updateData.effectiveDate || `${year}-01-01` },
            {
                $set: {
                    ...updateData,
                    year: requestedYear,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: 'Reguli fiscale actualizate' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/fiscal-rules (all years)
async function handleFiscalRulesGetAll(db) {
    const rules = await db.collection('fiscal_rules').find({}).sort({ year: -1 }).toArray();
    return NextResponse.json(rules);
}

// POST /api/leads
async function handleLeadPost(body, db) {
    const lead = { ...body, id: uuidv4(), createdAt: new Date() };
    await db.collection('leads').insertOne(lead);
    return NextResponse.json({ success: true, message: 'Lead salvat cu succes' });
}

// GET /api/leads
async function handleLeadsGet(db) {
    const leads = await db.collection('leads').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(leads);
}

// GET /api/leads/export
async function handleLeadsExport(db) {
    const leads = await db.collection('leads').find({}).sort({ createdAt: -1 }).toArray();
    let csv = 'ID,Nume,Email,Telefon,Calculator,Data Creării\n';
    leads.forEach(lead => {
        csv += `${lead.id},"${lead.name}","${lead.email}","${lead.phone}","${lead.calculatorType}","${lead.createdAt}"\n`;
    });
    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=leads.csv',
        },
    });
}

// Auth for /api/auth/login, /api/auth/session, /api/auth/logout now lives exclusively in
// app/api/auth/login|session|logout/route.js + lib/admin-auth.js (single source of truth —
// this file used to have its own duplicate login handler with a hardcoded password bypass
// ("Admin2026!" always worked). Removed as part of the 2026-08-11 security fix.

// Guards every admin-only endpoint below (PUT fiscal-rules/settings/holidays, GET leads).
// Returns the session if valid, or null — callers must check and return 401 themselves.
async function requireSession(request, db) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    return validateSession(db, token);
}

// GET /api/holidays/:year
async function handleHolidaysGet(db, year) {
    const requestedYear = parseInt(year);
    const data = await db.collection('holidays').findOne({ year: requestedYear });

    if (data) {
        return NextResponse.json(data);
    }

    return NextResponse.json({
        year: requestedYear,
        holidays: [],
        weather: {},
        message: 'No holidays found in database'
    });
}

// PUT /api/holidays/:year
async function handleHolidaysPut(request, db, year) {
    try {
        const body = await request.json();
        const requestedYear = parseInt(year);

        await db.collection('holidays').updateOne(
            { year: requestedYear },
            {
                $set: {
                    ...body,
                    year: requestedYear,
                    lastUpdated: new Date()
                }
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: 'Holidays updated' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET /api/settings
async function handleSettingsGet(db) {
    const settingsArray = await db.collection('settings').find({}).toArray();
    const settings = {};
    settingsArray.forEach(s => {
        settings[s.key] = s.value;
    });
    return NextResponse.json(settings);
}

// PUT /api/settings
async function handleSettingsPut(request, db) {
    try {
        const body = await request.json();
        const settingsCollection = db.collection('settings');
        for (const [key, value] of Object.entries(body)) {
            await settingsCollection.updateOne(
                { key },
                { $set: { key, value } },
                { upsert: true }
            );
        }
        return NextResponse.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Main handler
export async function GET(request, { params }) {
    try {
        const { db } = await connectToDatabase();
        await initializeFiscalRules(db);
        await initializeSettings(db);

        const slug = params?.slug?.join('/') || '';

        if (slug.startsWith('fiscal-rules/')) {
            const year = slug.split('/')[1];
            if (year === 'all' || !year) {
                return handleFiscalRulesGetAll(db);
            }
            return handleFiscalRulesGet(year, db, request);
        } else if (slug === 'fiscal-rules') {
            return handleFiscalRulesGetAll(db);
        } else if (slug.startsWith('holidays/')) {
            const year = slug.split('/')[1];
            return handleHolidaysGet(db, year);
        } else if (slug === 'settings') {
            return handleSettingsGet(db);
        } else if (slug === 'leads' || slug === 'leads/export') {
            // Leads contain visitor PII (name, email, phone) — admin session required.
            const session = await requireSession(request, db);
            if (!session) {
                return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
            }
            return slug === 'leads' ? handleLeadsGet(db) : handleLeadsExport(db);
        }

        return NextResponse.json({
            message: 'eCalc RO API - Professional Edition',
            version: '2.0',
            endpoints: ['/api/fiscal-rules/:year', '/api/holidays/:year', '/api/leads', '/api/settings', '/api/auth/login']
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const slug = params?.slug?.join('/') || '';
    let body = {};
    try {
        body = await request.json();
    } catch (err) { }

    try {
        const { db } = await connectToDatabase();

        if (slug === 'leads') {
            // Public on purpose — this is the visitor-facing lead capture form.
            return handleLeadPost(body, db);
        }
        // Auth (/api/auth/login, /session, /logout) is handled by its own literal routes now.

        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { db } = await connectToDatabase();
        const slug = params?.slug?.join('/') || '';

        // Every PUT below mutates fiscal rules, holidays or settings for ALL visitors —
        // admin session required for all of them.
        const isAdminWrite = slug.startsWith('fiscal-rules/') || slug.startsWith('holidays/') || slug === 'settings';
        if (isAdminWrite) {
            const session = await requireSession(request, db);
            if (!session) {
                return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
            }
        }

        if (slug.startsWith('fiscal-rules/')) {
            const year = slug.split('/')[1];
            return handleFiscalRulesPut(year, request, db);
        } else if (slug.startsWith('holidays/')) {
            const year = slug.split('/')[1];
            return handleHolidaysPut(request, db, year);
        } else if (slug === 'settings') {
            return handleSettingsPut(request, db);
        }

        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
