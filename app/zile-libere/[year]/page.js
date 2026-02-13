'use client';

import { Suspense } from 'react';
import { Calendar } from 'lucide-react';
import { SalaryCalculatorContent } from '../../calculator-salarii-pro/[year]/page';

/**
 * Pagina SEO ROOT pentru Zile Libere
 * Ruta: /zile-libere/[year]
 */
export default function ZileLibereRootPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Calendar className="h-12 w-12 animate-bounce mx-auto mb-4 text-blue-600" />
                    <p className="text-slate-600 font-medium italic">Se încarcă zilele libere...</p>
                </div>
            </div>
        }>
            <SalaryCalculatorContent initialTab="zile-libere" />
        </Suspense>
    );
}
