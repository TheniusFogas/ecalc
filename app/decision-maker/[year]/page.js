'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TrendingUp, AlertCircle, CheckCircle, Info, Target, ArrowRight, RotateCcw, Share2, Facebook, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { SalaryCalculator } from '@/lib/salary-engine';
import { BreakEvenCalculator } from '@/lib/break-even-calculator';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

// export default function DecisionMakerPage({ params }) { // OLD
export default function DecisionMakerPage() {
  const params = useParams();

  const year = parseInt(params?.year) || 2026;
  // if (!params) return null; // Removed, params from hook is always an object (can be empty)

  const [fiscalRules, setFiscalRules] = useState(null);
  const [fiscalRules2025, setFiscalRules2025] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comparison');

  const [annualIncome, setAnnualIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [results, setResults] = useState(null);
  const [comparison2025, setComparison2025] = useState(null);
  const [breakEvenData, setBreakEvenData] = useState(null);

  useEffect(() => {
    loadFiscalRules();
  }, [year]);

  const loadFiscalRules = async () => {
    try {
      const [current, prev] = await Promise.all([
        fetch(`/api/fiscal-rules/${year}`).then(r => r.json()),
        fetch('/api/fiscal-rules/2025').then(r => r.json()),
      ]);
      console.log("Reguli 2026:", current);
      console.log("Reguli 2025:", prev);
      setFiscalRules(current);
      setFiscalRules2025(prev);
      setLoading(false);
    } catch (error) {
      toast.error('Eroare la încărcarea regulilor fiscale');
      setLoading(false);
    }
  };

  const calculateSalary = (income, rules) => {
    if (!rules) return { net: 0, taxes: 0, details: {} }; // Siguranță
    const calculator = new SalaryCalculator(rules);
    const monthlyGross = income / 12;
    const result = calculator.calculateStandard(monthlyGross);
    return {
      type: 'Salariu',
      gross: income,
      net: result.net * 12,
      taxes: (result.cas + result.cass + result.incomeTax) * 12,
      employerCost: result.totalCost * 12,
      details: {
        cas: result.cas * 12,
        cass: result.cass * 12,
        incomeTax: result.incomeTax * 12,
        cam: result.cam * 12,
      },
    };
  };

  const calculatePFAReal = (income, expenses, rules) => {
    const minSalary = rules.pfa.minimum_salary || 4050;
    const netIncome = income - expenses;
    const incomeTax = netIncome * ((rules.pfa.income_tax_rate || 10) / 100);

    // CASS calculation with thresholds
    const minThreshold = minSalary * (rules.pfa.cass_min_threshold || 6);
    const maxThreshold = minSalary * (rules.pfa.cass_max_threshold || 60);
    let cassBase = Math.max(netIncome, minThreshold);
    cassBase = Math.min(cassBase, maxThreshold);
    const cass = cassBase * ((rules.pfa.cass_rate || 10) / 100);

    // CAS calculation (optional under 12 salaries)
    const threshold12 = minSalary * 12;
    const threshold24 = minSalary * 24;
    let cas = 0;
    if (netIncome >= threshold24) {
      cas = threshold24 * ((rules.pfa.cas_rate || 25) / 100);
    } else if (netIncome >= threshold12) {
      cas = threshold12 * ((rules.pfa.cas_rate || 25) / 100);
    }

    const totalTaxes = incomeTax + cass + cas;
    const net = income - expenses - totalTaxes;

    return {
      type: 'PFA Sistem Real',
      gross: income,
      expenses,
      netIncome,
      net,
      taxes: totalTaxes,
      details: {
        incomeTax,
        cass,
        cas,
      },
    };
  };

  const calculatePFANorm = (income, rules) => {
    // Simplified - assumes average norm of 30,000 RON/year
    const normValue = 30000;
    const incomeTax = normValue * ((rules.pfa.income_tax_rate || 10) / 100);
    const minSalary = rules.pfa.minimum_salary || 4050;

    const minThreshold = minSalary * (rules.pfa.cass_min_threshold || 6);
    const maxThreshold = minSalary * (rules.pfa.cass_max_threshold || 60);
    let cassBase = Math.max(normValue, minThreshold);
    cassBase = Math.min(cassBase, maxThreshold);
    const cass = cassBase * ((rules.pfa.cass_rate || 10) / 100);

    const cas = 0; // Optional for norm under 12 salaries

    const totalTaxes = incomeTax + cass + cas;
    const net = income - totalTaxes;

    return {
      type: 'PFA Normă de Venit',
      gross: income,
      normValue,
      net,
      taxes: totalTaxes,
      details: {
        incomeTax,
        cass,
        cas,
      },
    };
  };

  const calculateSRL = (income, expenses, rules) => {
    const profit = income - expenses;
    const profitTax = profit * 0.16; // 16% corporate tax
    const netProfit = profit - profitTax;

    // Dividend tax (10%) + CASS on dividends
    const dividendTax = netProfit * 0.10;
    const minSalary = rules.salary?.minimum_salary || 4050;
    const minThreshold = minSalary * 6;
    const maxThreshold = minSalary * 24;
    let cassBase = Math.min(Math.max(netProfit, minThreshold), maxThreshold);
    const dividendCASS = cassBase * 0.10;

    const netAfterAllTaxes = netProfit - dividendTax - dividendCASS;
    const totalTaxes = profitTax + dividendTax + dividendCASS;

    return {
      type: 'SRL',
      gross: income,
      expenses,
      profit,
      netProfit,
      net: netAfterAllTaxes,
      taxes: totalTaxes,
      details: {
        profitTax,
        dividendTax,
        dividendCASS,
      },
    };
  };

  const calculate = () => {
    if (!fiscalRules || !annualIncome || parseFloat(annualIncome) <= 0) {
      toast.error('Introduceți venitul anual');
      return;
    }

    const income = parseFloat(annualIncome);
    const exp = parseFloat(expenses) || 0;

    const salary = calculateSalary(income, fiscalRules);
    const pfaReal = calculatePFAReal(income, exp, fiscalRules);
    const pfaNorm = calculatePFANorm(income, fiscalRules);
    const srl = calculateSRL(income, exp, fiscalRules);

    setResults({
      salary,
      pfaReal,
      pfaNorm,
      srl,
      best: [salary, pfaReal, pfaNorm, srl].reduce((best, curr) =>
        curr.net > best.net ? curr : best
      ),
    });

    // Calculate break-even points
    const breakEvenCalc = new BreakEvenCalculator(fiscalRules);
    const expenseRate = exp > 0 ? (exp / income) * 100 : 30;
    const breakEvenTable = breakEvenCalc.generateBreakEvenTable(expenseRate, 30000);
    setBreakEvenData(breakEvenTable);

    // Calculate for 2025 if available
    if (year === 2026 && fiscalRules2025) {
      const salary2025 = calculateSalary(income, fiscalRules2025);
      const pfaReal2025 = calculatePFAReal(income, exp, fiscalRules2025);
      const pfaNorm2025 = calculatePFANorm(income, fiscalRules2025);
      const srl2025 = calculateSRL(income, exp, fiscalRules2025);

      setComparison2025({
        salary: salary2025,
        pfaReal: pfaReal2025,
        pfaNorm: pfaNorm2025,
        srl: srl2025,
      });
    }
  };

  const calculateBreakEven = () => {
    if (!results) return null;

    // Find income level where PFA becomes better than Salary
    const pfaAdvantage = results.pfaReal.net - results.salary.net;
    const srlAdvantage = results.srl.net - results.salary.net;

    return {
      pfaVsSalary: pfaAdvantage > 0 ? parseFloat(annualIncome) : null,
      srlVsSalary: srlAdvantage > 0 ? parseFloat(annualIncome) : null,
      srlVsPFA: results.srl.net > results.pfaReal.net ? parseFloat(annualIncome) : null,
    };
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const text = encodeURIComponent(`Vezi analiza Salariu vs PFA vs SRL pe eCalc.ro! #decisionmaker #fiscale #romania`);

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
      income: annualIncome,
      expenses: expenses || '',
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Link analiză copiat în clipboard!');
  };

  const resetForm = () => {
    setAnnualIncome('');
    setExpenses('');
    setResults(null);
    setComparison2025(null);
    setBreakEvenData(null);
    toast.success('Formular resetat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  const breakEven = results ? calculateBreakEven() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Decision Maker {year}</h1>
            <p className="text-sm text-slate-600">Comparație Salariu vs PFA vs SRL • Analiză Break-even</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm} disabled={!results}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            {/* Social Sharing */}
            <Button variant="outline" size="sm" onClick={() => shareToSocial('facebook')} disabled={!results} className="hover:text-blue-600 border-slate-200">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('x')} disabled={!results} className="hover:text-slate-900 border-slate-200">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('instagram')} disabled={!results} className="hover:text-pink-600 border-slate-200">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('tiktok')} disabled={!results} className="hover:text-slate-900 border-slate-200">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.32h0q2.73,12,8.14,23.36a121.25,121.25,0,0,0,103,63.18v90.41l-.11,210.64h0Z"></path></svg>
            </Button>

            <Button variant="outline" size="sm" onClick={shareCalculation} disabled={!results}>
              <Share2 className="h-4 w-4 mr-1" />
              Distribuie
            </Button>
          </div>
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Input */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Date Intrare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Venit Brut Anual (RON)</Label>
                  <Input
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    placeholder="ex: 120000"
                  />
                </div>
                <div>
                  <Label>Cheltuieli Anuale (RON)</Label>
                  <Input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="ex: 30000"
                  />
                  <p className="text-xs text-slate-500 mt-1">Pentru PFA Real și SRL</p>
                </div>
                <Button onClick={calculate} className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analizează
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {results ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="comparison">Comparație</TabsTrigger>
                  <TabsTrigger value="breakeven">Break-even Analysis</TabsTrigger>
                  <TabsTrigger value="history">Istoric 2025 vs 2026</TabsTrigger>
                </TabsList>

                {/* COMPARISON TAB */}
                <TabsContent value="comparison" className="space-y-6">
                  {/* Comparison Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparație Completă {year}</CardTitle>
                      <CardDescription>Bani rămași în mână după TOATE taxele</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3">Formă Organizare</th>
                              <th className="text-right p-3">Venit Brut</th>
                              <th className="text-right p-3">Taxe Totale</th>
                              <th className="text-right p-3">NET Rămas</th>
                              <th className="text-right p-3">% din Brut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[results.salary, results.pfaReal, results.pfaNorm, results.srl].map((r, idx) => (
                              <tr
                                key={idx}
                                className={`border-b ${r.type === results.best.type ? 'bg-green-50' : ''}`}
                              >
                                <td className="p-3 font-medium">
                                  {r.type}
                                  {r.type === results.best.type && (
                                    <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />
                                  )}
                                </td>
                                <td className="text-right p-3">{r.gross.toFixed(2)} RON</td>
                                <td className="text-right p-3 text-red-600">-{r.taxes.toFixed(2)} RON</td>
                                <td className="text-right p-3 font-bold text-green-600">{r.net.toFixed(2)} RON</td>
                                <td className="text-right p-3">{((r.net / r.gross) * 100).toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Best Option */}
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Recomandare Optimă
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg">
                        Pentru venitul de <strong>{parseFloat(annualIncome).toFixed(2)} RON/an</strong>,
                        forma optimă este <strong>{results.best.type}</strong>.
                      </p>
                      <p className="text-sm text-slate-600 mt-2">
                        Economisești <strong>{(results.best.net - Math.min(...[results.salary, results.pfaReal, results.pfaNorm, results.srl].map(r => r.net))).toFixed(2)} RON</strong> față de cea mai dezavantajoasă opțiune.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* BREAK-EVEN TAB */}
                <TabsContent value="breakeven" className="space-y-6">
                  {breakEvenData ? (
                    <>
                      <Card className="border-2 border-purple-200 bg-purple-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-6 w-6 text-purple-600" />
                            Break-even Analysis - Praguri de Tranziție
                          </CardTitle>
                          <CardDescription>
                            Identifică exact la ce nivel de venit devine avantajoasă trecerea la o altă formă juridică
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {breakEvenData.transitions.map((transition, idx) => (
                              <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-slate-700">{transition.from}</span>
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                    <span className="font-semibold text-blue-700">{transition.to}</span>
                                  </div>
                                  <p className="text-sm text-slate-600">{transition.message}</p>
                                </div>
                                {transition.breakEvenIncome && (
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {new Intl.NumberFormat('ro-RO').format(transition.breakEvenIncome)} RON
                                    </div>
                                    <div className="text-xs text-slate-500">prag anual</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-blue-900">
                                <p className="font-semibold mb-2">Cum să folosești această analiză:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Identifică pragul de venit la care forma actuală devine mai puțin eficientă</li>
                                  <li>Planifică tranziția la momentul optim pentru minimizarea taxelor</li>
                                  <li>Ține cont de costurile de tranziție (contabil, notarial, timp)</li>
                                  <li>Rămâi flexibil - pragurile se pot schimba anual cu legislația</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Target className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                        <p className="text-slate-600">Calculați mai întâi pentru a vedea analiza break-even</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history" className="space-y-6">
                  {comparison2025 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Comparație 2025 vs 2026</CardTitle>
                        <CardDescription>Impactul modificărilor fiscale</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { key: 'salary', label: 'Salariu' },
                            { key: 'pfaReal', label: 'PFA Sistem Real' },
                            { key: 'pfaNorm', label: 'PFA Normă' },
                            { key: 'srl', label: 'SRL' },
                          ].map(({ key, label }) => {
                            const diff = results[key].net - comparison2025[key].net;
                            const percDiff = (diff / comparison2025[key].net) * 100;
                            return (
                              <div key={key} className="flex justify-between items-center">
                                <span className="font-medium">{label}:</span>
                                <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {diff >= 0 ? '+' : ''}{diff.toFixed(2)} RON ({percDiff >= 0 ? '+' : ''}{percDiff.toFixed(2)}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Detailed Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalii Taxe pe Formă de Organizare</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {[results.salary, results.pfaReal, results.pfaNorm, results.srl].map((r, idx) => (
                          <div key={idx} className="space-y-2">
                            <h4 className="font-semibold border-b pb-2">{r.type}</h4>
                            {r.type === 'Salariu' && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>CAS (25%):</span>
                                  <span className="text-red-600">-{r.details.cas.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CASS (10%):</span>
                                  <span className="text-red-600">-{r.details.cass.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Impozit (10%):</span>
                                  <span className="text-red-600">-{r.details.incomeTax.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CAM Angajator:</span>
                                  <span className="text-slate-600">+{r.details.cam.toFixed(2)} RON</span>
                                </div>
                              </>
                            )}
                            {r.type.startsWith('PFA') && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>Impozit venit:</span>
                                  <span className="text-red-600">-{r.details.incomeTax.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CASS:</span>
                                  <span className="text-red-600">-{r.details.cass.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CAS:</span>
                                  <span className="text-red-600">-{r.details.cas.toFixed(2)} RON</span>
                                </div>
                              </>
                            )}
                            {r.type === 'SRL' && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>Impozit profit (16%):</span>
                                  <span className="text-red-600">-{r.details.profitTax.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Impozit dividend (10%):</span>
                                  <span className="text-red-600">-{r.details.dividendTax.toFixed(2)} RON</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CASS dividend (10%):</span>
                                  <span className="text-red-600">-{r.details.dividendCASS.toFixed(2)} RON</span>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Introduceți venitul anual și apăsați "Analizează"</p>
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
