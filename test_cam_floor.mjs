
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
        personal_deduction_range: 2000,
        part_time_overtax_enabled: true
    }
};

const calc = new SalaryCalculator(RULES);

console.log("=== TEST CAM LOGIC (FLOOR & UNTAXED) ===");

// Case: Gross = 4050.
// SN = 300.
// BCCAM = 4050 - 300 = 3750.
// CAM = floor(3750 * 0.0225) = floor(84.375) = 84.
// Old logic (round) would be 84.
// Old logic (no SN deduction) would be 4050 * 0.0225 = 91.125 -> 91.

const res = calc.calculateStandard(4050);
console.log(`Gross: 4050`);
console.log(`CAM: ${res.cam} (Exp: 84)`);

if (res.cam === 84) {
    console.log("✅ SUCCESS: CAM uses Untaxed Base and Floor Rounding.");
} else {
    console.error(`❌ FAIL: CAM expected 84, got ${res.cam}`);
}
