// PFA (Persoană Fizică Autorizată) Calculator Engine
// Compară Sistem Real vs. Normă de Venit conform Cod Fiscal 2025-2026

export class PFACalculator {
  constructor(fiscalRules) {
    this.rules = fiscalRules.pfa;
    this.salaryRules = fiscalRules.salary;
  }

  // Calculează CASS obligatoriu bazat pe venit
  calculateCASSThreshold(yearlyIncome) {
    const minSalary = this.rules.minimum_salary || 4050;
    const cassRate = (this.rules.cass_rate || 10) / 100;

    const minThreshold = minSalary * (this.rules.cass_min_threshold || 6); // 6 salarii minime
    const maxThreshold = minSalary * (this.rules.cass_max_threshold || 60); // 60 salarii minime

    if (yearlyIncome < minThreshold) {
      // Sub 6 salarii minime - CASS opțional
      return {
        base: 0,
        cass: 0,
        isOptional: true,
        threshold: minThreshold,
      };
    } else if (yearlyIncome > maxThreshold) {
      // Peste 60 salarii minime - plafon maxim
      return {
        base: maxThreshold,
        cass: maxThreshold * cassRate,
        isOptional: false,
        threshold: maxThreshold,
        capped: true,
      };
    } else {
      // Între 6 și 60 salarii minime
      return {
        base: yearlyIncome,
        cass: yearlyIncome * cassRate,
        isOptional: false,
        threshold: minThreshold,
      };
    }
  }

  // Calculează CAS obligatoriu bazat pe venit
  calculateCASThreshold(yearlyIncome) {
    const minSalary = this.rules.minimum_salary || 4050;
    const casRate = (this.rules.cas_rate || 25) / 100;

    const threshold12 = minSalary * 12 * (this.rules.cas_obligatory_12 || 12);
    const threshold24 = minSalary * 12 * (this.rules.cas_obligatory_24 || 24);

    if (yearlyIncome < threshold12) {
      // Sub 12 salarii minime/an - CAS opțional
      return {
        base: 0,
        cas: 0,
        isOptional: true,
        threshold: threshold12,
        years: 0,
      };
    } else if (yearlyIncome >= threshold12 && yearlyIncome < threshold24) {
      // Între 12 și 24 salarii minime
      return {
        base: minSalary * 12,
        cas: minSalary * 12 * casRate,
        isOptional: false,
        threshold: threshold12,
        years: 0.5, // jumătate de an stagiu
      };
    } else {
      // Peste 24 salarii minime
      return {
        base: minSalary * 24,
        cas: minSalary * 24 * casRate,
        isOptional: false,
        threshold: threshold24,
        years: 1, // un an stagiu
      };
    }
  }

  // SISTEM REAL - calcul complet
  calculateSistemReal(yearlyIncome, yearlyExpenses = 0, options = {}) {
    const taxRate = (this.rules.income_tax_rate || 10) / 100;

    // Venit net = Venit brut - Cheltuieli deductibile
    const netIncome = Math.max(0, yearlyIncome - yearlyExpenses);

    // Calcul CASS
    const cassInfo = this.calculateCASSThreshold(netIncome);
    const cass = options.optOutCASS && cassInfo.isOptional ? 0 : cassInfo.cass;

    // Calcul CAS
    const casInfo = this.calculateCASThreshold(netIncome);
    const cas = options.optOutCAS && casInfo.isOptional ? 0 : casInfo.cas;

    // Baza impozabilă = Venit net - CAS - CASS
    const taxableIncome = Math.max(0, netIncome - cas - cass);

    // Impozit pe venit
    const incomeTax = taxableIncome * taxRate;

    // Venit net după toate taxele
    const finalNet = netIncome - cas - cass - incomeTax;

    // Rata efectivă de impozitare
    const effectiveRate = yearlyIncome > 0 ? ((cas + cass + incomeTax) / yearlyIncome) * 100 : 0;

    return {
      type: 'sistem_real',
      yearlyIncome,
      yearlyExpenses,
      netIncome,
      cas,
      casInfo,
      cass,
      cassInfo,
      taxableIncome,
      incomeTax,
      finalNet,
      monthlyNet: finalNet / 12,
      totalTaxes: cas + cass + incomeTax,
      effectiveRate,
    };
  }

