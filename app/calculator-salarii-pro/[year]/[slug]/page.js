import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SalaryCalculatorContent } from '../page';
import { calculateSalaryResults, getSectorMinimums } from '@/lib/salary-engine';
import { getFiscalRulesServer } from '@/lib/fiscal-rules-server';

// FIX (audit 2026-08-11): parseSlug() below accepted ANY string — a random slug like
// "asdkjaskjd123123" fell through to amount='' and rendered as a normal 200 page with the
// SAME content as "minim-standard", canonical'd to its own garbage URL. That's an unbounded,
// self-inflicted space of duplicate-content pages (confirmed live: Google was choosing its
// own canonical for some of these instead of trusting ours). This whitelist only accepts the
// slug shapes this page actually knows how to render distinctly; everything else is a real
// 404 now instead of a fake 200.
const VALID_SLUG = /^(\d{1,7}(-[a-z]+){1,4}|minim(-[a-z]+)?)$/;

/**
 * Dynamic SEO route for Salary Calculator variations.
 * Parses slugs like: 
 * - /2026/3000-it-brut-calcul-salariu-net
 * - /2026/minim-constructii
 * - /2026/5000-ron-net-standard
 */
export async function generateMetadata({ params }) {
    const { year, slug } = params;
    const decodedSlug = decodeURIComponent(slug);
    if (!VALID_SLUG.test(decodedSlug.toLowerCase())) {
        return { title: 'Pagină negăsită | eCalc' };
    }
    const { amount, type, sector } = parseSlug(decodedSlug);

    const currency = 'RON';
    const sectorName = getSectorName(sector);
    const typeLabel = type === 'net-brut' ? 'Net' : 'Brut';
    const sectorSuffix = sectorName ? ` (${sectorName})` : '';

    let title = `Calcul Salariu ${amount || 'Minim'} ${currency} ${typeLabel}${sectorSuffix} - ${year} | eCalc`;
    let description = `Calculează salariul complet pentru ${amount || 'suma minimă'} ${currency} ${typeLabel.toLowerCase()} în ${sectorName || 'România'} pentru anul ${year}. Vezi fluturașul de salariu, taxele și contribuțiile sociale.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
        },
        alternates: {
            canonical: `/calculator-salarii-pro/${year}/${slug}`,
        }
    };
}

// FIX (audit 2026-08-11): the page below used to render NOTHING but the interactive client
// calculator — confirmed live that the first HTML response was just a loading spinner, with
// zero numbers, for every single one of these SEO pages. This is a Server Component (no
// 'use client'), so the block below runs on the server and its output — the actual computed
// salary breakdown — is present in the very first byte of HTML, visible to Googlebot's first
// pass and to AI crawlers that never run JavaScript at all. The interactive calculator
// underneath is untouched and still works exactly as before for real visitors.
export default async function SalarySlugPage({ params }) {
    const { year, slug } = params;
    const decodedSlug = decodeURIComponent(slug);
    if (!VALID_SLUG.test(decodedSlug.toLowerCase())) {
        notFound();
    }
    const { amount, type, sector } = parseSlug(decodedSlug);

    return (
        <>
            <ServerComputedSummary year={year} amount={amount} type={type} sector={sector} />
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Se încarcă calculatorul...</div>}>
                <SalaryCalculatorContent
                    initialTab="calculator"
                    initialValue={amount}
                    initialSector={sector}
                    initialType={type}
                />
            </Suspense>
        </>
    );
}

async function ServerComputedSummary({ year, amount, type, sector }) {
    const rulesDoc = await getFiscalRulesServer(year);
    const sectorName = getSectorName(sector);
    const typeLabel = type === 'net-brut' ? 'Net' : type === 'cost-net' ? 'Cost total angajator' : 'Brut';

    // Fiscal rules unavailable (DB unreachable, year not configured) — render a plain
    // explanation instead of a broken/empty page. Still real, readable text, just no numbers.
    if (!rulesDoc) {
        return (
            <section className="max-w-3xl mx-auto px-4 pt-10 pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                    Calcul Salariu {amount === 'minim' ? 'Minim' : `${amount} RON`} {typeLabel}{sectorName ? ` — ${sectorName}` : ''} ({year})
                </h1>
                <p className="text-slate-600">
                    Calculatorul de mai jos îți arată salariul net, contribuțiile CAS și CASS și impozitul pe venit
                    pentru {year}, conform legislației fiscale românești în vigoare.
                </p>
            </section>
        );
    }

    let inputValue = amount;
    let calcType = type;
    if (amount === 'minim') {
        const { brut } = getSectorMinimums(sector, rulesDoc);
        inputValue = brut;
        calcType = 'brut-net';
    }

    const result = calculateSalaryResults(inputValue, calcType, sector, rulesDoc, { isBasicFunction: true });
    if (!result) {
        return (
            <section className="max-w-3xl mx-auto px-4 pt-10 pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                    Calcul Salariu {typeLabel}{sectorName ? ` — ${sectorName}` : ''} ({year})
                </h1>
            </section>
        );
    }

    const ron = (n) => `${Math.round(n).toLocaleString('ro-RO')} RON`;

    // FIX (audit 2026-08-12): same gap as the interactive calculator — a gross below the legal
    // minimum wage isn't a valid full-time salary. Several curated SEO amounts (POPULAR_SALARY_
    // AMOUNTS) are intentionally below the current minimum for informational purposes, so this
    // doesn't hide the numbers (removing them would mean fewer indexable pages, which the
    // product direction here is deliberately NOT doing) — it labels them honestly instead.
    const sectorMinWageKey = sector === 'construction' ? 'minimum_gross_construction'
        : sector === 'agriculture' ? 'minimum_gross_agriculture'
        : sector === 'it' ? 'minimum_gross_it'
        : 'minimum_salary';
    const sectorMinWage = rulesDoc?.salary?.[sectorMinWageKey] || rulesDoc?.salary?.minimum_salary || 0;
    const isBelowMinimum = sectorMinWage > 0 && result.gross > 0 && result.gross < sectorMinWage;

    // FAQPage structured data — real numbers, real questions people actually search for.
    // This is what AI answer engines and Google's rich results extract directly, without
    // needing to run any JavaScript.
    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: `Cât este salariul net pentru ${ron(result.gross)} brut în ${year}?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Pentru un salariu brut de ${ron(result.gross)}${sectorName ? ` în sectorul ${sectorName.toLowerCase()}` : ''} în ${year}, salariul net este ${ron(result.net)}, după reținerea CAS (${ron(result.cas)}), CASS (${ron(result.cass)}) și impozit pe venit (${ron(result.incomeTax)}).`,
                },
            },
            {
                '@type': 'Question',
                name: `Cât costă un angajat cu salariul brut de ${ron(result.gross)} pentru angajator în ${year}?`,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Costul total pentru angajator este ${ron(result.totalCost)}, format din salariul brut de ${ron(result.gross)} plus contribuția CAM de ${ron(result.cam)}.`,
                },
            },
        ],
    };

    return (
        <section className="max-w-3xl mx-auto px-4 pt-10 pb-2">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Salariu {ron(result.gross)} Brut = {ron(result.net)} Net{sectorName ? ` (${sectorName})` : ''} — {year}
            </h1>
            <p className="text-slate-600 mb-5">
                Pentru un salariu brut de <strong>{ron(result.gross)}</strong>{sectorName ? ` în sectorul ${sectorName.toLowerCase()}` : ''} în {year},
                salariul net în mână este <strong>{ron(result.net)}</strong>, după reținerea contribuției CAS
                ({ron(result.cas)}), a contribuției CASS ({ron(result.cass)}) și a impozitului pe venit ({ron(result.incomeTax)}).
                Costul total pentru angajator, incluzând CAM ({ron(result.cam)}), este de <strong>{ron(result.totalCost)}</strong>.
            </p>
            {isBelowMinimum && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-5">
                    ⚠️ {ron(result.gross)} este sub salariul minim legal pe economie ({ron(sectorMinWage)}). Calculul de mai sus
                    e valabil pentru un contract <strong>part-time</strong> — un salariu full-time nu poate fi legal sub acest prag.
                </p>
            )}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    ['Salariu Brut', result.gross],
                    ['Salariu Net', result.net],
                    ['CAS (pensie)', result.cas],
                    ['CASS (sănătate)', result.cass],
                    ['Impozit venit', result.incomeTax],
                    ['CAM (angajator)', result.cam],
                    ['Cost total firmă', result.totalCost],
                    ['Deducere personală', result.personalDeduction],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="text-base font-semibold text-slate-900">{ron(value)}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

