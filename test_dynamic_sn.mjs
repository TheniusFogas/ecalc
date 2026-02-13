
import { SalaryCalculator } from './lib/salary-engine.js';

console.log("=== TEST DYNAMIC SN (0 vs 300) ===");

// SCENARIO 1: SN = 0 (Admin removed facility)
const RULES_ZERO_SN = {
    salary: {
        minimum_salary: 4050,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        cam_rate: 2.25,
        untaxed_amount: 0, // EXPLICITLY 0
        personal_deduction_percent: 20,
        personal_deduction_range: 2000,
        part_time_overtax_enabled: true
    }
};

const calcZero = new SalaryCalculator(RULES_ZERO_SN);
const resZero = calcZero.calculateStandard(4050);

console.log(`\n[SCENARIO 1: SN = 0]`);
console.log(`Gross: 4050`);
console.log(`Untaxed Amount (SN): ${resZero.untaxedAmount} (Exp: 0)`);
// Base = 4050 - 0 = 4050.
// CAS = 4050 * 0.25 = 1012.5 -> 1013.
// CAM = floor(4050 * 0.0225) = floor(91.125) = 91.

console.log(`CAS: ${resZero.cas} (Exp: 1013)`);
console.log(`CAM: ${resZero.cam} (Exp: 91)`);

if (resZero.untaxedAmount === 0 && resZero.cam === 91) {
    console.log("✅ SUCCESS: Engine handles SN=0 correctly (Full Base).");
} else {
    console.error(`❌ FAIL: Expected CAM 91, got ${resZero.cam}`);
}

// SCENARIO 2: SN = 300 (Standard)
const RULES_STD_SN = {
    salary: { ...RULES_ZERO_SN.salary, untaxed_amount: 300 }
};
const calcStd = new SalaryCalculator(RULES_STD_SN);
const resStd = calcStd.calculateStandard(4050);

console.log(`\n[SCENARIO 2: SN = 300]`);
// Base = 3750.
// CAM = floor(3750 * 0.0225) = 84.
console.log(`CAM: ${resStd.cam} (Exp: 84)`);

if (resStd.cam === 84) {
    console.log("✅ SUCCESS: Engine handles SN=300 correctly.");
} else {
    console.error(`❌ FAIL: Expected CAM 84, got ${resStd.cam}`);
}
