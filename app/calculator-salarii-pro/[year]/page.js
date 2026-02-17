'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Download, Share2, Info, RotateCcw, Save, Mail, Calendar, Printer, Snowflake, Heart, Flower2, CloudRain, Sun, Leaf, Cloud, CloudSnow, Briefcase, Facebook, Instagram, ChevronDown, Table, Triangle, ChevronUp, Circle, Home, ChevronRight, ChevronLeft } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isWeekend, getWeek, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { mapDbToFiscalRules } from '@/lib/data-mapper';
import { calculateSalaryResults, SalaryCalculator, getBNRExchangeRate, getSectorMinimums } from '@/lib/salary-engine';
import { MedicalLeaveCalculator, SICK_CODES } from '@/lib/medical-leave-calculator';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import { saveToStorage, loadFromStorage, clearStorage } from '@/components/CalculatorLayout';
import { generateSalaryPDF, generateGenericPDF, generateWorkingDaysPDF } from '@/lib/pdf-export';
import { defaultHolidays, calculateWorkingDays, calculateYearlyWorkingDays } from '@/lib/holidays-data';
import { holidayDescriptions } from '@/lib/holiday-descriptions';
import { getHistoricalWeather } from '@/lib/weather-data';
import Breadcrumbs from '@/components/Breadcrumbs';

