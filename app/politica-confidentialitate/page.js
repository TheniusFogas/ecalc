'use client';

import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
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
                <Shield className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-3xl">Politica de Confidențialitate</CardTitle>
              </div>
              <p className="text-slate-600 mt-2">Ultima actualizare: Februarie 2026</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <h2>1. Introducere</h2>
              <p>
                eCalc.ro ("noi", "nostru") respectă confidențialitatea utilizatorilor săi și se angajează să protejeze
                datele cu caracter personal în conformitate cu Regulamentul General privind Protecția Datelor (GDPR)
                și legislația română aplicabilă.
              </p>

              <h2>2. Date Colectate</h2>
              <h3>2.1 Date Furnizate Direct</h3>
              <p>Colectăm următoarele date când utilizați calculatoarele noastre:</p>
              <ul>
                <li><strong>Date de calcul:</strong> Sume, procentaje, parametri introduși în calculatoare (stocate LOCAL în browser-ul dumneavoastră, NU pe serverele noastre)</li>
                <li><strong>Lead-uri:</strong> Dacă alegeți să vă înscrieți pentru consultanță:
                  <ul>
                    <li>Nume</li>
                    <li>Email</li>
                    <li>Telefon (opțional)</li>
                    <li>Tipul calculatorului folosit</li>
                  </ul>
                </li>
              </ul>

              <h3>2.2 Date Colectate Automat</h3>
              <ul>
                <li><strong>Date tehnice:</strong> Adresa IP, tip browser, sistem de operare</li>
                <li><strong>Cookie-uri:</strong> Pentru funcționarea site-ului și salvarea preferințelor</li>
                <li><strong>Analytics:</strong> Nu folosim în prezent niciun instrument de analytics (ex. Google Analytics) — dacă adăugăm unul pe viitor, această secțiune va fi actualizată</li>
              </ul>

              <h2>3. Scopul Prelucrării Datelor</h2>
              <p>Folosim datele dumneavoastră pentru:</p>
              <ul>
                <li>Furnizarea calculatoarelor fiscale (procesare locală în browser)</li>
                <li>Răspuns la solicitările de consultanță (lead-uri)</li>
                <li>Îmbunătățirea serviciilor noastre</li>
                <li>Respectarea obligațiilor legale</li>
              </ul>

              <h2>4. Partajarea Datelor</h2>
              <p><strong>NU vindem datele dumneavoastră terților.</strong></p>
              <p>Partajăm date doar cu:</p>
              <ul>
                <li><strong>Furnizori de servicii:</strong> MongoDB Atlas (hosting bază de date - UE)</li>
                <li><strong>Autorități:</strong> Când este cerut legal</li>
              </ul>

              <h2>5. Drepturile Dumneavoastră (GDPR)</h2>
              <p>Aveți dreptul la:</p>
              <ul>
                <li><strong>Acces:</strong> Să solicitați o copie a datelor dumneavoastră</li>
                <li><strong>Rectificare:</strong> Să corectați date incorecte</li>
                <li><strong>Ștergere:</strong> Să solicitați ștergerea datelor ("dreptul de a fi uitat")</li>
                <li><strong>Restricționare:</strong> Să limitați prelucrarea datelor</li>
                <li><strong>Portabilitate:</strong> Să primiți datele într-un format structurat</li>
                <li><strong>Opoziție:</strong> Să vă opuneți prelucrării</li>
                <li><strong>Plângere:</strong> Să depuneți plângere la ANSPDCP</li>
              </ul>

              <h2>6. Securitatea Datelor</h2>
              <p>Implementăm măsuri tehnice și organizatorice pentru protejarea datelor:</p>
              <ul>
                <li>Criptare SSL/TLS pentru transmiterea datelor</li>
                <li>Baze de date securizate cu acces restricționat</li>
                <li>Parole hash-uite pentru admin</li>
                <li>Backup-uri regulate</li>
              </ul>

              <h2>7. Păstrarea Datelor</h2>
              <ul>
                <li><strong>Lead-uri:</strong> 2 ani sau până la solicitarea ștergerii</li>
                <li><strong>Date de calcul:</strong> Stocate LOCAL în browser (șterse când goliți cache-ul)</li>
                <li><strong>Logs tehnice:</strong> Maxim 90 zile</li>
              </ul>

              <h2>8. Cookie-uri</h2>
              <p>Folosim următoarele tipuri de cookie-uri:</p>
              <ul>
                <li><strong>Esențiale:</strong> Necesare pentru funcționarea site-ului (autentificare admin)</li>
                <li><strong>Funcționale:</strong> Salvare preferințe calculator (an selectat, monedă)</li>
              </ul>
              <p>Puteți refuza cookie-urile din setările browser-ului, dar acest lucru poate afecta funcționarea site-ului.</p>

              <h2>9. Transfer Internațional</h2>
              <p>
                Datele sunt stocate în Uniunea Europeană (MongoDB Atlas - Frankfurt, Germania).
                Nu transferăm date în afara UE fără măsuri de protecție adecvate.
              </p>

              <h2>10. Minori</h2>
              <p>
                Site-ul nostru nu se adresează minorilor sub 16 ani.
                Nu colectăm conștient date de la minori fără consimțământul părinților.
              </p>

              <h2>11. Modificări ale Politicii</h2>
              <p>
                Ne rezervăm dreptul de a actualiza această politică.
                Modificările vor fi publicate pe această pagină cu data actualizării.
              </p>

              <h2>12. Contact</h2>
              <p>Pentru exercitarea drepturilor sau întrebări despre date:</p>
              <ul>
                <li><strong>Email:</strong> privacy@ecalc.ro</li>
                <li><strong>Adresă:</strong> România</li>
              </ul>

              <h2>13. Autoritatea de Supraveghere</h2>
              <p>Puteți depune plângere la:</p>
              <p>
                <strong>ANSPDCP</strong> (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal)<br />
                Website: <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">www.dataprotection.ro</a><br />
                Email: anspdcp@dataprotection.ro
              </p>

              <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500">
                <p className="font-semibold text-blue-900">Notă Importantă:</p>
                <p className="text-blue-800 text-sm mt-1">
                  Datele introduse în calculatoare (sume, procente) sunt procesate LOCAL în browser-ul dumneavoastră
                  și NU sunt trimise pe serverele noastre. Doar lead-urile (nume, email) sunt stocate în baza noastră de date.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
