import { SalaryCalculator } from './lib/salary-engine.js';
import fs from 'fs';

let output = '';
const log = (msg) => {
    output += msg + '\n';
    console.log(msg);
};

const mockRules = {
    salary: {
        minimum_salary: 4050,
        cas_rate: 25,
        pilon2_rate: 4.75,
        cass_rate: 10,
        income_tax_rate: 10,
        cam_rate: 2.25,
        untaxed_amount: 300,
        it_tax_exempt: true,
        it_threshold: 10000,
        it_pilon2_optional: false,
        part_time_overtax_enabled: true
    }
};

log('--- TEST 1: IT PILON 2 OPTIONAL ---');
const calcITNoPilon = new SalaryCalculator({ ...mockRules, salary: { ...mockRules.salary, it_pilon2_optional: true } });
const resITNoPilon = calcITNoPilon.calculateIT(5000, { sector: 'it' });
log('IT (Pilon 2 OPTIONAL - CAS should be 20.25%):');
log(`Gross: ${resITNoPilon.gross}, CAS: ${resITNoPilon.cas} (${(resITNoPilon.cas / resITNoPilon.gross * 100).toFixed(2)}%)`);

const calcITWithPilon = new SalaryCalculator({ ...mockRules, salary: { ...mockRules.salary, it_pilon2_optional: false } });
const resITWithPilon = calcITWithPilon.calculateIT(5000, { sector: 'it' });
log('IT (Pilon 2 MANDATORY - CAS should be 25%):');
log(`Gross: ${resITWithPilon.gross}, CAS: ${resITWithPilon.cas} (${(resITWithPilon.cas / resITWithPilon.gross * 100).toFixed(2)}%)`);

if (resITNoPilon.cas < resITWithPilon.cas) log('✅ TEST PASSED: IT Pilon 2 optional correctly reduces CAS.');
else log('❌ TEST FAILED: IT Pilon 2 logic not working.');

log('\n--- TEST 2: SUPRATAXARE PART-TIME ---');
const partTimeSalary = 2000; // Below minimum (4050)
const calcOvertaxActive = new SalaryCalculator({ ...mockRules, salary: { ...mockRules.salary, part_time_overtax_enabled: true } });
const resOvertaxActive = calcOvertaxActive.calculateStandard(partTimeSalary, { isPartTime: true });
log('Part-Time (Suprataxare ACTIVA):');
log(`Gross: ${resOvertaxActive.gross}, CAS: ${resOvertaxActive.cas}, is_overtaxed: ${resOvertaxActive.is_overtaxed}`);

const calcOvertaxInactive = new SalaryCalculator({ ...mockRules, salary: { ...mockRules.salary, part_time_overtax_enabled: false } });
const resOvertaxInactive = calcOvertaxInactive.calculateStandard(partTimeSalary, { isPartTime: true });
log('Part-Time (Suprataxare INACTIVA):');
log(`Gross: ${resOvertaxInactive.gross}, CAS: ${resOvertaxInactive.cas}, is_overtaxed: ${resOvertaxInactive.is_overtaxed}`);

if (resOvertaxActive.is_overtaxed === true && resOvertaxInactive.is_overtaxed === false) {
    log('✅ TEST PASSED: Overtaxing toggle correctly controls engine logic.');
} else {
    log('❌ TEST FAILED: Overtaxing toggle not working.');
}

fs.writeFileSync('test_results_clean.txt', output);
log('\nResults saved to test_results_clean.txt');