export function SalaryCalculatorContent({ initialTab, initialValue, initialSector, initialType }) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const year = parseInt(params?.year) || 2026;
  const printRef = useRef(null);

  const [fiscalRules, setFiscalRules] = useState(null);
  const [fiscalRulesHistory, setFiscalRulesHistory] = useState([]); // Store full history
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  let activeTab = 'calculator';
  if (pathname.includes('/zile-lucratoare')) activeTab = 'zile-lucratoare';
  else if (pathname.includes('/zile-libere')) activeTab = 'zile-libere';
  const [holidays, setHolidays] = useState([]);
  const [yearlyData, setYearlyData] = useState(null);

  // Inputs - EXTENDED pentru Calculator Avansat
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [calculationType, setCalculationType] = useState(initialType || 'brut-net');
  const [inputValue, setInputValue] = useState(initialValue || '');
  const [sector, setSector] = useState(initialSector || 'standard');
  const [dependents, setDependents] = useState('0');
  const [children, setChildren] = useState('0');
  const [weatherCache, setWeatherCache] = useState({});
  const [weatherLoadingProgress, setWeatherLoadingProgress] = useState({});

  const monthNames = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  const selectedMonthName = monthNames[(selectedMonth || 1) - 1] || '';


  // Salvare cache meteo în DB pentru persistență (2027-2030)
  const saveWeatherToDB = async (weatherData) => {
    try {
      await fetch(`/api/holidays/${selectedYear || year}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather: weatherData })
      });
    } catch (error) {
      console.error('Error saving weather to DB:', error);
    }
  };

  // Fetch live weather data for holidays
  useEffect(() => {
    if (activeTab === 'zile-libere') {
      const targetYear = selectedYear || year;
      const allHolidays = holidays.length > 0 ? holidays : defaultHolidays[targetYear] || [];

      const fetchWeather = async () => {
        let updated = false;
        const newCache = { ...weatherCache };

        // Cerință: Pentru 2026, datele sunt deja hardcodate în getHistoricalWeather.
        // Pentru 2027-2030, dacă nu există date, folosim mirroring din 2026 sau anul curent.
        for (const h of allHolidays) {
          if (!newCache[h.date] && !weatherLoadingProgress[h.date]) {
            setWeatherLoadingProgress(prev => ({ ...prev, [h.date]: true }));

            // Determinăm data pentru fetch (mirroring pentru ani viitori nerealizați în Admin)
            let fetchDate = h.date;
            if (targetYear > 2026) {
              // Dacă e an viitor, încercăm să "oglindim" datele din 2026 pentru a avea un punct de plecare
              const monthDay = h.date.substring(5); // MM-DD
              fetchDate = `2026-${monthDay}`;
            }

            const data = await getHistoricalWeather(fetchDate);
            newCache[h.date] = data;
            setWeatherLoadingProgress(prev => ({ ...prev, [h.date]: false }));
            updated = true;
          }
        }

        if (updated) {
          setWeatherCache(newCache);
          // Salvăm în DB doar dacă nu e 2026 (care e readonly hardcoded)
          if (targetYear !== 2026 && Object.keys(newCache).length >= allHolidays.length) {
            saveWeatherToDB(newCache);
          }
        }
      };

      fetchWeather();
    }
  }, [activeTab, holidays, selectedYear, year]);
  const [mealVouchers, setMealVouchers] = useState('0');
  const [voucherDays, setVoucherDays] = useState('22');
  const [vacationVouchers, setVacationVouchers] = useState('0');
  const [isPartTime, setIsPartTime] = useState(false);
  const [isPartTimeStudentOrPensioner, setIsPartTimeStudentOrPensioner] = useState(false);
  const [currency, setCurrency] = useState('RON');
  const [exchangeRate, setExchangeRate] = useState(4.98);

  // NEW - Opțiuni Avansate
  const [isBasicFunction, setIsBasicFunction] = useState(true); // Funcție de bază
  const [age, setAge] = useState(30); // Pentru scutire < 26 ani
  const [isYouthExempt, setIsYouthExempt] = useState(false); // < 26 ani
  const [isTaxExempt, setIsTaxExempt] = useState(false); // Handicap/Scutit complet
  const [showAdvanced, setShowAdvanced] = useState(false); // Toggle calcul avansat

  // MEDICAL LEAVE
  const [enableMedicalLeave, setEnableMedicalLeave] = useState(false);
  const [sickCode, setSickCode] = useState('01');
  const [sickDays, setSickDays] = useState('5');
  const [medicalLeaveResult, setMedicalLeaveResult] = useState(null);

  // Results
  const [result, setResult] = useState(null);
  const [comparison2025, setComparison2025] = useState(null);
  const [expandedHolidayIndex, setExpandedHolidayIndex] = useState(null);

  const hasHydrated = useRef(false);

  // Consolidated Hydration Logic (Mount Only or External Sync)
  useEffect(() => {
    if (hasHydrated.current) return;

    // Priority: URL query params > initialValue props > LocalStorage
    const urlValue = searchParams.get('value') || searchParams.get('brut');
    const urlType = searchParams.get('type');
    const urlSector = searchParams.get('sector');
    const urlCurrency = searchParams.get('currency');
    const urlYear = searchParams.get('an');
    const urlMonth = searchParams.get('luna');
    const urlChildren = searchParams.get('copii');
    const urlDependents = searchParams.get('persoane');
    const urlTickets = searchParams.get('tichete');
    const urlDays = searchParams.get('zile');
    const urlBasicFunc = searchParams.get('functie_baza');
    const urlYouth = searchParams.get('tanar');
    const urlHandicap = searchParams.get('handicap');
    const voucherDaysVal = searchParams.get('voucherDays');
    const vacationVouchersVal = searchParams.get('vacationVouchers');

    // 1. Load from localStorage (as base)
    const saved = loadFromStorage('salary_calculator');
    if (saved) {
      if (saved.inputValue) setInputValue(saved.inputValue);
      if (saved.calculationType) setCalculationType(saved.calculationType);
      if (saved.sector) setSector(saved.sector);
      if (saved.dependents) setDependents(saved.dependents.toString());
      if (saved.children) setChildren(saved.children.toString());
      if (saved.mealVouchers) setMealVouchers(saved.mealVouchers.toString());
      if (saved.voucherDays) setVoucherDays(saved.voucherDays.toString());
      if (saved.currency) setCurrency(saved.currency);
      if (saved.vacationVouchers) setVacationVouchers(saved.vacationVouchers.toString());
    }

    // 2. Let Props (SEO slugs) override
    if (initialValue) {
      setInputValue(initialValue);
      // If we have a prop value, we likely need to clear any stale results to force fresh calc
      setResult(null);
    }
    if (initialSector) setSector(initialSector);
    if (initialType) setCalculationType(initialType);

    // 3. Finally let explicit URL query params have the final word
    if (urlValue) {
      setInputValue(urlValue);
      if (urlType) setCalculationType(urlType);
      if (urlSector) setSector(urlSector);
      if (urlCurrency) setCurrency(urlCurrency);
      if (urlYear) setSelectedYear(parseInt(urlYear));
      if (urlMonth) setSelectedMonth(parseInt(urlMonth));
      if (urlChildren) setChildren(urlChildren);
      if (urlDependents) setDependents(urlDependents);
      if (urlTickets) setMealVouchers(urlTickets);
      if (urlDays) setVoucherDays(urlDays);
      if (urlBasicFunc === '0') setIsBasicFunction(false);
      if (urlYouth === '1') setIsYouthExempt(true);
      if (urlHandicap === '1') setIsTaxExempt(true);
      if (vacationVouchersVal) setVacationVouchers(vacationVouchersVal);
    }

    hasHydrated.current = true;
  }, [searchParams, initialValue, initialSector, initialType]);

  // Handle Sector/Type sync IF they change via external navigation (e.g. Breadcrumbs or Menu)
  // But NOT inputValue to prevent the typing reset loop
  useEffect(() => {
    if (!hasHydrated.current) return;
    if (initialSector && initialSector !== sector) setSector(initialSector);
    if (initialType && initialType !== calculationType) setCalculationType(initialType);
  }, [initialSector, initialType]);


  // Helper pentru a obține Salariul Minim (Brut și Net) în funcție de sector și opțiuni
  const getCurrentMinValues = () => {
    // Protocol Check: Figures must come from engine
    return getSectorMinimums(sector, fiscalRules, {
      isBasicFunction,
      dependents: parseInt(dependents) || 0,
      children: parseInt(children) || 0,
      isTaxExempt,
      isYouthExempt
    });
  };

  const { brut: currentMinBrut, net: currentMinNet } = getCurrentMinValues();

  // NOU: Auto-calculate când regulile fiscale sunt încărcate și orice input relevant se schimbă
  useEffect(() => {
    if (fiscalRules && !loading && inputValue) {
      const val = parseFloat(inputValue);

      // Handle explicit 'minim' from SEO slug
      if (inputValue === 'minim') {
        const { brut: minBrut } = getCurrentMinValues();
        setInputValue(minBrut.toString());
        return;
      }

      if (!isNaN(val) && val > 0) {
        const timer = setTimeout(() => {
          calculate();
        }, 150); // Small debounce to avoid flickering while typing
        return () => clearTimeout(timer);
      }
    }
  }, [
    fiscalRules,
    loading,
    inputValue,
    sector,
    calculationType,
    currency,
    dependents,
    children,
    mealVouchers,
    voucherDays,
    vacationVouchers, // Added vacationVouchers to dependency array
    isBasicFunction,
    isYouthExempt,
    isTaxExempt,
    isPartTime,
    isPartTimeStudentOrPensioner,
    enableMedicalLeave,
    sickCode,
    sickDays
  ]);

  // Update browser title dynamically for SEO
  useEffect(() => {
    if (activeTab === 'calculator') {
      const title = inputValue
        ? `Calcul Salariu ${calculationType === 'brut-net' ? 'Net' : 'Brut'} ${inputValue} ${currency} - ${selectedYear || year} | eCalc`
        : `Calculator Salarii Profesional ${selectedYear || year} | eCalc`;
      document.title = title;
    }
  }, [inputValue, calculationType, selectedYear, year, activeTab, currency]);

  // Save to localStorage when inputs change
  useEffect(() => {
    if (!loading) {
      saveToStorage('salary_calculator', {
        inputValue,
        calculationType,
        sector,
        dependents,
        children,
        mealVouchers,
        voucherDays,
        currency,
        vacationVouchers,
      });
    }
  }, [inputValue, calculationType, sector, dependents, children, mealVouchers, voucherDays, currency, loading, vacationVouchers]);

  // Încarcă regulile fiscale când anul URL sau anul selectat se schimbă
  useEffect(() => {
    loadFiscalRules();
    loadExchangeRate();
  }, [year, selectedYear]);

  const loadFiscalRules = async () => {
    try {
      // Folosește anul selectat din dropdown (dacă e diferit) sau anul din URL
      const targetYear = selectedYear || year;
      const response = await fetch(`/api/fiscal-rules/${targetYear}?history=1`, { cache: 'no-store' });
      const data = await response.json();
      // PLAN C: Map DB data to standard schema
      const mappedRules = mapDbToFiscalRules(data);

      if (Array.isArray(mappedRules)) {
        // If it's an array (History), store it and pick correct one for current month
        setFiscalRulesHistory(mappedRules);
        updateActiveRule(mappedRules, selectedMonth || new Date().getMonth() + 1);
      } else {
        // Legacy/Fallback (Single Object)
        setFiscalRules(mappedRules);
        setFiscalRulesHistory([mappedRules]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Fiscal Load Error:', error);
      toast.error('Eroare la încărcarea regulilor fiscale');
      setLoading(false);
    }
  };

  // Helper to pick the right rule for the selected month
  const updateActiveRule = (history, month) => {
    if (!history || history.length === 0) return;

    const targetYear = selectedYear || year;
    // Construct a comparable date string: YYYY-MM-DD (End of month or Start? Start is safer)
    // Actually we need to check if the rule is effective BEFORE the target month starts/ends.
    // Let's us start of month. If rule is effective 1st July, it applies to July.
    const targetDateStr = `${targetYear}-${String(month).padStart(2, '0')}-01`;

    // Sort descending by date (Newest first)
    const sorted = [...history].sort((a, b) =>
      new Date(b.effectiveDate || `${targetYear}-01-01`).getTime() -
      new Date(a.effectiveDate || `${targetYear}-01-01`).getTime()
    );

    // Find first rule that has effectiveDate <= targetDate
    const active = sorted.find(r => {
      const eff = r.effectiveDate || `${targetYear}-01-01`;
      return eff <= targetDateStr;
    });

    // If found, use it. If not (e.g. target is Jan, rule starts Mar), use the oldest one (fallback) 
    // or arguably the previous year? For now, assume oldest valid rule for that year.
    const ruleToUse = active || sorted[sorted.length - 1];

    setFiscalRules(ruleToUse);

    // Also update exchange rate if connected
    if (ruleToUse.exchange_rate?.eur) {
      setExchangeRate(ruleToUse.exchange_rate.eur);
    }
  };

  // Re-select rule when month changes
  useEffect(() => {
    if (fiscalRulesHistory.length > 0) {
      updateActiveRule(fiscalRulesHistory, selectedMonth);
    }
  }, [selectedMonth, fiscalRulesHistory]);

  const loadExchangeRate = async () => {
    // This is now handled in loadFiscalRules
    // Kept for backwards compatibility
  };

  // Încarcă zilele libere din API sau folosește valorile default
  const loadHolidays = async () => {
    try {
      const targetYear = selectedYear || year;
      const response = await fetch(`/api/holidays/${targetYear}`);
      if (response.ok) {
        const data = await response.json();
        const customHolidays = data.holidays || [];
        const defaults = defaultHolidays[targetYear] || [];

        // Merge: Create a map by date to handle unique/overrides
        const holidayMap = new Map();

        // 1. Add defaults first
        defaults.forEach(h => holidayMap.set(h.date, h));

        // 2. Add/Override with custom holidays
        customHolidays.forEach(h => holidayMap.set(h.date, h));

        // 3. Convert back to array and sort
        const mergedHolidays = Array.from(holidayMap.values()).sort((a, b) =>
          new Date(a.date) - new Date(b.date)
        );

        setHolidays(mergedHolidays);
        if (data.weather) setWeatherCache(data.weather);
      } else {
        setHolidays(defaultHolidays[targetYear] || []);
      }
    } catch (error) {
      const targetYear = selectedYear || year;
      setHolidays(defaultHolidays[targetYear] || []);
    }
  };

  // Calculează zilele lucratoare când se schimbă anul sau zilele libere
  useEffect(() => {
    loadHolidays();
  }, [selectedYear, year]);

  useEffect(() => {
    if (holidays.length > 0 || defaultHolidays[selectedYear || year]) {
      const targetYear = selectedYear || year;
      const holidaysToUse = holidays.length > 0 ? holidays : (defaultHolidays[targetYear] || []);
      const data = calculateYearlyWorkingDays(targetYear, holidaysToUse);
      setYearlyData(data);
    }
  }, [holidays, selectedYear, year]);

  // ============================================
  // PRINT - DOAR REZULTATUL (A4/A5)
  // ============================================
  // ============================================
  // PRINT - MD3 PREMIUM LAYOUT (Pure CSS Approach)
  // ============================================
  const handlePrintResult = () => {
    if (activeTab === 'calculator' && !result) {
      toast.error('Calculați mai întâi salariul pentru a printa');
      return;
    }

    // Simplu: declanșăm dialogul de print al browserului.
    // CSS-ul @media print se va ocupa de restul.
    window.print();
    toast.success('Pregătim raportul pentru imprimare...');
  };

  const getDetailedExplanation = () => {
    if (!result) return "";

    const isIT = sector === 'it';
    const isConst = sector === 'construction';
    const isAgri = sector === 'agriculture';

    let mainMessage = "";
    const val = parseFloat(inputValue);

    if (calculationType === 'brut-net') {
      mainMessage = `Pentru un salariu brut de ${val} ${currency}, angajatul primește un salariu net de ${result.net.toFixed(0)} RON.`;
    } else if (calculationType === 'net-brut') {
      mainMessage = `Pentru a obține un salariu net de ${val} ${currency}, salariul brut necesar este de ${result.gross.toFixed(0)} RON.`;
    } else {
      mainMessage = `La un cost total de ${val} ${currency}, salariul net rezultat este de ${result.net.toFixed(0)} RON.`;
    }

    return (
      <div className="space-y-4">
        <div className="bg-indigo-50/30 rounded-2xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-100">
          <p className="font-medium text-slate-900 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            Analiză Salarială {selectedYear || year}
          </p>
          <p className="mb-2">{mainMessage}</p>
          <p className="mb-2">
            Contribuțiile sociale reținute sunt: CAS (Pensii) <b>{result.cas.toFixed(0)} RON</b> și CASS (Sănătate) <b>{result.cass.toFixed(0)} RON</b>.
          </p>

          {isIT && (
            <p className="text-xs mt-2 bg-blue-50/50 p-2 rounded text-blue-800 border border-blue-100/50">
              ℹ️ Sector IT: Scutire de impozit pe venit pentru primii {fiscalRules?.salary?.it_threshold?.toLocaleString('ro-RO') || '...'} RON brut.
            </p>
          )}
          {(isConst || isAgri) && (
            <p className="text-xs mt-2 bg-orange-50/50 p-2 rounded text-orange-800 border border-orange-100/50">
              ℹ️ Sector {isConst ? 'Construcții' : 'Agricultură'}: Facilități fiscale aplicate (CAS redus, scuțire CASS/Impozit) conform legislației.
            </p>
          )}

          <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 italic">
            Costul total suportat de angajator: <b>{result.totalCost.toFixed(0)} RON</b> (inclusiv CAM).
          </p>
        </div>

        <div className="p-3 text-[11px] text-slate-400 italic leading-relaxed text-center">
          Acest instrument este destinat exclusiv simularilor si nu inlocuieste consultanta juridica sau fiscala.
          ecalc.ro nu poate fi tinut responsabil pentru erori sau omisiuni rezultate din calcule.
          Pentru rezultate garantate, apelati la un specialist.
        </div>
      </div>
    );
  };

  const calculate = () => {
    if (!fiscalRules || !inputValue || parseFloat(inputValue) <= 0) {
      toast.error('Introduceți o valoare validă');
      return;
    }

    const calculator = new SalaryCalculator(fiscalRules);
    const value = parseFloat(inputValue);
    const valueInRON = currency === 'EUR' ? value * exchangeRate : value;

    // Opțiuni complete cu toate facilitățile avansate
    // IMPORTANT: Verificăm explicit dacă mealVouchers este setat (chiar și 0)
    const mealVouchersValue = mealVouchers !== '' && mealVouchers !== null && mealVouchers !== undefined
      ? parseFloat(mealVouchers)
      : 0;
    const vacationVouchersValue = vacationVouchers !== '' && vacationVouchers !== null && vacationVouchers !== undefined
      ? parseFloat(vacationVouchers)
      : 0;

    const options = {
      dependents: parseInt(dependents) || 0,
      children: parseInt(children) || 0,
      mealVouchers: mealVouchersValue,
      voucherDays: parseInt(voucherDays) || 22,
      vacationVouchers: vacationVouchersValue, // Added vacationVouchers
      isStudentOrPensioner: isPartTimeStudentOrPensioner,
      // OPȚIUNI AVANSATE
      isBasicFunction, // Pentru deducere personală (doar cu funcție de bază)
      age: isYouthExempt ? 25 : 30, // Sub 26 = scutire IV
    };

    // OPTIMIZED - Use isolated Salary Engine
    const calcResult = calculateSalaryResults(
      valueInRON,
      calculationType,
      sector,
      fiscalRules,
      {
        ...options,
        isPartTime,
        isPartTimeStudentOrPensioner
      }
    );

    setResult(calcResult);

    // Actualizare URL pentru SEO
    // IMPORTANT: Transmitem REZULTATUL calculat proaspăt pentru a evita race-condition cu starea async
    updateURLParams(valueInRON, sector, calculationType, calcResult);

    // Update comparison
    load2025Comparison(valueInRON, sector, calculationType, options);

    // MEDICAL LEAVE CALCULATION
    if (enableMedicalLeave && fiscalRules && valueInRON > 0) {
      // Instantiate Medical Leave Calculator with SAME rules
      const mlCalculator = new MedicalLeaveCalculator(fiscalRules);
      const mlRes = mlCalculator.calculate({
        sickCode: sickCode,
        days: parseInt(sickDays) || 0,
        averageSalaryOverride: valueInRON, // Use current gross as average
        monthsContributed: 12
      });
      setMedicalLeaveResult(mlRes);
    } else {
      setMedicalLeaveResult(null);
    }
  };

  // ============================================
  // URL DINAMIC - SEO POWER
  // ============================================
  // Update URL function - NOW accepts explicit sector/type overrides
  const updateURLParams = (grossValue, overrideSector = null, overrideType = null, currentResult = null) => {
    // GUARD: Only update URL if we are on the main calculator tab
    if (activeTab !== 'calculator') return;

    const params = new URLSearchParams();

    // Use overrides if provided, otherwise current state
    const currentSector = overrideSector || sector;
    const currentType = overrideType || calculationType;

    // Folosim rezultatul pasat ca argument (calculat pe loc) sau cel din state ca fallback
    const effectiveResult = currentResult || result;
    const currentVal = Math.round(currentType === 'brut-net' ? grossValue : effectiveResult?.net || 0);

    // 1. Construct SEO-friendly slug
    // Format: /2026/[valoare]-[sector]-[tip]
    // Ex: /2026/3000-it-brut

    // Determine slug parts (Standardized to Romanian for SEO)
    let slugSector = '';
    let sectorKey = '';
    if (currentSector === 'it') { slugSector = '-it'; sectorKey = 'it'; }
    else if (currentSector === 'construction') { slugSector = '-constructii'; sectorKey = 'constructii'; }
    else if (currentSector === 'agriculture') { slugSector = '-agricultura'; sectorKey = 'agricultura'; }
    else { sectorKey = 'standard'; }

    let slugType = currentType === 'brut-net' ? '-brut' : (currentType === 'net-brut' ? '-net' : '-cost');

    // 2. Logic for 'minim' slug preservation
    const { brut: minSalary } = getCurrentMinValues();
    const isMinim = Math.round(grossValue) === Math.round(minSalary) && currentType === 'brut-net';

    // Construct new slug with descriptive suffix for SEO
    let newSlug = "";
    if (isMinim) {
      newSlug = `minim-${sectorKey}`;
    } else {
      // FORMAT: [val]-ron-[sector]-[tip]-calcul-salariu-net
      newSlug = `${currentVal}-ron${slugSector}${slugType}-calcul-salariu-net`;
    }

    const newPath = `/calculator-salarii-pro/${selectedYear || year}/${newSlug}`;

    // Update history without reload
    window.history.replaceState({}, '', newPath);

    // Update document title
    const title = `Calcul Salariu ${currentType === 'brut-net' ? 'Net' : 'Brut'} ${currentVal} ${currency} ${currentSector !== 'standard' ? `(${currentSector})` : ''} - ${selectedYear || year} | eCalc`;
    document.title = title;
  };

  const load2025Comparison = async (valueInRON, sector, calculationType, options) => {
    try {
      const response = await fetch('/api/fiscal-rules/2025');
      const data2025 = await response.json();
      const mapped2025 = mapDbToFiscalRules(data2025);

      const result2025 = calculateSalaryResults(
        valueInRON,
        calculationType,
        sector,
        mapped2025,
        options
      );

      setComparison2025(result2025);
    } catch (error) {
      console.error('Error loading 2025 comparison:', error);
    }
  };

  const shareToSocial = (platform) => {
    const url = window.location.href.split('#')[0];
    const shareMessage = activeTab === 'zile-libere' ? 'Zile Libere' : activeTab === 'zile-lucratoare' ? 'Zile Lucrătoare' : 'Calculator Salariu';
    const text = encodeURIComponent(`Vezi ${shareMessage} pe eCalc.ro! #fiscale #romania`);

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400,noopener,noreferrer');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, '_blank', 'width=600,height=400');
        break;
      case 'instagram':
      case 'tiktok':
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          toast.success(`Link copiat! Poți să-l adaugi acum în Story pe ${platform === 'instagram' ? 'Instagram' : 'TikTok'}`);
        }
        break;
      default:
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
          toast.success('Link copiat în clipboard!');
        }
    }
  };

  const shareCalculation = () => {
    if (activeTab === 'calculator') {
      const params = new URLSearchParams({
        type: calculationType,
        value: inputValue,
        sector,
        dependents,
        children,
        vouchers: mealVouchers,
        days: voucherDays,
        currency,
      });
      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      navigator.clipboard.writeText(url);
      toast.success('Link calcul copiat în clipboard!');
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link pagină copiat!');
    }
  };

  const downloadPDF = () => {
    if (activeTab === 'calculator' && !result) {
      toast.error('Calculați mai întâi salariul pentru a descărca PDF');
      return;
    }

    try {
      if (activeTab === 'calculator') {
        const filename = generateSalaryPDF(result, selectedYear || year, exchangeRate);
        toast.success(`PDF descărcat: ${filename}`);
      } else {
        const title = activeTab === 'zile-libere' ? `Zile Libere ${selectedYear || year}` : `Zile Lucratoare ${selectedYear || year}`;
        let dataToExport = {};

        if (activeTab === 'zile-libere') {
          const allHolidays = holidays.length > 0 ? holidays : defaultHolidays[selectedYear || year] || [];
          dataToExport = allHolidays.reduce((acc, h) => {
            const d = new Date(h.date);
            const dateStr = `${d.getDate()} ${d.toLocaleDateString('ro-RO', { month: 'long' })} ${d.getFullYear()}`;
            return { ...acc, [dateStr]: h.name };
          }, {});
          generateGenericPDF(title, dataToExport, selectedYear || year);
        } else {
          const data = yearlyData || calculateYearlyWorkingDays(selectedYear || year, holidays.length > 0 ? holidays : defaultHolidays[selectedYear || year]);
          generateWorkingDaysPDF(data, selectedYear || year);
        }
        toast.success('PDF generat cu succes');
      }
    } catch (error) {
      toast.error('Eroare la generarea PDF-ului');
      console.error(error);
    }
  };

  // ============================================
  // EXPORT - PRINT PDF (DOAR REZULTATUL - A4/A5)
  // ============================================
  // Funcția handlePrintResult este definită mai sus după loadHolidays

  // ============================================
  // EXPORT - EMAIL REZULTATE
  // ============================================
  const handleEmail = () => {
    if (activeTab === 'calculator' && !result) {
      toast.error('Calculați mai întâi salariul');
      return;
    }

    let subject = '';
    let bodyText = '';

    if (activeTab === 'zile-libere') {
      subject = `Zile Libere ${selectedYear || year} - eCalc.ro`;
      const allHolidays = holidays.length > 0 ? holidays : defaultHolidays[selectedYear || year] || [];
      bodyText = `LISTA ZILE LIBERE ${selectedYear || year}\n`;
      bodyText += `====================================\n\n`;
      allHolidays.forEach(h => {
        const d = new Date(h.date);
        bodyText += `- ${d.getDate()} ${d.toLocaleDateString('ro-RO', { month: 'long' })} (${d.toLocaleDateString('ro-RO', { weekday: 'long' })}): ${h.name}\n`;
      });
    } else if (activeTab === 'zile-lucratoare') {
      subject = `Zile Lucrătoare ${selectedYear || year} - eCalc.ro`;
      const data = yearlyData || calculateYearlyWorkingDays(selectedYear || year, holidays.length > 0 ? holidays : defaultHolidays[selectedYear || year]);
      bodyText = `ZILE LUCRĂTOARE ${selectedYear || year}\n`;
      bodyText += `====================================\n`;
      bodyText += `Total an: ${data.totalWorkingDays} zile (${data.totalWorkingHours} ore)\n\n`;
      data.months.forEach(m => {
        bodyText += `- ${m.month}: ${m.workingDays} zile lucrătoare, ${m.holidays} zile libere\n`;
      });
    } else {
      subject = `Calculator Salariu ${selectedYear} - Rezultate`;
      const totalTaxes = result.cas + result.cass + result.incomeTax;

      bodyText = `CALCULATOR SALARIU ${selectedYear} - REZULTATE\n`;
      bodyText += `====================================\n\n`;
      bodyText += `📊 SALARIU BRUT: ${result.gross.toFixed(2)} RON\n`;
      bodyText += `💰 SALARIU NET: ${result.net.toFixed(2)} RON\n`;
      bodyText += `📉 TOTAL TAXE ANGAJAT: ${totalTaxes.toFixed(2)} RON\n\n`;
      bodyText += `DETALII TAXE:\n`;
      bodyText += `- CAS (Pensii): ${result.cas.toFixed(2)} RON\n`;
      bodyText += `- CASS (Sănătate): ${result.cass.toFixed(2)} RON\n`;
      bodyText += `- Impozit pe Venit: ${result.incomeTax.toFixed(2)} RON\n\n`;

      if (result.personalDeduction > 0) {
        bodyText += `✅ Deducere personală: ${result.personalDeduction.toFixed(2)} RON\n`;
      }
      if (result.childDeduction > 0) {
        bodyText += `✅ Deducere copii: ${result.childDeduction.toFixed(2)} RON\n`;
      }
      if (result.taxExemptReason) {
        bodyText += `✅ ${result.taxExemptReason}\n`;
      }

      bodyText += `\n💼 COST TOTAL ANGAJATOR: ${result.totalCost.toFixed(2)} RON\n`;
    }

    bodyText += `\n====================================\n`;
    bodyText += `Calculat pe eCalc.ro - ${new Date().toLocaleDateString('ro-RO')}\n`;
    bodyText += `Link: ${window.location.href.split('#')[0]}`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(bodyText);

    window.location.href = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
    toast.success('Clientul de email a fost deschis');
  };

  const resetForm = () => {
    setInputValue('');
    setCalculationType('brut-net');
    setSector('standard');
    setDependents('0');
    setChildren('0');
    setMealVouchers('0');
    setVoucherDays('22');
    setCurrency('RON');
    setIsPartTime(false);
    setIsPartTimeStudentOrPensioner(false);
    setResult(null);
    setComparison2025(null);
    clearStorage('salary_calculator');
    toast.success('Formular resetat');
  };

  const isInfoTab = initialTab === 'zile-libere' || initialTab === 'zile-lucratoare';

  if (loading && !isInfoTab) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <NavigationHeader />
        {/* SEO Semantic content while loading */}
        <div className="sr-only" aria-hidden="true">
          <h1>{`Calculator Salariu ${year} - Brut la Net & Detalii Taxe`}</h1>
          <p>Se încarcă regulile fiscale pentru anul {year}. Calculatorul nostru oferă detalii oficiale despre salariul minim, deduceri și impozit în IT, Construcții și Agricultură.</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Calculator className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Se încarcă regulile fiscale {year}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <NavigationHeader />

        <div className="container mx-auto px-4 py-4 sm:py-6">
          {/* Page Header with Right-Aligned Breadcrumbs */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 gap-4">
            <div className="flex-1">
              {activeTab === 'zile-lucratoare' ? (
                <>
                  <h1 className="text-2xl font-bold text-slate-900">Zile Lucrătoare {selectedYear || year}</h1>
                  <p className="text-sm text-slate-600 mt-1">Calendar detaliat cu zilele lucrătoare și libere</p>
                </>
              ) : activeTab === 'zile-libere' ? (
                <>
                  <h1 className="text-2xl font-bold text-slate-900">Sărbători Legale {selectedYear || year}</h1>
                  <p className="text-sm text-slate-600 mt-1">Lista completă a zilelor libere legale din România</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    {inputValue
                      ? `Calcul Salariu ${calculationType === 'brut-net' ? 'Net' : 'Brut'} ${inputValue} ${currency} - ${selectedYear || year}`
                      : `Calculator Salarii Profesional ${selectedYear || year}`}
                  </h1>

                  {/* SEO Semantic Content (Visually Hidden) */}
                  <div className="sr-only" aria-hidden="true">
                    <p>
                      Acest instrument de calcul salarial pentru anul {selectedYear || year} oferă o estimare precisă a veniturilor nete și costurilor angajatorului.
                      Monitorizăm constant modificările Codului Fiscal pentru a asigura calcule corecte pentru sectoarele IT, Construcții și Agricultură.
                    </p>
                    {result && (
                      <>
                        <p>{getDetailedExplanation()}</p>
                        <h3>Comparație Sectoare pentru {inputValue} {currency}</h3>
                        <p>
                          Dacă ai activa în sectorul IT, netul ar fi diferit datorită scutirilor specifice.
                          În Construcții și Agricultură, facilitățile fiscale pot crește salariul net prin reducerea contribuțiilor.
                          Calculatorul nostru permite compararea instantanee a acestor scenarii pentru a vedea exact câți bani primești "în mână".
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="md:w-auto flex flex-col items-end gap-3">
              <Breadcrumbs items={[
                { label: 'Calculator Salarii', href: `/calculator-salarii-pro/${year}` },
                ...(activeTab === 'zile-lucratoare' ? [{ label: 'Zile Lucrătoare' }] : []),
                ...(activeTab === 'zile-libere' ? [{ label: 'Zile Libere' }] : []),
                ...(activeTab === 'calculator' ? [
                  ...(sector !== 'standard' ? [{
                    label: sector === 'construction' ? 'CONSTRUCȚII' : (sector === 'agriculture' ? 'AGRICULTURĂ' : sector.toUpperCase()),
                    className: 'text-blue-600 font-bold'
                  }] : []),
                  ...(inputValue ? [
                    { label: calculationType === 'brut-net' ? 'Brut' : (calculationType === 'net-brut' ? 'Net' : 'Total'), className: 'text-slate-400' },
                    { label: `${inputValue} ${currency}` }
                  ] : [{ label: (selectedYear || year).toString() }])
                ] : [])
              ]} />


            </div>
          </div>

          {/* Tab-uri pentru Navigator + Selector An (Conditional) */}
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                <div className="grid w-full sm:w-auto grid-cols-3 max-w-lg h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500">
                  <Link
                    href={`/calculator-salarii-pro/${selectedYear || year}`}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'calculator' ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Salariu PRO
                  </Link>
                  <Link
                    href={`/calculator-salarii-pro/${selectedYear || year}/zile-lucratoare`}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'zile-lucratoare' ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Zile Lucrătoare
                  </Link>
                  <Link
                    href={`/calculator-salarii-pro/${selectedYear || year}/zile-libere`}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'zile-libere' ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Zile Libere
                  </Link>
                </div>

                {/* Selector An + Butoane Print/PDF - DOAR pentru Zile Lucrătoare / Zile Libere */}
                {activeTab !== 'calculator' && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 pl-2">Anul:</span>
                      <Select value={(selectedYear || year).toString()} onValueChange={(v) => {
                        const newYear = parseInt(v);
                        setSelectedYear(newYear);
                        // Update URL logic
                        if (activeTab === 'calculator') router.push(`/calculator-salarii-pro/${newYear}`);
                        else router.push(`/calculator-salarii-pro/${newYear}/${activeTab}`);
                      }}>
                        <SelectTrigger className="h-8 w-[100px] border-none bg-transparent focus:ring-0 text-slate-900 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 6 }, (_, i) => 2025 + i).map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 no-print">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrintResult}
                        className="w-9 h-9 p-0 border-slate-200 shadow-sm hover:text-blue-600 bg-white"
                        title="Printează"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadPDF}
                        className="w-9 h-9 p-0 border-slate-200 shadow-sm hover:text-blue-600 bg-white"
                        title="Descarcă PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* SEO Variation Links - DOAR pentru Calculator (când există input) */}
                {activeTab === 'calculator' && inputValue && result && (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-xs text-indigo-900/60 font-semibold tracking-wide hidden sm:inline uppercase text-[10px]">Vezi și salariul de:</span>
                    <div className="flex gap-2">
                      {[-100, -50, 50, 100].map((diff) => {
                        const val = parseInt(inputValue);
                        if (isNaN(val)) return null;
                        const newVal = val + diff;
                        if (newVal <= 0) return null;

                        const typeSlug = calculationType === 'net-brut' ? 'net' : 'brut';

                        // Map internal sector to SEO slug (ROBUST MAPPING)
                        let sectorSlug = 'standard';
                        const s = (sector || 'standard').toLowerCase();

                        if (s === 'it' || s.includes('it')) sectorSlug = 'it';
                        else if (s === 'construction' || s.includes('construct')) sectorSlug = 'constructii';
                        else if (s === 'agriculture' || s.includes('agri')) sectorSlug = 'agricultura';

                        // Slug format: /year/[val]-ron-[sector]-[tip]-calcul-salariu-net
                        const href = `/calculator-salarii-pro/${selectedYear || year}/${newVal}-ron${sectorSlug === 'standard' ? '' : '-' + sectorSlug}-${typeSlug}-calcul-salariu-net`;

                        return (
                          <Link
                            key={diff}
                            href={href}
                            title={`Calculează salariul ${sectorSlug} pentru ${newVal} ${currency}`}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 hover:border-indigo-200 transition-all shadow-sm"
                          >
                            {diff > 0 ? '+' : ''} {newVal} {currency}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TAB: CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="mt-2">

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Input Panel */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurare Calcul</CardTitle>
                      <CardDescription>Selectați tipul de calcul și introduceți datele</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Salariu + Buton Salariu Minim */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Salariu</Label>
                          <Input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Introduceți salariul aici..."
                            className="bg-blue-50 border-2 border-blue-400 focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <Label>Salariu Minim</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (calculationType === 'net-brut') {
                                setInputValue(currentMinNet.toString());
                              } else {
                                setInputValue(currentMinBrut.toString());
                              }
                            }}
                            className="w-full h-10 text-xs border-blue-200 hover:bg-blue-50 text-blue-700 font-bold"
                          >
                            {calculationType === 'net-brut' ? `${currentMinNet} RON NET` : `${currentMinBrut} RON BRUT`}
                          </Button>
                        </div>
                      </div>

                      {/* Tip Calcul + Sector */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Tip Calcul</Label>
                          <Select value={calculationType} onValueChange={setCalculationType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="brut-net">Brut → Net</SelectItem>
                              <SelectItem value="net-brut">Net → Brut</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Sector</Label>
                          <Select value={sector} onValueChange={setSector}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="it">IT</SelectItem>
                              <SelectItem value="construction">Construcții</SelectItem>
                              <SelectItem value="agriculture">Agricultură</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Calculator Avansat - Toggle */}
                      <div className="border-t pt-4">
                        <button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="w-full flex items-center justify-center text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
                        >
                          <span>⚙️ Calcul Avansat</span>
                        </button>

                        {showAdvanced && (
                          <div className="space-y-4 mt-4 pt-4 border-t">
                            {/* Persoane întreținere + Copii */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>Persoane întreținere</Label>
                                <Input
                                  type="number"
                                  value={dependents}
                                  onChange={(e) => setDependents(e.target.value)}
                                  min="0"
                                />
                              </div>
                              <div>
                                <Label>Copii sub 18 ani</Label>
                                <Input
                                  type="number"
                                  value={children}
                                  onChange={(e) => setChildren(e.target.value)}
                                  min="0"
                                />
                              </div>
                            </div>

                            {/* Tichete masă + Zile */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>Tichet masă (RON)</Label>
                                <Input
                                  type="number"
                                  value={mealVouchers}
                                  onChange={(e) => setMealVouchers(e.target.value)}
                                  min="0"
                                  max={fiscalRules?.salary?.meal_voucher_max || 40}
                                />
                              </div>
                              <div>
                                <Label>Zile lucrate/lună</Label>
                                <Input
                                  type="number"
                                  value={voucherDays}
                                  onChange={(e) => setVoucherDays(e.target.value)}
                                  min="0"
                                  max="31"
                                />
                              </div>
                            </div>

                            {/* Vouchere Vacanță */}
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <Label>Vouchere Vacanță (RON / an)</Label>
                                <Input
                                  type="number"
                                  value={vacationVouchers}
                                  onChange={(e) => setVacationVouchers(e.target.value)}
                                  min="0"
                                  placeholder="Ex: 1600"
                                />
                              </div>
                            </div>

                            {/* Part-time */}
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="parttime"
                                  checked={isPartTime}
                                  onChange={(e) => setIsPartTime(e.target.checked)}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="parttime" className="text-sm">Part-time (sub salariu minim)</Label>
                              </div>
                              {isPartTime && (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="student"
                                    checked={isPartTimeStudentOrPensioner}
                                    onChange={(e) => setIsPartTimeStudentOrPensioner(e.target.checked)}
                                    className="h-4 w-4"
                                  />
                                  <Label htmlFor="student" className="text-sm">Elev/Student/Pensionar</Label>
                                </div>
                              )}
                            </div>


                            {/* Selectoare An, Lună, Monedă */}
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">An Fiscal</Label>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 16 }, (_, i) => 2015 + i).map(y => (
                                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Lună</Label>
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'].map((m, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Monedă</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                  <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="RON">RON</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {currency === 'EUR' && (
                              <div className="text-xs text-slate-600 bg-blue-50 p-2 rounded">
                                Curs BNR: 1 EUR = {exchangeRate.toFixed(4)} RON
                              </div>
                            )}

                            {/* Bife Facilitați */}
                            <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-slate-700 mb-2">Facilități & Scutiri:</p>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="basicFunction"
                                  checked={isBasicFunction}
                                  onChange={(e) => setIsBasicFunction(e.target.checked)}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="basicFunction" className="text-sm cursor-pointer">
                                  ✓ Funcție de bază (pentru deducere personală)
                                </Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="youthExempt"
                                  checked={isYouthExempt}
                                  onChange={(e) => {
                                    setIsYouthExempt(e.target.checked);
                                    if (e.target.checked) setAge(25); else setAge(30);
                                  }}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="youthExempt" className="text-sm cursor-pointer">
                                  👤 Vârstă sub 26 ani (scutire IV până la {fiscalRules?.salary?.youth_exemption_threshold || 6050} RON)
                                </Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="taxExempt"
                                  checked={isTaxExempt}
                                  onChange={(e) => setIsTaxExempt(e.target.checked)}
                                  className="h-4 w-4"
                                />
                                <Label htmlFor="taxExempt" className="text-sm cursor-pointer">
                                  ♿ Persoană cu handicap (scutire TOTALĂ IV)
                                </Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button onClick={calculate} className="w-full" size="lg">
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculează
                      </Button>

                      {/* Visible SEO Explanation (Opțiunea A - Sigur pt Google) */}
                      {result && (
                        <div className="mt-6 w-full">
                          <div className="text-xs text-slate-600 leading-relaxed italic">
                            {getDetailedExplanation()}
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100 italic text-[10px] text-slate-400">
                            * Calculele includ toate facilitățile fiscale și deducerile personale actualizate conform Codului Fiscal.
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                  {result ? (
                    <div className="space-y-6">
                      {/* Main Results */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardDescription>
                            Anul {selectedYear || year} - <span className="capitalize">{new Date(2000, (selectedMonth || 1) - 1).toLocaleDateString('ro-RO', { month: 'long' })}</span>
                          </CardDescription>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={resetForm} disabled={!result} className="h-9 px-3 border-slate-200">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => shareToSocial('facebook')} disabled={!result} className="w-9 h-9 p-0 hover:text-blue-600 border-slate-200">
                              <Facebook className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => shareToSocial('x')} disabled={!result} className="w-9 h-9 p-0 hover:text-slate-900 border-slate-200">
                              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => shareToSocial('instagram')} disabled={!result} className="w-9 h-9 p-0 hover:text-pink-600 border-slate-200">
                              <Instagram className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => shareToSocial('tiktok')} disabled={!result} className="w-9 h-9 p-0 hover:text-slate-900 border-slate-200">
                              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.32h0q2.73,12,8.14,23.36a121.25,121.25,0,0,0,103,63.18v90.41l-.11,210.64h0Z"></path></svg>
                            </Button>
                            <Button variant="outline" size="sm" onClick={shareCalculation} disabled={!result} className="w-9 h-9 p-0 border-slate-200" title="Distribuie">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrintResult} disabled={!result} className="w-9 h-9 p-0 border-slate-200" title="Printează">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleEmail} disabled={!result} className="w-9 h-9 p-0 border-slate-200" title="Trimite pe Email">
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={downloadPDF} disabled={!result} className="w-9 h-9 p-0 border-slate-200" title="Descarcă PDF">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* OVERTAXATION ALERT */}
                          {result.is_overtaxed && (
                            <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg shadow-sm">
                              <div className="flex items-start gap-3">
                                <Triangle className="h-6 w-6 text-orange-600 shrink-0" />
                                <div>
                                  <h4 className="font-bold text-orange-900 text-sm uppercase tracking-wide">
                                    Atenție! Se aplică suprataxarea
                                  </h4>
                                  <p className="text-sm text-orange-800 mt-1 leading-relaxed">
                                    CAS și CASS sunt calculate la nivelul salariului minim ({fiscalRules?.salary?.minimum_salary} RON),
                                    deoarece venitul brut este sub acest prag și nu ați selectat o excepție.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="space-y-0">
                            {/* Unified Results List */}
                            <div>
                              <h3 className="font-semibold text-lg border-b pb-2 mb-0 px-2 uppercase py-1.5 bg-slate-100/40 rounded-t">ANGAJAT</h3>
                              <div className="space-y-0">
                                <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center text-xl font-bold py-1.5 px-2 rounded bg-slate-100 hover:bg-slate-200 transition-colors border-y border-slate-300 mb-1">
                                  <span className="text-slate-700">Salariu Brut:</span>
                                  <span className="text-slate-800 text-right">{result.gross.toFixed(0)}</span>
                                  <span className="text-slate-800 text-left text-sm font-medium">RON</span>
                                  <span className="text-slate-400 text-sm text-right font-normal">{(result.gross / exchangeRate).toFixed(0)} EUR</span>
                                </div>
                                {result.untaxedAmount > 0 && (
                                  <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0">
                                    <span className="text-blue-600">Sumă netaxabilă:</span>
                                    <span className="text-blue-600 text-right">-{result.untaxedAmount.toFixed(0)}</span>
                                    <span className="text-blue-600 text-left text-[10px] font-medium">RON</span>
                                    <span className="text-blue-400 text-sm text-right">-{(result.untaxedAmount / exchangeRate).toFixed(0)} EUR</span>
                                  </div>
                                )}

                                <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-red-50 transition-colors border-b border-slate-100 last:border-0">
                                  <span className="text-red-600">- CAS ({fiscalRules?.salary?.cas_rate || 25}%):</span>
                                  <span className="text-red-600 text-right">-{result.cas.toFixed(0)}</span>
                                  <span className="text-red-600 text-left text-[10px] font-medium">RON</span>
                                  <span className="text-red-400 text-sm text-right">-{(result.cas / exchangeRate).toFixed(0)} EUR</span>
                                </div>
                                <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-red-50 transition-colors border-b border-slate-100 last:border-0">
                                  <span className="text-red-600">- CASS ({fiscalRules?.salary?.cass_rate || 10}%):</span>
                                  <span className="text-red-600 text-right">-{result.cass.toFixed(0)}</span>
                                  <span className="text-red-600 text-left text-[10px] font-medium">RON</span>
                                  <span className="text-red-400 text-sm text-right">-{(result.cass / exchangeRate).toFixed(0)} EUR</span>
                                </div>
                                {result.personalDeduction > 0 && (
                                  <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-green-50 transition-colors border-b border-slate-100 last:border-0">
                                    <span className="text-green-600">Deducere personală (DP):</span>
                                    <span className="text-green-600 text-right">{result.personalDeduction.toFixed(0)}</span>
                                    <span className="text-green-600 text-left text-[10px] font-medium">RON</span>
                                    <span className="text-green-400 text-sm text-right">{(result.personalDeduction / exchangeRate).toFixed(0)} EUR</span>
                                  </div>
                                )}
                                {result.childDeduction > 0 && (
                                  <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-green-50 transition-colors border-b border-slate-100 last:border-0">
                                    <span className="text-green-600">Deducere copii ({parseInt(children) || 0} x {fiscalRules?.salary?.child_deduction || 100} RON):</span>
                                    <span className="text-green-600 text-right">{result.childDeduction.toFixed(0)}</span>
                                    <span className="text-green-600 text-left text-[10px] font-medium">RON</span>
                                    <span className="text-green-400 text-sm text-right">{(result.childDeduction / exchangeRate).toFixed(0)} EUR</span>
                                  </div>
                                )}
                                {result.dependentDeduction > 0 && (
                                  <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-green-50 transition-colors border-b border-slate-100 last:border-0">
                                    <span className="text-green-600">Deducere persoane întreținere:</span>
                                    <span className="text-green-600 text-right">{result.dependentDeduction.toFixed(0)}</span>
                                    <span className="text-green-600 text-left text-[10px] font-medium">RON</span>
                                    <span className="text-green-400 text-sm text-right">{(result.dependentDeduction / exchangeRate).toFixed(0)} EUR</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-red-50 transition-colors border-b border-slate-100 last:border-0">
                                  <span className="text-red-600">- Impozit ({fiscalRules?.salary?.income_tax_rate || 10}%):</span>
                                  <span className="text-red-600 text-right">-{result.incomeTax.toFixed(0)}</span>
                                  <span className="text-red-600 text-left text-[10px] font-medium">RON</span>
                                  <span className="text-red-400 text-sm text-right">-{(result.incomeTax / exchangeRate).toFixed(0)} EUR</span>
                                </div>

                                {result.voucherValue > 0 && (
                                  <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-green-50 transition-colors border-b border-slate-100 last:border-0">
                                    <span className="text-green-600">+ Tichete masă:</span>
                                    <span className="text-green-600 text-right">+{result.voucherValue.toFixed(0)}</span>
                                    <span className="text-green-600 text-left text-[10px] font-medium">RON</span>
                                    <span className="text-green-400 text-sm text-right">+{(result.voucherValue / exchangeRate).toFixed(0)} EUR</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center text-xl font-bold py-1.5 px-2 rounded bg-green-100/80 hover:bg-green-100 transition-colors border-y border-green-200 mt-2 pt-2">
                                  <span className="text-green-600">Salariu NET:</span>
                                  <span className="text-green-600 text-right">{result.net.toFixed(0)}</span>
                                  <span className="text-green-600 text-left text-sm font-medium">RON</span>
                                  <span className="text-green-400 text-sm text-right font-normal">{(result.net / exchangeRate).toFixed(0)} EUR</span>
                                </div>
                              </div>
                            </div>

                            {/* Employer Side */}
                            <div className="mt-0">
                              <h3 className="font-semibold text-lg border-b pb-2 mb-0 px-2 uppercase py-1.5 bg-slate-100/40 rounded-t">ANGAJATOR</h3>
                              <div className="space-y-0">
                                <div className="grid grid-cols-[1fr_100px_40px_100px] gap-2 items-center p-2 rounded hover:bg-red-50 transition-colors border-b border-slate-100 last:border-0">
                                  <span className="text-red-600">+ CAM ({fiscalRules?.salary?.cam_rate || 2.25}%):</span>
                                  <span className="text-red-600 text-right">+{result.cam.toFixed(0)}</span>
                                  <span className="text-red-600 text-left text-[10px] font-medium">RON</span>
                                  <span className="text-red-400 text-sm text-right">+{(result.cam / exchangeRate).toFixed(0)} EUR</span>
                                </div>
                                {result.voucherValue > 0 && (
                                  <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center py-0.5 px-2 rounded hover:bg-red-50 transition-colors border-b border-slate-100 last:border-0">
                                    <span className="text-red-600">+ Tichete masă:</span>
                                    <span className="text-red-600 text-right">+{result.voucherValue.toFixed(0)}</span>
                                    <span className="text-red-600 text-left text-[10px] font-medium">RON</span>
                                    <span className="text-red-400 text-sm text-right">+{(result.voucherValue / exchangeRate).toFixed(0)} EUR</span>
                                  </div>
                                )}
                                {result.overtaxed && (
                                  <>
                                    <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center text-orange-600 py-0.5 px-2 rounded hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-0">
                                      <span>+ Extra CAS (part-time):</span>
                                      <span className="text-right">+{result.employerExtraCAS?.toFixed(0)}</span>
                                      <span className="text-left text-[10px] font-medium">RON</span>
                                      <span className="text-orange-400 text-sm text-right">+{(result.employerExtraCAS / exchangeRate).toFixed(0)} EUR</span>
                                    </div>
                                    <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center text-orange-600 py-0.5 px-2 rounded hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-0">
                                      <span>+ Extra CASS (part-time):</span>
                                      <span className="text-right">+{result.employerExtraCASS?.toFixed(0)}</span>
                                      <span className="text-left text-[10px] font-medium">RON</span>
                                      <span className="text-orange-400 text-sm text-right">+{(result.employerExtraCASS / exchangeRate).toFixed(0)} EUR</span>
                                    </div>
                                  </>
                                )}
                                <div className="grid grid-cols-[1fr_100px_40px_100px] gap-1 items-center text-xl font-bold py-1.5 px-2 rounded bg-red-100 px-2 rounded bg-red-100 hover:bg-red-200 transition-colors border-y border-red-200 mt-2 pt-2">
                                  <span className="text-red-600">Salariu Complet:</span>
                                  <span className="text-red-600 text-right">{result.totalCost.toFixed(0)}</span>
                                  <span className="text-red-600 text-left text-sm font-medium">RON</span>
                                  <span className="text-red-400 text-sm text-right font-normal">{(result.totalCost / exchangeRate).toFixed(0)} EUR</span>
                                </div>
                              </div>
                            </div>

                            {result.exemptAmount && (
                              <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded">
                                <div className="flex items-start gap-2">
                                  <Info className="h-5 w-5 text-green-600 mt-0.5" />
                                  <div className="text-sm text-green-800">
                                    <strong>Facilitate fiscală activă:</strong> Scutire impozit pentru {result.exemptAmount.toFixed(0)} RON
                                    {result.taxExemptReason && (
                                      <span className="block mt-1 text-green-700">
                                        📋 {result.taxExemptReason}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {result.taxExemptReason && !result.exemptAmount && (
                              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="flex items-start gap-2">
                                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                  <div className="text-sm text-blue-800">
                                    <strong>Facilitate:</strong> {result.taxExemptReason}
                                  </div>
                                </div>
                              </div>
                            )}

                            {result.noBasicFunctionNote && (
                              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded">
                                <div className="flex items-start gap-2">
                                  <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                                  <div className="text-sm text-amber-800">
                                    <strong>Atenție:</strong> {result.noBasicFunctionNote}
                                  </div>
                                </div>
                              </div>
                            )}

                            {result.overtaxed && (
                              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                                <div className="flex items-start gap-2">
                                  <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                                  <div className="text-sm text-orange-800">
                                    <strong>Overtaxare part-time:</strong> Angajatorul suportă diferența până la salariul minim
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Divider between Results Table and Breakdown */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <div className="space-y-3">
                                {/* Summary Table */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Taxe Angajat */}
                                  <div className="flex items-center justify-between md:justify-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100/80">
                                    <div className="text-[10px] leading-tight text-slate-500 uppercase font-bold text-right min-w-[50px]">
                                      Taxe<br />Angajat
                                    </div>
                                    <div className="flex flex-col items-end md:items-start">
                                      <div className="text-2xl font-bold text-blue-600 leading-none">
                                        {(result.cas + result.cass + result.incomeTax).toFixed(0)} <span className="text-[10px] font-normal text-slate-400">RON</span>
                                      </div>
                                      {currency === 'EUR' && (
                                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                          {((result.cas + result.cass + result.incomeTax) / exchangeRate).toFixed(0)} EUR
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Taxe Angajator */}
                                  <div className="flex items-center justify-between md:justify-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100/80">
                                    <div className="text-[10px] leading-tight text-slate-500 uppercase font-bold text-right min-w-[55px]">
                                      Taxe<br />Angajator
                                    </div>
                                    <div className="flex flex-col items-end md:items-start">
                                      <div className="text-2xl font-bold text-orange-600 leading-none">
                                        {(result.cam + (result.employerExtraCAS || 0) + (result.employerExtraCASS || 0)).toFixed(0)} <span className="text-[10px] font-normal text-slate-400">RON</span>
                                      </div>
                                      {currency === 'EUR' && (
                                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                          {((result.cam + (result.employerExtraCAS || 0) + (result.employerExtraCASS || 0)) / exchangeRate).toFixed(0)} EUR
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Total Statul */}
                                  <div className="flex items-center justify-between md:justify-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100/80">
                                    <div className="text-[10px] leading-tight text-slate-500 uppercase font-bold text-right min-w-[45px]">
                                      Total<br />Statul
                                    </div>
                                    <div className="flex flex-col items-end md:items-start">
                                      <div className="text-2xl font-bold text-red-600 leading-none">
                                        {(result.cas + result.cass + result.incomeTax + result.cam + (result.employerExtraCAS || 0) + (result.employerExtraCASS || 0)).toFixed(0)} <span className="text-[10px] font-normal text-slate-400">RON</span>
                                      </div>
                                      {currency === 'EUR' && (
                                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                                          {((result.cas + result.cass + result.incomeTax + result.cam + (result.employerExtraCAS || 0) + (result.employerExtraCASS || 0)) / exchangeRate).toFixed(0)} EUR
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Visual Bar */}
                                <div className="space-y-1">
                                  <div className="flex h-12 rounded-lg overflow-hidden border border-slate-200">
                                    <div
                                      className="bg-green-500 flex items-center justify-center text-white text-sm font-semibold transition-all"
                                      style={{
                                        width: `${(result.net / result.totalCost * 100).toFixed(2)}%`
                                      }}
                                    >
                                      {(result.net / result.totalCost * 100).toFixed(2)}% Angajat
                                    </div>
                                    <div
                                      className="bg-red-500 flex items-center justify-center text-white text-sm font-semibold transition-all"
                                      style={{
                                        width: `${((result.cas + result.cass + result.incomeTax + result.cam + (result.employerExtraCAS || 0) + (result.employerExtraCASS || 0)) / result.totalCost * 100).toFixed(2)}%`
                                      }}
                                    >
                                      {((result.cas + result.cass + result.incomeTax + result.cam + (result.employerExtraCAS || 0) + (result.employerExtraCASS || 0)) / result.totalCost * 100).toFixed(2)}% Stat
                                    </div>
                                  </div>
                                  <p className="text-sm sm:text-base text-center text-slate-700 font-medium">
                                    Pentru a plăti un salariu net de <strong>{result.net.toFixed(0)} RON</strong>, angajatorul cheltuiește <strong>{result.totalCost.toFixed(0)} RON</strong>
                                  </p>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="grid md:grid-cols-[1.5fr_0.5fr] gap-4 bg-slate-100/50 p-2 rounded-lg border border-slate-200 mt-1">
                                  <div>
                                    <h4 className="font-semibold text-[13px] mb-1 text-slate-600 uppercase tracking-tight">Detalii Taxe Angajat:</h4>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-600">
                                      <div className="flex items-center gap-1">
                                        <span>CAS ({fiscalRules?.salary?.cas_rate || 25}%):</span>
                                        <span className="font-bold text-slate-800">{result.cas.toFixed(0)} RON</span>
                                      </div>
                                      <div className="text-slate-300">|</div>
                                      <div className="flex items-center gap-1">
                                        <span>CASS ({fiscalRules?.salary?.cass_rate || 10}%):</span>
                                        <span className="font-bold text-slate-800">{result.cass.toFixed(0)} RON</span>
                                      </div>
                                      <div className="text-slate-300">|</div>
                                      <div className="flex items-center gap-1">
                                        <span>Impozit ({fiscalRules?.salary?.income_tax_rate || 10}%):</span>
                                        <span className="font-bold text-slate-800">{result.incomeTax.toFixed(0)} RON</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="border-l border-slate-200 pl-4 md:border-l md:pl-4">
                                    <h4 className="font-semibold text-[13px] mb-1 text-slate-600 uppercase tracking-tight">Detalii Taxe Angajator:</h4>
                                    <div className="space-y-0.5 text-[13px] text-slate-600">
                                      <div className="flex justify-between">
                                        <span>CAM ({fiscalRules?.salary?.cam_rate || 2.25}%):</span>
                                        <span className="font-bold text-slate-800">{result.cam.toFixed(0)} RON</span>
                                      </div>
                                      {result.overtaxed && (
                                        <>
                                          <div className="flex justify-between text-orange-600">
                                            <span>Extra CAS:</span>
                                            <span className="font-bold">{result.employerExtraCAS?.toFixed(0)} RON</span>
                                          </div>
                                          <div className="flex justify-between text-orange-600">
                                            <span>Extra CASS:</span>
                                            <span className="font-bold">{result.employerExtraCASS?.toFixed(0)} RON</span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Comparison with 2025 */}
                      {(comparison2025 && fiscalRules?.salary?.show_year_comparison !== false) && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Comparație 2025 vs 2026</CardTitle>
                            <CardDescription>Impactul modificărilor legislative</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span>Salariu Net 2025:</span>
                                <span>{comparison2025.net.toFixed(0)} RON</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Salariu Net 2026:</span>
                                <span>{result.net.toFixed(0)} RON</span>
                              </div>
                              <div className="flex justify-between font-bold pt-2 border-t">
                                <span>Diferență:</span>
                                <span className={result.net - comparison2025.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {result.net - comparison2025.net >= 0 ? '+' : ''}
                                  {(result.net - comparison2025.net).toFixed(0)} RON
                                  ({((result.net - comparison2025.net) / comparison2025.net * 100).toFixed(2)}%)
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-slate-500">
                        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Introduceți datele și apăsați "Calculează"</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ZILE LUCRATOARE */}
          {activeTab === 'zile-lucratoare' && (
            <div className="mt-2 print-calendar-expanded">
              <Card className="print:border-none print:shadow-none overflow-hidden">
                <div className="no-print border-b border-slate-100 bg-slate-50/10 h-2" />
                <CardContent className="pt-6 print:pt-0">
                  {yearlyData ? (
                    <div className="space-y-6">
                      {/* Summary Cards - NO ICONS */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                          <div className="text-3xl font-bold text-blue-700">{yearlyData.totalWorkingDays}</div>
                          <div className="text-xs font-medium text-blue-900 uppercase tracking-wider mt-1">Zile Lucratoare</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                          <div className="text-3xl font-bold text-red-700">{yearlyData.totalHolidays}</div>
                          <div className="text-xs font-medium text-red-900 uppercase tracking-wider mt-1">Sărbători Legale</div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                          <div className="text-3xl font-bold text-slate-700">{yearlyData.totalWeekends}</div>
                          <div className="text-xs font-medium text-slate-900 uppercase tracking-wider mt-1">Zile Weekend</div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                          <div className="text-3xl font-bold text-emerald-700">{yearlyData.totalDays}</div>
                          <div className="text-xs font-medium text-emerald-900 uppercase tracking-wider mt-1">Total Zile</div>
                        </div>
                      </div>

                      {/* Monthly Accordion Calendar */}
                      <Accordion type="single" collapsible className="w-full space-y-1">
                        {yearlyData.months.map((monthData, monthIndex) => {
                          const currentYear = selectedYear || year;
                          const monthDate = new Date(currentYear, monthIndex, 1);
                          const daysInMonth = eachDayOfInterval({
                            start: startOfMonth(monthDate),
                            end: endOfMonth(monthDate)
                          });

                          // Grupăm zilele pe săptămâni pentru layout
                          const weeks = [];
                          let currentWeek = [];
                          let lastWeekNum = -1;

                          // Adăugăm padding la începutul lunii
                          const startDay = getDay(daysInMonth[0]); // 0 = Duminică, 1 = Luni
                          const padStart = startDay === 0 ? 6 : startDay - 1; // Ajustăm pt Luni = 0 în loop-ul nostru vizual

                          // Generăm săptămânile complete
                          const allDays = [
                            ...Array(padStart).fill(null),
                            ...daysInMonth
                          ];

                          allDays.forEach((day) => {
                            if (currentWeek.length === 7) {
                              weeks.push({ weekNum: lastWeekNum, days: currentWeek });
                              currentWeek = [];
                            }

                            if (day) {
                              lastWeekNum = getWeek(day, { weekStartsOn: 1 });
                            }

                            currentWeek.push(day);
                          });

                          // Push ultima săptămână
                          if (currentWeek.length > 0) {
                            // Umplem până la 7
                            while (currentWeek.length < 7) currentWeek.push(null);
                            weeks.push({ weekNum: lastWeekNum, days: currentWeek });
                          }

                          return (
                            <AccordionItem key={monthData.month} value={`month-${monthIndex}`} className="px-0 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
                              <AccordionTrigger className="px-5 py-0.5 hover:bg-slate-50 hover:no-underline [&[data-state=open]]:bg-slate-50">
                                {/* Container Principal: Flex pe Mobile, Grid pe Desktop (aliniere cu summary cards) */}
                                <div className="flex items-center justify-between w-full pr-4 md:grid md:grid-cols-4 md:gap-4">

                                  {/* 1. Nume Lună (Col 1 pe Desktop) */}
                                  <div className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2 md:col-span-1">
                                    <span className="sm:hidden">{monthData.name.substring(0, 3)}</span>
                                    <span className="hidden sm:inline">{monthData.name}</span>
                                  </div>

                                  {/* 2. Iconițe Sărbători (Col 2 pe Desktop - Aliniat cu Cardul 'Sarbatori Legale') */}
                                  <div className="hidden md:flex items-center gap-1 md:col-span-1 pl-4 h-full">
                                    {daysInMonth.filter(d => {
                                      const dateStr = format(d, 'yyyy-MM-dd');
                                      return holidays.find(h => h.date === dateStr) || (defaultHolidays[currentYear] || []).find(h => h.date === dateStr);
                                    }).map((d, i) => {
                                      const isWknd = isWeekend(d);
                                      return (
                                        <Circle
                                          key={i}
                                          className={`w-3 h-3 ${isWknd ? 'text-red-200 fill-red-200' : 'text-red-600 fill-red-600'}`}
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* 3. Coloane Date (Col 3-4 pe Desktop - Dreapta) */}
                                  <div className="flex md:col-span-2 justify-end gap-1 sm:gap-4 text-xs sm:text-sm tabular-nums">
                                    {/* Spacer pt aliniere cu TOTAL/MEDIE din sumar */}
                                    <div className="hidden md:block w-20"></div>
                                    <div className="flex flex-col gap-0 items-end w-11 sm:w-16">
                                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Zile</span>
                                      <span className="font-bold text-slate-400 text-xs sm:text-sm leading-none">{monthData.totalDays}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div className="flex flex-col gap-0 items-end w-11 sm:w-16">
                                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">Zile L.</span>
                                      <span className="font-bold text-slate-700 text-xs sm:text-sm leading-none">{monthData.workingDays}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div className="flex flex-col gap-0 items-end w-11 sm:w-16">
                                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">8h</span>
                                      <span className="font-bold text-slate-700 text-xs sm:text-sm leading-none">{monthData.workingHours}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div className="flex flex-col gap-0 items-end w-11 sm:w-16">
                                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">4h</span>
                                      <span className="font-bold text-slate-700 text-xs sm:text-sm leading-none">{monthData.workingDays * 4}</span>
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-0 pb-0 pt-0">
                                <div className="w-full overflow-x-auto">
                                  <div className="min-w-full sm:min-w-[600px] border-t border-slate-100">
                                    {/* Header Tabel Calendar - Zile Săptămână */}
                                    <div className="grid grid-cols-[35px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] gap-0 border-b border-slate-200 bg-slate-50/50">
                                      <div className="p-0 sm:p-0.5 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200 flex items-center justify-center leading-none">
                                        S
                                      </div>
                                      {['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'].map((d, i) => (
                                        <div key={d} className={`p-0 sm:p-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center leading-none ${i >= 5 ? 'text-slate-400' : 'text-slate-600'}`}>
                                          <span className="hidden sm:inline">{d.substring(0, 3)}</span>
                                          <span className="sm:hidden">{d.substring(0, 1)}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Body Calendar */}
                                    {weeks.map((week, wIndex) => (
                                      <div key={wIndex} className="grid grid-cols-[35px_repeat(7,1fr)] sm:grid-cols-[80px_repeat(7,1fr)] gap-0 border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-colors duration-200">
                                        {/* Săptămâna - Separator Stânga */}
                                        {/* Săptămâna - Separator Stânga */}
                                        <div className="p-0 sm:p-0.5 border-r border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-xs font-bold text-slate-400">
                                          <span className="hidden sm:block text-[10px] font-normal uppercase opacity-70 leading-none">Săpt</span>
                                          <span className="text-[10px] sm:text-sm leading-none">{week.weekNum}</span>
                                        </div>

                                        {/* Zilele */}
                                        {week.days.map((day, dIndex) => {
                                          if (!day) return <div key={dIndex} className="bg-slate-50/20"></div>;

                                          const isWeekendDay = isWeekend(day);
                                          const dateStr = format(day, 'yyyy-MM-dd');
                                          const holiday = holidays.find(h => h.date === dateStr) || (defaultHolidays[currentYear] || []).find(h => h.date === dateStr);
                                          const isHoliday = !!holiday;

                                          let bgClass = "bg-white";
                                          let textClass = "text-slate-700";
                                          let borderClass = "";

                                          if (isHoliday) {
                                            bgClass = "bg-red-50 hover:bg-red-100";
                                            textClass = "text-red-700 font-bold";
                                            borderClass = "border-l-2 border-red-500";
                                          } else if (isWeekendDay) {
                                            bgClass = "bg-slate-50 hover:bg-slate-100";
                                            textClass = "text-slate-400";
                                          } else {
                                            bgClass = "hover:bg-blue-200 transition-colors duration-200"; // Darker hover for working days
                                            textClass = "text-slate-800 font-medium";
                                          }

                                          return (
                                            <div key={dIndex} className={`group p-0 sm:p-0.5 transition-colors relative flex flex-col items-start justify-start ${bgClass} ${borderClass}`}>
                                              <span className={`text-xs sm:text-sm leading-none ${textClass}`}>{format(day, 'd')}</span>
                                              {isHoliday && (
                                                <span className="hidden sm:block text-[10px] leading-tight text-red-600 font-medium mt-1 line-clamp-2">
                                                  {holiday.name}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>

                      {/* Bara de progres distribuție anuală - SIMPLIFICAT 2 CULORI */}
                      <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200">

                        {(() => {
                          // Calcule procentuale
                          const total = yearlyData.totalDays;
                          const working = yearlyData.totalWorkingDays;
                          const free = total - working;

                          const workingPct = ((working / total) * 100).toFixed(1);
                          const freePct = ((free / total) * 100).toFixed(1);

                          return (
                            <div className="space-y-2">
                              {/* Container Sumar: Trebuie sa aiba aceleasi padding-uri ca si AccordionTrigger (px-5) */}
                              <div className="border-b border-slate-100 pb-1 px-5">
                                {/* Row: TOTAL */}
                                <div className="flex items-center justify-between w-full pr-4 md:grid md:grid-cols-4 md:gap-4">
                                  <div className="md:col-span-2"></div>
                                  <div className="md:col-span-2 flex justify-end gap-1 sm:gap-4 text-xs sm:text-sm tabular-nums">
                                    <div className="hidden md:flex w-20 justify-end items-center pr-2">
                                      <span className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest leading-none">TOTAL</span>
                                    </div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-slate-400 text-xs sm:text-sm">{total}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100"></div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-blue-700 text-xs sm:text-sm">{working}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100"></div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-slate-700 text-xs sm:text-sm">{yearlyData.totalWorkingHours}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100"></div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-slate-500 text-xs sm:text-sm">{working * 4}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Row: MEDIE */}
                                <div className="flex items-center justify-between w-full pr-4 md:grid md:grid-cols-4 md:gap-4 mt-2">
                                  <div className="md:col-span-2 flex items-center gap-2 min-w-0">
                                    <Briefcase className="h-5 w-5 text-blue-600 shrink-0" />
                                    <h4 className="text-[10px] sm:text-sm font-bold text-slate-800 uppercase tracking-widest text-left leading-none whitespace-nowrap">
                                      DISTRIBUȚIE ANUALĂ {selectedYear || year} - DIN {yearlyData.totalDays} ZILE
                                    </h4>
                                  </div>
                                  <div className="md:col-span-2 flex justify-end gap-1 sm:gap-4 text-xs sm:text-sm tabular-nums">
                                    <div className="hidden md:flex w-20 justify-end items-center pr-2">
                                      <span className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest leading-none shrink-0">MEDIE</span>
                                    </div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-slate-400 text-xs sm:text-sm">{(total / 12).toFixed(1)}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100"></div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-blue-700 text-xs sm:text-sm">{(working / 12).toFixed(1)}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100"></div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-slate-700 text-xs sm:text-sm">{((yearlyData.totalWorkingHours) / 12).toFixed(1)}</span>
                                    </div>
                                    <div className="w-px h-6 bg-slate-100"></div>
                                    <div className="flex flex-col items-end w-11 sm:w-16">
                                      <span className="font-bold text-slate-500 text-xs sm:text-sm">{((working * 4) / 12).toFixed(1)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {/* Progresie Vizuală - 2 culori */}
                                <div className="flex h-4 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full" style={{ width: `${workingPct}%` }} title={`Lucratoare: ${working} zile`}></div>
                                  <div className="bg-slate-300 h-full" style={{ width: `${freePct}%` }} title={`Libere: ${free} zile`}></div>
                                </div>

                                {/* Legendă */}
                                <div className="flex flex-wrap gap-6 text-xs text-slate-600 justify-between">
                                  <div className="flex items-center gap-1">
                                    <span><strong>{working}</strong> Zile Lucrătoare ({workingPct}%)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                    <span><strong>{free}</strong> Zile Libere (Weekend + Sărbători) ({freePct}%)</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p>Se încarcă calendarul...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}


          {/* TAB: ZILE LIBERE */}
          {activeTab === 'zile-libere' && (
            <div className="mt-2 print-holidays-list">
              <Card className="print:border-none print:shadow-none overflow-hidden">
                <div className="no-print border-b border-slate-100 bg-slate-50/10 h-2" />
                <CardContent className="pt-6 print:pt-0">
                  {(holidays.length > 0 || defaultHolidays[selectedYear || year]) ? (
                    <div className="space-y-4">
                      {/* Tabel Material Design 3 */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left py-1 px-4 text-sm font-medium text-slate-700">Data</th>
                              <th className="text-left py-1 px-1 text-sm font-medium text-slate-700">Zi</th>
                              <th className="text-left py-1 px-4 text-sm font-medium text-slate-700">Sărbătoare</th>
                              <th className="text-left py-1 px-4 text-sm font-medium text-slate-700">Meteo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const currentHolidays = [...(holidays.length > 0 ? holidays : defaultHolidays[selectedYear || year] || [])]
                                .sort((a, b) => new Date(a.date) - new Date(b.date));

                              const monthIconsMD3 = [
                                'Snowflake', // Ianuarie
                                'Heart', // Februarie  
                                'Flower2', // Martie
                                'CloudRain', // Aprilie
                                'Sun', // Mai
                                'Sun', // Iunie
                                'Sun', // Iulie
                                'Sun', // August
                                'Leaf', // Septembrie
                                'CloudRain', // Octombrie
                                'Cloud', // Noiembrie
                                'Snowflake' // Decembrie
                              ];

                              return currentHolidays.map((holiday, index) => {
                                const date = new Date(holiday.date);
                                const dayOfWeek = date.toLocaleDateString('ro-RO', { weekday: 'long' });

                                // Iconițe Material Design 3 (lucide-react) - specifice lunii
                                const MonthIcon = [
                                  Snowflake, // Ianuarie
                                  Heart, // Februarie  
                                  Flower2, // Martie
                                  CloudRain, // Aprilie
                                  Sun, // Mai
                                  Sun, // Iunie
                                  Sun, // Iulie
                                  Sun, // August
                                  Leaf, // Septembrie
                                  CloudRain, // Octombrie
                                  Cloud, // Noiembrie
                                  Snowflake // Decembrie
                                ][date.getMonth()];

                                // Temperatură medie aproximativă (date climatice România)
                                const weatherData = {
                                  0: { temp: '0°C - 5°C', icon: Snowflake, condition: 'Îngheț' },
                                  1: { temp: '2°C - 8°C', icon: CloudSnow, condition: 'Ninsoare' },
                                  2: { temp: '6°C - 14°C', icon: Flower2, condition: 'Primăvară' },
                                  3: { temp: '12°C - 20°C', icon: CloudRain, condition: 'Ploaie' },
                                  4: { temp: '16°C - 24°C', icon: Sun, condition: 'Senin' },
                                  5: { temp: '20°C - 28°C', icon: Sun, condition: 'Cald' },
                                  6: { temp: '22°C - 32°C', icon: Sun, condition: 'Caniculă' },
                                  7: { temp: '22°C - 32°C', icon: Sun, condition: 'Caniculă' },
                                  8: { temp: '16°C - 24°C', icon: Leaf, condition: 'Toamnă' },
                                  9: { temp: '10°C - 18°C', icon: CloudRain, condition: 'Ploaie' },
                                  10: { temp: '4°C - 10°C', icon: Cloud, condition: 'Ceață' },
                                  11: { temp: '-2°C - 4°C', icon: Snowflake, condition: 'Îngheț' }
                                };

                                const WeatherIcon = weatherData[date.getMonth()].icon;

                                // Calcul zile rămase/trecute
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const holidayDate = new Date(date);
                                holidayDate.setHours(0, 0, 0, 0);
                                const diffTime = holidayDate - today;
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                const isExpanded = expandedHolidayIndex === index;

                                return (
                                  <>
                                    {(() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      const date = new Date(holiday.date);
                                      const nextHolidayDate = currentHolidays[index + 1] ? new Date(currentHolidays[index + 1].date) : null;
                                      const isPast = date < today;
                                      const isNextFuture = nextHolidayDate && nextHolidayDate >= today;

                                      const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 0 = Sunday, 6 = Saturday

                                      return (
                                        <>
                                          <tr
                                            key={index}
                                            onClick={() => setExpandedHolidayIndex(isExpanded ? null : index)}
                                            className={`border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer ${isExpanded ? 'bg-slate-100' : isWeekend ? 'bg-red-100' : ''}`}
                                          >
                                            <td className="py-1 px-4">
                                              <div className="flex items-center gap-2">
                                                {(() => {
                                                  const IconComp = {
                                                    Snowflake, Heart, Flower2, CloudRain, Sun, Leaf, Cloud, CloudSnow
                                                  }[monthIconsMD3[date.getMonth()]] || Cloud;
                                                  return <IconComp className="h-5 w-5 text-blue-500 opacity-80" />;
                                                })()}
                                                <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                                                  {date.getDate()} {date.toLocaleDateString('ro-RO', { month: 'short' })}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="py-1 px-1">
                                              <span className="text-sm text-slate-500">{dayOfWeek}</span>
                                            </td>
                                            <td className="py-1 px-4">
                                              <span className="text-sm text-slate-900">{holiday.name}</span>
                                            </td>
                                            <td className="py-1 px-4">
                                              {weatherLoadingProgress[holiday.date] ? (
                                                <div className="flex items-center gap-2">
                                                  <div className="animate-spin h-3 w-3 border-b-2 border-blue-500 rounded-full"></div>
                                                  <span className="text-[10px] text-slate-400 italic">Se caută istoric...</span>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2">
                                                  {(() => {
                                                    const weather = weatherCache[holiday.date] || weatherData[date.getMonth()];
                                                    const IconComp = {
                                                      Sun, Snowflake, CloudRain, CloudSnow, Leaf, Cloud, Flower2
                                                    }[weather.icon] || Sun;
                                                    return <IconComp className="h-4 w-4 text-slate-500" />;
                                                  })()}
                                                  <div className="text-xs text-slate-600">
                                                    <div className="font-medium">
                                                      {weatherCache[holiday.date]?.temp || weatherData[date.getMonth()].temp}
                                                    </div>
                                                    <div className="text-slate-500 text-[10px]">
                                                      {weatherCache[holiday.date]?.condition || weatherData[date.getMonth()].condition}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </td>
                                          </tr>

                                          {/* Separator intre trecut și viitor */}
                                          {isPast && isNextFuture && (
                                            <tr key={`sep-${index}`}>
                                              <td colSpan="4" className="py-1">
                                                <div className="relative flex items-center py-1 px-2">
                                                  <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                                                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/50 border border-blue-100/50 shadow-sm backdrop-blur-sm">
                                                    <Triangle className="h-3 w-3 text-blue-500 fill-blue-500 animate-pulse rotate-180" />
                                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-[0.2em]">Zile libere viitoare</span>
                                                  </div>
                                                  <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}

                                          {isExpanded && (
                                            <tr key={`expanded-${index}`} className="bg-green-100 border-b border-green-200">
                                              <td colSpan="4" className="py-4 px-4">
                                                <div className="space-y-2">
                                                  <div className="flex items-center gap-2 text-sm text-green-900">
                                                    {diffDays > 0 ? (
                                                      <>
                                                        <Calendar className="h-4 w-4" />
                                                        <span><strong>Mai sunt {diffDays} {diffDays === 1 ? 'zi' : 'zile'}</strong> până la această sărbătoare</span>
                                                      </>
                                                    ) : diffDays === 0 ? (
                                                      <>
                                                        <Calendar className="h-4 w-4" />
                                                        <span><strong>Astăzi este această sărbătoare!</strong></span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Calendar className="h-4 w-4" />
                                                        <span><strong>Au trecut {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'zi' : 'zile'}</strong> de la această sărbătoare</span>
                                                      </>
                                                    )}
                                                  </div>
                                                  <div className="space-y-2">
                                                    {(() => {
                                                      const desc = holiday.description || holidayDescriptions[holiday.name];
                                                      if (!desc) return null;
                                                      let formattedDesc = desc;
                                                      if (diffDays < 0) {
                                                        formattedDesc = formattedDesc.replace('Sărbătorește', 'S-a sărbătorit');
                                                        if (formattedDesc.startsWith('Ziua')) {
                                                          formattedDesc = formattedDesc.replace('Ziua', 'A fost ziua');
                                                        }
                                                      }
                                                      return (
                                                        <div className="text-xs text-slate-600 italic">
                                                          {formattedDesc}
                                                        </div>
                                                      );
                                                    })()}
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                      <span className="font-medium">Tip:</span>
                                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                        {holiday.applicableTo === 'public_sector' ? 'Zi liberă bugetari' : 'Sărbătoare legală / Zi liberă'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>

                      {/* Bara de progres sărbători */}
                      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-900 mb-3">Distribuție sărbători {selectedYear || year} - TOTAL {(holidays.length > 0 ? holidays : defaultHolidays[selectedYear || year] || []).length} zile</h4>
                        {(() => {
                          const allHolidays = holidays.length > 0 ? holidays : defaultHolidays[selectedYear || year] || [];
                          const weekdayHolidays = allHolidays.filter(h => {
                            const d = new Date(h.date);
                            const day = d.getDay();
                            return day !== 0 && day !== 6;
                          });
                          const weekendHolidays = allHolidays.length - weekdayHolidays.length;
                          const weekdayPercent = allHolidays.length > 0 ? ((weekdayHolidays.length / allHolidays.length) * 100).toFixed(0) : 0;
                          const weekendPercent = allHolidays.length > 0 ? ((weekendHolidays / allHolidays.length) * 100).toFixed(0) : 0;

                          return (
                            <div className="flex h-12 rounded-lg overflow-hidden border border-slate-200">
                              <div
                                className="bg-blue-500 flex flex-col items-center justify-center text-white text-xs font-medium transition-all px-2"
                                style={{ width: `${weekdayPercent}%` }}
                              >
                                <div className="font-bold">{weekdayPercent}%</div>
                                <div className="text-[10px] opacity-90">{weekdayHolidays.length} în zile lucrătoare</div>
                              </div>
                              <div
                                className="bg-slate-400 flex flex-col items-center justify-center text-white text-xs font-medium transition-all px-2"
                                style={{ width: `${weekendPercent}%` }}
                              >
                                <div className="font-bold">{weekendPercent}%</div>
                                <div className="text-[10px] opacity-90">{weekendHolidays} în weekend</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-blue-900 leading-relaxed">
                            <strong>Notă:</strong> Datele meteo reprezintă statistici climatice medii pentru România (temperaturi și condiții tipice pentru fiecare zi).
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nu sunt configurate zile libere pentru {selectedYear || year}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}


          <Footer />
        </div>
      </div>

      {/* PROFESSIONAL PRINT REPORTS (MD3 Styled) */}
      <div className="printable-report-container">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media screen {
              .printable-report-container { display: none; }
            }
            @media print {
              @page { size: A4; margin: 0; }
              body * { visibility: hidden; }
              .printable-report-container, .printable-report-container * { visibility: visible; }
              
              html, body {
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              .printable-report-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                min-height: 100%;
                margin: 0;
                padding: 15mm 20mm;
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                color: #0f172a;
                background: white !important;
                display: flex !important;
                flex-direction: column;
              }
              .report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2pt solid #3b82f6;
                padding-bottom: 5mm;
                margin-bottom: 8mm;
              }
              .report-logo { font-size: 18pt; font-weight: 800; color: #3b82f6; }
              .report-date { font-size: 9pt; color: #64748b; text-align: right; }
              .report-title { font-size: 16pt; font-weight: 800; margin-bottom: 10mm; color: #1e293b; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; }
              
              /* Salary Specific */
              .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
              .salary-table th { background: #f8fafc; color: #475569; text-align: left; padding: 4mm; border-bottom: 1pt solid #e2e8f0; font-size: 10pt; text-transform: uppercase; }
              .salary-table td { padding: 4mm; border-bottom: 0.5pt solid #f1f5f9; font-size: 11pt; }
              .salary-table .bold { font-weight: 700; background: #f1f5f9; }
              .salary-table .num { text-align: right; font-family: 'Courier New', monospace; }
              
              /* Working Days Specific (3-COLUMN GRID for A4 FIT) */
              .working-days-summary {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 4mm;
                margin-bottom: 4mm;
              }
              .summary-box {
                border: 0.8pt solid #e2e8f0;
                padding: 2.5mm;
                border-radius: 4pt;
                text-align: center;
              }
              .summary-box.blue { background: #eff6ff !important; border-color: #bfdbfe; }
              .summary-box.red { background: #fef2f2 !important; border-color: #fecaca; }
              .summary-box.slate { background: #f8fafc !important; border-color: #e2e8f0; }
              .summary-box.emerald { background: #ecfdf5 !important; border-color: #a7f3d0; }

              .summary-label { font-size: 5.5pt; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.5mm; }
              .summary-value { font-size: 10pt; font-weight: 800; }
              .summary-value.blue { color: #1d4ed8; }
              .summary-value.red { color: #b91c1c; }
              .summary-value.slate { color: #334155; }
              .summary-value.emerald { color: #047857; }
              
              .months-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1.5mm;
              }
              .month-box {
                border: 0.5pt solid #e2e8f0;
                padding: 1mm;
                border-radius: 4pt;
                page-break-inside: avoid;
              }
              .month-title {
                font-size: 8pt;
                font-weight: 700;
                color: #1e293b;
                border-bottom: 0.5pt solid #f1f5f9;
                padding-bottom: 0.8mm;
                margin-bottom: 1.2mm;
                display: flex;
                justify-content: space-between;
                text-transform: capitalize;
              }
              
              .mini-calendar { width: 100%; border-collapse: collapse; }
              .mini-calendar th { font-size: 4pt; color: #94a3b8; padding: 0.1mm 0; }
              .mini-calendar td { 
                font-size: 10.5pt; 
                text-align: center; 
                padding: 0.3mm 0; 
                border: 0.1pt solid #f8fafc; 
                position: relative; 
              }
              
              .date-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .day-weekend { font-weight: 900 !important; color: #b91c1c; }
              .day-holiday { 
                border: 1.2pt solid #15803d !important; 
                background: #f0fdf4 !important;
                color: #15803d; 
                font-weight: 900;
                border-radius: 2pt;
                width: 80% !important; /* Smaller than cell */
                height: 80% !important;
                margin: auto;
              }
              .day-today { border: 1pt solid #3b82f6 !important; }
              
              /* Holidays List Specific */
              .holidays-table { width: 100%; border-collapse: collapse; }
              .holidays-table th { background: #eff6ff; color: #1e40af; text-align: left; padding: 2mm; border-bottom: 1pt solid #bfdbfe; font-size: 8pt; }
              .holidays-table td { padding: 2mm; border-bottom: 0.5pt solid #f1f5f9; font-size: 9pt; }
              .holiday-row:nth-child(even) { background: #fafafa; }
              .holiday-date { font-weight: 600; color: #475569; width: 80mm; }
              
              .report-footer {
                margin-top: 4mm;
                padding-top: 3mm;
                border-top: 0.5pt solid #e2e8f0;
                font-size: 7.5pt;
                color: #94a3b8;
                text-align: center;
              }
            }
          `}} />


        {activeTab === 'calculator' && result && (
          <div className="salary-report">
            <div className="report-title">Raport Salarial {selectedYear || year} - {monthNames[(selectedMonth || 1) - 1]}</div>

            <table className="salary-table">
              <thead>
                <tr>
                  <th>Analiză Angajat</th>
                  <th className="num">Procent</th>
                  <th className="num">Valoare RON</th>
                  <th className="num">Valoare EUR</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bold">
                  <td>Salariu Brut</td>
                  <td className="num">100%</td>
                  <td className="num">{result.gross.toLocaleString('ro-RO')}</td>
                  <td className="num">{Math.round(result.gross / exchangeRate).toLocaleString('ro-RO')}</td>
                </tr>
                {result.untaxedAmount > 0 && (
                  <tr>
                    <td>Suma Netaxabilă</td>
                    <td className="num">-</td>
                    <td className="num">-{result.untaxedAmount.toLocaleString('ro-RO')}</td>
                    <td className="num">-{Math.round(result.untaxedAmount / exchangeRate).toLocaleString('ro-RO')}</td>
                  </tr>
                )}
                <tr>
                  <td>Contribuție Pensii (CAS)</td>
                  <td className="num">{result.breakdown?.casPercent || 25}%</td>
                  <td className="num">-{result.cas.toLocaleString('ro-RO')}</td>
                  <td className="num">-{Math.round(result.cas / exchangeRate).toLocaleString('ro-RO')}</td>
                </tr>
                <tr>
                  <td>Contribuție Sănătate (CASS)</td>
                  <td className="num">{result.breakdown?.cassPercent || 10}%</td>
                  <td className="num">-{result.cass.toLocaleString('ro-RO')}</td>
                  <td className="num">-{Math.round(result.cass / exchangeRate).toLocaleString('ro-RO')}</td>
                </tr>
                {result.personalDeduction > 0 && (
                  <tr>
                    <td>Deducere Personală (DP)</td>
                    <td className="num">-</td>
                    <td className="num">{result.personalDeduction.toLocaleString('ro-RO')}</td>
                    <td className="num">{Math.round(result.personalDeduction / exchangeRate).toLocaleString('ro-RO')}</td>
                  </tr>
                )}
                <tr>
                  <td>Impozit pe Venit</td>
                  <td className="num">{result.breakdown?.taxPercent || 10}%</td>
                  <td className="num">-{result.incomeTax.toLocaleString('ro-RO')}</td>
                  <td className="num">-{Math.round(result.incomeTax / exchangeRate).toLocaleString('ro-RO')}</td>
                </tr>
                <tr className="bold">
                  <td style={{ color: '#16a34a' }}>Salariu Net (În mână)</td>
                  <td className="num">-</td>
                  <td className="num" style={{ color: '#16a34a' }}>{result.net.toLocaleString('ro-RO')}</td>
                  <td className="num" style={{ color: '#16a34a' }}>{Math.round(result.net / exchangeRate).toLocaleString('ro-RO')}</td>
                </tr>
              </tbody>
            </table>

            <table className="salary-table">
              <thead>
                <tr>
                  <th>Analiză Angajator</th>
                  <th className="num">Procent</th>
                  <th className="num">Valoare RON</th>
                  <th className="num">Valoare EUR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Contribuție Asiguratorie (CAM)</td>
                  <td className="num">{result.breakdown?.camPercent || 2.25}%</td>
                  <td className="num">{result.cam.toLocaleString('ro-RO')}</td>
                  <td className="num">{Math.round(result.cam / exchangeRate).toLocaleString('ro-RO')}</td>
                </tr>
                <tr className="bold">
                  <td style={{ color: '#dc2626' }}>Cost Total Angajator</td>
                  <td className="num">-</td>
                  <td className="num" style={{ color: '#dc2626' }}>{result.totalCost.toLocaleString('ro-RO')}</td>
                  <td className="num" style={{ color: '#dc2626' }}>{Math.round(result.totalCost / exchangeRate).toLocaleString('ro-RO')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'zile-lucratoare' || activeTab === 'zile-libere') && yearlyData && (
          <div className="working-days-report">
            <div className="report-title">{activeTab === 'zile-lucratoare' ? 'Calendar zile lucrătoare' : 'Calendar Sărbători'} {selectedYear || year}</div>

            {activeTab === 'zile-lucratoare' && (
              <div className="working-days-summary">
                <div className="summary-box blue">
                  <div className="summary-label">Zile Lucrătoare</div>
                  <div className="summary-value blue">{yearlyData.totalWorkingDays}</div>
                </div>
                <div className="summary-box red">
                  <div className="summary-label">Sărbători Legale</div>
                  <div className="summary-value red">{yearlyData.totalHolidays}</div>
                </div>
                <div className="summary-box slate">
                  <div className="summary-label">Zile Weekend</div>
                  <div className="summary-value slate">{yearlyData.totalWeekends}</div>
                </div>
                <div className="summary-box emerald">
                  <div className="summary-label">Total Zile</div>
                  <div className="summary-value emerald">{yearlyData.totalDays}</div>
                </div>
              </div>
            )}

            <div className="months-grid">
              {yearlyData.months.map((m, idx) => (
                <div key={idx} className="month-box">
                  <div className="month-title">
                    <span>{m.name}</span>
                    <span style={{ fontSize: '8pt', color: '#64748b' }}>{m.workingDays} L / {m.holidayDays} S / {m.weekendDays} W</span>
                  </div>
                  <table className="mini-calendar">
                    <thead>
                      <tr>
                        <th>Lu</th><th>Ma</th><th>Mi</th><th>Jo</th><th>Vi</th><th>Sâ</th><th>Du</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const monthIndex = idx;
                        const firstDay = new Date(selectedYear || year, monthIndex, 1);
                        const daysInMonth = new Date(selectedYear || year, monthIndex + 1, 0).getDate();
                        const startDay = (firstDay.getDay() + 6) % 7;

                        const rows = [];
                        let cells = [];

                        for (let i = 0; i < startDay; i++) {
                          cells.push(<td key={`empty-${i}`}></td>);
                        }

                        // Use same fallback as main UI
                        const holidaysToUse = holidays.length > 0 ? holidays : (defaultHolidays[selectedYear || year] || []);

                        for (let d = 1; d <= daysInMonth; d++) {
                          const date = new Date(selectedYear || year, monthIndex, d);
                          const isWk = date.getDay() === 0 || date.getDay() === 6;

                          // Robust holiday detection matching the UI
                          const yearStr = date.getFullYear();
                          const monthStr = String(date.getMonth() + 1).padStart(2, '0');
                          const dayStr = String(date.getDate()).padStart(2, '0');
                          const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

                          // Cerință: Dacă o sarbatoare cade in weekend, nu se evidențiază ca sărbătoare
                          const isHolidayOnWorkday = holidaysToUse.some(h => h.date === dateStr) && !isWk;

                          cells.push(
                            <td key={d}>
                              <div className={`date-wrapper ${isWk ? 'day-weekend' : ''} ${isHolidayOnWorkday ? 'day-holiday' : ''}`}>
                                {d}
                              </div>
                            </td>
                          );

                          if ((cells.length) % 7 === 0 || d === daysInMonth) {
                            while (cells.length % 7 !== 0) cells.push(<td key={`fill-${cells.length}`}></td>);
                            rows.push(<tr key={d}>{cells}</tr>);
                            cells = [];
                          }
                        }
                        return rows;
                      })()}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {activeTab === 'zile-libere' && (
              <div className="holidays-report" style={{ marginTop: '10mm', pageBreakBefore: 'auto' }}>
                <div className="report-title" style={{ fontSize: '12pt', marginBottom: '5mm' }}>Listă Sărbători Legale</div>
                <table className="holidays-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Dată</th>
                      <th style={{ width: '20%' }}>Zi</th>
                      <th style={{ width: '40%' }}>Sărbătoare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(holidays.length > 0 ? holidays : (defaultHolidays[selectedYear || year] || [])).map((h, i) => {
                      const d = new Date(h.date);
                      return (
                        <tr key={i} className="holiday-row">
                          <td className="holiday-date">{d.getDate()} {d.toLocaleDateString('ro-RO', { month: 'long' })} {d.getFullYear()}</td>
                          <td>{d.toLocaleDateString('ro-RO', { weekday: 'long' })}</td>
                          <td style={{ fontWeight: 700 }}>{h.name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="report-footer">
          Raport generat pe eCalc.ro - Calculator Salarii Profesional și Calendar Fiscal.
          <br />
          Documentul are caracter informativ și reflectă legislația în vigoare pentru anul {selectedYear || year}.
        </div>
      </div>
    </>
  );
}

export default function SalaryCalculatorProPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center py-20">
          <Calculator className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    }>
      <SalaryCalculatorContent />
    </Suspense>
  );
}
