// Medical Leave Calculator Engine - OUG 158/2005
// Calculează indemnizație concediu medical cu toate codurile de boală

export class MedicalLeaveCalculator {
  constructor(fiscalRules) {
    this.rules = fiscalRules.medical_leave;
    this.salaryRules = fiscalRules.salary;
  }

  // Coduri de boală și procentaje
  static SICK_CODES = {
    '01': { name: 'Boală obișnuită', rate: 75, maxDays: 183, employerDays: 5 },
    '02': { name: 'Accident în afara muncii', rate: 80, maxDays: 183, employerDays: 5 },
    '03': { name: 'Accident de muncă', rate: 100, maxDays: 183, employerDays: 3 },
    '04': { name: 'Boală profesională', rate: 100, maxDays: 183, employerDays: 3 },
    '05': { name: 'TBC', rate: 100, maxDays: 270, employerDays: 5 },
    '06': { name: 'Urgențe medico-chirurgicale', rate: 100, maxDays: 183, employerDays: 5 },
    '07': { name: 'Carantină', rate: 75, maxDays: 90, employerDays: 5 },
    '08': { name: 'Sarcină și lăuzie', rate: 85, maxDays: 126, employerDays: 0 },
    '09': { name: 'Îngrijire copil bolnav', rate: 85, maxDays: 45, employerDays: 0 },
    '10': { name: 'Risc maternal', rate: 75, maxDays: 120, employerDays: 0 },
    '11': { name: 'Prevenție', rate: 75, maxDays: 30, employerDays: 5 },
    '12': { name: 'Recuperare', rate: 75, maxDays: 90, employerDays: 5 },
    '13': { name: 'Reducere timp muncă', rate: 75, maxDays: 90, employerDays: 5 },
    '14': { name: 'Transplant', rate: 100, maxDays: 183, employerDays: 5 },
    '15': { name: 'Oncologie', rate: 100, maxDays: 270, employerDays: 5 },
  };

  // Verifică eligibilitatea (stagiu de cotizare)
  checkEligibility(monthsContributed) {
    const minMonths = this.rules?.minimum_months || 6;
    const isEligible = monthsContributed >= minMonths;
    
    return {
      isEligible,
      monthsContributed,
      monthsRequired: minMonths,
      monthsRemaining: isEligible ? 0 : minMonths - monthsContributed,
      message: isEligible 
        ? 'Aveți dreptul la indemnizație de concediu medical'
        : `Mai aveți nevoie de ${minMonths - monthsContributed} luni de contribuție`,
    };
  }

  // Calculează baza de calcul (media ultimelor 6 luni)
  calculateBase(salaryHistory) {
    // salaryHistory = [{ month: 'Jan 2026', gross: 5000 }, ...]
    if (!salaryHistory || salaryHistory.length === 0) {
      return { base: 0, averageSalary: 0, months: 0 };
    }

    const maxMonths = this.rules?.max_base_salaries || 12;
    const relevantSalaries = salaryHistory.slice(0, Math.min(maxMonths, salaryHistory.length));
    
    const total = relevantSalaries.reduce((sum, s) => sum + s.gross, 0);
    const averageSalary = total / relevantSalaries.length;
    
    // Baza = media lunară / numărul de zile lucrătoare din lună (standard 21.17)
    const dailyBase = averageSalary / 21.17;
    
    return {
      base: dailyBase,
      averageSalary,
      months: relevantSalaries.length,
      totalSalaries: total,
    };
  }

  // Calculează indemnizația pentru un concediu medical
  calculate(options) {
    const {
      sickCode = '01',
      days = 1,
      salaryHistory = [],
      monthsContributed = 12,
      averageSalaryOverride = null,
    } = options;

    // Verifică eligibilitate
    const eligibility = this.checkEligibility(monthsContributed);
    if (!eligibility.isEligible) {
      return {
        eligible: false,
        eligibility,
        indemnity: 0,
        message: eligibility.message,
      };
    }

    // Obține informații despre codul de boală
    const sickInfo = MedicalLeaveCalculator.SICK_CODES[sickCode] || MedicalLeaveCalculator.SICK_CODES['01'];
    
    // Verifică dacă zilele nu depășesc maximul
    const effectiveDays = Math.min(days, sickInfo.maxDays);
    
    // Calculează baza
    let baseInfo;
    if (averageSalaryOverride) {
      baseInfo = {
        base: averageSalaryOverride / 21.17,
        averageSalary: averageSalaryOverride,
        months: 6,
        totalSalaries: averageSalaryOverride * 6,
      };
    } else {
      baseInfo = this.calculateBase(salaryHistory);
    }

    // Procent în funcție de cod
    const rate = this.getRate(sickCode);
    
    // Indemnizație zilnică
    const dailyIndemnity = baseInfo.base * (rate / 100);
    
    // Total indemnizație
    const totalIndemnity = dailyIndemnity * effectiveDays;
    
    // Split angajator / FNUASS
    const employerDays = Math.min(effectiveDays, sickInfo.employerDays);
    const fnuassDays = Math.max(0, effectiveDays - employerDays);
    
    const employerAmount = dailyIndemnity * employerDays;
    const fnuassAmount = dailyIndemnity * fnuassDays;
    
    // CASS dacă se aplică (de obicei NU pentru concediu medical)
    const applyCass = this.rules?.apply_cass || false;
    const cassDeduction = applyCass ? totalIndemnity * ((this.salaryRules?.cass_rate || 10) / 100) : 0;
    
    const netIndemnity = totalIndemnity - cassDeduction;

    return {
      eligible: true,
      eligibility,
      sickCode,
      sickInfo,
      days: effectiveDays,
      maxDays: sickInfo.maxDays,
      daysRemaining: sickInfo.maxDays - effectiveDays,
      baseInfo,
      rate,
      dailyIndemnity,
      totalIndemnity,
      split: {
        employerDays,
        employerAmount,
        fnuassDays,
        fnuassAmount,
      },
      cassDeduction,
      netIndemnity,
      monthlyEquivalent: netIndemnity / (effectiveDays / 21.17),
    };
  }

