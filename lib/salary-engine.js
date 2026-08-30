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
        // FIX (audit 2026-08-11): tracks which REQUIRED fiscal keys were missing from the
        // database for this calculation. Previously a missing rate silently became 0% —
        // now it's still 0% (we don't invent fiscal values), but it's recorded and surfaced
        // on the result instead of vanishing. See getRequiredRule() below.
        this._warnings = [];
    }

    getRule(key) {
        return this.rules[key] !== undefined ? this.rules[key] : DEFAULT_RULES[key];
    }

    // Same lookup as getRule(), but for keys where a missing value is a configuration bug,
    // not a legitimate "off" state (a contribution rate, a sector minimum wage, etc).
    // Records the gap instead of failing silently.
    getRequiredRule(key, label) {
        if (this.rules[key] === undefined) {
            this._warnings.push({ key, label: label || key });
        }
        return this.getRule(key);
    }

    calculatePersonalDeduction(grossSalary, isBasicFunction = true) {
        if (!isBasicFunction) return 0;

        // 1. EXTRACT RULES (Strict Dynamic Fetching)
        const minWage = this.getRule('minimum_salary');
        const deductionPercent = this.getRule('personal_deduction_percent') || 0;
        const range = this.getRule('personal_deduction_range') || 2000;

        // 2. DP Base: Prefer absolute value, fallback to percentage.
        // CORRECTION (audit 2026-08-11): a first pass changed this `||` to `??`, reasoning that
        // an explicit personal_deduction_base = 0 should mean "no deduction". Reverted after
        // regression-testing against the existing test suite: tests/manual-scripts/
        // test_percentage_deduction.mjs encodes the OPPOSITE, deliberate convention —
        // `personal_deduction_base: 0` is the documented way to say "ignore the fixed base,
        // use personal_deduction_percent instead" — and that test was passing before the `??`
        // change and broken by it. Keeping `||` preserves the established, tested behavior.
        // (If you actually want a way to configure a hard zero deduction, that's a real product
        // decision — worth a dedicated flag rather than overloading what "0" means here.)
        const deductionBase = this.getRule('personal_deduction_base') || Math.round(minWage * (deductionPercent / 100));

        // 3. APPLY REGRESSIVE LOGIC (BUSINESS_LOGIC.md)
        if (grossSalary <= minWage) return deductionBase;
        if (grossSalary > minWage + range) return 0;

        // CORRECTION (audit 2026-08-12): this used to be a smooth linear regression
        // (DB * (1 - (gross-min)/range)) — verified against multiple independent sources
        // (including an official ANAF communication, ✅ good for the eligibility rule, but it
        // doesn't publish the actual bracket table) that Art. 77 Codul Fiscal does NOT phase the
        // deduction out linearly. The percentage steps DOWN in fixed 50 RON gross increments,
        // losing (personal_deduction_percent / (range/50)) percentage points per step — e.g.
        // at the standard 20% / 2000 RON config, that's -0.5 percentage points per 50 RON.
        // A smooth line only agrees with the real stepped function at the two endpoints
        // (gross = minWage and gross = minWage + range) — everywhere in between it can be off
        // by a few RON, which is exactly the discrepancy this correction was written to close.
        // Step boundary uses Math.ceil, not Math.floor — i.e. brackets are (minWage, minWage+50],
        // (minWage+50, minWage+100], ... — confirmed against two independent reference points
        // (5000 RON gross → 562 RON deduction, 6000 RON gross → 130 RON deduction, at the
        // current 4325 RON minimum wage): Math.ceil reproduces BOTH exactly; Math.floor missed
        // both by a full step. Not a primary legislative source, but two matching data points
        // from an independent site is real corroboration, not a guess — much stronger footing
        // than the previous smooth-line implementation had.
        if (deductionPercent > 0) {
            const stepRon = 50;
            const totalSteps = range / stepRon;
            const percentPerStep = deductionPercent / totalSteps;
            const currentStep = Math.ceil((grossSalary - minWage) / stepRon);
            const currentPercent = Math.max(0, deductionPercent - percentPerStep * currentStep);
            return Math.round(deductionBase * (currentPercent / deductionPercent));
        }

        // Fallback if no percent is configured at all (can't derive steps) — old smooth line.
        return Math.round(deductionBase * (1 - (grossSalary - minWage) / range));
    }

    calculateStandard(grossSalary, options = {}) {
        const { isBasicFunction = true, isPartTime = false, isStudentOrPensioner = false } = options;

        // 0. FETCH BASE RULES (Strictly Dynamic)
        // FIX (audit 2026-08-11): these four are contribution/tax RATES — a missing one used to
        // silently become 0% (nobody pays that contribution). getRequiredRule() still returns 0
        // (we're not inventing a rate), but now records the gap in this._warnings.
        const minWage = this.getRule('minimum_salary') || 0;
        const non_taxable_amount_admin = this.getRule('untaxed_amount') || 0;
        const cas_percentage = this.getRequiredRule('cas_rate', 'CAS (pensie)');
        const cass_percentage = this.getRequiredRule('cass_rate', 'CASS (sănătate)');
        const tax_percentage = this.getRequiredRule('income_tax_rate', 'Impozit pe venit');
        const cam_percentage = this.getRequiredRule('cam_rate', 'CAM (contribuție asiguratorie muncă)');

        // FEATURE (audit 2026-08-12): part-time "suprataxare" — implements Codul Fiscal art. 146/154:
        // an employee on a part-time contract earning LESS than the full minimum wage still owes
        // CAS/CASS calculated at the full minimum-wage level, not on their actual (lower) pay —
        // UNLESS they fall into an exempted category (students, retirees, disabled, unemployed
        // registered as job seekers, etc. — simplified here to a single `isStudentOrPensioner`
        // flag, matching tests/manual-scripts/test_strict_overtax.mjs; extend if you need the
        // full category list). This existed only as an unread admin toggle
        // (`part_time_overtax_enabled`) and a dangling test before this fix — never implemented.
        // Income tax is NOT affected — that stays on the real gross, only CAS/CASS use the
        // overtaxed base. This can legitimately make `net` very low or negative for a very small
        // part-time gross, which is the real, documented effect of this rule (and exactly why the
        // exemption categories exist) — not a bug.
        const partTimeOvertaxEnabled = this.getRule('part_time_overtax_enabled');
        const isOvertaxed = Boolean(isPartTime && partTimeOvertaxEnabled && !isStudentOrPensioner && grossSalary < minWage);
        const contributionGross = isOvertaxed ? minWage : grossSalary;

        // 1. Facilitate Salariu Minim (Suma Netaxabilă)
        // Logica de Prag: Daca Brut > Prag (Minim), Scutirea devine 0.
        // STRICT LEGAL: Fără toleranță. Brut <= Minim => Scutire.
        const applySN = grossSalary <= minWage;
        const non_taxable_amount = applySN ? non_taxable_amount_admin : 0;

        // 2. Formule Angajat (Baza de Calcul)
        // Baza_Contributii = MAX(0, Baza_CAS/CASS - non_taxable_amount) — Baza_CAS/CASS e
        // salariul minim în caz de suprataxare part-time, altfel venitul brut real.
        const Baza_Contributii = Math.max(0, contributionGross - non_taxable_amount);

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
            },
            // FIX (audit 2026-08-11): non-empty only when a required fiscal key was missing
            // from the database for this calculation — see getRequiredRule().
            warnings: this._warnings.slice(),
            // FEATURE (audit 2026-08-12): true when CAS/CASS above were computed on the
            // minimum wage instead of the real (lower) part-time gross — see isOvertaxed above.
            is_overtaxed: isOvertaxed
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
        // FIX (audit 2026-08-11): minWage and the sector CAS rate are required — a missing
        // minWage collapses getSectorMinimums() to {brut:0, net:0} and disables the untaxed-
        // amount facility entirely; a missing sector CAS rate means that sector pays 0% pension
        // contribution. Both are now recorded via getRequiredRule() instead of vanishing.
        const minWageKey = (sector === 'agriculture') ? 'minimum_gross_agriculture' : 'minimum_gross_construction';
        const minWage = this.getRequiredRule(minWageKey, `Salariu minim brut — ${sector}`);
        const cas_percentage = this.getRequiredRule(`${prefix}_cas_rate`, `CAS — ${sector}`);
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
            },
            warnings: this._warnings.slice()
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
        const resAtMin = this._calculateForSector(minSalary, sector, options);
        if (Math.abs(resAtMin.net - netSalary) < 1) return resAtMin; // Match exact

        // FIX (audit 2026-08-11): the untaxed-amount facility creates a real discontinuity —
        // net DROPS immediately above the minimum-wage threshold, then climbs back past the
        // old value a few hundred RON later. That means a single requested net can legitimately
        // be reachable from TWO different gross values (one below the threshold, one above),
        // and the function is not monotonic across the jump. The old code guessed which side
        // to search using `netSalary < resAtMin.net` — wrong for the entire band between the
        // post-cliff net and the pre-cliff net, where it silently returned a gross BELOW the
        // legal minimum wage for a full-time salary. Fix: search both branches independently,
        // then pick whichever result actually matches the requested net — preferring the
        // branch at/above the legal minimum on a near-tie, since that's the only one valid for
        // a standard full-time contract.
        const upperBound = Math.max(netSalary * 2.5, minSalary * 2.5, 1);

        const searchBranch = (low, high) => {
            if (low > high) return null;
            let best = null;
            let bestDiff = Infinity;
            for (let i = 0; i < 50; i++) { // 50 iterații pt precizie maximă
                if (low > high) break;
                const mid = Math.round((low + high) / 2);
                if (mid <= 0) break;

                const res = this._calculateForSector(mid, sector, options);
                const diff = res.net - netSalary;

                if (Math.abs(diff) < bestDiff) {
                    bestDiff = Math.abs(diff);
                    best = res;
                }
                if (Math.abs(diff) < 1) return { result: res, diff: 0 }; // Match găsit (toleranță 1 RON)

                if (diff < 0) low = mid + 1;
                else high = mid - 1; // Binary search standard pe intregi
            }
            return best ? { result: best, diff: bestDiff } : null;
        };

        const belowBranch = minSalary > 1 ? searchBranch(1, minSalary - 1) : null;
        const aboveBranch = searchBranch(minSalary + 1, upperBound);

        const candidates = [belowBranch, aboveBranch].filter(Boolean);
        if (candidates.length === 0) return resAtMin;

        candidates.sort((a, b) => {
            // CORRECTION (audit 2026-08-11): the first version compared the two diffs to EACH
            // OTHER (`|a.diff - b.diff| < 1`) — so a genuinely exact match (diff 0) on the
            // "below minimum" branch could lose to a merely-close (diff ~0.9) match on the
            // "above minimum" branch, just because the two diffs happened to be near each
            // other. Caught by tests/manual-scripts/test_dynamic_deduction.mjs regressing.
            // The tie-break for "prefer the legally valid branch" should only apply when BOTH
            // candidates are actually exact matches (the genuine two-roots case created by the
            // untaxed-amount cliff) — not whenever they're merely similar in quality.
            const aExact = a.diff < 1;
            const bExact = b.diff < 1;
            if (aExact && bExact) {
                const aValid = a.result.gross >= minSalary;
                const bValid = b.result.gross >= minSalary;
                if (aValid !== bValid) return aValid ? -1 : 1;
            }
            return a.diff - b.diff;
        });

        return candidates[0].result;
    }

    // Helper intern pentru a apela funcția corectă de calcul (Single Source of Truth)
    _calculateForSector(gross, sector, options) {
        if (sector === 'it') return this.calculateIT(gross, options);
        if (sector === 'construction' || sector === 'agriculture') return this.calculateConstruction(gross, options);
        return this.calculateStandard(gross, { ...options, sector });
    }

    calculateCostToNet(totalCost, sector = 'standard', options = {}) {
        // FIX (audit 2026-08-11): `mid` was never rounded, so a gross salary like 4890.625 RON
        // could come back as the "answer" — not usable as an actual contractual salary, and
        // inconsistent with calculateNetToGross() which always rounds to whole RON.
        let low = Math.round(totalCost * 0.3);
        let high = Math.round(totalCost);
        let bestGuess = low;
        for (let i = 0; i < 40; i++) {
            const mid = Math.round((low + high) / 2);
            const res = this._calculateForSector(mid, sector, options);

            if (Math.abs(res.totalCost - totalCost) < 1) return res;
            if (res.totalCost < totalCost) low = mid; else high = mid;
            bestGuess = mid;
            if (high - low <= 1) break;
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

    // FIX (audit 2026-08-11): make missing fiscal configuration loud instead of silent. This
    // does NOT change the calculated numbers (still 0% for a genuinely unconfigured rate) —
    // it just makes the gap impossible to miss in logs while the admin panel gets a proper
    // "neconfigurat" indicator (tracked separately).
    if (res?.warnings?.length) {
        console.warn(
            `[salary-engine] Calcul cu reguli fiscale incomplete (sector: ${sector}, an: ${rules?.year || '?'}):`,
            res.warnings.map(w => w.label).join(', ')
        );
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
