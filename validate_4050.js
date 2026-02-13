
import { calculateSalaryResults } from './lib/salary-engine.js';

const rules = {
    salary: {
        minimum_salary: 4050,
        personal_deduction_base: 810, // from SALARY_ALGORITHM_FIX.md
        personal_deduction_range: 2000,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        untaxed_amount: 300,
        cam_rate: 2.25
    }
};

const res = calculateSalaryResults(4050, 'brut-net', 'standard', rules);

console.log('--- VALIDARE BRUT 4050 ---');
console.log(`Brut: ${res.gross}`);
console.log(`Net: ${res.net}`);
console.log(`CAS: ${res.cas}`);
console.log(`CASS: ${res.cass}`);
console.log(`Impozit: ${res.incomeTax}`);
console.log(`Deducere Personala: ${res.personalDeduction}`);
console.log(`Baza Impozabila: ${res.taxableIncome}`);
console.log('--------------------------');
