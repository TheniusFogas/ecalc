// e-Factura Calculator - Termene, Sancțiuni și Verificare Conformitate
// Conform Codului Fiscal, OUG 89/2025 și reglementărilor ANAF

export class EFacturaCalculator {
  constructor(fiscalRules) {
    this.rules = fiscalRules?.efactura || {};
  }

  // Sărbători legale România - se actualizează anual din admin
  // Aceste date sunt folosite pentru calculul zilelor lucrătoare
  static HOLIDAYS_2025 = [
    '2025-01-01', '2025-01-02',        // Anul Nou
    '2025-01-06', '2025-01-07',        // Boboteaza și Sf. Ioan
    '2025-01-24',                       // Ziua Unirii Principatelor
    '2025-04-18', '2025-04-20', '2025-04-21', // Vinerea Mare, Paștele Ortodox
    '2025-05-01',                       // Ziua Muncii
    '2025-06-01',                       // Ziua Copilului
    '2025-06-08', '2025-06-09',        // Rusalii (Cincizecimea)
    '2025-08-15',                       // Adormirea Maicii Domnului
    '2025-11-30',                       // Sf. Andrei
    '2025-12-01',                       // Ziua Națională
    '2025-12-25', '2025-12-26',        // Crăciunul
  ];

  static HOLIDAYS_2026 = [
    '2026-01-01', '2026-01-02',        // Anul Nou
    '2026-01-06', '2026-01-07',        // Boboteaza și Sf. Ioan
    '2026-01-24',                       // Ziua Unirii Principatelor
    '2026-04-10', '2026-04-12', '2026-04-13', // Vinerea Mare, Paștele Ortodox
    '2026-05-01',                       // Ziua Muncii
    '2026-06-01',                       // Ziua Copilului
    '2026-05-31', '2026-06-01',        // Rusalii (50 zile după Paște)
    '2026-08-15',                       // Adormirea Maicii Domnului
    '2026-11-30',                       // Sf. Andrei
    '2026-12-01',                       // Ziua Națională
    '2026-12-25', '2026-12-26',        // Crăciunul
  ];

  // Obține lista de sărbători pentru un an specific
  getHolidays(year, customHolidays = []) {
    const defaultHolidays = year >= 2026
      ? EFacturaCalculator.HOLIDAYS_2026
      : EFacturaCalculator.HOLIDAYS_2025;

    // Combină sărbătorile default cu cele personalizate din admin
    return [...new Set([...defaultHolidays, ...customHolidays])];
  }

  // Verifică dacă o dată este zi lucrătoare
  isWorkingDay(date, holidays = []) {
    const d = new Date(date);
    const dayOfWeek = d.getDay();

    // Weekend = nu e zi lucrătoare
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    // Verifică sărbători
    const dateStr = d.toISOString().split('T')[0];
    if (holidays.includes(dateStr)) return false;

    return true;
  }

  // Calculează data limită de transmitere (5 zile lucrătoare conform OUG 89/2025)
  calculateDeadline(invoiceDate, customHolidays = []) {
    const year = new Date(invoiceDate).getFullYear();
    const holidays = this.getHolidays(year, customHolidays);

    const deadline = new Date(invoiceDate);
    let workingDays = 0;
    const targetDays = this.rules.working_days_deadline || 5;

    while (workingDays < targetDays) {
      deadline.setDate(deadline.getDate() + 1);

      if (this.isWorkingDay(deadline, holidays)) {
        workingDays++;
      }
    }

    return {
      deadline,
      deadlineString: deadline.toISOString().split('T')[0],
      workingDaysLimit: targetDays,
      skippedHolidays: holidays.filter(h => {
        const hDate = new Date(h);
        return hDate > new Date(invoiceDate) && hDate <= deadline;
      }),
    };
  }

  // Calculează numărul de zile de întârziere
  calculateDelayDays(invoiceDate, transmissionDate, customHolidays = []) {
    const year = new Date(invoiceDate).getFullYear();
    const holidays = this.getHolidays(year, customHolidays);
    const deadlineInfo = this.calculateDeadline(invoiceDate, customHolidays);

    const transmission = new Date(transmissionDate);

    if (transmission <= deadlineInfo.deadline) {
      return { delayed: false, delayDays: 0, deadline: deadlineInfo };
    }

    // Calculează zilele lucrătoare de întârziere
    let delayDays = 0;
    const current = new Date(deadlineInfo.deadline);

    while (current < transmission) {
      current.setDate(current.getDate() + 1);
      if (this.isWorkingDay(current, holidays)) {
        delayDays++;
      }
    }

    return {
      delayed: true,
      delayDays,
      deadline: deadlineInfo,
      transmissionDate,
    };
  }

