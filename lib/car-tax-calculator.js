// Car Tax Calculator Engine - Romania
// Calculează impozitul auto bazat pe Art. 470 Cod Fiscal 2026
// Formula: (CMC / 200, rotunjit în sus) × Rata pe normă Euro × Coeficient localitate

export class CarTaxCalculator {
  constructor(fiscalRules) {
    this.rules = fiscalRules?.car_tax || {};
  }

  // Rate conform Art. 470 Cod Fiscal 2026 (lei per 200 cm³ sau fracțiune)
  // Structura: [Euro 0-3, Euro 4, Euro 5, Euro 6, Hibrid]
  static RATES_2026 = {
    'sub_1600': { 'euro_0_3': 19.5, 'euro_4': 18.8, 'euro_5': 17.6, 'euro_6': 16.5, 'hibrid': 16.2 },
    '1601_2000': { 'euro_0_3': 29.7, 'euro_4': 28.5, 'euro_5': 26.7, 'euro_6': 25.1, 'hibrid': 24.6 },
    '2001_2600': { 'euro_0_3': 92.2, 'euro_4': 88.6, 'euro_5': 82.8, 'euro_6': 77.8, 'hibrid': 76.3 },
    '2601_3000': { 'euro_0_3': 182.9, 'euro_4': 172.8, 'euro_5': 154.1, 'euro_6': 151.2, 'hibrid': 149.8 },
    'peste_3000': { 'euro_0_3': 319.0, 'euro_4': 297.3, 'euro_5': 294.4, 'euro_6': 290.0, 'hibrid': 275.5 },
  };

  // Rate pentru motociclete/ATV/mopede (lei per 200 cm³)
  static MOTORCYCLE_RATES = {
    'sub_1600': { 'euro_0_3': 9.5, 'euro_4': 9.0, 'euro_5': 8.5, 'euro_6': 8.0, 'hibrid': 7.5 },
    'peste_1600': { 'euro_0_3': 15.0, 'euro_4': 14.0, 'euro_5': 13.0, 'euro_6': 12.0, 'hibrid': 11.0 },
  };

  // Coeficienți majorare pentru localități (Consilii Locale pot majora până la 16%)
  // Aceste valori sunt orientative și pot varia anual
  static LOCATION_COEFFICIENTS = {
    'bucurești': 1.16,       // +16% majorare maximă
    'cluj-napoca': 1.15,
    'timișoara': 1.12,
    'iași': 1.10,
    'constanța': 1.12,
    'brașov': 1.12,
    'sibiu': 1.10,
    'oradea': 1.08,
    'arad': 1.05,
    'craiova': 1.08,
    'galați': 1.05,
    'ploiești': 1.08,
    'brăila': 1.05,
    'pitești': 1.06,
    'bacău': 1.05,
    'târgu mureș': 1.06,
    'baia mare': 1.04,
    'buzău': 1.04,
    'botoșani': 1.02,
    'satu mare': 1.03,
    'suceava': 1.04,
    'piatra neamț': 1.03,
    'drobeta-turnu severin': 1.02,
    'focșani': 1.03,
    'râmnicu vâlcea': 1.05,
    'târgoviște': 1.05,
    'târgu jiu': 1.04,
    'bistrița': 1.04,
    'reșița': 1.02,
    'slatina': 1.03,
    'călărași': 1.02,
    'giurgiu': 1.02,
    'alba iulia': 1.05,
    'zalău': 1.03,
    'deva': 1.03,
    'sfântu gheorghe': 1.04,
    'hunedoara': 1.02,
    'mediaș': 1.02,
    'petroșani': 1.01,
    'turda': 1.03,
    'câmpina': 1.03,
    'sector 1': 1.16,
    'sector 2': 1.16,
    'sector 3': 1.16,
    'sector 4': 1.16,
    'sector 5': 1.16,
    'sector 6': 1.16,
    // Categorii generale
    'reședință de județ': 1.08,
    'municipiu mare': 1.05,
    'municipiu': 1.03,
    'oraș': 1.00,
    'oraș mic': 0.98,
    'comună': 0.95,
    'rural': 0.95,
  };

