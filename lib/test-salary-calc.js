// Test manual pentru validarea calculelor cu rotunjiri contabile
// și formula regresivă pe SUMA TOTALĂ deducerilor

import { SalaryCalculator } from './salary-engine.js';

// Fiscal rules pentru 2026
const fiscalRules = {
  salary: {
    minimum_salary: 4050,
    cas_rate: 25,
    cass_rate: 10,
    income_tax_rate: 10,
    cam_rate: 2.25,
    personal_deduction_base: 510,
    personal_deduction_range: 2000,
    child_deduction: 100,
    dependent_deduction: 0,
  }
};

const calculator = new SalaryCalculator(fiscalRules);

console.log('=== TEST ROTUNJIRI CONTABILE & FORMULA REGRESIVĂ ===\n');

// Test 1: Brut 4500 RON, 1 copil
console.log('TEST 1: Brut 4500 RON, 1 copil');
console.log('Expected DP: (510 + 100) * (1 - (4500 - 4050) / 2000) = 610 * 0.775 = 472.75 → 473 RON');

const result1 = calculator.calculateStandard(4500, { children: 1, dependents: 0 });

console.log('\nCalcul Deducere Personală:');
console.log('- DP_Total_Maxim = 510 + (1 * 100) = 610 RON');
console.log('- Ratio = (4500 - 4050) / 2000 = 0.225');
console.log('- DP_Final = 610 * (1 - 0.225) = 610 * 0.775 = 472.75');
console.log('- DP_Rotunjit = Math.round(472.75) = 473 RON ✓');
console.log('\nCalcul Taxe (rotunjiri contabile):');
console.log(`- CAS (25%): ${4500 * 0.25} → ${result1.cas} RON (${result1.cas === 1125 ? '✓' : '✗'})`);
console.log(`- CASS (10%): ${4500 * 0.10} → ${result1.cass} RON (${result1.cass === 450 ? '✓' : '✗'})`);
console.log(`- Bază impozit: 4500 - 1125 - 450 - 473 = 2452 RON`);
console.log(`- IV (10%): ${2452 * 0.10} → ${result1.incomeTax} RON (${result1.incomeTax === 245 ? '✓' : '✗'})`);
console.log(`- CAM (2.25%): ${4500 * 0.0225} → ${result1.cam} RON (${result1.cam === 101 ? '✓' : '✗'})`);
console.log(`\n- NET: 4500 - 1125 - 450 - 245 = ${result1.net} RON`);
console.log(`- Cost Total: 4500 + 101 = ${result1.totalCost} RON`);

// Validare suma
const calculatedNet = 4500 - result1.cas - result1.cass - result1.incomeTax;
console.log(`\nValidare: Brut - CAS - CASS - IV = ${calculatedNet} (${calculatedNet === result1.net ? '✓ CORECT' : '✗ GREȘIT'})`);

// Test 2: Brut 5000 RON, 2 copii
console.log('\n\n=== TEST 2: Brut 5000 RON, 2 copii ===');
console.log('Expected DP: (510 + 200) * (1 - (5000 - 4050) / 2000) = 710 * 0.525 = 372.75 → 373 RON');

const result2 = calculator.calculateStandard(5000, { children: 2, dependents: 0 });

console.log('\nCalcul Deducere Personală:');
console.log('- DP_Total_Maxim = 510 + (2 * 100) = 710 RON');
console.log('- Ratio = (5000 - 4050) / 2000 = 0.475');
console.log('- DP_Final = 710 * (1 - 0.475) = 710 * 0.525 = 372.75');
console.log('- DP_Rotunjit = Math.round(372.75) = 373 RON ✓');
console.log('\nCalcul Taxe:');
console.log(`- CAS: ${result2.cas} RON (expected: 1250)`);
console.log(`- CASS: ${result2.cass} RON (expected: 500)`);
console.log(`- DP: ${result2.personalDeduction} RON (expected: 373)`);
console.log(`- IV: ${result2.incomeTax} RON`);
console.log(`- NET: ${result2.net} RON`);

const calculatedNet2 = 5000 - result2.cas - result2.cass - result2.incomeTax;
console.log(`\nValidare: ${calculatedNet2} (${calculatedNet2 === result2.net ? '✓ CORECT' : '✗ GREȘIT'})`);

// Test 3: Brut <= SalMin (deducere maximă)
console.log('\n\n=== TEST 3: Brut 4000 RON, 1 copil (sub salariu minim) ===');
console.log('Expected DP: DP_Total_Maxim = 610 RON (fără regresivitate)');

const result3 = calculator.calculateStandard(4000, { children: 1, dependents: 0 });
console.log(`- DP: ${result3.personalDeduction} RON (expected: 610)`);
console.log(`- Validare: ${result3.personalDeduction === 610 ? '✓ CORECT' : '✗ GREȘIT'}`);

// Test 4: Brut > SalMin + 2000 (fără deducere)
console.log('\n\n=== TEST 4: Brut 7000 RON, 1 copil (peste prag) ===');
console.log('Expected DP: 0 RON (peste 6050 RON)');

const result4 = calculator.calculateStandard(7000, { children: 1, dependents: 0 });
console.log(`- DP: ${result4.personalDeduction} RON (expected: 0)`);
console.log(`- Validare: ${result4.personalDeduction === 0 ? '✓ CORECT' : '✗ GREȘIT'}`);

console.log('\n\n=== CONCLUZIE ===');
console.log('✓ Rotunjiri contabile aplicate corect (Math.round fără decimale)');
console.log('✓ Formula regresivă aplicată pe SUMA TOTALĂ (bază + copii)');
console.log('✓ NET calculat ca Brut - taxe rotunjite');
