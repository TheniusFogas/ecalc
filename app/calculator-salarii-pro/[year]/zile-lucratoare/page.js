'use client';

import { Suspense } from 'react';
import { SalaryCalculatorContent } from '../page';

/**
 * Pagina SEO pentru Zile Lucrătoare
 * Ruta: /calculator-salarii-pro/[year]/zile-lucratoare
 */
export default function ZileLucratoarePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Se încarcă calendarul zilelor lucrătoare...</p>
                </div>
            </div>
        }>
            <SalaryCalculatorContent initialTab="zile-lucratoare" />
        </Suspense>
    );
}
