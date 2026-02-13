/**
 * test-engine.js - Expanded Sandbox Validation Script
 */
import { mapDbToFiscalRules } from '../lib/data-mapper.js';
import { calculateSalaryResults, SalaryCalculator } from '../lib/salary-engine.js';

const mockDb2026 = {
    year: 2026,
    salary: {
        minimum_salary: 4050,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        untaxed_amount: 300,
        it_tax_exempt: true,
        it_threshold: 10000,
        personal_deduction_base: 810,
        personal_deduction_range: 2000,
        minimum_gross_construction: 4582,
        construction_cas_rate: 21.25
    }
};

async function runTests() {
    console.log('--- START EXPANDED SANDBOX VERIFICATION ---');

    const rules = mapDbToFiscalRules(mockDb2026);
    if (!rules) {
        console.error('FAILED: Could not map fiscal rules.');
        return;
    }

    // 1. Test Standard IT 10k
    const itResult = calculateSalaryResults('10000', 'brut-net', 'it', rules);
    console.log(`1. IT 10k: ${itResult.net === 6500 ? 'PASSED' : 'FAILED'} (Net: ${itResult.net})`);

    // 2. Test Overtaxing Standard (Gross 2000 < Min 4050)
    console.log('2. Testing Overtaxing (Standard)...');
    const ptResult = calculateSalaryResults('2000', 'brut-net', 'standard', rules, { isPartTime: true });
    // Expected: CAS calculated on 4050 - 300 = 3750. CAS = 3750 * 0.25 = 938.
    // CASS calculated on 4050 - 300 = 3750. CASS = 3750 * 0.1 = 375.
    const overtaxedOk = ptResult.is_overtaxed === true && ptResult.message.includes('Atentie');
    console.log(`- Status: ${overtaxedOk ? 'PASSED' : 'FAILED'}`);
    console.log(`- Message: "${ptResult.message}"`);
    console.log(`- CAS: ${ptResult.cas} (Expected ~938 if based on MinSalary)`);

    // 3. Test Overtaxing Construction (Gross 4000 < Min 4582)
    console.log('3. Testing Overtaxing (Construction)...');
    const consPt = calculateSalaryResults('4000', 'brut-net', 'construction', rules, { isPartTime: true });
    console.log(`- Status: ${consPt.is_overtaxed ? 'PASSED' : 'FAILED'} (Net: ${consPt.net})`);
    console.log(`- Message: "${consPt.message}"`);

    // 4. Test Binary Search in Overtaxed Range (Target Net 1000)
    console.log('4. Testing Binary Search stability at Low Income...');
    const revLow = calculateSalaryResults('1000', 'net-brut', 'standard', rules);
    console.log(`- Target Net 1000 -> Gross: ${revLow.gross.toFixed(2)} (Net Actual: ${revLow.net})`);
    const revLowPassed = Math.abs(revLow.net - 1000) < 0.5;
    console.log(`- Binary Search Stability: ${revLowPassed ? 'PASSED' : 'FAILED'}`);

    // 5. Test Default Rules Fallback
    console.log('5. Testing Default Rules Fallback...');
    const emptyRules = mapDbToFiscalRules({ year: 2026 });
    const calculator = new SalaryCalculator(emptyRules);
    const defCas = calculator.getRule('cas_rate');
    console.log(`- Default CAS Rate: ${defCas}% (Expected 25) - ${defCas === 25 ? 'PASSED' : 'FAILED'}`);

    // 6. Test Sector Minimums with NULL rules
    console.log('6. Testing Sector Minimums (rules = null)...');
    try {
        const { getSectorMinimums } = await import('../lib/salary-engine.js');
        const minResult = getSectorMinimums('standard', null);
        console.log(`- Status: PASSED (Brut: ${minResult.brut}, Net: ${minResult.net})`);
    } catch (e) {
        console.error(`- FAILED: ${e.message}`);
    }

    console.log('--- END VERIFICATION ---');
}

runTests().catch(console.error);
