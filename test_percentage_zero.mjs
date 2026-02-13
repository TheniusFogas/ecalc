
import { SalaryCalculator } from './lib/salary-engine.js';

const RULES_ZERO_PERCENT = {
    salary: {
        minimum_salary: 4050,
        personal_deduction_percent: 0, // EXPLICITLY 0
        personal_deduction_base: 810   // Legacy value present
    }
};

const calc = new SalaryCalculator(RULES_ZERO_PERCENT);
const res = calc.calculatePersonalDeduction(4050, true);

console.log("=== TEST ZERO PERCENT ===");
console.log(`Percent: ${RULES_ZERO_PERCENT.salary.personal_deduction_percent}`);
console.log(`Legacy Base: ${RULES_ZERO_PERCENT.salary.personal_deduction_base}`);
console.log(`Calculated Deduction: ${res}`);

if (res === 0) {
    console.log("✅ SUCCESS: Engine respects 0% setting.");
} else {
    console.error("❌ FAIL: Engine ignored 0% and used fallback.");
}