  // Grila de amenzi conform Codului Fiscal
  static PENALTY_GRID = {
    // Contribuabili mari
    large: {
      name: 'Contribuabili Mari',
      min: 5000,
      max: 10000,
      b2bExtra: 0.15, // 15% din valoarea facturii
      description: 'Cifră afaceri > 100 milioane EUR',
    },
    // Contribuabili mijlocii
    medium: {
      name: 'Contribuabili Mijlocii',
      min: 2500,
      max: 5000,
      b2bExtra: 0.15,
      description: 'Cifră afaceri 50-100 milioane EUR',
    },
    // Alte persoane juridice
    small: {
      name: 'Alte Persoane Juridice / Mici',
      min: 1000,
      max: 2500,
      b2bExtra: 0.15,
      description: 'Cifră afaceri < 50 milioane EUR',
    },
    // Microîntreprinderi și PFA
    micro: {
      name: 'Microîntreprinderi / PFA',
      min: 500,
      max: 1000,
      b2bExtra: 0,
      description: 'Cifră afaceri < 500.000 EUR',
    },
  };

  // Calculează amenda potențială
  calculatePenalty(options) {
    const {
      invoiceDate,
      transmissionDate = null,
      invoiceValue = 0,
      contributorType = 'small', // 'large', 'medium', 'small', 'micro'
      transactionType = 'B2B',   // 'B2B' sau 'B2C'
      isFirstOffense = true,
      customHolidays = [],
    } = options;

    const penaltyGrid = this.rules?.penalty_grid || EFacturaCalculator.PENALTY_GRID;
    const penaltyInfo = penaltyGrid[contributorType] || penaltyGrid.small;

    // Dacă nu e transmisă, calculăm pentru astăzi
    const transmitDate = transmissionDate || new Date().toISOString().split('T')[0];
    const delayInfo = this.calculateDelayDays(invoiceDate, transmitDate, customHolidays);

    if (!delayInfo.delayed) {
      return {
        isOverdue: false,
        penalty: null,
        message: 'Factura a fost transmisă în termen',
        deadline: delayInfo.deadline,
      };
    }

    // Calculăm amenda
    let basePenalty;
    let severity;

    if (delayInfo.delayDays <= 5) {
      basePenalty = penaltyInfo.min;
      severity = 'ușor';
    } else if (delayInfo.delayDays <= 15) {
      basePenalty = Math.round((penaltyInfo.min + penaltyInfo.max) / 2);
      severity = 'moderat';
    } else {
      basePenalty = penaltyInfo.max;
      severity = 'grav';
    }

    // Prima abatere poate beneficia de avertisment
    if (isFirstOffense && delayInfo.delayDays <= 5) {
      basePenalty = 0;
    }

    // Amendă suplimentară B2B (15% din valoare)
    let b2bExtraPenalty = 0;
    if (transactionType === 'B2B' && invoiceValue > 0) {
      b2bExtraPenalty = Math.round(invoiceValue * penaltyInfo.b2bExtra);
    }

    const totalPenalty = basePenalty + b2bExtraPenalty;

    return {
      isOverdue: true,
      delayDays: delayInfo.delayDays,
      deadline: delayInfo.deadline,
      contributorType: penaltyInfo.name,
      basePenalty,
      b2bExtraPenalty,
      totalPenalty,
      severity,
      isFirstOffense,
      breakdown: {
        base: `Amendă de bază: ${basePenalty.toLocaleString('ro-RO')} RON`,
        b2b: b2bExtraPenalty > 0 ? `Supliment B2B (15%): ${b2bExtraPenalty.toLocaleString('ro-RO')} RON` : null,
        total: `Total estimat: ${totalPenalty.toLocaleString('ro-RO')} RON`,
      },
      warnings: [
        'Amenzile sunt estimative și pot varia în funcție de decizia ANAF',
        'Prima abatere poate beneficia de avertisment (fără amendă)',
        'În cazul tranzacțiilor B2B, atât emitentul cât și destinatarul pot fi sancționați',
      ],
      legalBasis: 'Codul Fiscal art. 10^1, OUG 89/2025, Legea 227/2015',
    };
  }