  // Norme de poluare Euro
  static EURO_NORMS = {
    'euro_0': { name: 'Euro 0 (non-Euro)', key: 'euro_0_3', description: 'Fabricație înainte de 1992' },
    'euro_1': { name: 'Euro 1', key: 'euro_0_3', description: '1992-1996' },
    'euro_2': { name: 'Euro 2', key: 'euro_0_3', description: '1996-2000' },
    'euro_3': { name: 'Euro 3', key: 'euro_0_3', description: '2000-2005' },
    'euro_4': { name: 'Euro 4', key: 'euro_4', description: '2005-2009' },
    'euro_5': { name: 'Euro 5', key: 'euro_5', description: '2009-2014' },
    'euro_6': { name: 'Euro 6', key: 'euro_6', description: '2014-prezent' },
    'hibrid': { name: 'Hibrid', key: 'hibrid', description: 'Motor termic + electric' },
  };

  // Tipuri de vehicule
  static VEHICLE_TYPES = {
    'autoturism': { name: 'Autoturism', category: 'standard' },
    'suv': { name: 'SUV / Crossover', category: 'standard' },
    'break': { name: 'Break / Combi', category: 'standard' },
    'caroserie_sport': { name: 'Coupe / Cabrio', category: 'standard' },
    'autoutilitara': { name: 'Autoutilitară sub 3.5t', category: 'utility' },
    'camion': { name: 'Camion peste 3.5t', category: 'heavy' },
    'motocicleta': { name: 'Motocicletă', category: 'motorcycle' },
    'atv': { name: 'ATV', category: 'motorcycle' },
    'moped': { name: 'Moped / Scuter', category: 'motorcycle' },
    'tractor': { name: 'Tractor rutier', category: 'agricultural' },
    'remorca': { name: 'Remorcă/Semiremorcă', category: 'trailer' },
    'electric': { name: 'Electric (0 emisii)', category: 'electric' },
    'hibrid': { name: 'Hibrid plug-in', category: 'hybrid' },
  };

  // Tipuri de combustibil
  static FUEL_TYPES = {
    'benzina': { name: 'Benzină' },
    'motorina': { name: 'Motorină / Diesel' },
    'gpl': { name: 'GPL' },
    'cng': { name: 'GNC (Gaz natural comprimat)' },
    'electric': { name: 'Electric' },
    'hibrid_benzina': { name: 'Hibrid Benzină' },
    'hibrid_diesel': { name: 'Hibrid Diesel' },
  };

  // Determină intervalul de capacitate cilindrică
  getCapacityInterval(engineCC) {
    if (engineCC <= 1600) return 'sub_1600';
    if (engineCC <= 2000) return '1601_2000';
    if (engineCC <= 2600) return '2001_2600';
    if (engineCC <= 3000) return '2601_3000';
    return 'peste_3000';
  }

  // Calculează numărul de fracțiuni de 200 cm³
  calculateFractions(engineCC) {
    return Math.ceil(engineCC / 200);
  }

  // Obține rata per 200 cm³ bazat pe capacitate și normă Euro
  getRate(engineCC, euroNorm, vehicleType) {
    // Vehicule electrice - taxă fixă mică
    if (vehicleType === 'electric' || euroNorm === 'electric') {
      return { rate: 0, fixed: 40 }; // ~40 RON fix pentru electrice
    }

    // RATE DINAMICE (Admin) sau Default
    const rates = this.rules?.rates || CarTaxCalculator.RATES_2026;
    const motorRates = this.rules?.motorcycle_rates || CarTaxCalculator.MOTORCYCLE_RATES;

    // Motociclete/ATV/Mopede - rate separate
    const vehicleCategory = CarTaxCalculator.VEHICLE_TYPES[vehicleType]?.category;
    if (vehicleCategory === 'motorcycle') {
      const interval = engineCC <= 1600 ? 'sub_1600' : 'peste_1600';
      const euroKey = CarTaxCalculator.EURO_NORMS[euroNorm]?.key || 'euro_0_3';
      return { rate: motorRates[interval]?.[euroKey] || 9.5, fixed: 0 };
    }

    // Autoturisme standard
    const interval = this.getCapacityInterval(engineCC);
    const euroKey = CarTaxCalculator.EURO_NORMS[euroNorm]?.key || 'euro_0_3';
    return { rate: rates[interval]?.[euroKey] || 19.5, fixed: 0 };
  }

