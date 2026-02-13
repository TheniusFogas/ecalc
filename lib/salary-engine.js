/**
 * Salary Engine - Pure Business Logic Layer
 * This file is part of the 'Sandbox Isolation' architecture.
 */

const DEFAULT_RULES = {
    minimum_salary: 0,
    minimum_gross_construction: 0,
    minimum_gross_agriculture: 0,
    minimum_gross_it: 0,
    cas_rate: 0,
    cass_rate: 0,
    income_tax_rate: 0,
    cam_rate: 0,
    untaxed_amount: 0,
    personal_deduction_percent: 0,
    personal_deduction_base: 0,
    personal_deduction_range: 0,
    child_deduction: 0,
    dependent_deduction: 0,
    it_threshold: 0,
    it_tax_exempt: false,
    it_pilon2_optional: false,
    construction_cas_rate: 0,
    construction_tax_exempt: false,
    construction_cass_exempt: false,
    agriculture_cas_rate: 0,
    agriculture_tax_exempt: false,
    tax_exemption_threshold: 0,
    youth_exemption_threshold: 0,
    youth_deduction_rate: 0,
    part_time_overtax_enabled: false
};

export class SalaryCalculator {
    constructor(fiscalRules) {
        this.rules = (fiscalRules && fiscalRules.salary) ? fiscalRules.salary : (fiscalRules || {});
    }

    getRule(key) {
        return this.rules[key] !== undefined ? this.rules[key] : DEFAULT_RULES[key];
    }


    calculatePersonalDeduction(grossSalary, isBasicFunction = true) {
        if (!isBasicFunction) return 0;

        // 1. EXTRACT RULES (Strict Dynamic Fetching)
        const minWage = this.getRule('minimum_salary');
        const deductionPercent = this.getRule('personal_deduction_percent') || 0;
        const range = this.getRule('personal_deduction_range') || 2000;

        // 2. DP Base: Prefer absolute value, fallback to percentage
        const deductionBase = this.getRule('personal_deduction_base') || Math.round(minWage * (deductionPercent / 100));

        // 3. APPLY REGRESSIVE LOGIC (BUSINESS_LOGIC.md)
        if (grossSalary <= minWage) return deductionBase;
        if (grossSalary > minWage + range) return 0;

        // Regression Formula: DB * (1 - (Gross - Min) / Range)
        return Math.round(deductionBase * (1 - (grossSalary - minWage) / range));
    }

