'use client';

import { Suspense } from 'react';
import { Briefcase } from 'lucide-react';
import { SalaryCalculatorContent } from '../../calculator-salarii-pro/[year]/page';

/**
 * Pagina SEO ROOT pentru Zile Lucrătoare
 * Ruta: /zile-lucratoare/[year]
 */
export default function ZileLucratoareRootPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Briefcase className="h-12 w-12 animate-pulse mx-auto mb-4 text-emerald-600" />
                    <p className="text-slate-600 font-medium italic">Se încarcă zilele lucrătoare...</p>
                </div>
            </div>
        }>
            <SalaryCalculatorContent initialTab="zile-lucratoare" />
        </Suspense>
    );
}
