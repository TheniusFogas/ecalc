
import { mapDbToFiscalRules } from './lib/data-mapper.js';

const mockDbRecord = {
    year: 2026,
    salary: {
        minimum_salary: 4050,
        personal_deduction_percent: 25, // Admin Value
        // personal_deduction_base is MISSING (as expected in new system)
    }
};

console.log("=== TEST DATA MAPPER SYNC ===");
const mapped = mapDbToFiscalRules(mockDbRecord);

console.log(`DB Input Percent: ${mockDbRecord.salary.personal_deduction_percent}`);
console.log(`Mapped Output Percent: ${mapped.salary.personal_deduction_percent}`);
console.log(`Mapped Output Base: ${mapped.salary.personal_deduction_base}`);

if (mapped.salary.personal_deduction_percent === 25) {
    console.log("✅ SUCCESS: Mapperul propagă procentul către Frontend.");
} else {
    console.error("❌ FAIL: Mapperul a pierdut procentul.");
}