    calculateStandard(grossSalary, options = {}) {
        const { isBasicFunction = true } = options;

        // 0. FETCH BASE RULES (Strictly Dynamic)
        const minWage = this.getRule('minimum_salary') || 0;
        const non_taxable_amount_admin = this.getRule('untaxed_amount') || 0;
        const cas_percentage = this.getRule('cas_rate') || 0;
        const cass_percentage = this.getRule('cass_rate') || 0;
        const tax_percentage = this.getRule('income_tax_rate') || 0;
        const cam_percentage = this.getRule('cam_rate') || 0;

        // 1. Facilitate Salariu Minim (Suma Netaxabilă) 
        // Logica de Prag: Daca Brut > Prag (Minim), Scutirea devine 0.
        // STRICT LEGAL: Fără toleranță. Brut <= Minim => Scutire.
        const applySN = grossSalary <= minWage;
        const non_taxable_amount = applySN ? non_taxable_amount_admin : 0;

        // 2. Formule Angajat (Baza de Calcul)
        // Baza_Contributii = MAX(0, Venit_Brut - non_taxable_amount)
        const Baza_Contributii = Math.max(0, grossSalary - non_taxable_amount);

        // CAS = Math.round(Baza_Contributii * (cas_percentage / 100))
        const cas = Math.round(Baza_Contributii * (cas_percentage / 100));

        // CASS = Math.round(Baza_Contributii * (cass_percentage / 100))
        const cass = Math.round(Baza_Contributii * (cass_percentage / 100));

        // 3. Deducere Personală
        // Deducere_Personala = min_wage * (deduction_percentage / 100) (aplica regresivitatea)
        const Deducere_Personala = this.calculatePersonalDeduction(grossSalary, isBasicFunction);

        // 4. Baza Impozit (BI)
        // Corecție: Tichetele sunt venit impozabil, dar nu contributiv.
        const Tichete_Masa = (options.mealVouchers || 0) * (options.voucherDays || 0);
        const Tichete_Vacanta = parseFloat(options.vacationVouchers) || 0;

        // Baza_Impozit = MAX(0, Venit_Brut - non_taxable_amount - CAS - CASS - Deducere_Personala + Tichete_Masa + Tichete_Vacanta)
        const Baza_Impozit = Math.max(0, grossSalary - non_taxable_amount - cas - cass - Deducere_Personala + Tichete_Masa + Tichete_Vacanta);

        // Impozit = Math.round(Baza_Impozit * (tax_percentage / 100))
        const incomeTax = Math.round(Baza_Impozit * (tax_percentage / 100));

        // 5. SALARIU NET
        // SALARIU NET = Venit_Brut - CAS - CASS - Impozit
        const netSalary = grossSalary - cas - cass - incomeTax;

        // 6. Formule Angajator (Cost Firma)
        // Baza_CAM = MAX(0, Venit_Brut - non_taxable_amount)
        const Baza_CAM = Math.max(0, grossSalary - non_taxable_amount);

        // CAM = Math.floor(Baza_CAM * (cam_percentage / 100))
        const cam = Math.floor(Baza_CAM * (cam_percentage / 100));

        // COST TOTAL = Venit_Brut + CAM
        const totalCost = grossSalary + cam;

        return {
            gross: grossSalary,
            net: netSalary,
            cas,
            cass,
            incomeTax,
            personalDeduction: Deducere_Personala,
            taxableIncome: Baza_Impozit,
            untaxedAmount: non_taxable_amount,
            cam,
            totalCost,
            breakdown: {
                casPercent: cas_percentage,
                cassPercent: cass_percentage,
                taxPercent: tax_percentage,
                camPercent: cam_percentage
            }
        };
    }

    // ... calculateIT, calculateConstruction (similarly use standard or own logic) ...

    calculateIT(grossSalary, options = {}) {
        const isTaxExemptRule = this.getRule('it_tax_exempt');
        const threshold = this.getRule('it_threshold') || 0;

        // Force Standard calculation as base (contains all dynamic rules)
        const res = this.calculateStandard(grossSalary, options);

        // IT Specific adjustment: CAS reduction (Pilon 2)
        const pilon2Rate = this.getRule('pilon2_rate') || 0;
        if (this.getRule('it_pilon2_optional')) {
            // Recalculate CAS with reduced rate
            const casPercent = res.breakdown.casPercent - pilon2Rate;
            res.cas = Math.round((grossSalary - res.untaxedAmount) * (casPercent / 100));
            res.breakdown.casPercent = casPercent;
        }

        // Apply IT Tax Exemption
        if (isTaxExemptRule) {
            if (grossSalary <= threshold) {
                res.incomeTax = 0;
                res.taxableIncome = 0;
            } else {
                // Taxable only above threshold
                const taxablePart = grossSalary - threshold;
                const Tichete = ((options.mealVouchers || 0) * (options.voucherDays || 0)) + (parseFloat(options.vacationVouchers) || 0);

                // BI = MAX(0, Venit_Impozabil - DP + Tichete)
                const BI = Math.max(0, taxablePart - res.personalDeduction + Tichete);
                res.incomeTax = Math.round(BI * (res.breakdown.taxPercent / 100));
                res.taxableIncome = BI;
            }
        }

        res.net = grossSalary - res.cas - res.cass - res.incomeTax;
        return res;
    }

