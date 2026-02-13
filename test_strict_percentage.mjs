
import { SalaryCalculator } from './lib/salary-engine.js';

const RULES = {
    salary: {
        minimum_salary: 4050,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        cam_rate: 2.25,
        untaxed_amount: 300,
        personal_deduction_percent: 20, // 4050 * 20% = 810
        personal_deduction_range: 2000,
        child_deduction: 0,
        dependent_deduction: 0,
        part_time_overtax_enabled: true
    }
};

const calc = new SalaryCalculator(RULES);

console.log("=== TEST STRICT PERCENTAGE ALGORITHM ===");

// 1. STANDARD CASE (Gross = 4050)
// BCC = 4050 - 300 = 3750
// CAS = 3750 * 0.25 = 938
// CASS = 3750 * 0.10 = 375
// DP = 4050 * 0.20 = 810
// VI = 4050 - 300 - 938 - 375 - 810 = 1627
// Impozit = 1627 * 0.10 = 163
// Net = 4050 - 938 - 375 - 163 = 2574
// CAM = 4050 * 0.0225 = 91

const res = calc.calculateStandard(4050);
console.log(`\n[Gross 4050]`);
console.log(`CAS: ${res.cas} (Exp: 938)`);
console.log(`CASS: ${res.cass} (Exp: 375)`);
console.log(`Impozit: ${res.incomeTax} (Exp: 163)`);
console.log(`Net: ${res.net} (Exp: 2574)`);
console.log(`CAM: ${res.cam} (Exp: 91)`);

// PROOF of SUM
const sumTaxes = res.cas + res.cass + res.incomeTax;
const calculatedSum = res.net + sumTaxes;
console.log(`\n[PROOF] Net (${res.net}) + Taxes (${sumTaxes}) = ${calculatedSum} (Should be 4050)`);

if (calculatedSum === 4050) {
    console.log("✅ SUCCESS: Sum matches Gross Exactly.");
} else {
    console.error(`❌ FAIL: Sum mismatch! Diff: ${4050 - calculatedSum}`);
}

// 2. CHECK DEDUCTION AT HIGHER SALARY (Regressive)
// Gross = 5050 (Midway in range)
// Range = 2000. Min = 4050.
// Factor = 1 - (5050 - 4050)/2000 = 1 - 1000/2000 = 0.5
// DP = 810 * 0.5 = 405
const resHigh = calc.calculateStandard(5050);
console.log(`\n[Gross 5050]`);
console.log(`Deduction: ${resHigh.personalDeduction} (Exp: 405)`);

if (resHigh.personalDeduction === 405) {
    console.log("✅ SUCCESS: Regressive deduction works.");
} else {
    console.error("❌ FAIL: Deduction calculation error.");
}
