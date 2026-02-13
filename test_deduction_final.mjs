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
        personal_deduction_base: 0,
        personal_deduction_range: 2000,
        child_deduction: 100,
        dependent_deduction: 0
    }
};

log('--- TESTUL DE "0" (Deducere = 0 RON) ---');
const calcTest0 = new SalaryCalculator(mockRulesBase);
const resTest0 = calcTest0.calculateStandard(4050);
log(`Salariu Brut: ${resTest0.gross} RON`);
log(`Deducere Personală: ${resTest0.personalDeduction} RON`);
log(`Impozit pe Venit: ${resTest0.incomeTax} RON`);

if (resTest0.incomeTax === 244) {
    log('✅ TEST "0" REUȘIT: Impozitul este fix 244 RON.');
} else {
    log(`❌ TEST "0" EȘUAT: Impozitul este ${resTest0.incomeTax} RON (așteptat 244).`);
}

log('\n--- TESTUL DE "REVENIRE" (Deducere = 810 RON) ---');
const calcTest810 = new SalaryCalculator({
    salary: { ...mockRulesBase.salary, personal_deduction_base: 810 }
});
const resTest810 = calcTest810.calculateStandard(4050);
log(`Salariu Brut: ${resTest810.gross} RON`);
log(`Deducere Personală: ${resTest810.personalDeduction} RON`);
log(`Impozit pe Venit: ${resTest810.incomeTax} RON`);

if (resTest810.incomeTax < 244) {
    log(`✅ TEST "REVENIRE" REUȘIT: Impozitul a scăzut la ${resTest810.incomeTax} RON.`);
} else {
    log('❌ TEST "REVENIRE" EȘUAT.');
}

fs.writeFileSync('deduction_final_test.txt', output);
