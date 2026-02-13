'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 px-4 border-t border-slate-200 bg-white mt-auto">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-5 gap-6 text-sm mb-6">
          <div>
            <h3 className="font-bold text-slate-900 mb-3">eCalc.ro</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Calculatoare fiscale profesionale pentru România.
              Informațiile sunt orientative și nu înlocuiesc consultanța fiscală.
            </p>
          </div>
          <nav aria-label="Linkuri utile calculatoare">
            <h3 className="font-bold text-slate-900 mb-3">Calculatoare</h3>
            <div className="space-y-1.5">
              <Link href={`/calculator-salarii-pro/${currentYear}`} className="block text-slate-600 hover:text-blue-700 text-xs font-medium">
                Calculator Salarii
              </Link>
              <Link href={`/calculator-pfa/${currentYear}`} className="block text-slate-600 hover:text-blue-700 text-xs font-medium">
                Calculator PFA
              </Link>
              <Link href={`/decision-maker/${currentYear}`} className="block text-slate-600 hover:text-blue-700 text-xs font-medium">
                Decision Maker
              </Link>
            </div>
          </nav>
          <nav aria-label="Salarii Minime pe Sectoare">
            <h3 className="font-bold text-slate-900 mb-3">Salarii Minime {currentYear}</h3>
            <div className="space-y-1.5">
              <Link href={`/calculator-salarii-pro/${currentYear}/minim-standard`} className="block text-slate-600 hover:text-blue-700 text-xs font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                Minim Standard
              </Link>
              <Link href={`/calculator-salarii-pro/${currentYear}/minim-constructii`} className="block text-slate-600 hover:text-blue-700 text-xs font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2"></span>
                Minim Construcții
              </Link>
              <Link href={`/calculator-salarii-pro/${currentYear}/minim-agricultura`} className="block text-slate-600 hover:text-blue-700 text-xs font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2"></span>
                Minim Agricultură
              </Link>
              <Link href={`/calculator-salarii-pro/${currentYear}/minim-it`} className="block text-slate-600 hover:text-blue-700 text-xs font-medium flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                Minim IT
              </Link>
            </div>
          </nav>
          <nav aria-label="Linkuri legale">
            <h3 className="font-bold text-slate-900 mb-3">Legal</h3>
            <div className="space-y-1.5">
              <Link href="/termeni-conditii" className="block text-slate-600 hover:text-blue-700 text-xs font-medium">
                Termeni și Condiții
              </Link>
              <Link href="/politica-confidentialitate" className="block text-slate-600 hover:text-blue-700 text-xs font-medium">
                Politica de Confidențialitate
              </Link>
            </div>
          </nav>
          <nav aria-label="Surse externe oficiale">
            <h3 className="font-bold text-slate-900 mb-3">Surse Oficiale</h3>
            <div className="space-y-1.5">
              <a href="https://www.anaf.ro" target="_blank" rel="noopener noreferrer" title="Vizitează site-ul oficial ANAF" className="block text-slate-600 hover:text-blue-700 text-xs font-medium">
                ANAF
              </a>
              <a href="https://e-factura.anaf.ro" target="_blank" rel="noopener noreferrer" title="Acces portal e-Factura" className="block text-slate-600 hover:text-blue-700 text-xs font-medium">
                Portal e-Factura
              </a>
            </div>
          </nav>
        </div>
        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-slate-600 text-xs font-medium">© {currentYear} eCalc.ro - Toate drepturile rezervate</p>
        </div>
      </div>
    </footer>
  );
}
