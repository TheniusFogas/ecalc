'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CalculatorSalariiProRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to current year
        const currentYear = new Date().getFullYear();
        router.replace(`/calculator-salarii-pro/${currentYear}`);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Redirecționare...</h2>
                <p className="text-slate-600">Vă redirecționăm către calculatorul pentru anul curent.</p>
            </div>
        </div>
    );
}
