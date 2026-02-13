
import { SalaryCalculator } from './lib/salary-engine.js';

// Snapshot cu Procent 25% (25% din 4050 = 1012.5 -> 1013 RON)
const rulesPercent = {
    salary: {
        minimum_salary: 4050,
        personal_deduction_percent: 25, // !!! PROCENT
        personal_deduction_base: 0,     // Ignorat
        personal_deduction_range: 2000,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        untaxed_amount: 300
    }
};

console.log("=== TEST DEDUCERE PROCENTUALĂ (25%) ===");
const calc = new SalaryCalculator(rulesPercent);
const res = calc.calculateStandard(4050); // La minim -> Deducere Maximă

console.log(`Salariu Minim: ${rulesPercent.salary.minimum_salary}`);
console.log(`Procent Setat: ${rulesPercent.salary.personal_deduction_percent}%`);
console.log(`Deducere Calculată: ${res.personalDeduction} RON`);
console.log(`Expected (4050 * 0.25): 1013 RON`);

if (res.personalDeduction === 1013) {
    console.log("✅ SUCCESS: Formula PROCENTUALĂ funcționează corect (rotunjit).");
} else {
    console.error(`❌ FAIL: A calculat ${res.personalDeduction}.`);
}

// Verificare că Base-ul vechi e ignorat
const rulesMixed = { ...rulesPercent };
rulesMixed.salary.personal_deduction_base = 500; // Valoare mică fixă
const calcMixed = new SalaryCalculator(rulesMixed);
const resMixed = calcMixed.calculateStandard(4050);

if (resMixed.personalDeduction === 1013) {
    console.log("✅ SUCCESS: Prioritizează Procentul peste Suma Fixă.");
} else {
    console.error("❌ FAIL: A folosit suma fixă.");
}