// --- Helpers ---

function parseSlug(slug) {
    const cleanSlug = slug.toLowerCase();

    // 1. Identify Sector (Default: standard)
    let sector = 'standard';
    if (cleanSlug.includes('it') || cleanSlug.includes('programator')) sector = 'it';
    else if (cleanSlug.includes('construct') || cleanSlug.includes('constructii')) sector = 'construction';
    else if (cleanSlug.includes('agri') || cleanSlug.includes('agricultura')) sector = 'agriculture';

    // 2. Identify Type (Default: brut-net i.e. Input is Gross)
    let type = 'brut-net';
    if (cleanSlug.includes('-net') && !cleanSlug.includes('-brut')) type = 'net-brut';
    else if (cleanSlug.includes('cost') || cleanSlug.includes('total')) type = 'cost-net';

    // 3. Identify Amount (supports [val]-ron- or just [val]-)
    // Match digits followed by optional "-ron" or just a dash
    const amountMatch = cleanSlug.match(/^(\d+)/);
    let amount = amountMatch ? amountMatch[1] : '';

    // Handle "minim" keyword if no amount.
    if (!amount && cleanSlug.includes('minim')) {
        amount = 'minim';
    }

    return { amount, type, sector };
}

function getSectorName(sectorCode) {
    switch (sectorCode) {
        case 'it': return 'IT';
        case 'construction': return 'Construcții';
        case 'agriculture': return 'Agricultură';
        default: return '';
    }
}