  // NORMĂ DE VENIT - calcul complet
  calculateNormaVenit(normAmount, options = {}) {
    const taxRate = (this.rules.income_tax_rate || 10) / 100;

    // La normă de venit, CASS se aplică pe normă
    const cassInfo = this.calculateCASSThreshold(normAmount);
    const cass = options.optOutCASS && cassInfo.isOptional ? 0 : cassInfo.cass;

    // CAS pe normă
    const casInfo = this.calculateCASThreshold(normAmount);
    const cas = options.optOutCAS && casInfo.isOptional ? 0 : casInfo.cas;

    // Impozit pe normă (fără deduceri)
    const incomeTax = normAmount * taxRate;

    // Total taxe
    const totalTaxes = cas + cass + incomeTax;

    return {
      type: 'norma_venit',
      normAmount,
      cas,
      casInfo,
      cass,
      cassInfo,
      incomeTax,
      totalTaxes,
      // Venitul real rămâne nelimitat, plătești doar pe normă
      effectiveRate: (totalTaxes / normAmount) * 100,
    };
  }

  // Comparație Sistem Real vs Normă de Venit
  compare(yearlyIncome, yearlyExpenses, normAmount, options = {}) {
    const sistemReal = this.calculateSistemReal(yearlyIncome, yearlyExpenses, options);
    const normaVenit = this.calculateNormaVenit(normAmount, options);

    // La normă, venitul real nu e taxat, doar norma
    // Deci venitul net real = Venit - Cheltuieli - Taxe pe Normă
    const normaFinalNet = yearlyIncome - yearlyExpenses - normaVenit.totalTaxes;

    const difference = normaFinalNet - sistemReal.finalNet;
    const betterOption = difference > 0 ? 'norma_venit' : 'sistem_real';

    return {
      sistemReal,
      normaVenit: {
        ...normaVenit,
        actualIncome: yearlyIncome,
        actualExpenses: yearlyExpenses,
        finalNet: normaFinalNet,
        monthlyNet: normaFinalNet / 12,
      },
      comparison: {
        difference: Math.abs(difference),
        betterOption,
        yearlySavings: Math.abs(difference),
        monthlySavings: Math.abs(difference) / 12,
        recommendation: betterOption === 'norma_venit'
          ? `Norma de Venit este mai avantajoasă cu ${Math.abs(difference).toFixed(2)} RON/an`
          : `Sistemul Real este mai avantajos cu ${Math.abs(difference).toFixed(2)} RON/an`,
      },
    };
  }

  // Calculează pragul de rentabilitate (break-even)
  calculateBreakEven(normAmount, expenseRate = 0) {
    const taxRate = (this.rules.income_tax_rate || 10) / 100;

    // La ce venit anual devine Sistemul Real mai avantajos?
    // Depinde de cheltuieli și normă

    // Normă taxe fixe
    const normaTaxes = this.calculateNormaVenit(normAmount).totalTaxes;

    // Iterăm pentru a găsi pragul
    let breakEvenIncome = normAmount;
    for (let income = normAmount; income <= normAmount * 10; income += 1000) {
      const expenses = income * expenseRate;
      const sistemReal = this.calculateSistemReal(income, expenses);
      const normaNet = income - expenses - normaTaxes;

      if (sistemReal.finalNet > normaNet) {
        breakEvenIncome = income;
        break;
      }
    }

    return {
      breakEvenIncome,
      normAmount,
      expenseRate: expenseRate * 100,
      message: `Sistemul Real devine mai avantajos la venituri peste ${breakEvenIncome.toFixed(0)} RON/an`,
    };
  }