    calculateConstruction(grossSalary, options = {}) {
        const sector = (options.sector === 'agriculture') ? 'agriculture' : 'construction';
        const prefix = sector;

        // 0. FETCH BASE RULES
        const minWageKey = (sector === 'agriculture') ? 'minimum_gross_agriculture' : 'minimum_gross_construction';
        const minWage = this.getRule(minWageKey) || 0;
        const cas_percentage = this.getRule(`${prefix}_cas_rate`) || 0;
        const cass_percentage = this.getRule('cass_rate') || 0;
        const tax_percentage = this.getRule('income_tax_rate') || 0;
        const cam_percentage = this.getRule('cam_rate') || 0;
        const taxExempt = this.getRule(`${prefix}_tax_exempt`);
        const cassExempt = this.getRule(`${prefix}_cass_exempt`);
        const threshold = this.getRule('tax_exemption_threshold') || 0;
        const non_taxable_amount_admin = this.getRule('untaxed_amount') || 0;

        // 1. Facilitate Salariu Minim (Suma Netaxabilă)
        // STRICT LEGAL: Fără toleranță. Brut <= Minim => Scutire.
        // Pentru a evita problema "Fiscal Cliff" la reciprocitate, pragul e fix.
        const applySN = grossSalary <= minWage;
        const non_taxable_amount = applySN ? non_taxable_amount_admin : 0;

        // 2. Formule Angajat
        const Baza_Contributii = Math.max(0, grossSalary - non_taxable_amount);
        const cas = Math.round(Baza_Contributii * (cas_percentage / 100));

        const effectiveCassRate = cassExempt ? 0 : cass_percentage;
        const cass = Math.round(Baza_Contributii * (effectiveCassRate / 100));

        const Deducere_Personala = this.calculatePersonalDeduction(grossSalary, options.isBasicFunction);

        // 3. Impozit
        let incomeTax = 0;
        let BI = 0;
        if (taxExempt && grossSalary <= threshold) {
            incomeTax = 0;
            // Note: Even if exempt from standard tax, vouchers might be taxable? 
            // Legal nuance: Usually the exemption covers all salary income. 
            // User formula: MAX(0, Venit_Brut - SN - CAS - CASS - DP + Tichete)
            // If taxExempt, we assume BI=0 unless part-taxable.
        } else {
            const Tichete = ((options.mealVouchers || 0) * (options.voucherDays || 0)) + (parseFloat(options.vacationVouchers) || 0);
            // Apply standard BI formula if not exempt
            BI = Math.max(0, grossSalary - non_taxable_amount - cas - cass - Deducere_Personala + Tichete);
            incomeTax = Math.round(BI * (tax_percentage / 100));
        }

        // 4. Formule Angajator
        const Baza_CAM = Math.max(0, grossSalary - non_taxable_amount);
        const cam = Math.floor(Baza_CAM * (cam_percentage / 100));
        const totalCost = grossSalary + cam;

        return {
            gross: grossSalary,
            net: grossSalary - cas - cass - incomeTax,
            cas,
            cass,
            incomeTax,
            personalDeduction: Deducere_Personala,
            taxableIncome: BI,
            untaxedAmount: non_taxable_amount,
            cam,
            totalCost,
            breakdown: {
                casPercent: cas_percentage,
                cassPercent: effectiveCassRate,
                taxPercent: tax_percentage,
                camPercent: cam_percentage
            }
        };
    }

    /**
     * Calculează Brut pornind de la Net (Binary Search Robust cu suport pentru Discontinuități)
     */
    calculateNetToGross(netSalary, sector = 'standard', options = {}) {
        // 1. Check "Cliff" Point (Salariu Minim)
        // Discontinuitatea "Untaxed Amount" (200/300 RON) crează o scădere a Netului imediat după prag.
        const minSalary = sector === 'construction' ? this.getRule('minimum_gross_construction') :
            sector === 'agriculture' ? this.getRule('minimum_gross_agriculture') :
                sector === 'it' ? this.getRule('minimum_gross_it') :
                    this.getRule('minimum_salary');

        // Calculăm Net-ul EXACT la pragul de Salariu Minim
        let resMin = this._calculateForSector(minSalary, sector, options);
        if (Math.abs(resMin.net - netSalary) < 1) return resMin; // Match exact

        // 2. Binary Search Logic
        // Dacă net-ul căutat e mai mic decât net-ul la minim, căutăm sub minim (funcție monotonă)
        // Dacă e mai mare, căutăm peste minim (funcție monotonă, dar cu start shiftat)
        let low, high;

        if (netSalary < resMin.net) {
            low = netSalary;
            high = minSalary; // Căutăm DOAR sub prag
        } else {
            low = minSalary + 1; // Sărim peste "groapa" creată de pierderea facilităților
            high = netSalary * 2.5; // Estimare superioară
        }

        let bestResult = resMin;
        let minDiff = Math.abs(resMin.net - netSalary);

        for (let i = 0; i < 50; i++) { // 50 iterații pt precizie maximă
            const mid = Math.round((low + high) / 2);
            if (mid <= 0) break;

            const res = this._calculateForSector(mid, sector, options);
            const diff = res.net - netSalary;

            if (Math.abs(diff) < minDiff) {
                minDiff = Math.abs(diff);
                bestResult = res;
            }

            if (Math.abs(diff) < 1) return res; // Match găsit (toleranță 1 RON)

            if (diff < 0) {
                low = mid + 1;
            } else {
                high = mid - 1; // Binary search standard pe intregi
            }
        }

        return bestResult;
    }

