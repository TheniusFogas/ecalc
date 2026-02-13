
import { SalaryCalculator } from './lib/salary-engine.js';

const RULES = {
    salary: {
        minimum_salary: 4050,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        untaxed_amount: 300,
        personal_deduction_percent: 20,
        personal_deduction_base: 0,
        personal_deduction_range: 2000,
        part_time_overtax_enabled: true
    }
};

const calc = new SalaryCalculator(RULES);

console.log("=== TEST STRICT OVERTAXATION ===");

// Scenario 1: Gross 1000, Part-Time, OVERTAXED
// CAS Payable: 4050 * 25% = 1013 (approx, ignoring untaxed for base for a moment to see logic)
// Wait, if 4050 is base, CAS is 1012.5 -> 1013.
// Tax Base: 1000 - (1000 * 25%) - (1000 * 10%) = 1000 - 250 - 100 = 650.
// Tax: (650 - Ded) * 10%.
const resOvertax = calc.calculateStandard(1000, {
    isPartTime: true,
    isStudentOrPensioner: false
});

console.log(`\n[OVERTAXED] Gross: 1000`);
console.log(`CAS Payable: ${resOvertax.cas} (Expected ~1013 at min salary base)`);
console.log(`CASS Payable: ${resOvertax.cass} (Expected ~405 at min salary base)`);
console.log(`Income Tax: ${resOvertax.incomeTax}`);
console.log(`Net: ${resOvertax.net}`);
console.log(`Is Overtaxed: ${resOvertax.is_overtaxed}`);

if (resOvertax.cas > 250 && resOvertax.is_overtaxed) {
    console.log("✅ SUCCESS: Paying CAS at Minimum Level.");
} else {
    console.error("❌ FAIL: CAS calculation incorrect for overtaxation.");
}

// Scenario 2: Gross 1000, Student (EXCEPTION)
const resExempt = calc.calculateStandard(1000, {
    isPartTime: true,
    isStudentOrPensioner: true
});

console.log(`\n[EXEMPT] Gross: 1000`);
console.log(`CAS Payable: ${resExempt.cas} (Expected ~250)`);
console.log(`CASS Payable: ${resExempt.cass} (Expected ~100)`);
console.log(`Is Overtaxed: ${resExempt.is_overtaxed}`);

if (resExempt.cas <= 250 && !resExempt.is_overtaxed) {
    console.log("✅ SUCCESS: Exception respected (Real Taxes).");
} else {
    console.error("❌ FAIL: Exception ignored.");
}
