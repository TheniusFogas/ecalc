import { Suspense } from 'react';
import { SalaryCalculatorContent } from '../page';

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
    const { amount, type, sector } = parseSlug(decodedSlug);

    const currency = 'RON';
    const sectorName = getSectorName(sector);
    const typeLabel = type === 'net-brut' ? 'Net' : 'Brut';

    let title = `Calcul Salariu ${amount || 'Minim'} ${currency} ${typeLabel} ${sectorName ? `(${sectorName})` : ''} - ${year} | eCalc`;
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

export default function SalarySlugPage({ params }) {
    const { year, slug } = params;
    const decodedSlug = decodeURIComponent(slug);
    const { amount, type, sector } = parseSlug(decodedSlug);

    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Se încarcă calculatorul...</div>}>
            <SalaryCalculatorContent
                initialTab="calculator"
                initialValue={amount}
                initialSector={sector}
                initialType={type}
            />
        </Suspense>
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
