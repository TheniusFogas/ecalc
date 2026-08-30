// Break-even Point Calculator for Decision Maker
// Calculează pragurile exacte la care devine mai avantajoasă o formă juridică față de alta

export class BreakEvenCalculator {
  constructor(fiscalRules) {
    this.rules = fiscalRules;
  }

  // Calculează break-even între Salariu și PFA Sistem Real
  calculateSalaryToPFABreakeven(expenseRate = 30) {
    // Incrementăm venitul până găsim punctul de break-even
    let income = 10000; // Start la 10k
    const step = 1000;
    const maxIncome = 500000;
    
    let breakEvenPoint = null;
    let previousDiff = null;

    while (income <= maxIncome) {
      const salaryNet = this.calculateSalaryNet(income);
      const pfaNet = this.calculatePFARealNet(income, income * (expenseRate / 100));
      
      const diff = pfaNet - salaryNet;
      
      if (previousDiff !== null && previousDiff < 0 && diff > 0) {
        // Am trecut punctul de break-even
        breakEvenPoint = income;
        break;
      }
      
      previousDiff = diff;
      income += step;
    }

    return {
      breakEvenIncome: breakEvenPoint,
      message: breakEvenPoint 
        ? `La venit ${this.formatCurrency(breakEvenPoint)} RON/an, PFA Sistem Real devine mai avantajos decât Salariu`
        : 'PFA Sistem Real nu devine mai avantajos în intervalul calculat',
      expenseRate,
    };
  }

  // Calculează break-even între PFA Sistem Real și Normă de Venit
  calculateRealToNormBreakeven(normValue, expenseRate = 30) {
    let income = 10000;
    const step = 1000;
    const maxIncome = 300000;
    
    let breakEvenPoint = null;
    let previousDiff = null;

    while (income <= maxIncome) {
      const realNet = this.calculatePFARealNet(income, income * (expenseRate / 100));
      const normNet = this.calculatePFANormNet(income, normValue);
      
      const diff = normNet - realNet;
      
      if (previousDiff !== null && previousDiff < 0 && diff > 0) {
        breakEvenPoint = income;
        break;
      }
      
      previousDiff = diff;
      income += step;
    }

    return {
      breakEvenIncome: breakEvenPoint,
      message: breakEvenPoint
        ? `La venit ${this.formatCurrency(breakEvenPoint)} RON/an, Norma de Venit devine mai avantajoasă decât Sistem Real`
        : 'Norma de Venit nu devine mai avantajoasă în intervalul calculat',
      normValue,
      expenseRate,
    };
  }

  // Calculează break-even între PFA și SRL Micro
  calculatePFAToSRLBreakeven(expenseRate = 30, employees = 0) {
    const microTaxRate = employees > 0 ? 1 : 3;
    
    let income = 10000;
    const step = 1000;
    const maxIncome = 500000;
    
    let breakEvenPoint = null;
    let previousDiff = null;

    while (income <= maxIncome) {
      const pfaNet = this.calculatePFARealNet(income, income * (expenseRate / 100));
      const srlNet = this.calculateSRLNet(income, income * (expenseRate / 100), microTaxRate);
      
      const diff = srlNet - pfaNet;
      
      if (previousDiff !== null && previousDiff < 0 && diff > 0) {
        breakEvenPoint = income;
        break;
      }
      
      previousDiff = diff;
      income += step;
    }

    return {
      breakEvenIncome: breakEvenPoint,
      message: breakEvenPoint
        ? `La venit ${this.formatCurrency(breakEvenPoint)} RON/an, SRL Micro (${microTaxRate}%) devine mai avantajos decât PFA`
        : 'SRL Micro nu devine mai avantajos în intervalul calculat',
      microTaxRate,
      expenseRate,
    };
  }

  // Calculează net pentru salariu
  calculateSalaryNet(annualGross) {
    const monthlyGross = annualGross / 12;
    const casRate = (this.rules.salary?.cas_rate || 25) / 100;
    const cassRate = (this.rules.salary?.cass_rate || 10) / 100;
    const taxRate = (this.rules.salary?.income_tax_rate || 10) / 100;
    const personalDeduction = this.rules.salary?.personal_deduction_base || 510;

    const cas = monthlyGross * casRate;
    const cass = monthlyGross * cassRate;
    const taxableIncome = Math.max(0, monthlyGross - cas - cass - personalDeduction);
    const incomeTax = taxableIncome * taxRate;
    const monthlyNet = monthlyGross - cas - cass - incomeTax;

    return monthlyNet * 12;
  }

