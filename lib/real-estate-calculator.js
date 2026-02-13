// Real Estate Calculator Engine - Romania
// Calculează randamente, ROI, simulare credit ipotecar

export class RealEstateCalculator {
  constructor(fiscalRules) {
    this.rules = fiscalRules?.real_estate || {};
  }

  // Calculează randamentul brut al chiriei
  calculateGrossYield(propertyValue, monthlyRent) {
    const annualRent = monthlyRent * 12;
    const grossYield = (annualRent / propertyValue) * 100;

    return {
      propertyValue,
      monthlyRent,
      annualRent,
      grossYield,
      monthsToPayoff: propertyValue / monthlyRent,
      yearsToPayoff: propertyValue / annualRent,
    };
  }

  // Calculează randamentul net al chiriei
  calculateNetYield(options) {
    const {
      propertyValue,
      monthlyRent,
      propertyTax = 0,
      maintenanceCost = null,
      insuranceCost = 0,
      managementFee = 0, // % din chirie
      vacancyRate = null, // % din an
      otherCosts = 0,
    } = options;

    const annualRent = monthlyRent * 12;

    // Folosim ratele din regulile fiscale sau valori default
    const maintenanceRate = this.rules.maintenance_rate || 1;
    const defaultVacancy = this.rules.vacancy_rate || 8.33;

    // Costuri anuale
    const maintenance = maintenanceCost ?? (propertyValue * (maintenanceRate / 100));
    const vacancy = annualRent * ((vacancyRate ?? defaultVacancy) / 100);
    const management = annualRent * (managementFee / 100);

    // Total costuri
    const totalCosts = propertyTax + maintenance + insuranceCost + management + vacancy + otherCosts;

    // Venit net
    const netIncome = annualRent - totalCosts;

    // Randament net
    const netYield = (netIncome / propertyValue) * 100;

    return {
      propertyValue,
      monthlyRent,
      annualRent,
      costs: {
        propertyTax,
        maintenance,
        insurance: insuranceCost,
        management,
        vacancy,
        other: otherCosts,
        total: totalCosts,
      },
      netIncome,
      netYield,
      grossYield: (annualRent / propertyValue) * 100,
      monthlyNetIncome: netIncome / 12,
    };
  }

  // Calculează impozitul pe venitul din chirii (PF)
  calculateRentalTax(options) {
    const { annualRent, useDeduction = true } = options;

    const taxRate = this.rules.rental_tax_rate || 10;
    const deductionRate = this.rules.rental_deduction || 20;

    let taxableIncome;
    if (useDeduction) {
      // Cota forfetară 20%
      taxableIncome = annualRent * (1 - deductionRate / 100);
    } else {
      taxableIncome = annualRent;
    }

    const incomeTax = taxableIncome * (taxRate / 100);

    // CASS pe venituri din chirii (dacă depășesc plafonul)
    // CASS pe venituri din chirii (dacă depășesc plafonul)
    // Folosim salariul minim din reguli (injectat sau default)
    const minSalary = this.rules.minimum_salary || 4050;
    const cassThreshold = 6 * minSalary; // 6 salarii minime
    let cass = 0;
    if (annualRent > cassThreshold) {
      cass = Math.min(annualRent, 60 * minSalary) * 0.10;
    }

    const totalTax = incomeTax + cass;
    const netRent = annualRent - totalTax;

    return {
      annualRent,
      useDeduction,
      deduction: useDeduction ? annualRent * (deductionRate / 100) : 0,
      taxableIncome,
      incomeTax,
      cass,
      totalTax,
      netRent,
      effectiveRate: (totalTax / annualRent) * 100,
    };
  }