  // Simulare SRL (Microîntreprindere) pentru comparație
  calculateSRL(yearlyRevenue, yearlyExpenses = 0, employeesCount = 0, options = {}) {
    // Impozit microîntreprindere
    let microTaxRate;
    if (employeesCount === 0) {
      microTaxRate = 3; // 3% fără angajați
    } else {
      microTaxRate = 1; // 1% cu angajați
    }

    const profit = yearlyRevenue - yearlyExpenses;
    const microTax = yearlyRevenue * (microTaxRate / 100);

    // Dacă se extrag dividende
    const dividendTaxRate = this.rules.dividend_tax_rate || 8; // Impozit dividende din Admin (sau 8 default)
    const cassDividendRate = 10; // CASS pe dividende

    const profitAfterMicroTax = profit - microTax;
    const dividendTax = profitAfterMicroTax * (dividendTaxRate / 100);

    // CASS pe dividende doar dacă depășește plafonul
    const minSalary = this.rules.minimum_salary || 4050;
    const cassThreshold = minSalary * (this.rules.cass_min_threshold || 6);
    let cassDividend = 0;
    if (profitAfterMicroTax > cassThreshold) {
      cassDividend = Math.min(profitAfterMicroTax, minSalary * 60) * (cassDividendRate / 100);
    }

    const netDividend = profitAfterMicroTax - dividendTax - cassDividend;
    const totalTaxes = microTax + dividendTax + cassDividend;

    return {
      type: 'srl_micro',
      yearlyRevenue,
      yearlyExpenses,
      profit,
      microTaxRate,
      microTax,
      dividendTax,
      cassDividend,
      netDividend,
      monthlyNet: netDividend / 12,
      totalTaxes,
      effectiveRate: yearlyRevenue > 0 ? (totalTaxes / yearlyRevenue) * 100 : 0,
    };
  }

  // Comparație completă PFA vs SRL
  fullComparison(yearlyIncome, yearlyExpenses, normAmount, options = {}) {
    const sistemReal = this.calculateSistemReal(yearlyIncome, yearlyExpenses, options);
    const normaVenit = this.calculateNormaVenit(normAmount, options);
    const srl = this.calculateSRL(yearlyIncome, yearlyExpenses, options.employees || 0, options);

    // Normă net real
    const normaFinalNet = yearlyIncome - yearlyExpenses - normaVenit.totalTaxes;

    const results = [
      { type: 'PFA Sistem Real', net: sistemReal.finalNet, taxes: sistemReal.totalTaxes, rate: sistemReal.effectiveRate },
      { type: 'PFA Normă Venit', net: normaFinalNet, taxes: normaVenit.totalTaxes, rate: (normaVenit.totalTaxes / yearlyIncome) * 100 },
      { type: 'SRL Micro', net: srl.netDividend, taxes: srl.totalTaxes, rate: srl.effectiveRate },
    ];

    results.sort((a, b) => b.net - a.net);

    return {
      sistemReal,
      normaVenit: { ...normaVenit, finalNet: normaFinalNet, monthlyNet: normaFinalNet / 12 },
      srl,
      ranking: results,
      bestOption: results[0],
      recommendation: `Cea mai avantajoasă opțiune: ${results[0].type} cu ${results[0].net.toFixed(2)} RON/an net`,
    };
  }
}

// Utilitar: Calculează norma de venit pentru diferite activități
export const NORME_VENIT_2026 = {
  'it_programare': 45000,
  'it_consultanta': 50000,
  'contabilitate': 35000,
  'avocatura': 60000,
  'medicina': 80000,
  'arhitectura': 45000,
  'constructii': 40000,
  'transport_marfa': 35000,
  'transport_persoane': 30000,
  'comert_ambulant': 20000,
  'turism': 35000,
  'restaurant': 45000,
  'frizerie_coafura': 25000,
  'reparatii_auto': 35000,
  'agricultura': 15000,
};

export function getNormaVenit(activity) {
  return NORME_VENIT_2026[activity] || 30000;
}