  // Calcul complet impozit auto conform Art. 470 Cod Fiscal
  calculate(options) {
    const {
      engineCC = 1600,
      vehicleType = 'autoturism',
      euroNorm = 'euro_6',
      location = 'bucurești',
      fuelType = 'benzina',
      registrationYear = new Date().getFullYear(),
      purchasePrice = 0, // pentru mașini scumpe
    } = options;

    // Vehicule electrice - scutite
    if (vehicleType === 'electric' || euroNorm === 'electric') {
      return {
        engineCC,
        vehicleType,
        vehicleTypeName: CarTaxCalculator.VEHICLE_TYPES[vehicleType]?.name || vehicleType,
        euroNorm,
        euroNormName: 'Electric',
        location,
        baseTax: 40,
        locationCoefficient: 1,
        finalTax: 40,
        taxExempt: false,
        isElectric: true,
        quarterly: 10,
        monthly: Math.round(40 / 12),
        breakdown: {
          formula: 'Vehicul electric - taxă fixă redusă',
          result: '40 RON/an',
        },
      };
    }

    // Calcul standard
    const fractions = this.calculateFractions(engineCC);
    const { rate, fixed } = this.getRate(engineCC, euroNorm, vehicleType);
    const baseTax = fixed > 0 ? fixed : Math.round(fractions * rate * 100) / 100;

    // Coeficient locație
    const locationKey = location.toLowerCase().replace(/ /g, ' ');
    const locationCoeff = CarTaxCalculator.LOCATION_COEFFICIENTS[locationKey] || 1.0;

    // Impozit final
    let finalTax = Math.round(baseTax * locationCoeff);

    // Suprataxă mașini scumpe (peste 375.000 RON)
    let luxuryTax = 0;
    const luxuryThreshold = this.rules?.luxury_threshold || 375000;
    if (purchasePrice > luxuryThreshold) {
      luxuryTax = Math.round((purchasePrice - luxuryThreshold) * 0.009); // 0.9%
      finalTax += luxuryTax;
    }

    const euroNormInfo = CarTaxCalculator.EURO_NORMS[euroNorm] || CarTaxCalculator.EURO_NORMS['euro_0'];
    const vehicleTypeInfo = CarTaxCalculator.VEHICLE_TYPES[vehicleType] || { name: vehicleType };

    return {
      engineCC,
      vehicleType,
      vehicleTypeName: vehicleTypeInfo.name,
      euroNorm,
      euroNormName: euroNormInfo.name,
      fuelType,
      location,
      registrationYear,
      // Calcul
      fractions,
      ratePerFraction: rate,
      baseTax,
      locationCoefficient: locationCoeff,
      luxuryTax,
      finalTax,
      taxExempt: false,
      isElectric: false,
      // Parțiale
      quarterly: Math.round(finalTax / 4),
      monthly: Math.round(finalTax / 12),
      // Breakdown detaliat
      breakdown: {
        step1_fractions: `${engineCC} cmc ÷ 200 = ${(engineCC / 200).toFixed(2)} → rotunjit în sus = ${fractions} fracțiuni`,
        step2_rate: `Rată ${euroNormInfo.name}, ${this.getCapacityInterval(engineCC)}: ${rate} lei/fracțiune`,
        step3_base: `${fractions} × ${rate} = ${baseTax.toFixed(2)} RON (bază impozit)`,
        step4_location: `× coeficient ${location}: ${locationCoeff.toFixed(2)}`,
        step5_luxury: luxuryTax > 0 ? `+ suprataxă lux: ${luxuryTax} RON` : null,
        step6_final: `= Impozit anual: ${finalTax} RON`,
      },
      // Info legislație
      legalBasis: 'Art. 470 Cod Fiscal, valabil 2026',
      notes: [
        'Impozitul se plătește trimestrial sau integral până la 31 martie',
        `Norma ${euroNormInfo.name}: ${euroNormInfo.description}`,
        'Coeficientul localității poate varia - verificați cu primăria',
      ],
    };
  }

  // Comparație între diferite localități
  compareLocations(engineCC, euroNorm = 'euro_6', vehicleType = 'autoturism') {
    const mainLocations = [
      'bucurești', 'cluj-napoca', 'timișoara', 'iași', 'constanța',
      'brașov', 'sibiu', 'oradea', 'arad', 'craiova',
      'municipiu', 'oraș', 'rural'
    ];

    const results = mainLocations.map(location => {
      const calc = this.calculate({ engineCC, euroNorm, vehicleType, location });
      return {
        location,
        locationLabel: location.charAt(0).toUpperCase() + location.slice(1),
        tax: calc.finalTax,
        coefficient: calc.locationCoefficient,
        quarterly: calc.quarterly,
      };
    });

    results.sort((a, b) => a.tax - b.tax);

    return {
      engineCC,
      euroNorm,
      vehicleType,
      results,
      cheapest: results[0],
      mostExpensive: results[results.length - 1],
      savings: results[results.length - 1].tax - results[0].tax,
    };
  }

