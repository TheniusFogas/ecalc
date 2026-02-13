import { SalaryCalculator } from './lib/salary-engine.js';
import fs from 'fs';

let output = '';
const log = (msg) => {
    output += msg + '\n';
    console.log(msg);
};

const mockRulesBase = {
    salary: {
        minimum_salary: 4050,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        cam_rate: 2.25,
        untaxed_amount: 300,
        personal_deduction_base: 510,
        personal_deduction_range: 2000,
        child_deduction: 100,
        dependent_deduction: 0
    }
};

log('--- TEST DEDUCERE PERSONALA (Salariu Minim 4050 RON) ---');

// Scenariu 1: Deducere standard (510 RON)
const calcWithDeduction = new SalaryCalculator(mockRulesBase);
const resWithDeduction = calcWithDeduction.calculateStandard(4050);
log(`1. Deducere Standard (510 RON):`);
log(`   Venit Impozabil: ${resWithDeduction.taxableIncome}`);
log(`   Impozit pe Venit: ${resWithDeduction.incomeTax} RON`);

// Scenariu 2: Deducere zero (0 RON)
const calcNoDeduction = new SalaryCalculator({
    salary: { ...mockRulesBase.salary, personal_deduction_base: 0 }
});
const resNoDeduction = calcNoDeduction.calculateStandard(4050);
log(`2. Deducere Zero (0 RON):`);
log(`   Venit Impozabil: ${resNoDeduction.taxableIncome}`);
log(`   Impozit pe Venit: ${resNoDeduction.incomeTax} RON`);

if (resNoDeduction.incomeTax > resWithDeduction.incomeTax) {
    log(`✅ TEST PASSED: Impozitul a crescut de la ${resWithDeduction.incomeTax} la ${resNoDeduction.incomeTax} RON când deducerea a fost setată pe 0.`);
} else {
    log(`❌ TEST FAILED: Impozitul NU a crescut.`);
}

fs.writeFileSync('deduction_test_results.txt', output);
