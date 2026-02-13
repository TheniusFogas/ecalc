
import { SalaryCalculator } from './lib/salary-engine.js';

// 1. Setup Mock Rules (Snapshot A - Standard 2026)
const rulesA = {
    salary: {
        minimum_salary: 4050,
        personal_deduction_base: 810, // Standard
        personal_deduction_range: 2000,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        untaxed_amount: 300
    }
};

// 2. Setup Mock Rules (Snapshot B - Custom Admin Change)
const rulesB = {
    salary: {
        minimum_salary: 4050,
        personal_deduction_base: 1200, // !!! CHANGED to 1200 RON
        personal_deduction_range: 2000,
        cas_rate: 25,
        cass_rate: 10,
        income_tax_rate: 10,
        untaxed_amount: 300
    }
};

console.log("=== TEST INTEGRITATE DINAMICĂ ===");

// Test A: Standard
const calcA = new SalaryCalculator(rulesA);
const resA = calcA.calculateStandard(4000);
console.log(`\n[SNAPSHOT A] Base 810 | Gross 4000`);
console.log(`Deducere aplicată: ${resA.personalDeduction} RON (Expected: 810)`);
console.log(`Net rezultat: ${resA.net} RON`);

// Test B: Custom (Admin Change)
const calcB = new SalaryCalculator(rulesB);
const resB = calcB.calculateStandard(4000);
console.log(`\n[SNAPSHOT B] Base 1200 | Gross 4000`);
console.log(`Deducere aplicată: ${resB.personalDeduction} RON (Expected: 1200)`);
console.log(`Net rezultat: ${resB.net} RON`);

if (resB.personalDeduction === 1200) {
    console.log("✅ SUCCESS: Motorul a citit valoarea din Snapshot, NU pe cea hardcodată.");
} else {
    console.error("❌ FAIL: Motorul a ignorat Snapshot-ul B.");
}

// Test C: Calcul Invers (Net -> Brut) cu reguli B
console.log(`\n[TEST INVERS] Căutăm Brutul pentru Net-ul generat de Snapshot B (${resB.net})`);
const resReverse = calcB.calculateNetToGross(resB.net);
console.log(`Brut Găsit: ${resReverse.gross} (Expected: 4000)`);

if (Math.abs(resReverse.gross - 4000) < 1) {
    console.log("✅ SUCCESS: Calculul invers respectă și el Snapshot-ul B.");
} else {
    console.error(`❌ FAIL: Calculul invers a dat ${resReverse.gross}.`);
}