  // Calculează net pentru PFA Sistem Real
  calculatePFARealNet(income, expenses) {
    const minSalary = this.rules.pfa?.minimum_salary || 4050;
    const netIncome = income - expenses;
    const incomeTax = netIncome * ((this.rules.pfa?.income_tax_rate || 10) / 100);
    
    // CASS
    const minThreshold = minSalary * (this.rules.pfa?.cass_min_threshold || 6);
    const maxThreshold = minSalary * (this.rules.pfa?.cass_max_threshold || 60);
    let cassBase = Math.max(netIncome, minThreshold);
    cassBase = Math.min(cassBase, maxThreshold);
    const cass = cassBase * ((this.rules.pfa?.cass_rate || 10) / 100);
    
    // CAS
    const threshold12 = minSalary * 12;
    const threshold24 = minSalary * 24;
    let cas = 0;
    if (netIncome >= threshold24) {
      cas = threshold24 * ((this.rules.pfa?.cas_rate || 25) / 100);
    } else if (netIncome >= threshold12) {
      cas = threshold12 * ((this.rules.pfa?.cas_rate || 25) / 100);
    }
    
    const totalTaxes = incomeTax + cass + cas;
    return income - expenses - totalTaxes;
  }

  // Calculează net pentru PFA Normă de Venit
  calculatePFANormNet(actualIncome, normValue) {
    const minSalary = this.rules.pfa?.minimum_salary || 4050;
    const incomeTax = normValue * ((this.rules.pfa?.income_tax_rate || 10) / 100);
    
    // CASS pe normă
    const minThreshold = minSalary * (this.rules.pfa?.cass_min_threshold || 6);
    const maxThreshold = minSalary * (this.rules.pfa?.cass_max_threshold || 60);
    let cassBase = Math.max(normValue, minThreshold);
    cassBase = Math.min(cassBase, maxThreshold);
    const cass = cassBase * ((this.rules.pfa?.cass_rate || 10) / 100);
    
    // CAS pe normă
    const threshold12 = minSalary * 12;
    const threshold24 = minSalary * 24;
    let cas = 0;
    if (normValue >= threshold24) {
      cas = threshold24 * ((this.rules.pfa?.cas_rate || 25) / 100);
    } else if (normValue >= threshold12) {
      cas = threshold12 * ((this.rules.pfa?.cas_rate || 25) / 100);
    }
    
    const totalTaxes = incomeTax + cass + cas;
    return actualIncome - totalTaxes;
  }

  // Calculează net pentru SRL Micro
  calculateSRLNet(revenue, expenses, microTaxRate) {
    const minSalary = this.rules.pfa?.minimum_salary || 4050;
    const profit = revenue - expenses;
    const microTax = revenue * (microTaxRate / 100);
    const grossDividend = profit - microTax;
    // FIX (audit 2026-08-11): was hardcoded to 0.08 regardless of admin config — inconsistent
    // with lib/pfa-calculator.js's calculateSRL(), which already reads dividend_tax_rate from
    // the same fiscal_rules.pfa document. Same source now, same result for the same scenario
    // whether the user reaches it via PFA vs SRL comparison or via Decision Maker break-even.
    const dividendTaxRate = (this.rules.pfa?.dividend_tax_rate || 10) / 100;
    const dividendTax = grossDividend * dividendTaxRate;
    
    // CASS pe dividende (10% peste 24 salarii)
    const dividendThreshold = minSalary * 24;
    let cassDividend = 0;
    if (grossDividend > dividendThreshold) {
      cassDividend = grossDividend * 0.10;
    }
    
    const netDividend = grossDividend - dividendTax - cassDividend;
    return netDividend;
  }

  // Generează tabel complet cu toate punctele de tranziție
  generateBreakEvenTable(expenseRate = 30, normValue = 50000) {
    const salaryToPFA = this.calculateSalaryToPFABreakeven(expenseRate);
    const realToNorm = this.calculateRealToNormBreakeven(normValue, expenseRate);
    const pfaToSRL0 = this.calculatePFAToSRLBreakeven(expenseRate, 0);
    const pfaToSRL1 = this.calculatePFAToSRLBreakeven(expenseRate, 1);

    return {
      transitions: [
        {
          from: 'Salariu',
          to: 'PFA Sistem Real',
          breakEvenIncome: salaryToPFA.breakEvenIncome,
          message: salaryToPFA.message,
        },
        {
          from: 'PFA Sistem Real',
          to: 'PFA Normă de Venit',
          breakEvenIncome: realToNorm.breakEvenIncome,
          message: realToNorm.message,
        },
        {
          from: 'PFA',
          to: 'SRL Micro (3% - fără angajați)',
          breakEvenIncome: pfaToSRL0.breakEvenIncome,
          message: pfaToSRL0.message,
        },
        {
          from: 'PFA',
          to: 'SRL Micro (1% - cu angajați)',
          breakEvenIncome: pfaToSRL1.breakEvenIncome,
          message: pfaToSRL1.message,
        },
      ],
      parameters: {
        expenseRate,
        normValue,
      },
    };
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('ro-RO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