  // Verifică obligativitatea transmiterii
  checkMandatory(transactionType, year = 2026) {
    if (transactionType === 'B2B') {
      return {
        mandatory: true,
        since: '2024-07-01',
        reason: 'Tranzacții B2B - obligatoriu din 1 iulie 2024',
        deadline: '5 zile lucrătoare de la emitere',
      };
    }

    if (transactionType === 'B2C' && year >= 2025) {
      return {
        mandatory: true,
        since: '2025-01-01',
        reason: 'Tranzacții B2C - obligatoriu din 1 ianuarie 2025',
        deadline: '5 zile lucrătoare de la emitere',
      };
    }

    return {
      mandatory: false,
      reason: 'Nu există obligativitate pentru acest tip de tranzacție',
      deadline: null,
    };
  }

  // Verifică dacă factura trebuie transmisă prin SPV
  checkSPVRequirement(invoiceDetails) {
    const { hasVAT, isB2B, invoiceValue, isCrossEU } = invoiceDetails;

    const requirements = [];

    if (hasVAT) {
      requirements.push({
        required: true,
        reason: 'Facturi cu TVA - obligatoriu în SPV',
      });
    }

    if (isB2B) {
      requirements.push({
        required: true,
        reason: 'Tranzacții B2B între companii din România',
      });
    }

    if (invoiceValue > 50000) {
      requirements.push({
        required: true,
        reason: 'Valoare factură peste 50.000 RON - obligatoriu raportare',
      });
    }

    return {
      spvRequired: requirements.some(r => r.required),
      requirements,
    };
  }

  // Info ANAF
  getANAFInfo() {
    return {
      portal: 'https://e-factura.anaf.ro',
      ghid: 'https://www.anaf.ro/ghid-utilizare-efactura',
      suport: 'efactura@anaf.ro',
      telefon: '0800 108 800',
      programLucru: 'Luni - Vineri: 08:00 - 16:00',
      softwareCertificat: [
        'SmartBill', 'Facturis', 'Saga', 'WinMentor', 'FGO',
        'Oblio', 'Factureaza.ro', 'Freya', 'NextUp'
      ],
    };
  }

  // Timeline implementare
  getImplementationTimeline() {
    return [
      { date: '2024-07-01', event: 'Obligatoriu pentru tranzacții B2B (companie către companie)', status: 'activ' },
      { date: '2025-01-01', event: 'Obligatoriu pentru tranzacții B2C (companie către consumatori)', status: 'activ' },
      { date: '2025-01-01', event: 'Termen de transmitere: 5 zile lucrătoare (OUG 89/2025)', status: 'activ' },
      { date: '2026-01-01', event: 'Obligatoriu pentru toți contribuabilii cu venituri peste pragul TVA', status: 'planificat' },
    ];
  }

  // Recomandări pentru evitarea amenzilor
  getRecommendations() {
    return [
      {
        priority: 'high',
        title: 'Automatizare transmitere',
        description: 'Configurați software-ul de facturare să transmită automat în 2-3 zile de la emitere',
      },
      {
        priority: 'high',
        title: 'Verificare zilnică',
        description: 'Verificați zilnic statusul facturilor în portalul SPV',
      },
      {
        priority: 'medium',
        title: 'Calendar sărbători',
        description: 'Țineți cont de sărbătorile legale când planificați termenele',
      },
      {
        priority: 'medium',
        title: 'Backup sistemul',
        description: 'Păstrați un sistem de backup pentru cazul în care SPV este indisponibil',
      },
      {
        priority: 'low',
        title: 'Instruirea echipei',
        description: 'Asigurați-vă că toți angajații care emit facturi cunosc procedura',
      },
    ];
  }
}

// Export pentru utilizare în admin și pentru preîncărcare
export const HOLIDAYS_2025 = EFacturaCalculator.HOLIDAYS_2025;
export const HOLIDAYS_2026 = EFacturaCalculator.HOLIDAYS_2026;
export const PENALTY_GRID = EFacturaCalculator.PENALTY_GRID;