  // Obține rata în funcție de cod și reguli din DB
  getRate(sickCode) {
    // Încercăm să luăm din regulile fiscale, altfel din static
    const codeInfo = MedicalLeaveCalculator.SICK_CODES[sickCode];
    if (!codeInfo) return 75;

    // Override din reguli fiscale
    if (sickCode === '01' && this.rules?.code_01_rate) return this.rules.code_01_rate;
    if (sickCode === '06' && this.rules?.code_06_rate) return this.rules.code_06_rate;
    if (sickCode === '08' && this.rules?.code_08_rate) return this.rules.code_08_rate;
    
    return codeInfo.rate;
  }

  // Simulează un an de concedii medicale
  simulateYear(options) {
    const { averageSalary, sickDaysPerMonth = 0, sickCode = '01' } = options;
    
    const months = [];
    let totalWorkDays = 0;
    let totalSickDays = 0;
    let totalSalary = 0;
    let totalIndemnity = 0;

    for (let i = 1; i <= 12; i++) {
      const workDays = 21 - sickDaysPerMonth;
      const sickDays = sickDaysPerMonth;
      
      const salaryForWork = (averageSalary / 21) * workDays;
      
      let indemnityForSick = 0;
      if (sickDays > 0) {
        const result = this.calculate({
          sickCode,
          days: sickDays,
          averageSalaryOverride: averageSalary,
        });
        indemnityForSick = result.netIndemnity;
      }
      
      months.push({
        month: i,
        workDays,
        sickDays,
        salaryForWork,
        indemnityForSick,
        totalIncome: salaryForWork + indemnityForSick,
      });
      
      totalWorkDays += workDays;
      totalSickDays += sickDays;
      totalSalary += salaryForWork;
      totalIndemnity += indemnityForSick;
    }

    return {
      months,
      summary: {
        totalWorkDays,
        totalSickDays,
        totalSalary,
        totalIndemnity,
        totalIncome: totalSalary + totalIndemnity,
        averageMonthlyIncome: (totalSalary + totalIndemnity) / 12,
      },
    };
  }

  // Calculează concediu de maternitate complet
  calculateMaternity(options) {
    const { averageSalary, prenatalDays = 63, postnatalDays = 63 } = options;
    
    const prenatal = this.calculate({
      sickCode: '08',
      days: prenatalDays,
      averageSalaryOverride: averageSalary,
    });
    
    const postnatal = this.calculate({
      sickCode: '08',
      days: postnatalDays,
      averageSalaryOverride: averageSalary,
    });
    
    return {
      prenatal: {
        days: prenatalDays,
        ...prenatal,
      },
      postnatal: {
        days: postnatalDays,
        ...postnatal,
      },
      total: {
        days: prenatalDays + postnatalDays,
        totalIndemnity: prenatal.totalIndemnity + postnatal.totalIndemnity,
        netIndemnity: prenatal.netIndemnity + postnatal.netIndemnity,
      },
      message: `Indemnizație maternitate totală: ${(prenatal.netIndemnity + postnatal.netIndemnity).toFixed(2)} RON pentru ${prenatalDays + postnatalDays} zile`,
    };
  }
}

// FIX (audit 2026-08-11): removed generateSalaryHistory() — dead code, imported by
// app/calculator-concediu-medical/[year]/page.js but never actually called there. It also
// fabricated salary history with Math.random(), which would have been a real bug (a different
// "history" on every render) had anything ever used it.

// Export coduri de boală pentru UI
export const SICK_CODES = MedicalLeaveCalculator.SICK_CODES;