    // Helper intern pentru a apela funcția corectă de calcul (Single Source of Truth)
    _calculateForSector(gross, sector, options) {
        if (sector === 'it') return this.calculateIT(gross, options);
        if (sector === 'construction' || sector === 'agriculture') return this.calculateConstruction(gross, options);
        return this.calculateStandard(gross, { ...options, sector });
    }

    calculateCostToNet(totalCost, sector = 'standard', options = {}) {
        // ... existing simple binary search is likely fine for CostToNet as Cost is monotonic ...
        // But for consistency let's use the helper
        let low = totalCost * 0.3;
        let high = totalCost;
        let bestGuess = low;
        for (let i = 0; i < 40; i++) {
            const mid = (low + high) / 2;
            const res = this._calculateForSector(mid, sector, options);

            if (Math.abs(res.totalCost - totalCost) < 1) return res;
            if (res.totalCost < totalCost) low = mid; else high = mid;
            bestGuess = mid;
        }
        return this._calculateForSector(bestGuess, sector, options);
    }
}


export const calculateSalaryResults = (inputValue, calculationType, sector, rules, options = {}) => {
    if (!rules || !inputValue) return null;
    const calculator = new SalaryCalculator(rules);
    const value = parseFloat(inputValue);
    if (isNaN(value)) return null;
    const calcOptions = { ...options, sector };
    let res;
    if (calculationType === 'brut-net') {
        if (sector === 'it') res = calculator.calculateIT(value, calcOptions);
        else if (sector === 'construction' || sector === 'agriculture') res = calculator.calculateConstruction(value, calcOptions);
        else res = calculator.calculateStandard(value, calcOptions);
    } else if (calculationType === 'net-brut') res = calculator.calculateNetToGross(value, sector, calcOptions);
    else res = calculator.calculateCostToNet(value, sector, calcOptions);

    if (options.isTaxExempt) {
        res.net += res.incomeTax;
        res.incomeTax = 0;
    } else if (options.isYouthExempt) {
        const threshold = calculator.getRule('youth_exemption_threshold');
        if (res.gross <= threshold) {
            res.net += res.incomeTax;
            res.incomeTax = 0;
        }
    }
    return res;
};

export const getSectorMinimums = (sector, rules, options = {}) => {
    const calc = new SalaryCalculator(rules);
    let brut = sector === 'construction' ? calc.getRule('minimum_gross_construction') : (sector === 'agriculture' ? calc.getRule('minimum_gross_agriculture') : (sector === 'it' ? calc.getRule('minimum_gross_it') : calc.getRule('minimum_salary')));
    const sRules = (rules || {}).salary || {};
    let net = sector === 'construction' ? sRules.minimum_net_construction : (sector === 'agriculture' ? sRules.minimum_net_agriculture : (sector === 'it' ? sRules.minimum_net_it : sRules.minimum_net));
    if (!net) {
        const res = calculateSalaryResults(brut, 'brut-net', sector, rules, { ...options, isPartTime: false, isPartTimeExempt: true });
        net = Math.floor(res?.net || 0);
    }
    return { brut, net };
};

export const getBNRExchangeRate = async (currency = 'EUR') => {
    try {
        const res = await fetch('https://www.bnr.ro/nbrfxrates.xml');
        const text = await res.text();
        const match = text.match(new RegExp(`<Rate currency="${currency}"[^>]*>([0-9.]+)</Rate>`));
        return match ? parseFloat(match[1]) : 0;
    } catch (e) { return 0; }
};
