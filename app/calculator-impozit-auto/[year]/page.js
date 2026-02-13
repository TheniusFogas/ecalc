'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Car, Calculator, MapPin, Fuel, Shield, Settings, Info, Download, Share2, TrendingDown, Zap, RotateCcw, Facebook, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CarTaxCalculator, VEHICLE_TYPES, LOCATION_COEFFICIENTS, EURO_NORMS, FUEL_TYPES } from '@/lib/car-tax-calculator';
import { generateCarTaxPDF } from '@/lib/pdf-export';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

export default function CarTaxCalculatorPage() {
  const params = useParams();
  const year = parseInt(params?.year) || 2026;

  const [fiscalRules, setFiscalRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calculator');

  // Inputs
  const [engineCC, setEngineCC] = useState('');
  const [vehicleType, setVehicleType] = useState('autoturism');
  const [euroNorm, setEuroNorm] = useState('euro_6');
  const [fuelType, setFuelType] = useState('benzina');
  const [location, setLocation] = useState('bucurești');
  const [registrationYear, setRegistrationYear] = useState(new Date().getFullYear().toString());
  const [purchasePrice, setPurchasePrice] = useState('');

  // TCO inputs
  const [kmPerYear, setKmPerYear] = useState('15000');
  const [fuelPrice, setFuelPrice] = useState('7.5');
  const [consumption, setConsumption] = useState('8');

  // Results
  const [result, setResult] = useState(null);
  const [tcoResult, setTcoResult] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);

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

  const calculateTax = () => {
    if (!fiscalRules || !engineCC) {
      toast.error('Introduceți capacitatea cilindrică');
      return;
    }

    const calculator = new CarTaxCalculator(fiscalRules);
    const calcResult = calculator.calculate({
      engineCC: parseInt(engineCC),
      vehicleType,
      euroNorm,
      fuelType,
      location,
      registrationYear: parseInt(registrationYear),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
    });

    setResult(calcResult);

    // Auto-calculate comparison
    const comparison = calculator.compareLocations(parseInt(engineCC), euroNorm, vehicleType);
    setComparisonResult(comparison);
  };

  const calculateTCO = () => {
    if (!fiscalRules || !engineCC) {
      toast.error('Calculați mai întâi impozitul');
      return;
    }

    const calculator = new CarTaxCalculator(fiscalRules);
    const tco = calculator.estimateTCO({
      engineCC: parseInt(engineCC),
      vehicleType,
      euroNorm,
      fuelType,
      location,
      registrationYear: parseInt(registrationYear),
      kmPerYear: parseInt(kmPerYear),
      fuelPrice: parseFloat(fuelPrice),
      consumption: parseFloat(consumption),
    });

    setTcoResult(tco);
    setActiveTab('tco');
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
    const text = encodeURIComponent(`Vezi calculul impozitului auto pe eCalc.ro! #auto #impozit #romania`);

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
      cc: engineCC,
      type: vehicleType,
      loc: location,
      year: registrationYear,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Link calcul copiat în clipboard!');
  };

  const downloadPDF = () => {
    if (!result) {
      toast.error('Calculați mai întâi impozitul');
      return;
    }

    try {
      generateCarTaxPDF(result, year);
      toast.success('PDF descărcat cu succes');
    } catch (error) {
      toast.error('Eroare la generarea PDF-ului');
      console.error(error);
    }
  };

  const resetForm = () => {
    setEngineCC('');
    setPurchasePrice('');
    setResult(null);
    setTcoResult(null);
    setComparisonResult(null);
    toast.success('Formular resetat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <NavigationHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Car className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-600" />
            <p className="text-slate-600">Se încarcă taxele auto {year}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <NavigationHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calculator Impozit Auto {year}</h1>
            <p className="text-sm text-slate-600">Capacitate • Tip Vehicul • Coeficient Regional • TCO</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={resetForm} disabled={!result}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            {/* Social Sharing */}
            <Button variant="outline" size="sm" onClick={() => shareToSocial('facebook')} disabled={!result} className="hover:text-blue-600 border-slate-200">
              <Facebook className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('x')} disabled={!result} className="hover:text-slate-900 border-slate-200">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('instagram')} disabled={!result} className="hover:text-pink-600 border-slate-200">
              <Instagram className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => shareToSocial('tiktok')} disabled={!result} className="hover:text-slate-900 border-slate-200">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.32h0q2.73,12,8.14,23.36a121.25,121.25,0,0,0,103,63.18v90.41l-.11,210.64h0Z"></path></svg>
            </Button>

            <Button variant="outline" size="sm" onClick={shareCalculation} disabled={!result}>
              <Share2 className="h-4 w-4 mr-1" />
              Distribuie
            </Button>
            <Button variant="outline" size="sm" onClick={downloadPDF} disabled={!result}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="calculator">Calculator Impozit</TabsTrigger>
            <TabsTrigger value="tco">Cost Total (TCO)</TabsTrigger>
            <TabsTrigger value="compare">Comparație Localități</TabsTrigger>
          </TabsList>

          {/* Tax Calculator */}
          <TabsContent value="calculator">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Input Panel */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-amber-600" />
                      Date Vehicul
                    </CardTitle>
                    <CardDescription>Introduceți datele autovehiculului</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Capacitate Cilindrică (cmc)</Label>
                      <Input
                        type="number"
                        value={engineCC}
                        onChange={(e) => setEngineCC(e.target.value)}
                        placeholder="Ex: 1998"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Găsiți în cartea de identitate a vehiculului
                      </p>
                    </div>

                    <div>
                      <Label>Tip Vehicul</Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VEHICLE_TYPES).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              {info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Normă de Poluare (Euro)</Label>
                      <Select value={euroNorm} onValueChange={setEuroNorm}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EURO_NORMS).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              {info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {EURO_NORMS[euroNorm] && (
                        <p className="text-xs text-slate-500 mt-1">
                          {EURO_NORMS[euroNorm].description}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Tip Combustibil</Label>
                      <Select value={fuelType} onValueChange={setFuelType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FUEL_TYPES).map(([key, info]) => (
                            <SelectItem key={key} value={key}>
                              {info.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Localitate Înmatriculare</Label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bucurești">București (+16%)</SelectItem>
                          <SelectItem value="sector 1">București - Sector 1</SelectItem>
                          <SelectItem value="sector 2">București - Sector 2</SelectItem>
                          <SelectItem value="sector 3">București - Sector 3</SelectItem>
                          <SelectItem value="sector 4">București - Sector 4</SelectItem>
                          <SelectItem value="sector 5">București - Sector 5</SelectItem>
                          <SelectItem value="sector 6">București - Sector 6</SelectItem>
                          <SelectItem value="cluj-napoca">Cluj-Napoca (+15%)</SelectItem>
                          <SelectItem value="timișoara">Timișoara (+12%)</SelectItem>
                          <SelectItem value="iași">Iași (+10%)</SelectItem>
                          <SelectItem value="constanța">Constanța (+12%)</SelectItem>
                          <SelectItem value="brașov">Brașov (+12%)</SelectItem>
                          <SelectItem value="sibiu">Sibiu (+10%)</SelectItem>
                          <SelectItem value="oradea">Oradea (+8%)</SelectItem>
                          <SelectItem value="arad">Arad (+5%)</SelectItem>
                          <SelectItem value="craiova">Craiova (+8%)</SelectItem>
                          <SelectItem value="galați">Galați (+5%)</SelectItem>
                          <SelectItem value="ploiești">Ploiești (+8%)</SelectItem>
                          <SelectItem value="brăila">Brăila (+5%)</SelectItem>
                          <SelectItem value="pitești">Pitești (+6%)</SelectItem>
                          <SelectItem value="bacău">Bacău (+5%)</SelectItem>
                          <SelectItem value="târgu mureș">Târgu Mureș (+6%)</SelectItem>
                          <SelectItem value="baia mare">Baia Mare (+4%)</SelectItem>
                          <SelectItem value="buzău">Buzău (+4%)</SelectItem>
                          <SelectItem value="botoșani">Botoșani (+2%)</SelectItem>
                          <SelectItem value="satu mare">Satu Mare (+3%)</SelectItem>
                          <SelectItem value="suceava">Suceava (+4%)</SelectItem>
                          <SelectItem value="piatra neamț">Piatra Neamț (+3%)</SelectItem>
                          <SelectItem value="drobeta-turnu severin">Drobeta-Turnu Severin (+2%)</SelectItem>
                          <SelectItem value="focșani">Focșani (+3%)</SelectItem>
                          <SelectItem value="râmnicu vâlcea">Râmnicu Vâlcea (+5%)</SelectItem>
                          <SelectItem value="târgoviște">Târgoviște (+5%)</SelectItem>
                          <SelectItem value="târgu jiu">Târgu Jiu (+4%)</SelectItem>
                          <SelectItem value="bistrița">Bistrița (+4%)</SelectItem>
                          <SelectItem value="reșița">Reșița (+2%)</SelectItem>
                          <SelectItem value="slatina">Slatina (+3%)</SelectItem>
                          <SelectItem value="călărași">Călărași (+2%)</SelectItem>
                          <SelectItem value="giurgiu">Giurgiu (+2%)</SelectItem>
                          <SelectItem value="alba iulia">Alba Iulia (+5%)</SelectItem>
                          <SelectItem value="zalău">Zalău (+3%)</SelectItem>
                          <SelectItem value="deva">Deva (+3%)</SelectItem>
                          <SelectItem value="sfântu gheorghe">Sfântu Gheorghe (+4%)</SelectItem>
                          <SelectItem value="hunedoara">Hunedoara (+2%)</SelectItem>
                          <SelectItem value="mediaș">Mediaș (+2%)</SelectItem>
                          <SelectItem value="petroșani">Petroșani (+1%)</SelectItem>
                          <SelectItem value="turda">Turda (+3%)</SelectItem>
                          <SelectItem value="câmpina">Câmpina (+3%)</SelectItem>
                          <SelectItem value="reședință de județ">Alt Reședință de Județ (+8%)</SelectItem>
                          <SelectItem value="municipiu mare">Municipiu Mare (+5%)</SelectItem>
                          <SelectItem value="municipiu">Municipiu (+3%)</SelectItem>
                          <SelectItem value="oraș">Oraș (0%)</SelectItem>
                          <SelectItem value="oraș mic">Oraș Mic (-2%)</SelectItem>
                          <SelectItem value="comună">Comună (-5%)</SelectItem>
                          <SelectItem value="rural">Rural (-5%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>An Înmatriculare</Label>
                      <Input
                        type="number"
                        value={registrationYear}
                        onChange={(e) => setRegistrationYear(e.target.value)}
                        min="1990"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div>
                      <Label>Preț Achiziție (RON, opțional)</Label>
                      <Input
                        type="number"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        placeholder="Pentru mașini de lux (>375.000 RON)"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Suprataxă 0.9% pentru valori peste 375.000 RON
                      </p>
                    </div>

                    <Button onClick={calculateTax} className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculează Impozit
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results Panel */}
              <div className="lg:col-span-2">
                {result ? (
                  <div className="space-y-4">
                    {/* Tax Result */}
                    <Card className={`border-2 ${result.taxExempt ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
                      <CardContent className="py-6">
                        <div className="text-center">
                          {result.taxExempt ? (
                            <>
                              <Zap className="h-12 w-12 text-green-600 mx-auto mb-4" />
                              <p className="text-2xl font-bold text-green-800">SCUTIT DE IMPOZIT</p>
                              <p className="text-green-600">{result.exemptReason}</p>
                            </>
                          ) : (
                            <>
                              <Car className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                              <p className="text-3xl font-bold text-amber-800">{formatCurrency(result.finalTax)} RON/an</p>
                              <p className="text-amber-600">
                                {formatCurrency(result.quarterly)} RON/trimestru • {formatCurrency(result.monthly)} RON/lună
                              </p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {!result.taxExempt && (
                      <>
                        {/* Breakdown */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Detalii Calcul - Art. 470 Cod Fiscal</CardTitle>
                            <CardDescription>
                              {result.vehicleTypeName} • {result.engineCC} cmc • {result.euroNormName} • {result.location}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                <span className="text-slate-600">Fracțiuni de 200 cmc:</span>
                                <span className="font-semibold">{result.fractions} fracțiuni</span>
                              </div>
                              <div className="flex justify-between items-center p-2">
                                <span className="text-slate-600">Rată per fracțiune ({result.euroNormName}):</span>
                                <span className="font-semibold">{result.ratePerFraction?.toFixed(1)} RON</span>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                <span className="text-slate-600">Bază impozit ({result.fractions} × {result.ratePerFraction?.toFixed(1)}):</span>
                                <span className="font-semibold">{result.baseTax?.toFixed(2)} RON</span>
                              </div>
                              <div className="flex justify-between items-center p-2">
                                <span className="text-slate-600">Coeficient locație ({result.location}):</span>
                                <span className="font-semibold">× {result.locationCoefficient?.toFixed(2)}</span>
                              </div>
                              {result.luxuryTax > 0 && (
                                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                                  <span className="text-purple-700">Suprataxă lux (0.9%):</span>
                                  <span className="font-semibold text-purple-700">+{formatCurrency(result.luxuryTax)} RON</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center p-3 bg-amber-100 rounded-lg text-lg">
                                <span className="font-bold text-amber-800">Impozit Anual:</span>
                                <span className="font-bold text-amber-800">{formatCurrency(result.finalTax)} RON</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Info */}
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                <strong>Termene de plată:</strong>
                                <ul className="list-disc list-inside mt-1">
                                  <li>31 Martie - trimestrul I (sau integral cu reducere 10%)</li>
                                  <li>30 Iunie - trimestrul II</li>
                                  <li>30 Septembrie - trimestrul III</li>
                                  <li>31 Decembrie - trimestrul IV</li>
                                </ul>
                                <p className="mt-2 text-xs">
                                  Bază legală: {result.legalBasis}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* TCO CTA */}
                        <Button onClick={calculateTCO} variant="outline" className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          Calculează Cost Total de Proprietate (TCO)
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Introduceți datele vehiculului</p>
                      <p className="text-sm mt-2">Calculăm impozitul bazat pe grila {year}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TCO Calculator */}
          <TabsContent value="tco">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-orange-600" />
                      Parametri TCO
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Km/An</Label>
                      <Input
                        type="number"
                        value={kmPerYear}
                        onChange={(e) => setKmPerYear(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Preț Combustibil (RON/L)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={fuelPrice}
                        onChange={(e) => setFuelPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Consum Mediu (L/100km)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={consumption}
                        onChange={(e) => setConsumption(e.target.value)}
                      />
                    </div>
                    <Button onClick={calculateTCO} className="w-full bg-orange-600 hover:bg-orange-700">
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculează TCO
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                {tcoResult ? (
                  <div className="space-y-4">
                    <Card className="border-2 border-orange-500 bg-orange-50">
                      <CardContent className="py-6">
                        <div className="text-center">
                          <p className="text-sm text-orange-600 mb-2">Cost Total Anual de Proprietate</p>
                          <p className="text-3xl font-bold text-orange-800">{formatCurrency(tcoResult.totalWithoutCASCO)} RON/an</p>
                          <p className="text-orange-600">{formatCurrency(tcoResult.monthlyWithoutCASCO)} RON/lună • {tcoResult.costPerKm} RON/km</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Defalcare Costuri Anuale</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[
                            { label: 'Impozit Auto', value: tcoResult.tax, icon: Car },
                            { label: 'Combustibil', value: tcoResult.fuelCost, icon: Fuel },
                            { label: 'Asigurare RCA', value: tcoResult.insuranceRCA, icon: Shield },
                            { label: 'ITP', value: tcoResult.itp, icon: Settings },
                            { label: 'Întreținere/Reparații', value: tcoResult.maintenance, icon: Settings },
                            { label: 'Anvelope', value: tcoResult.tires, icon: Car },
                            { label: 'Parcare', value: tcoResult.parking, icon: MapPin },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded">
                              <span className="flex items-center gap-2 text-slate-600">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                              </span>
                              <span className="font-semibold">{formatCurrency(item.value)} RON</span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="flex items-center gap-2 text-blue-700">
                              <Shield className="h-4 w-4" />
                              + CASCO (opțional)
                            </span>
                            <span className="font-semibold text-blue-700">+{formatCurrency(tcoResult.insuranceCASCO)} RON</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-slate-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Configurați parametrii de utilizare</p>
                      <p className="text-sm mt-2">Vom calcula costul total anual de proprietate</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Location Comparison */}
          <TabsContent value="compare">
            {comparisonResult ? (
              <div className="space-y-4">
                <Card className="border-2 border-green-500 bg-green-50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-bold text-lg text-green-800">
                            Economisești până la {formatCurrency(comparisonResult.savings)} RON/an
                          </p>
                          <p className="text-sm text-green-600">
                            Înmatriculând în {comparisonResult.cheapest.location} în loc de {comparisonResult.mostExpensive.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comparație Impozit pe Localități</CardTitle>
                    <CardDescription>
                      {comparisonResult.vehicleType} • {comparisonResult.engineCC} cmc
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {comparisonResult.results.map((loc, index) => (
                        <div
                          key={loc.location}
                          className={`flex justify-between items-center p-3 rounded-lg ${index === 0 ? 'bg-green-100 border-2 border-green-400' : 'bg-slate-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-green-500 text-white' : 'bg-slate-200'
                              }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold capitalize">{loc.location}</p>
                              <p className="text-xs text-slate-500">Coef: {loc.coefficient.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(loc.tax)} RON/an</p>
                            {index > 0 && (
                              <p className="text-xs text-red-500">+{formatCurrency(loc.tax - comparisonResult.cheapest.tax)} RON</p>
                            )}
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
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Calculați mai întâi impozitul</p>
                  <p className="text-sm mt-2">Vom afișa automat comparația între localități</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
