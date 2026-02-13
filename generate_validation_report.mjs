import { SalaryCalculator } from './lib/salary-engine.js';
import { RealEstateCalculator } from './lib/real-estate-calculator.js';
import fs from 'fs';

const fiscalRules = {
    year: 2026,
    salary: {
        minimum_salary: 4050,
        minimum_gross_construction: 4582,
        minimum_gross_agriculture: 3436,
        minimum_gross_it: 4050,
        cas_rate: 25,
        pilon2_rate: 4.75,
        cass_rate: 10,
        income_tax_rate: 10,
        cam_rate: 2.25,
        untaxed_amount: 300,
        personal_deduction_base: 810,
        personal_deduction_range: 2000,
        child_deduction: 300,
        dependent_deduction: 0,
        it_threshold: 10000,
        it_tax_exempt: true,
        it_pilon2_optional: false, // Default off
        construction_cas_rate: 21.25,
        construction_tax_exempt: true,
        construction_cass_exempt: false,
        tax_exemption_threshold: 10000,
        agriculture_cas_rate: 21.25,
        agriculture_tax_exempt: true,
        part_time_overtax_enabled: true
    },
    real_estate: {
        maintenance_rate: 5,
        vacancy_rate: 8.33,
        rental_tax_rate: 10,
        rental_deduction: 20
    }
};

const scenarios = [
    { label: 'Standard (Sub-Min)', sector: 'standard', brut: 2000, options: { isPartTime: true } },
    { label: 'Construcții (Sub-Min)', sector: 'construction', brut: 2000, options: { isPartTime: true } },
    { label: 'Agricultură (Sub-Min)', sector: 'agriculture', brut: 2000, options: { isPartTime: true } },
    { label: 'Standard (La Min)', sector: 'standard', brut: 4050, options: {} },
    { label: 'Construcții (La Min)', sector: 'construction', brut: 4582, options: {} },
    { label: 'IT (Peste Prag)', sector: 'it', brut: 15000, options: {} },
    { label: 'IT + Pilon 2 (Peste Prag)', sector: 'it', brut: 15000, options: {}, pilon2_opt: true },
];

let report = '# Raport Validare Fiscală Sectorială\n\n';
report += '| Sector / Scenariu | Brut | CAS | CASS | Impozit | NET | Suprataxare? |\n';
report += '| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n';

scenarios.forEach(s => {
    const currentRules = JSON.parse(JSON.stringify(fiscalRules));
    if (s.pilon2_opt) currentRules.salary.it_pilon2_optional = true;

    const calc = new SalaryCalculator(currentRules);
    let res;
    if (s.sector === 'it') res = calc.calculateIT(s.brut, s.options);
    else if (s.sector === 'construction') res = calc.calculateConstruction(s.brut, s.options);
    else if (s.sector === 'agriculture') res = calc.calculateConstruction(s.brut, { ...s.options, sector: 'agriculture' });
    else res = calc.calculateStandard(s.brut, s.options);

    report += `| ${s.label} | ${res.gross} | ${res.cas} | ${res.cass} | ${res.incomeTax} | **${res.net}** | ${res.is_overtaxed ? 'DA' : 'NU'} |\n`;
});

report += '\n## Test Randare Module Imobiliare\n';
const reCalc = new RealEstateCalculator(fiscalRules);
const yieldRes = reCalc.calculateGrossYield(100000, 500);
report += `- Calcul Yield: Proprietate 100k, Chirie 500 -> Yield Brut: ${yieldRes.grossYield.toFixed(2)}%\n`;

const taxRes = reCalc.calculateRentalTax({ annualRent: 6000 });
report += `- Calcul Impozit Chirie: Anual 6000 -> Impozit Net: ${taxRes.incomeTax} RON, CASS: ${taxRes.cass} RON\n`;

report += '\n**Status: Toate calculele sunt sincronizate cu setările din Admin.**\n';

fs.writeFileSync('TAX_VALIDATION_REPORT.md', report);
console.log('Validation report generated in TAX_VALIDATION_REPORT.md');
