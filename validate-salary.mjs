import { SalaryCalculator } from './lib/salary-engine.js';
import { mapDbToFiscalRules } from './lib/data-mapper.js';

// MOCK DATA (Simulates Admin DB/API)
const mockDb = {
    year: 2026,
    effectiveDate: '2026-01-01',
    salary: {
        minimum_salary: 4050,
        minimum_gross_construction: 4582,
        minimum_gross_agriculture: 3436,
        minimum_gross_it: 4050,
        average_salary: 7500,
        cas_rate: 25,
        pilon2_rate: 4.75,
        cass_rate: 10,
        income_tax_rate: 10,
        cam_rate: 2.25,
        untaxed_amount_enabled: true,
        untaxed_amount: 300,
        meal_voucher_max: 40,
        gift_voucher_threshold: 300,
        meal_allowance_max: 70,
        personal_deduction_percent: 20, // Example
        personal_deduction_base: 510, // from mock DB in route.js but missing there? No wait, it was there: 810? No, let's stick to what we see in route.js mockDb.
        // Wait, route.js had: personal_deduction_base: 810, personal_deduction_range: 2000.
        // I will use those values to generate the report.
        personal_deduction_base: 810,
        personal_deduction_range: 2000,
        child_deduction: 300,
        dependent_deduction: 0,
        it_threshold: 10000,
        it_tax_exempt: true,
        it_pilon2_optional: true,
        construction_cas_rate: 21.25,
        construction_tax_exempt: true,
        construction_cass_exempt: false,
        agriculture_cas_rate: 21.25,
        agriculture_tax_exempt: true,
        tax_exemption_threshold: 10000,
        youth_exemption_enabled: true,
        youth_exemption_threshold: 6050
    },
    exchange_rate: { eur: 5.0923, auto_update: true }
};

const fiscalRules = mapDbToFiscalRules(mockDb);
const calculator = new SalaryCalculator(fiscalRules);

console.log("# Raport Validare Motor Salarial (Unit Test)\n");

console.log("## 1. Parametri Sectoriali (Admin Values)");
console.log(`- Standard Minim: ${fiscalRules.salary.minimum_salary} RON`);
console.log(`- Construcții Minim: ${fiscalRules.salary.minimum_gross_construction} RON`);
console.log(`- Agricultură Minim: ${fiscalRules.salary.minimum_gross_agriculture} RON`);
console.log(`- IT Minim: ${fiscalRules.salary.minimum_gross_it} RON`);
console.log(`- Scutire Netaxabilă (untaxed_amount): ${fiscalRules.salary.untaxed_amount} RON`);
console.log(`- Prag Scutire IT: ${fiscalRules.salary.it_threshold} RON`);
console.log(`- Curs BNR: ${fiscalRules.exchange_rate.eur} RON\n`);

console.log("## 2. Matricea de Testare (Cross-Check & Reciprocitate)\n");

// 2. Definire Functie Test
function runTest(sector, grossAmount, description) {
    const options = {
        sector: sector,
        // Default options
        isBasicFunction: true,
        age: 30
    };

    let result;
    if (sector === 'it') result = calculator.calculateIT(grossAmount, options);
    else if (sector === 'construction') result = calculator.calculateConstruction(grossAmount, options);
    else if (sector === 'agriculture') result = calculator.calculateConstruction(grossAmount, { ...options, sector: 'agriculture' });
    else result = calculator.calculateStandard(grossAmount, options);

    // Reciprocitate Check
    // Net -> Brut
    const netTarget = result.net;
    let reverseResult = calculator.calculateNetToGross(netTarget, sector, options);

    // Check difference
    const diff = Math.abs(reverseResult.gross - grossAmount);
    const passReciprocity = diff <= 1; // 1 RON tolerance per requirements (Math.round issues)

    // Check Threshold Logic (Did 300 RON apply?)
    // Logic: If gross <= minWage + 10, untaxedAmount should be > 0. Else 0.
    let minWage = 0;
    if (sector === 'construction') minWage = fiscalRules.salary.minimum_gross_construction;
    else if (sector === 'agriculture') minWage = fiscalRules.salary.minimum_gross_agriculture;
    else if (sector === 'it') minWage = fiscalRules.salary.minimum_gross_it;
    else minWage = fiscalRules.salary.minimum_salary;

    const shouldHaveExemption = grossAmount <= minWage; // STRICT LEGAL
    const hasExemption = result.untaxedAmount > 0;

    let exemptionNote = "";
    if (shouldHaveExemption && hasExemption) exemptionNote = "✅ Scutire 300 Aplicată";
    else if (!shouldHaveExemption && !hasExemption) exemptionNote = "✅ Scutire 300 Eliminată Correct";
    else exemptionNote = `❌ EROARE SCUTIRE (Should: ${shouldHaveExemption}, Has: ${hasExemption})`;

    console.log(`### Scenariu: ${sector.toUpperCase()} - ${description}`);
    console.log(`- Brut: ${grossAmount} RON`);
    console.log(`- Net Calculat: ${result.net} RON`);
    console.log(`- Taxe: CAS=${result.cas}, CASS=${result.cass}, IV=${result.incomeTax}, CAM=${result.cam}`);
    console.log(`- Ded. Pers: ${result.personalDeduction}, Baza IV: ${result.taxableIncome}`);
    console.log(`- Scutire 300: ${result.untaxedAmount} RON (${exemptionNote})`);
    console.log(`- Reciprocitate (Net ${result.net} -> Brut ?): ${reverseResult.gross} RON (Diff: ${diff.toFixed(2)}) -> ${passReciprocity ? '✅ PASS' : '❌ FAIL'}`);
    console.log("");
}

// STANDARD
// STANDARD
const minStd = fiscalRules.salary.minimum_salary;
runTest('standard', minStd - 1, "Sub Minim (Min - 1)");
runTest('standard', minStd, "Fix Minim");
runTest('standard', minStd + 1, "Peste Minim (Min + 1)");

// CONSTRUCTII
const minConst = fiscalRules.salary.minimum_gross_construction;
runTest('construction', minConst - 1, "Sub Minim (Min - 1)");
runTest('construction', minConst, "Fix Minim");
runTest('construction', minConst + 1, "Peste Minim (Min + 1)");

// AGRICULTURA
const minAgri = fiscalRules.salary.minimum_gross_agriculture;
runTest('agriculture', minAgri - 1, "Sub Minim (Min - 1)");
runTest('agriculture', minAgri, "Fix Minim");
runTest('agriculture', minAgri + 1, "Peste Minim (Min + 1)");

// IT
const minIT = fiscalRules.salary.minimum_gross_it;
runTest('it', minIT - 1, "Sub Minim (Min - 1)");
runTest('it', minIT, "Fix Minim");
runTest('it', minIT + 1, "Peste Minim (Min + 1)");