  // Cash-on-Cash Return (ROI pe capital investit)
  calculateCashOnCash(options) {
    const {
      propertyValue,
      downPayment,
      monthlyRent,
      monthlyMortgage = 0,
      monthlyExpenses = 0,
      closingCosts = 0, // taxe notar, comisioane
    } = options;

    const totalCashInvested = downPayment + closingCosts;
    const annualRent = monthlyRent * 12;
    const annualMortgage = monthlyMortgage * 12;
    const annualExpenses = monthlyExpenses * 12;

    const annualCashFlow = annualRent - annualMortgage - annualExpenses;
    const cashOnCash = (annualCashFlow / totalCashInvested) * 100;

    return {
      propertyValue,
      downPayment,
      loanAmount: propertyValue - downPayment,
      closingCosts,
      totalCashInvested,
      annualRent,
      annualMortgage,
      annualExpenses,
      annualCashFlow,
      monthlyCashFlow: annualCashFlow / 12,
      cashOnCash,
      breakEvenMonths: annualCashFlow > 0 ? totalCashInvested / (annualCashFlow / 12) : Infinity,
    };
  }

  // Simulare credit ipotecar
  simulateMortgage(options) {
    const {
      loanAmount,
      annualRate, // Dobândă anuală %
      years,
      type = 'anuitate', // 'anuitate' sau 'rate_egale'
    } = options;

    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;

    let monthlyPayment;
    let schedule = [];
    let totalInterest = 0;
    let totalPayment = 0;

    if (type === 'anuitate') {
      // Rate lunare egale (anuitate)
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

      let balance = loanAmount;
      for (let month = 1; month <= totalMonths; month++) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance -= principal;

        totalInterest += interest;

        // Adăugăm doar câteva luni reprezentative pentru performanță
        if (month <= 12 || month % 12 === 0 || month === totalMonths) {
          schedule.push({
            month,
            payment: monthlyPayment,
            principal,
            interest,
            balance: Math.max(0, balance),
          });
        }
      }
    } else {
      // Rate egale la principal
      const monthlyPrincipal = loanAmount / totalMonths;
      let balance = loanAmount;

      for (let month = 1; month <= totalMonths; month++) {
        const interest = balance * monthlyRate;
        const payment = monthlyPrincipal + interest;
        balance -= monthlyPrincipal;

        totalInterest += interest;

        if (month === 1) monthlyPayment = payment; // Prima rată

        if (month <= 12 || month % 12 === 0 || month === totalMonths) {
          schedule.push({
            month,
            payment,
            principal: monthlyPrincipal,
            interest,
            balance: Math.max(0, balance),
          });
        }
      }
    }

    totalPayment = type === 'anuitate' ? monthlyPayment * totalMonths : loanAmount + totalInterest;

