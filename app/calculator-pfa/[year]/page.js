'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calculator, TrendingUp, TrendingDown, Building2, User, ArrowLeftRight, Info, Share2, ChevronRight, RotateCcw, Facebook, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PFACalculator, NORME_VENIT_2026, getNormaVenit } from '@/lib/pfa-calculator';
import { getBNRExchangeRate } from '@/lib/salary-engine';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import { saveToStorage, loadFromStorage, clearStorage } from '@/components/CalculatorLayout';
const currentYear = new Date().getFullYear();


export default function PFACalculatorPage() {
  const params = useParams();
  const year = parseInt(params?.year) || 2026;

  const [fiscalRules, setFiscalRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('compare');

  // Inputs
  const [yearlyIncome, setYearlyIncome] = useState('');
  const [yearlyExpenses, setYearlyExpenses] = useState('');
  const [expenseRate, setExpenseRate] = useState(30);
  const [activity, setActivity] = useState('it_programare');
  const [customNorm, setCustomNorm] = useState('');
  const [optOutCAS, setOptOutCAS] = useState(false);
  const [optOutCASS, setOptOutCASS] = useState(false);
  const [currency, setCurrency] = useState('RON');
  const [exchangeRate, setExchangeRate] = useState(4.98);
  const [srlEmployees, setSrlEmployees] = useState(0);

  // Results
  const [comparisonResult, setComparisonResult] = useState(null);
  const [fullComparisonResult, setFullComparisonResult] = useState(null);

  useEffect(() => {
    loadFiscalRules();
    loadExchangeRate();
  }, [year]);

  const loadFiscalRules = async () => {
    try {
      const response = await fetch(`/api/fiscal-rules/${year}`);
      const data = await response.json();
      setFiscalRules(data);
      setLoading(false);
    } catch (error) {
      toast.error('Eroare la încărcarea regulilor fiscale');
      setLoading(false);
    }
  };

  const loadExchangeRate = async () => {
    const rate = await getBNRExchangeRate('EUR');
    setExchangeRate(rate);
  };

  const calculateComparison = () => {
    if (!fiscalRules || !yearlyIncome) {
      toast.error('Introduceți venitul anual');
      return;
    }

    const calculator = new PFACalculator(fiscalRules);
    const income = parseFloat(yearlyIncome) * (currency === 'EUR' ? exchangeRate : 1);
    const expenses = yearlyExpenses
      ? parseFloat(yearlyExpenses) * (currency === 'EUR' ? exchangeRate : 1)
      : income * (expenseRate / 100);
    const norm = customNorm ? parseFloat(customNorm) : getNormaVenit(activity);

    const options = { optOutCAS, optOutCASS };
    const result = calculator.compare(income, expenses, norm, options);
    setComparisonResult(result);

    // Full comparison with SRL
    const fullResult = calculator.fullComparison(income, expenses, norm, {
      ...options,
      employees: srlEmployees
    });
    setFullComparisonResult(fullResult);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const text = encodeURIComponent(`Vezi calculul PFA pe eCalc.ro! #pfa #fiscale #romania`);

    switch (platform) {
      case 'facebook':
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url.split('#')[0])}`;
        window.open(fbUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, '_blank', 'width=600,height=400');
        break;
      case 'instagram':
      case 'tiktok':
        navigator.clipboard.writeText(url);
        toast.success(`Link copiat! Poți să-l adaugi acum în Story pe ${platform === 'instagram' ? 'Instagram' : 'TikTok'}`);
        break;
      default:
        navigator.clipboard.writeText(url);
        toast.success('Link copiat în clipboard!');
    }
  };

  const shareCalculation = () => {
    const params = new URLSearchParams({
      income: yearlyIncome,
      expenses: yearlyExpenses || '',
      rate: expenseRate,
      activity,
      currency,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Link calcul copiat în clipboard!');
  };



  const resetForm = () => {
    setYearlyIncome('');
    setYearlyExpenses('');
    setExpenseRate(30);
    setActivity('it_programare');
    setCustomNorm('');
    setOptOutCAS(false);
    setOptOutCASS(false);
    setSrlEmployees(0);
    setComparisonResult(null);
    setFullComparisonResult(null);
    clearStorage('pfa_calculator');
    toast.success('Formular resetat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <NavigationHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Calculator className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-slate-600">Se încarcă regulile fiscale {year}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calculator PFA Profesional {year}</h1>
            <p className="text-sm text-slate-600">Sistem Real vs. Normă de Venit • CASS/CAS • Comparație SRL</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm} disabled={!comparisonResult}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            {/* Social Sharing */}
            <Button variant="outline" size="sm" onClick={() => shareToSocial('facebook')} disabled={!comparisonResult} className="hover:text-blue-600 border-slate-200">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('x')} disabled={!comparisonResult} className="hover:text-slate-900 border-slate-200">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('instagram')} disabled={!comparisonResult} className="hover:text-pink-600 border-slate-200">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('tiktok')} disabled={!comparisonResult} className="hover:text-slate-900 border-slate-200">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.32h0q2.73,12,8.14,23.36a121.25,121.25,0,0,0,103,63.18v90.41l-.11,210.64h0Z"></path></svg>
            </Button>

            <Button variant="outline" size="sm" onClick={shareCalculation} disabled={!comparisonResult}>
              <Share2 className="h-4 w-4 mr-1" />
              Distribuie
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Date PFA
                </CardTitle>
                <CardDescription>Introduceți veniturile și cheltuielile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Venit Anual</Label>
                    <Input
                      type="number"
                      value={yearlyIncome}
                      onChange={(e) => setYearlyIncome(e.target.value)}
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <Label>Monedă</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
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
                  <div className="text-xs text-slate-600 bg-emerald-50 p-2 rounded">
                    Curs BNR: 1 EUR = {exchangeRate.toFixed(4)} RON
                  </div>
                )}

                <div>
                  <Label>Cheltuieli Anuale (opțional)</Label>
                  <Input
                    type="number"
                    value={yearlyExpenses}
                    onChange={(e) => setYearlyExpenses(e.target.value)}
                    placeholder="Lasă gol pentru estimare"
                  />
                </div>

                {!yearlyExpenses && (
                  <div>
                    <Label>Estimare Cheltuieli (%)</Label>
                    <Select value={expenseRate.toString()} onValueChange={(v) => setExpenseRate(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10% - Minimă</SelectItem>
                        <SelectItem value="20">20% - Redusă</SelectItem>
                        <SelectItem value="30">30% - Medie</SelectItem>
                        <SelectItem value="40">40% - Ridicată</SelectItem>
                        <SelectItem value="50">50% - Foarte ridicată</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Domeniu de Activitate</Label>
                  <Select value={activity} onValueChange={setActivity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it_programare">IT / Programare</SelectItem>
                      <SelectItem value="it_consultanta">IT / Consultanță</SelectItem>
                      <SelectItem value="contabilitate">Contabilitate</SelectItem>
                      <SelectItem value="avocatura">Avocatură</SelectItem>
                      <SelectItem value="medicina">Medicină</SelectItem>
                      <SelectItem value="arhitectura">Arhitectură</SelectItem>
                      <SelectItem value="constructii">Construcții</SelectItem>
                      <SelectItem value="transport_marfa">Transport Marfă</SelectItem>
                      <SelectItem value="turism">Turism</SelectItem>
                      <SelectItem value="restaurant">Restaurant/HoReCa</SelectItem>
                      <SelectItem value="frizerie_coafura">Frizerie/Coafură</SelectItem>
                      <SelectItem value="reparatii_auto">Reparații Auto</SelectItem>
                      <SelectItem value="agricultura">Agricultură</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    Normă estimată: {formatCurrency(getNormaVenit(activity))} RON/an
                  </p>
                </div>

                <div>
                  <Label>Normă Personalizată (opțional)</Label>
                  <Input
                    type="number"
                    value={customNorm}
                    onChange={(e) => setCustomNorm(e.target.value)}
                    placeholder={getNormaVenit(activity).toString()}
                  />
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="optCAS"
                      checked={optOutCAS}
                      onChange={(e) => setOptOutCAS(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="optCAS" className="text-sm">Nu plătesc CAS (sub prag)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="optCASS"
                      checked={optOutCASS}
                      onChange={(e) => setOptOutCASS(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="optCASS" className="text-sm">Nu plătesc CASS (sub prag)</Label>
                  </div>
                </div>

                <Button onClick={calculateComparison} className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Compară Opțiuni
                </Button>
              </CardContent>
            </Card>

            {/* SRL Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Opțiuni SRL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Număr Angajați</Label>
                  <Select value={srlEmployees.toString()} onValueChange={(v) => setSrlEmployees(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - Impozit 3%</SelectItem>
                      <SelectItem value="1">1+ - Impozit 1%</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    Impozit micro: {srlEmployees === 0 ? '3%' : '1%'} din cifra de afaceri
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {comparisonResult ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="compare">Comparație Rapidă</TabsTrigger>
                  <TabsTrigger value="details">Detalii Complete</TabsTrigger>
                  <TabsTrigger value="full">PFA vs SRL</TabsTrigger>
                </TabsList>

                {/* Quick Comparison */}
                <TabsContent value="compare" className="space-y-4 mt-4">
                  {/* Winner Banner */}
                  <Card className={`border-2 ${comparisonResult.comparison.betterOption === 'norma_venit' ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {comparisonResult.comparison.betterOption === 'norma_venit' ? (
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          ) : (
                            <TrendingDown className="h-8 w-8 text-blue-600" />
                          )}
                          <div>
                            <p className="font-bold text-lg">
                              {comparisonResult.comparison.betterOption === 'norma_venit'
                                ? 'Normă de Venit este mai avantajoasă'
                                : 'Sistem Real este mai avantajos'}
                            </p>
                            <p className="text-sm text-slate-600">
                              Economisești {formatCurrency(comparisonResult.comparison.yearlySavings)} RON/an
                              ({formatCurrency(comparisonResult.comparison.monthlySavings)} RON/lună)
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Sistem Real Card */}
                    <Card className={comparisonResult.comparison.betterOption === 'sistem_real' ? 'ring-2 ring-blue-500' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          Sistem Real
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Venit Brut:</span>
                          <span>{formatCurrency(comparisonResult.sistemReal.yearlyIncome)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Cheltuieli:</span>
                          <span>-{formatCurrency(comparisonResult.sistemReal.yearlyExpenses)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>CAS ({fiscalRules?.pfa?.cas_rate || 25}%):</span>
                          <span>-{formatCurrency(comparisonResult.sistemReal.cas)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>CASS ({fiscalRules?.pfa?.cass_rate || 10}%):</span>
                          <span>-{formatCurrency(comparisonResult.sistemReal.cass)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Impozit ({fiscalRules?.pfa?.income_tax_rate || 10}%):</span>
                          <span>-{formatCurrency(comparisonResult.sistemReal.incomeTax)} RON</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t text-lg">
                          <span>Net Anual:</span>
                          <span className="text-green-600">{formatCurrency(comparisonResult.sistemReal.finalNet)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Net Lunar:</span>
                          <span>{formatCurrency(comparisonResult.sistemReal.monthlyNet)} RON</span>
                        </div>
                        <div className="text-xs text-slate-500 pt-2">
                          Rată efectivă: {comparisonResult.sistemReal.effectiveRate.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>

                    {/* Normă de Venit Card */}
                    <Card className={comparisonResult.comparison.betterOption === 'norma_venit' ? 'ring-2 ring-green-500' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          Normă de Venit
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Normă Aplicată:</span>
                          <span>{formatCurrency(comparisonResult.normaVenit.normAmount)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                          <span>Venit Real (netaxat):</span>
                          <span>{formatCurrency(comparisonResult.normaVenit.actualIncome)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>CAS:</span>
                          <span>-{formatCurrency(comparisonResult.normaVenit.cas)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>CASS:</span>
                          <span>-{formatCurrency(comparisonResult.normaVenit.cass)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Impozit pe Normă:</span>
                          <span>-{formatCurrency(comparisonResult.normaVenit.incomeTax)} RON</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t text-lg">
                          <span>Net Anual:</span>
                          <span className="text-green-600">{formatCurrency(comparisonResult.normaVenit.finalNet)} RON</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Net Lunar:</span>
                          <span>{formatCurrency(comparisonResult.normaVenit.monthlyNet)} RON</span>
                        </div>
                        <div className="text-xs text-slate-500 pt-2">
                          Total Taxe: {formatCurrency(comparisonResult.normaVenit.totalTaxes)} RON
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Detailed View */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* CAS/CASS Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informații Contribuții {year}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* CAS Info */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">CAS (Pensii) - {fiscalRules?.pfa?.cas_rate || 25}%</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className={comparisonResult.sistemReal.casInfo.isOptional ? 'text-green-600' : 'text-red-600'}>
                                {comparisonResult.sistemReal.casInfo.isOptional ? 'Opțional' : 'Obligatoriu'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Plătit:</span>
                              <span>{formatCurrency(comparisonResult.sistemReal.cas)} RON</span>
                            </div>
                            {comparisonResult.sistemReal.casInfo.years > 0 && (
                              <div className="flex justify-between">
                                <span>Stagiu Cotizare:</span>
                                <span>{comparisonResult.sistemReal.casInfo.years} ani</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CASS Info */}
                        <div className="p-4 bg-emerald-50 rounded-lg">
                          <h4 className="font-semibold text-emerald-800 mb-2">CASS (Sănătate) - {fiscalRules?.pfa?.cass_rate || 10}%</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span className={comparisonResult.sistemReal.cassInfo.isOptional ? 'text-green-600' : 'text-red-600'}>
                                {comparisonResult.sistemReal.cassInfo.isOptional ? 'Opțional' : 'Obligatoriu'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Plătit:</span>
                              <span>{formatCurrency(comparisonResult.sistemReal.cass)} RON</span>
                            </div>
                            {comparisonResult.sistemReal.cassInfo.capped && (
                              <div className="text-xs text-orange-600">
                                Plafonat la 60 salarii minime
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                        <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                          <strong>Praguri {year}:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>CASS obligatoriu peste {formatCurrency((fiscalRules?.pfa?.minimum_salary || 4050) * 6)} RON/an (6 salarii minime)</li>
                            <li>CAS obligatoriu peste {formatCurrency((fiscalRules?.pfa?.minimum_salary || 4050) * 12)} RON/an (12 salarii minime)</li>
                            <li>Plafon CASS: {formatCurrency((fiscalRules?.pfa?.minimum_salary || 4050) * 60)} RON/an</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Full Comparison with SRL */}
                <TabsContent value="full" className="space-y-4 mt-4">
                  {fullComparisonResult && (
                    <>
                      {/* Ranking */}
                      <Card className="border-2 border-purple-200 bg-purple-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-purple-600" />
                            Clasament: PFA vs SRL Microîntreprindere
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {fullComparisonResult.ranking.map((item, index) => (
                              <div
                                key={item.type}
                                className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-green-100 border-2 border-green-400' : 'bg-white border'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-green-500 text-white' : 'bg-slate-200'
                                    }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-semibold">{item.type}</p>
                                    <p className="text-xs text-slate-500">Rată efectivă: {item.rate.toFixed(1)}%</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">{formatCurrency(item.net)} RON</p>
                                  <p className="text-xs text-slate-500">{formatCurrency(item.net / 12)} RON/lună</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* SRL Details */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Detalii SRL Microîntreprindere</CardTitle>
                          <CardDescription>
                            Impozit {fullComparisonResult.srl.microTaxRate}% pe cifra de afaceri + 8% dividende + CASS
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Cifră de Afaceri:</span>
                              <span>{formatCurrency(fullComparisonResult.srl.yearlyRevenue)} RON</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Cheltuieli:</span>
                              <span>-{formatCurrency(fullComparisonResult.srl.yearlyExpenses)} RON</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Profit înainte de impozit:</span>
                              <span>{formatCurrency(fullComparisonResult.srl.profit)} RON</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>Impozit Micro ({fullComparisonResult.srl.microTaxRate}%):</span>
                              <span>-{formatCurrency(fullComparisonResult.srl.microTax)} RON</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>Impozit Dividende (8%):</span>
                              <span>-{formatCurrency(fullComparisonResult.srl.dividendTax)} RON</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>CASS Dividende (10%):</span>
                              <span>-{formatCurrency(fullComparisonResult.srl.cassDividend)} RON</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t text-lg">
                              <span>Dividend Net Anual:</span>
                              <span className="text-green-600">{formatCurrency(fullComparisonResult.srl.netDividend)} RON</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recommendation */}
                      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        <CardContent className="py-6">
                          <div className="flex items-center gap-4">
                            <ChevronRight className="h-10 w-10" />
                            <div>
                              <p className="text-lg font-bold">{fullComparisonResult.recommendation}</p>
                              <p className="text-emerald-100 text-sm mt-1">
                                Diferență față de ultima opțiune: {formatCurrency(fullComparisonResult.ranking[0].net - fullComparisonResult.ranking[fullComparisonResult.ranking.length - 1].net)} RON/an
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Introduceți veniturile și apăsați "Compară Opțiuni"</p>
                  <p className="text-sm mt-2">Vom calcula automat cea mai avantajoasă formă juridică</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
