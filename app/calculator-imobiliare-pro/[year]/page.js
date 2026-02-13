'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Home, Calculator, TrendingUp, Wallet, Building, CreditCard, Info, Share2, PiggyBank, BarChart3, RotateCcw, Facebook, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { RealEstateCalculator, PROPERTY_TYPES, CITIES_AVG_YIELD } from '@/lib/real-estate-calculator';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

export default function RealEstateCalculatorPage() {
  const params = useParams();
  const year = parseInt(params?.year) || 2026;

  const [fiscalRules, setFiscalRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('yield');

  // Yield Inputs
  const [propertyValue, setPropertyValue] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [propertyTax, setPropertyTax] = useState('500');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [insuranceCost, setInsuranceCost] = useState('300');

  // Mortgage Inputs
  const [downPayment, setDownPayment] = useState('');
  const [mortgageRate, setMortgageRate] = useState('7.5');
  const [mortgageYears, setMortgageYears] = useState('25');
  const [mortgageType, setMortgageType] = useState('anuitate');

  // Results
  const [yieldResult, setYieldResult] = useState(null);
  const [mortgageResult, setMortgageResult] = useState(null);
  const [investmentResult, setInvestmentResult] = useState(null);

  useEffect(() => {
    loadFiscalRules();
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

  const calculateYield = () => {
    if (!propertyValue || !monthlyRent) {
      toast.error('Introduceți valoarea proprietății și chiria lunară');
      return;
    }

    const calculator = new RealEstateCalculator(fiscalRules);
    const result = calculator.calculateNetYield({
      propertyValue: parseFloat(propertyValue),
      monthlyRent: parseFloat(monthlyRent),
      propertyTax: parseFloat(propertyTax) || 0,
      maintenanceCost: maintenanceCost ? parseFloat(maintenanceCost) : null,
      insuranceCost: parseFloat(insuranceCost) || 0,
    });

    setYieldResult(result);
  };

  const calculateMortgage = () => {
    if (!propertyValue || !downPayment) {
      toast.error('Introduceți valoarea proprietății și avansul');
      return;
    }

    const calculator = new RealEstateCalculator(fiscalRules);
    const loanAmount = parseFloat(propertyValue) - parseFloat(downPayment);

    const result = calculator.simulateMortgage({
      loanAmount,
      annualRate: parseFloat(mortgageRate),
      years: parseInt(mortgageYears),
      type: mortgageType,
    });

    setMortgageResult(result);
  };

  const calculateFullAnalysis = () => {
    if (!propertyValue || !monthlyRent || !downPayment) {
      toast.error('Completați toate câmpurile obligatorii');
      return;
    }

    const calculator = new RealEstateCalculator(fiscalRules);

    const result = calculator.analyzeInvestment({
      propertyValue: parseFloat(propertyValue),
      downPayment: parseFloat(downPayment),
      monthlyRent: parseFloat(monthlyRent),
      mortgageRate: parseFloat(mortgageRate),
      mortgageYears: parseInt(mortgageYears),
      propertyTax: parseFloat(propertyTax) || 0,
      maintenanceCost: maintenanceCost ? parseFloat(maintenanceCost) : parseFloat(propertyValue) * 0.01,
      insuranceCost: parseFloat(insuranceCost) || 0,
    });

    setInvestmentResult(result);
    setActiveTab('analysis');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const text = encodeURIComponent(`Calcul rentabilitate imobiliară pe eCalc.ro! #imobiliare #investitii #romania`);

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
      value: propertyValue,
      rent: monthlyRent,
      down: downPayment,
      rate: mortgageRate,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Link calcul copiat în clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <NavigationHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Home className="h-12 w-12 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-slate-600">Se încarcă calculatorul imobiliar {year}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calculator Imobiliare Pro {year}</h1>
            <p className="text-sm text-slate-600">Randament • Credit Ipotecar • Cash-on-Cash • Analiză Investiție</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => {
              setPropertyValue('');
              setMonthlyRent('');
              setDownPayment('');
              setYieldResult(null);
              setMortgageResult(null);
              setInvestmentResult(null);
              toast.success('Calculator resetat');
            }} disabled={!yieldResult && !mortgageResult && !investmentResult}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            {/* Social Sharing */}
            <Button variant="outline" size="sm" onClick={() => shareToSocial('facebook')} disabled={!yieldResult && !mortgageResult && !investmentResult} className="hover:text-blue-600 border-slate-200">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('x')} className="hover:text-slate-900 border-slate-200">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('instagram')} disabled={!yieldResult && !mortgageResult && !investmentResult} className="hover:text-pink-600 border-slate-200">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('tiktok')} disabled={!yieldResult && !mortgageResult && !investmentResult} className="hover:text-slate-900 border-slate-200">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.32h0q2.73,12,8.14,23.36a121.25,121.25,0,0,0,103,63.18v90.41l-.11,210.64h0Z"></path></svg>
            </Button>

            <Button variant="outline" size="sm" onClick={shareCalculation} disabled={!yieldResult && !mortgageResult && !investmentResult}>
              <Share2 className="h-4 w-4 mr-1" />
              Distribuie
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="yield">Randament</TabsTrigger>
            <TabsTrigger value="mortgage">Credit Ipotecar</TabsTrigger>
            <TabsTrigger value="analysis">Analiză Investiție</TabsTrigger>
            <TabsTrigger value="market">Piața Imobiliară</TabsTrigger>
          </TabsList>

          {/* Yield Calculator */}
          <TabsContent value="yield">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-indigo-600" />
                      Date Proprietate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Valoare Proprietate (EUR)</Label>
                      <Input
                        type="number"
                        value={propertyValue}
                        onChange={(e) => setPropertyValue(e.target.value)}
                        placeholder="Ex: 100000"
                      />
                    </div>
                    <div>
                      <Label>Chirie Lunară (EUR)</Label>
                      <Input
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(e.target.value)}
                        placeholder="Ex: 600"
                      />
                    </div>
                    <div>
                      <Label>Impozit Anual (EUR)</Label>
                      <Input
                        type="number"
                        value={propertyTax}
                        onChange={(e) => setPropertyTax(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Costuri Întreținere (EUR/an)</Label>
                      <Input
                        type="number"
                        value={maintenanceCost}
                        onChange={(e) => setMaintenanceCost(e.target.value)}
                        placeholder="Lasă gol pt 1%"
                      />
                    </div>
                    <div>
                      <Label>Asigurare (EUR/an)</Label>
                      <Input
                        type="number"
                        value={insuranceCost}
                        onChange={(e) => setInsuranceCost(e.target.value)}
                      />
                    </div>
                    <Button onClick={calculateYield} className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Calculează Randament
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {yieldResult ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border-2 border-indigo-500 bg-indigo-50">
                        <CardContent className="py-6 text-center">
                          <p className="text-sm text-indigo-600 mb-1">Randament Brut</p>
                          <p className="text-3xl font-bold text-indigo-800">{yieldResult.grossYield.toFixed(2)}%</p>
                        </CardContent>
                      </Card>
                      <Card className="border-2 border-green-500 bg-green-50">
                        <CardContent className="py-6 text-center">
                          <p className="text-sm text-green-600 mb-1">Randament Net</p>
                          <p className="text-3xl font-bold text-green-800">{yieldResult.netYield.toFixed(2)}%</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Detalii Calcul</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="font-semibold border-b pb-2">Venituri</h4>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Chirie lunară:</span>
                              <span>{formatCurrency(yieldResult.monthlyRent)} EUR</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Chirie anuală:</span>
                              <span className="text-green-600">{formatCurrency(yieldResult.annualRent)} EUR</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold border-b pb-2">Costuri Anuale</h4>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Impozit:</span>
                              <span>-{formatCurrency(yieldResult.costs.propertyTax)} EUR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Întreținere:</span>
                              <span>-{formatCurrency(yieldResult.costs.maintenance)} EUR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Asigurare:</span>
                              <span>-{formatCurrency(yieldResult.costs.insurance)} EUR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Vacanță (~8%):</span>
                              <span>-{formatCurrency(yieldResult.costs.vacancy)} EUR</span>
                            </div>
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Total Costuri:</span>
                              <span className="text-red-600">-{formatCurrency(yieldResult.costs.total)} EUR</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-100 rounded-lg flex justify-between items-center">
                          <span className="font-semibold text-green-800">Venit Net Anual:</span>
                          <span className="text-xl font-bold text-green-800">{formatCurrency(yieldResult.netIncome)} EUR</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Introduceți datele proprietății</p>
                      <p className="text-sm mt-2">Calculăm randamentul brut și net</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Mortgage Calculator */}
          <TabsContent value="mortgage">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      Simulare Credit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Valoare Proprietate (EUR)</Label>
                      <Input
                        type="number"
                        value={propertyValue}
                        onChange={(e) => setPropertyValue(e.target.value)}
                        placeholder="Ex: 100000"
                      />
                    </div>
                    <div>
                      <Label>Avans (EUR)</Label>
                      <Input
                        type="number"
                        value={downPayment}
                        onChange={(e) => setDownPayment(e.target.value)}
                        placeholder="Min 15%"
                      />
                      {propertyValue && downPayment && (
                        <p className="text-xs text-slate-500 mt-1">
                          {((parseFloat(downPayment) / parseFloat(propertyValue)) * 100).toFixed(1)}% din valoare
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Dobândă Anuală (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={mortgageRate}
                        onChange={(e) => setMortgageRate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Perioadă (ani)</Label>
                      <Select value={mortgageYears} onValueChange={setMortgageYears}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 15, 20, 25, 30].map(y => (
                            <SelectItem key={y} value={y.toString()}>{y} ani</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tip Credit</Label>
                      <Select value={mortgageType} onValueChange={setMortgageType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anuitate">Anuitate (rate egale)</SelectItem>
                          <SelectItem value="rate_egale">Rate egale la principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={calculateMortgage} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculează Credit
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {mortgageResult ? (
                  <div className="space-y-4">
                    <Card className="border-2 border-purple-500 bg-purple-50">
                      <CardContent className="py-6">
                        <div className="grid md:grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-sm text-purple-600">Rată Lunară</p>
                            <p className="text-2xl font-bold text-purple-800">{formatCurrency(mortgageResult.monthlyPayment)} EUR</p>
                          </div>
                          <div>
                            <p className="text-sm text-purple-600">Total de Plătit</p>
                            <p className="text-2xl font-bold text-purple-800">{formatCurrency(mortgageResult.totalPayment)} EUR</p>
                          </div>
                          <div>
                            <p className="text-sm text-purple-600">Total Dobânzi</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(mortgageResult.totalInterest)} EUR</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Grafic Rambursare</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-slate-50">
                                <th className="text-left p-2">Luna</th>
                                <th className="text-right p-2">Rată</th>
                                <th className="text-right p-2">Principal</th>
                                <th className="text-right p-2">Dobândă</th>
                                <th className="text-right p-2">Sold</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mortgageResult.schedule.map((row) => (
                                <tr key={row.month} className="border-b hover:bg-slate-50">
                                  <td className="p-2">{row.month}</td>
                                  <td className="p-2 text-right">{formatCurrency(row.payment)}</td>
                                  <td className="p-2 text-right text-green-600">{formatCurrency(row.principal)}</td>
                                  <td className="p-2 text-right text-red-600">{formatCurrency(row.interest)}</td>
                                  <td className="p-2 text-right font-semibold">{formatCurrency(row.balance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="text-sm text-amber-800">
                            <strong>Informații importante:</strong>
                            <ul className="list-disc list-inside mt-1">
                              <li>Dobânda totală reprezintă {mortgageResult.interestRatio.toFixed(1)}% din împrumut</li>
                              <li>Rambursarea anticipată reduce semnificativ dobânda totală</li>
                              <li>Verificați comisioanele băncii (administrare, analiză dosar, etc.)</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Simulați creditul ipotecar</p>
                      <p className="text-sm mt-2">Calculăm rata lunară și graficul de rambursare</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Full Investment Analysis */}
          <TabsContent value="analysis">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Analiză Completă
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Completați datele în tab-urile "Randament" și "Credit" apoi apăsați butonul de mai jos.
                    </p>
                    <Button onClick={calculateFullAnalysis} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                      <PiggyBank className="h-4 w-4 mr-2" />
                      Analiză Investiție Completă
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {investmentResult ? (
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <Card className="border-2 border-blue-500 bg-blue-50">
                        <CardContent className="py-4 text-center">
                          <p className="text-xs text-blue-600">Cap Rate</p>
                          <p className="text-2xl font-bold text-blue-800">{investmentResult.yields.net.toFixed(2)}%</p>
                        </CardContent>
                      </Card>
                      <Card className={`border-2 ${investmentResult.cashFlow.cashOnCash > 8 ? 'border-green-500 bg-green-50' : investmentResult.cashFlow.cashOnCash > 5 ? 'border-amber-500 bg-amber-50' : 'border-red-500 bg-red-50'}`}>
                        <CardContent className="py-4 text-center">
                          <p className="text-xs">Cash-on-Cash</p>
                          <p className="text-2xl font-bold">{investmentResult.cashFlow.cashOnCash.toFixed(2)}%</p>
                        </CardContent>
                      </Card>
                      <Card className="border-2 border-purple-500 bg-purple-50">
                        <CardContent className="py-4 text-center">
                          <p className="text-xs text-purple-600">Break-Even</p>
                          <p className="text-2xl font-bold text-purple-800">{investmentResult.metrics.breakEvenYears.toFixed(1)} ani</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Cash Flow */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Cash Flow</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-lg ${investmentResult.cashFlow.monthly > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <p className="text-sm text-slate-600">Cash Flow Lunar</p>
                            <p className={`text-2xl font-bold ${investmentResult.cashFlow.monthly > 0 ? 'text-green-800' : 'text-red-800'}`}>
                              {investmentResult.cashFlow.monthly > 0 ? '+' : ''}{formatCurrency(investmentResult.cashFlow.monthly)} EUR
                            </p>
                          </div>
                          <div className={`p-4 rounded-lg ${investmentResult.cashFlow.annual > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <p className="text-sm text-slate-600">Cash Flow Anual</p>
                            <p className={`text-2xl font-bold ${investmentResult.cashFlow.annual > 0 ? 'text-green-800' : 'text-red-800'}`}>
                              {investmentResult.cashFlow.annual > 0 ? '+' : ''}{formatCurrency(investmentResult.cashFlow.annual)} EUR
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendation */}
                    <Card className={`${investmentResult.cashFlow.cashOnCash > 8 ? 'bg-green-500' : investmentResult.cashFlow.cashOnCash > 5 ? 'bg-amber-500' : 'bg-red-500'} text-white`}>
                      <CardContent className="py-6">
                        <div className="flex items-center gap-4">
                          <PiggyBank className="h-10 w-10" />
                          <div>
                            <p className="text-lg font-bold">{investmentResult.recommendation}</p>
                            <p className="text-sm opacity-90">
                              Investiție totală: {formatCurrency(investmentResult.property.totalInvestment)} EUR
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Analiză completă a investiției</p>
                      <p className="text-sm mt-2">Cash-on-Cash, Cap Rate, Break-Even</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Market Overview */}
          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle>Randamente Medii pe Piața Imobiliară {year}</CardTitle>
                <CardDescription>Date orientative pentru principalele orașe din România</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left p-3">Oraș</th>
                        <th className="text-right p-3">Preț Mediu (€/mp)</th>
                        <th className="text-right p-3">Chirie Medie (€/mp)</th>
                        <th className="text-right p-3">Randament Brut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(CITIES_AVG_YIELD).map(([city, data]) => (
                        <tr key={city} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-semibold capitalize">{city.replace('-', ' ')}</td>
                          <td className="p-3 text-right">{data.avgPrice} €</td>
                          <td className="p-3 text-right">{data.avgRent} €</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${data.yield > 6.5 ? 'bg-green-100 text-green-800' :
                              data.yield > 6 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {data.yield}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
                  <Info className="inline h-4 w-4 mr-1" />
                  Datele sunt orientative și pot varia în funcție de zonă, tip proprietate și perioada analizată.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
