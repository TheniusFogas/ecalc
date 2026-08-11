import Link from 'next/link';
import { Info, ArrowLeft, Mail, BookOpen, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// FIX (audit 2026-08-11): no "About" page existed anywhere on the site — zero E-E-A-T signal
// (who maintains this, what sources it uses, how current the numbers are), which both Google
// and AI answer engines weigh when deciding whether to trust/cite a source. This page is
// honest about what's verifiable (methodology, data sources, update cadence) and deliberately
// does NOT invent a company name, CUI, or address — none exist anywhere else in this codebase,
// and fabricating one would repeat exactly the "fake trust signal" mistake fixed elsewhere in
// this pass (the removed fake aggregateRating). Add real legal-entity details here once you
// have them to publish.
export const metadata = {
  title: 'Despre eCalc.ro',
  description: 'Cine întreține eCalc.ro, ce surse folosim pentru regulile fiscale și cât de des actualizăm calculatoarele.',
  alternates: { canonical: '/despre' },
};

export default function DesprePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Înapoi la Acasă
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-3xl">Despre eCalc.ro</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <p>
                eCalc.ro este un set de calculatoare fiscale pentru România — salarii (brut/net/cost angajator),
                PFA vs. SRL, impozit auto, e-Factura, rentabilitate imobiliară, compensații pentru zboruri
                întârziate/anulate, concediu medical și zile lucrătoare/libere. Scopul e simplu: să introduci o
                sumă și să vezi imediat, transparent, din ce se compune rezultatul — nu doar cifra finală.
              </p>

              <h2 className="flex items-center gap-2 not-prose text-xl font-semibold mt-8 mb-3">
                <BookOpen className="h-5 w-5 text-blue-600" /> Ce surse folosim
              </h2>
              <p>
                Formulele de calcul se bazează pe Codul Fiscal al României (contribuții CAS/CASS, impozit pe
                venit, CAM) și pe regulamentele relevante pentru fiecare calculator specific (ex. Regulamentul
                UE 261/2004 pentru compensații de zbor, OUG 158/2005 pentru concediul medical). Valorile
                fiscale (salariul minim, praguri, deduceri) sunt configurate central și actualizate pe măsură
                ce legislația se schimbă.
              </p>

              <h2 className="flex items-center gap-2 not-prose text-xl font-semibold mt-8 mb-3">
                <RefreshCw className="h-5 w-5 text-blue-600" /> Cât de des actualizăm
              </h2>
              <p>
                Regulile fiscale sunt revizuite la fiecare schimbare legislativă majoră (de obicei început de an
                fiscal, dar și în cursul anului dacă apar ordonanțe noi). Dacă observi o valoare care nu mai
                corespunde legislației curente, scrie-ne — corectăm rapid.
              </p>

              <h2 className="flex items-center gap-2 not-prose text-xl font-semibold mt-8 mb-3">
                <ShieldCheck className="h-5 w-5 text-blue-600" /> Ce NU suntem
              </h2>
              <p>
                Nu suntem o firmă de contabilitate sau consultanță fiscală autorizată, iar rezultatele
                calculatoarelor sunt <strong>orientative</strong>. Pentru decizii cu impact financiar sau legal
                important (contract de muncă, înființare PFA/SRL, declarații fiscale), verifică întotdeauna cu
                un contabil sau consultant fiscal autorizat — vezi și{' '}
                <Link href="/termeni-conditii" className="text-blue-700 underline">Termenii și Condițiile</Link>.
              </p>

              <h2 className="flex items-center gap-2 not-prose text-xl font-semibold mt-8 mb-3">
                <Mail className="h-5 w-5 text-blue-600" /> Contact
              </h2>
              <p>
                Întrebări, corecturi sau sesizări legate de o valoare fiscală: <strong>contact@ecalc.ro</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
