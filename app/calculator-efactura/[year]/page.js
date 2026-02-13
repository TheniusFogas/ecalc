'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, AlertCircle, CheckCircle, Info, Clock, Euro, AlertTriangle, Shield, Building2, RotateCcw, Share2, Facebook, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { EFacturaCalculator, HOLIDAYS_2025, HOLIDAYS_2026, PENALTY_GRID } from '@/lib/efactura-calculator';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

export default function EFacturaPage() {
  const params = useParams();
  const year = parseInt(params?.year) || 2026;

  const [fiscalRules, setFiscalRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('deadline');

  // Câmpuri formular
  const [invoiceDate, setInvoiceDate] = useState('');
  const [transmissionDate, setTransmissionDate] = useState('');
  const [transactionType, setTransactionType] = useState('B2B');
  const [contributorType, setContributorType] = useState('small');
  const [invoiceValue, setInvoiceValue] = useState('');
  const [isFirstOffense, setIsFirstOffense] = useState(true);

  // Rezultate
  const [deadlineResult, setDeadlineResult] = useState(null);
  const [penaltyResult, setPenaltyResult] = useState(null);

  useEffect(() => {
    loadFiscalRules();
  }, [year]);

  const loadFiscalRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fiscal-rules/${year}`);
      const data = await response.json();
      setFiscalRules(data);
    } catch (error) {
      toast.error('Eroare la încărcarea regulilor fiscale');
    } finally {
      setLoading(false);
    }
  };

  const calculateDeadline = () => {
    if (!invoiceDate) {
      toast.error('Introduceți data emiterii facturii');
      return;
    }

    const calculator = new EFacturaCalculator(fiscalRules);
    const customHolidays = fiscalRules?.holidays || [];

    const deadlineInfo = calculator.calculateDeadline(invoiceDate, customHolidays);
    const mandatory = calculator.checkMandatory(transactionType, year);
    const anafInfo = calculator.getANAFInfo();
    const timeline = calculator.getImplementationTimeline();
    const recommendations = calculator.getRecommendations();

    setDeadlineResult({
      ...deadlineInfo,
      mandatory,
      anafInfo,
      timeline,
      recommendations,
      isOverdue: new Date() > deadlineInfo.deadline,
      invoiceDate,
    });
  };

  const calculatePenalty = () => {
    if (!invoiceDate) {
      toast.error('Introduceți data emiterii facturii');
      return;
    }

    const calculator = new EFacturaCalculator(fiscalRules);
    const customHolidays = fiscalRules?.holidays || [];

    const result = calculator.calculatePenalty({
      invoiceDate,
      transmissionDate: transmissionDate || null,
      invoiceValue: invoiceValue ? parseFloat(invoiceValue) : 0,
      contributorType,
      transactionType,
      isFirstOffense,
      customHolidays,
    });

    setPenaltyResult(result);
    setActiveTab('penalty');
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const text = encodeURIComponent(`Vezi calculul termenelor e-Factura pe eCalc.ro! #eFactura #fiscale #romania`);

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
      date: invoiceDate,
      type: transactionType,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Link calcul copiat în clipboard!');
  };

  const resetForm = () => {
    setInvoiceDate('');
    setTransmissionDate('');
    setInvoiceValue('');
    setDeadlineResult(null);
    setPenaltyResult(null);
    toast.success('Formular resetat');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ro-RO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  const holidays = year >= 2026 ? HOLIDAYS_2026 : HOLIDAYS_2025;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-left">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Calculator e-Factura {year}</h1>
              <p className="text-slate-600">Termene de transmitere • Calcul Amenzi • Conformitate SPV</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm} disabled={!deadlineResult && !penaltyResult}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>

              {/* Social Sharing */}
              <Button variant="outline" size="sm" onClick={() => shareToSocial('facebook')} disabled={!deadlineResult && !penaltyResult} className="hover:text-blue-600 border-slate-200">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => shareToSocial('x')} disabled={!deadlineResult && !penaltyResult} className="hover:text-slate-900 border-slate-200">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
              </Button>
              <Button variant="outline" size="sm" onClick={() => shareToSocial('instagram')} disabled={!deadlineResult && !penaltyResult} className="hover:text-pink-600 border-slate-200">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => shareToSocial('tiktok')} disabled={!deadlineResult && !penaltyResult} className="hover:text-slate-900 border-slate-200">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.32h0q2.73,12,8.14,23.36a121.25,121.25,0,0,0,103,63.18v90.41l-.11,210.64h0Z"></path></svg>
              </Button>

              <Button variant="outline" size="sm" onClick={shareCalculation} disabled={!deadlineResult && !penaltyResult}>
                <Share2 className="h-4 w-4 mr-1" />
                Distribuie
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="deadline">Termen Transmitere</TabsTrigger>
              <TabsTrigger value="penalty">Calcul Amendă</TabsTrigger>
              <TabsTrigger value="holidays">Zile Libere {year}</TabsTrigger>
            </TabsList>

            {/* Termen Transmitere */}
            <TabsContent value="deadline">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Date Factură
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Data Emiterii Facturii</Label>
                        <Input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Tip Tranzacție</Label>
                        <Select value={transactionType} onValueChange={setTransactionType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B2B">B2B (Companie → Companie)</SelectItem>
                            <SelectItem value="B2C">B2C (Companie → Consumator)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={calculateDeadline} className="w-full" size="lg">
                        <Calendar className="h-4 w-4 mr-2" />
                        Calculează Termen
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  {deadlineResult ? (
                    <div className="space-y-4">
                      {/* Deadline Result */}
                      <Card className={`border-2 ${deadlineResult.isOverdue ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                        <CardContent className="py-6">
                          <div className="text-center">
                            {deadlineResult.isOverdue ? (
                              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                            ) : (
                              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            )}
                            <p className="text-sm text-slate-600 mb-2">Data limită de transmitere în SPV:</p>
                            <p className="text-2xl font-bold text-slate-900">
                              {formatDate(deadlineResult.deadline)}
                            </p>
                            <p className="text-sm text-slate-600 mt-2">
                              {deadlineResult.workingDaysLimit} zile lucrătoare de la {formatDate(deadlineResult.invoiceDate)}
                            </p>
                            {deadlineResult.isOverdue && (
                              <p className="text-red-600 mt-4 font-semibold">
                                ⚠️ ATENȚIE: Termenul a fost depășit! Calculează amenda posibilă.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Skipped Holidays */}
                      {deadlineResult.skippedHolidays?.length > 0 && (
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Zile libere în această perioadă:</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {deadlineResult.skippedHolidays.map(h => (
                                <span key={h} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">
                                  {formatDate(h)}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Mandatory Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Obligativitate {transactionType}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-start gap-3">
                            {deadlineResult.mandatory.mandatory ? (
                              <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
                            ) : (
                              <Info className="h-6 w-6 text-blue-600 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{deadlineResult.mandatory.reason}</p>
                              {deadlineResult.mandatory.since && (
                                <p className="text-sm text-slate-600 mt-1">
                                  În vigoare din: {formatDate(deadlineResult.mandatory.since)}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recommendations */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Recomandări pentru Evitarea Amenzilor</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {deadlineResult.recommendations?.map((rec, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg flex items-start gap-3 ${rec.priority === 'high' ? 'bg-red-50' :
                                  rec.priority === 'medium' ? 'bg-amber-50' : 'bg-slate-50'
                                  }`}
                              >
                                <div className={`w-2 h-2 rounded-full mt-2 ${rec.priority === 'high' ? 'bg-red-500' :
                                  rec.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                                  }`} />
                                <div>
                                  <p className="font-semibold text-slate-900">{rec.title}</p>
                                  <p className="text-sm text-slate-600">{rec.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-slate-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Introduceți data facturii</p>
                        <p className="text-sm mt-2">Vom calcula termenul limită de transmitere în SPV</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Calcul Amendă */}
            <TabsContent value="penalty">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Calcul Amendă Potențială
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Data Emiterii Facturii</Label>
                        <Input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Data Transmiterii (sau lasă gol pt. astăzi)</Label>
                        <Input
                          type="date"
                          value={transmissionDate}
                          onChange={(e) => setTransmissionDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Categorie Contribuabil</Label>
                        <Select value={contributorType} onValueChange={setContributorType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PENALTY_GRID).map(([key, info]) => (
                              <SelectItem key={key} value={key}>
                                {info.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500 mt-1">
                          {PENALTY_GRID[contributorType]?.description}
                        </p>
                      </div>

                      <div>
                        <Label>Tip Tranzacție</Label>
                        <Select value={transactionType} onValueChange={setTransactionType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B2B">B2B (15% supliment)</SelectItem>
                            <SelectItem value="B2C">B2C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {transactionType === 'B2B' && (
                        <div>
                          <Label>Valoare Factură (RON)</Label>
                          <Input
                            type="number"
                            value={invoiceValue}
                            onChange={(e) => setInvoiceValue(e.target.value)}
                            placeholder="Pentru calcul 15%"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="firstOffense"
                          checked={isFirstOffense}
                          onChange={(e) => setIsFirstOffense(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="firstOffense" className="text-sm">Prima abatere (poate primi avertisment)</Label>
                      </div>

                      <Button onClick={calculatePenalty} className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                        <Euro className="h-4 w-4 mr-2" />
                        Calculează Amendă
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  {penaltyResult ? (
                    <div className="space-y-4">
                      {penaltyResult.isOverdue ? (
                        <>
                          {/* Penalty Result */}
                          <Card className={`border-2 ${penaltyResult.severity === 'grav' ? 'border-red-500 bg-red-50' :
                            penaltyResult.severity === 'moderat' ? 'border-amber-500 bg-amber-50' :
                              'border-yellow-500 bg-yellow-50'
                            }`}>
                            <CardContent className="py-6">
                              <div className="text-center">
                                <AlertTriangle className={`h-12 w-12 mx-auto mb-4 ${penaltyResult.severity === 'grav' ? 'text-red-600' :
                                  penaltyResult.severity === 'moderat' ? 'text-amber-600' :
                                    'text-yellow-600'
                                  }`} />
                                <p className="text-sm text-slate-600 mb-2">Întârziere: {penaltyResult.delayDays} zile lucrătoare</p>
                                <p className="text-3xl font-bold text-slate-900">
                                  {penaltyResult.totalPenalty > 0
                                    ? `${formatCurrency(penaltyResult.totalPenalty)} RON`
                                    : 'Avertisment (fără amendă)'}
                                </p>
                                <p className="text-slate-600 mt-2">
                                  Severitate: <span className="font-semibold capitalize">{penaltyResult.severity}</span>
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Breakdown */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Defalcare Amendă Estimată</CardTitle>
                              <CardDescription>
                                Categorie: {penaltyResult.contributorType}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                  <span className="text-slate-600">Amendă de bază:</span>
                                  <span className="font-semibold">{formatCurrency(penaltyResult.basePenalty)} RON</span>
                                </div>
                                {penaltyResult.b2bExtraPenalty > 0 && (
                                  <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                                    <span className="text-amber-700">Supliment B2B (15% din valoare):</span>
                                    <span className="font-semibold text-amber-700">+{formatCurrency(penaltyResult.b2bExtraPenalty)} RON</span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg text-lg">
                                  <span className="font-bold text-red-800">Total Amendă Estimată:</span>
                                  <span className="font-bold text-red-800">{formatCurrency(penaltyResult.totalPenalty)} RON</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Warnings */}
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="py-4">
                              <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                  <p className="font-semibold mb-2">Atenție:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {penaltyResult.warnings?.map((w, idx) => (
                                      <li key={idx}>{w}</li>
                                    ))}
                                  </ul>
                                  <p className="mt-2 text-xs">Bază legală: {penaltyResult.legalBasis}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <Card className="border-2 border-green-500 bg-green-50">
                          <CardContent className="py-12 text-center">
                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                            <p className="text-2xl font-bold text-green-800">{penaltyResult.message}</p>
                            <p className="text-green-600 mt-2">
                              Termen limită: {formatDate(penaltyResult.deadline?.deadline)}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center text-slate-500">
                        <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">Verifică dacă ai depășit termenul</p>
                        <p className="text-sm mt-2">Vom calcula amenda potențială conform legislației</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Sărbători Legale */}
            <TabsContent value="holidays">
              <Card>
                <CardHeader>
                  <CardTitle>Sărbători Legale România {year}</CardTitle>
                  <CardDescription>
                    Aceste zile NU se contorizează la calculul termenului de 5 zile lucrătoare
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {holidays.map((date, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="font-semibold text-slate-900">
                          {formatDate(date)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold">Actualizare Sărbători:</p>
                        <p>Guvernul poate stabili zile libere suplimentare pe parcursul anului. Verificați periodic pentru actualizări sau adăugați-le din panoul de administrare.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ANAF Resources */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Resurse Oficiale ANAF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800">Portal e-Factura</p>
                  <a href="https://e-factura.anaf.ro" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm">
                    e-factura.anaf.ro
                  </a>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800">Telefon Suport</p>
                  <p className="text-blue-600 text-sm">0800 108 800</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800">Email</p>
                  <p className="text-blue-600 text-sm">efactura@anaf.ro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
