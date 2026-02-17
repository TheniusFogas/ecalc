
import { SalaryCalculator } from './lib/salary-engine.js';

const mockRules = {
    salary: {
        minimum_salary: 3000, // Custom Min Wage
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        personal_deduction_percent: 0,
        personal_deduction_base: 0,
        untaxed_amount_enabled: false,
        untaxed_amount: 0
    }
};

const calculator = new SalaryCalculator(mockRules);
const gross = 5000;
const result = calculator.calculateStandard(gross);

console.log('--- Test 1: Standard Calculation ---');
console.log(`Gross: ${gross}`);
console.log(`CAS (25%): ${result.cas} (Expected: 1250)`);
console.log(`CASS (10%): ${result.cass} (Expected: 500)`);
console.log(`Tax (10%): ${result.incomeTax} (Expected: 325)`);
console.log(`Net: ${result.net} (Expected: 2925)`);

const mockRulesChanged = {
    salary: {
        minimum_salary: 3000,
        cas_rate: 20, // CHANGED RATE
        cass_rate: 5, // CHANGED RATE
        income_tax_rate: 16, // CHANGED RATE
        personal_deduction_percent: 0,
        personal_deduction_base: 0
    }
};

const calculator2 = new SalaryCalculator(mockRulesChanged);
const result2 = calculator2.calculateStandard(gross);

console.log('\n--- Test 2: Changed Rates ---');
console.log(`Gross: ${gross}`);
console.log(`CAS (20%): ${result2.cas} (Expected: 1000)`);
console.log(`CASS (5%): ${result2.cass} (Expected: 250)`);
console.log(`Tax (16% of 3750): ${result2.incomeTax} (Expected: 600)`);
console.log(`Net: ${result2.net} (Expected: 3150)`);

if (result2.cas === 1000 && result2.cass === 250 && result2.incomeTax === 600) {
    console.log('\nSUCCESS: Engine respects dynamic parameters.');
} else {
    console.log('\nFAILURE: Engine ignored some parameters.');
}