    return {
      loanAmount,
      annualRate,
      years,
      type,
      monthlyPayment,
      totalPayment,
      totalInterest,
      interestRatio: (totalInterest / loanAmount) * 100,
      schedule,
      summary: {
        firstPayment: schedule[0]?.payment || monthlyPayment,
        lastPayment: schedule[schedule.length - 1]?.payment,
        yearlyPayment: monthlyPayment * 12,
      },
    };
  }

  // Comparație: cumpărare vs închiriere
  compareBuyVsRent(options) {
    const {
      propertyValue,
      downPayment,
      mortgageRate,
      mortgageYears,
      monthlyRentAlternative,
      appreciationRate = 2, // % pe an
      investmentReturn = 5, // % pe an dacă investești în loc să cumperi
    } = options;

    const loanAmount = propertyValue - downPayment;
    const mortgage = this.simulateMortgage({
      loanAmount,
      annualRate: mortgageRate,
      years: mortgageYears,
    });

    const years = [5, 10, 15, 20, 25, 30].filter(y => y <= mortgageYears);
    const comparison = [];

    for (const year of years) {
      // Cumpărare
      const propertyValueAtYear = propertyValue * Math.pow(1 + appreciationRate / 100, year);
      const mortgagePaid = mortgage.monthlyPayment * 12 * Math.min(year, mortgageYears);
      const downPaymentOpportunityCost = downPayment * Math.pow(1 + investmentReturn / 100, year) - downPayment;
      const totalBuyCost = downPayment + mortgagePaid + downPaymentOpportunityCost;
      const equity = propertyValueAtYear;
      const netBuy = equity - loanAmount; // simplificat

      // Închiriere + investiții
      const rentPaid = monthlyRentAlternative * 12 * year;
      // Dacă închiriezi, investești avansul + diferența dintre rată și chirie
      const monthlyDifference = mortgage.monthlyPayment - monthlyRentAlternative;
      let investedValue = downPayment;
      for (let m = 1; m <= year * 12; m++) {
        investedValue = investedValue * (1 + investmentReturn / 100 / 12);
        if (monthlyDifference > 0) {
          investedValue += monthlyDifference;
        }
      }
      const netRent = investedValue - rentPaid;

      comparison.push({
        year,
        buy: {
          propertyValue: propertyValueAtYear,
          mortgagePaid,
          totalCost: totalBuyCost,
          equity,
        },
        rent: {
          rentPaid,
          investedValue,
        },
        difference: netBuy - netRent,
        winner: netBuy > netRent ? 'buy' : 'rent',
      });
    }

    return {
      inputs: options,
      mortgage,
      comparison,
    };
  }

  // Analiză completă investiție imobiliară
  analyzeInvestment(options) {
    const {
      propertyValue,
      downPayment,
      monthlyRent,
      mortgageRate,
      mortgageYears,
      propertyTax,
      maintenanceCost,
      insuranceCost,
      closingCosts = propertyValue * 0.05, // ~5% taxe și comisioane
    } = options;

    const loanAmount = propertyValue - downPayment;
    const mortgage = this.simulateMortgage({
      loanAmount,
      annualRate: mortgageRate,
      years: mortgageYears,
    });

    const netYield = this.calculateNetYield({
      propertyValue,
      monthlyRent,
      propertyTax,
      maintenanceCost,
      insuranceCost,
    });

    const cashOnCash = this.calculateCashOnCash({
      propertyValue,
      downPayment,
      monthlyRent,
      monthlyMortgage: mortgage.monthlyPayment,
      monthlyExpenses: (propertyTax + maintenanceCost + insuranceCost) / 12,
      closingCosts,
    });

    const rentalTax = this.calculateRentalTax({
      annualRent: monthlyRent * 12,
    });

    return {
      property: {
        value: propertyValue,
        downPayment,
        loanAmount,
        closingCosts,
        totalInvestment: downPayment + closingCosts,
      },
      mortgage,
      yields: {
        gross: netYield.grossYield,
        net: netYield.netYield,
      },
      cashFlow: {
        monthly: cashOnCash.monthlyCashFlow,
        annual: cashOnCash.annualCashFlow,
        cashOnCash: cashOnCash.cashOnCash,
      },
      tax: rentalTax,
      metrics: {
        capRate: netYield.netYield,
        cashOnCash: cashOnCash.cashOnCash,
        breakEvenMonths: cashOnCash.breakEvenMonths,
        breakEvenYears: cashOnCash.breakEvenMonths / 12,
      },
      recommendation: cashOnCash.cashOnCash > 8
        ? 'Investiție atractivă (CoC > 8%)'
        : cashOnCash.cashOnCash > 5
          ? 'Investiție acceptabilă (CoC 5-8%)'
          : 'Investiție cu randament scăzut (CoC < 5%)',
    };
  }
}

// Constante pentru UI
export const PROPERTY_TYPES = {
  'garsoniera': 'Garsonieră',
  'apartament_2_camere': 'Apartament 2 camere',
  'apartament_3_camere': 'Apartament 3 camere',
  'apartament_4_camere': 'Apartament 4+ camere',
  'casa': 'Casă/Vilă',
  'teren': 'Teren',
  'comercial': 'Spațiu comercial',
  'birou': 'Birou',
};

export const CITIES_AVG_YIELD = {
  'bucurești': { avgPrice: 2200, avgRent: 12, yield: 6.5 },
  'cluj-napoca': { avgPrice: 2500, avgRent: 14, yield: 6.7 },
  'timișoara': { avgPrice: 1800, avgRent: 10, yield: 6.6 },
  'iași': { avgPrice: 1600, avgRent: 8, yield: 6.0 },
  'brașov': { avgPrice: 1900, avgRent: 11, yield: 6.9 },
  'constanța': { avgPrice: 1700, avgRent: 9, yield: 6.4 },
  'sibiu': { avgPrice: 1800, avgRent: 10, yield: 6.6 },
  'craiova': { avgPrice: 1200, avgRent: 6, yield: 6.0 },
};
