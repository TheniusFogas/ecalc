'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { SalaryCalculatorContent } from '../page';
import { Calculator } from 'lucide-react';

/**
 * Pagină SEO Programatică pentru sume specifice
 * Rute de tip: /calculator-salarii-pro/[year]/4500-brut-calcul-salariu-net
 */
export default function DynamicSalaryPage() {
    const params = useParams();
    const { path } = params;

    // Extragem suma din slug (ex: "4500-brut-..." -> 4500)
    const matches = path ? path.match(/^(\d+)/) : null;
    const initialValue = matches ? matches[1] : '';

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
                <div className="text-center">
                    <Calculator className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Se încarcă calculul pentru {initialValue || 'salariul tău'}...</p>
                </div>
            </div>
        }>
            <SalaryCalculatorContent initialValue={initialValue} />
        </Suspense>
    );
}
