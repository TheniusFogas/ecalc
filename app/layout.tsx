import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Metadata } from 'next';
import ChatFloat from '@/components/ChatFloat';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const currentYear = new Date().getFullYear();

export const metadata: Metadata = {
    metadataBase: new URL('https://ecalc.ro'),
    alternates: {
        canonical: '/',
    },
    title: {
        default: `Calculator Salarii ${currentYear} PRO - Brut la Net & PFA vs SRL | eCalc.ro`,
        template: `%s | eCalc.ro`
    },
    description: `Sistem profesional de calcul fiscal ${currentYear}. Calculator Salarii Brut/Net, PFA, e-Factura, Impozit Auto și Rentabilitate Imobiliară. Actualizat la zi conform legislației din România.`,
    keywords: `calculator salariu ${currentYear}, brut net ${currentYear}, calculator pfa ${currentYear}, pfa vs srl, impozit auto ${currentYear}, e-factura romania, prognoza meteo, vremea azi, starea vremii romania, vremea la munte, vremea la mare, vremea litoral, vremea munte, vremea ski`,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ro">
            <body className={inter.className}>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'SoftwareApplication',
                            name: 'eCalc RO',
                            applicationCategory: 'FinanceApplication',
                            offers: {
                                '@type': 'Offer',
                                price: '0',
                                priceCurrency: 'RON',
                            },
                            // aggregateRating REMOVED (audit 2026-08-11): the 4.8/1250 values were
                            // fabricated — no review system exists anywhere in the codebase. Fake
                            // review/rating markup is a Google structured-data spam violation and
                            // was already showing up in live search results. Re-add only once a
                            // real review collection mechanism exists, sourced from actual data.
                        }),
                    }}
                />
                {children}
                <Toaster />
                {/* FIX (audit 2026-08-11): built, tested, never mounted anywhere — quick win. */}
                <ChatFloat />
            </body>
        </html>
    );
}