  // Comparație între diferite norme Euro pentru același vehicul
  compareEuroNorms(engineCC, location = 'bucurești', vehicleType = 'autoturism') {
    const norms = ['euro_0', 'euro_3', 'euro_4', 'euro_5', 'euro_6', 'hibrid'];

    const results = norms.map(norm => {
      const calc = this.calculate({ engineCC, euroNorm: norm, vehicleType, location });
      return {
        euroNorm: norm,
        euroNormName: CarTaxCalculator.EURO_NORMS[norm]?.name || norm,
        tax: calc.finalTax,
        rate: calc.ratePerFraction,
      };
    });

    results.sort((a, b) => a.tax - b.tax);

    return {
      engineCC,
      location,
      vehicleType,
      results,
      cheapest: results[0],
      mostExpensive: results[results.length - 1],
      savings: results[results.length - 1].tax - results[0].tax,
    };
  }

  // Estimare cost total de proprietate (TCO) anual
  estimateTCO(options) {
    const {
      engineCC = 1600,
      vehicleType = 'autoturism',
      euroNorm = 'euro_6',
      location = 'bucurești',
      fuelType = 'benzina',
      kmPerYear = 15000,
      fuelPrice = 7.5,
      consumption = 8,
    } = options;

    const taxResult = this.calculate(options);

    // Estimări costuri anuale
    const fuelCost = Math.round((kmPerYear / 100) * consumption * fuelPrice);

    // RCA - variază cu puterea motorului și vârsta șoferului
    let insuranceRCA = 600;
    if (engineCC > 2500) insuranceRCA = 1800;
    else if (engineCC > 2000) insuranceRCA = 1400;
    else if (engineCC > 1600) insuranceRCA = 1000;

    // CASCO - opțional, bazat pe valoare vehicul
    let insuranceCASCO = 1200;
    if (engineCC > 2500) insuranceCASCO = 4000;
    else if (engineCC > 2000) insuranceCASCO = 2500;
    else if (engineCC > 1600) insuranceCASCO = 1800;

    // ITP
    const itp = engineCC > 2000 ? 200 : 150;

    // Întreținere și reparații (estimare)
    const maintenance = Math.round(kmPerYear * 0.12); // ~0.12 RON/km

    // Anvelope (anualizat)
    const tires = 1200;

    // Parcare (estimare urbanã)
    const parking = location.includes('bucurești') || location.includes('cluj') ? 1800 : 800;

    // Rovignetă (dacă e cazul)
    const vignette = 0; // inclusă în impozit pentru România

    const totalWithCASCO = taxResult.finalTax + fuelCost + insuranceRCA + insuranceCASCO + itp + maintenance + tires + parking;
    const totalWithoutCASCO = taxResult.finalTax + fuelCost + insuranceRCA + itp + maintenance + tires + parking;

    return {
      tax: taxResult.finalTax,
      fuelCost,
      insuranceRCA,
      insuranceCASCO,
      itp,
      maintenance,
      tires,
      parking,
      vignette,
      totalWithCASCO: Math.round(totalWithCASCO),
      totalWithoutCASCO: Math.round(totalWithoutCASCO),
      monthlyWithCASCO: Math.round(totalWithCASCO / 12),
      monthlyWithoutCASCO: Math.round(totalWithoutCASCO / 12),
      costPerKm: (totalWithoutCASCO / kmPerYear).toFixed(2),
      breakdown: {
        impozit: { value: taxResult.finalTax, percent: Math.round(taxResult.finalTax / totalWithoutCASCO * 100) },
        combustibil: { value: fuelCost, percent: Math.round(fuelCost / totalWithoutCASCO * 100) },
        asigurari: { value: insuranceRCA, percent: Math.round(insuranceRCA / totalWithoutCASCO * 100) },
        intretinere: { value: maintenance, percent: Math.round(maintenance / totalWithoutCASCO * 100) },
        altele: { value: itp + tires + parking, percent: Math.round((itp + tires + parking) / totalWithoutCASCO * 100) },
      },
    };
  }
}

// Export constante pentru UI
export const VEHICLE_TYPES = CarTaxCalculator.VEHICLE_TYPES;
export const LOCATION_COEFFICIENTS = CarTaxCalculator.LOCATION_COEFFICIENTS;
export const EURO_NORMS = CarTaxCalculator.EURO_NORMS;
export const FUEL_TYPES = CarTaxCalculator.FUEL_TYPES;
export const RATES_2026 = CarTaxCalculator.RATES_2026;
