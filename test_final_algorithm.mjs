
import { SalaryCalculator } from './lib/salary-engine.js';

const RULES = {
    salary: {
        minimum_salary: 4050,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        cam_rate: 2.25,
        untaxed_amount: 300,
        personal_deduction_percent: 20,
        personal_deduction_base: 0,
        personal_deduction_range: 2000,
        child_deduction: 0,
        dependent_deduction: 0,
        part_time_overtax_enabled: true
    }
};

const calc = new SalaryCalculator(RULES);

console.log("=== TEST FINAL ALGORITHM (USER FORMULA) ===");

// Case 1: Standard Salary 4050
// BC = 4050 - 300 = 3750
// CAS = 3750 * 25% = 938
// CASS = 3750 * 10% = 375
// Ded = 4050 * 20% = 810
// NetForTax = 4050 - 300 - 938 - 375 = 2437
// TaxBase = 2437 - 810 = 1627
// Tax = 1627 * 10% = 163
// Net = 4050 - 938 - 375 - 163 = 2574
// CAM = 4050 * 2.25% = 91

const resStandard = calc.calculateStandard(4050);
console.log(`\n[STANDARD 4050]`);
console.log(`CAS: ${resStandard.cas} (Exp: 938)`);
console.log(`CASS: ${resStandard.cass} (Exp: 375)`);
console.log(`Tax: ${resStandard.incomeTax} (Exp: 163)`);
console.log(`Net: ${resStandard.net} (Exp: 2574)`);
console.log(`CAM: ${resStandard.cam} (Exp: 91)`);

if (resStandard.net === 2574 && resStandard.cam === 91) {
    console.log("✅ SUCCESS: Standard Formula Matches.");
} else {
    console.error("❌ FAIL: Standard Calculation mismatch.");
}

// Case 2: Overtaxation (Gross 1000)
// BC_Payable = 4050
// CAS = 4050 * 25% = 1013 (rounded)
// CASS = 4050 * 10% = 405
// BC_Real = 1000 - 300 = 700
// CAS_Real = 700 * 25% = 175
// CASS_Real = 700 * 10% = 70
// NetForTax = 1000 - 300 - 175 - 70 = 455
// Ded = 810
// TaxBase = 455 - 810 < 0 -> 0
// Tax = 0
// Net = 1000 - 1013 - 405 - 0 = -418 (Negative Net expected)
// CAM = 1000 * 2.25% = 23 (rounded)

const resOvertax = calc.calculateStandard(1000, { isPartTime: true });
console.log(`\n[OVERTAX 1000]`);
console.log(`CAS: ${resOvertax.cas} (Exp: ~1012/1013)`);
console.log(`Tax: ${resOvertax.incomeTax} (Exp: 0)`);
console.log(`Net: ${resOvertax.net} (Exp: Negative)`);
console.log(`CAM: ${resOvertax.cam} (Exp: 23)`);

if (resOvertax.incomeTax === 0 && resOvertax.cam === 23 && resOvertax.cas > 1000) {
    console.log("✅ SUCCESS: Overtaxation Formula Matches.");
} else {
    console.error("❌ FAIL: Overtaxation Calculation mismatch.");
}
