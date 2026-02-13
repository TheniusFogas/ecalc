'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plane, MapPin, Clock, Euro, AlertCircle, CheckCircle, Info, RotateCcw, Share2, Download, Facebook, Instagram } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FlightCompensationCalculator, AIRPORTS_DATABASE } from '@/lib/flight-compensation-calculator';
import { generateFlightCompensationPDF } from '@/lib/pdf-export';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';

export default function FlightCompensationPage() {
  const params = useParams();
  const year = parseInt(params?.year) || 2026;

  const [fiscalRules, setFiscalRules] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mod de introducere: 'select' pentru selectare din listă, 'manual' pentru introducere manuală
  const [inputMode, setInputMode] = useState('manual');

  // Pentru selectare din listă
  const [departureAirport, setDepartureAirport] = useState('OTP');
  const [arrivalAirport, setArrivalAirport] = useState('');

  // Pentru introducere manuală
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [manualDistance, setManualDistance] = useState('');

  const [delayHours, setDelayHours] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);
  const [isDeniedBoarding, setIsDeniedBoarding] = useState(false);
  const [flightDate, setFlightDate] = useState('');
  const [airlineName, setAirlineName] = useState('');

  const [result, setResult] = useState(null);

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

  const calculate = () => {
    const calculator = new FlightCompensationCalculator(fiscalRules);

    let distance;
    let departureInfo, arrivalInfo;

    if (inputMode === 'manual') {
      // Mod manual - utilizatorul introduce distanța direct
      if (!manualDistance || parseFloat(manualDistance) <= 0) {
        toast.error('Introduceți distanța zborului în km');
        return;
      }
      distance = parseFloat(manualDistance);
      departureInfo = { city: departureCity || 'Plecare', name: departureCity || 'Aeroport Plecare' };
      arrivalInfo = { city: arrivalCity || 'Sosire', name: arrivalCity || 'Aeroport Sosire' };
    } else {
      // Mod selectare din listă
      if (!departureAirport || !arrivalAirport) {
        toast.error('Selectați ambele aeroporturi');
        return;
      }
      distance = calculator.calculateDistance(departureAirport, arrivalAirport, AIRPORTS_DATABASE);
      departureInfo = AIRPORTS_DATABASE[departureAirport];
      arrivalInfo = AIRPORTS_DATABASE[arrivalAirport];
    }

    if (!distance || distance <= 0) {
      toast.error('Nu s-a putut calcula distanța între aeroporturi');
      return;
    }

    // Verifică dacă avem întârziere sau anulare
    const hours = parseFloat(delayHours) || 0;
    if (!isCancelled && !isDeniedBoarding && hours < 2) {
      toast.error('Compensația se acordă pentru întârzieri de minim 2 ore, anulări sau refuz îmbarcare');
      return;
    }

    const isEligible = isCancelled || isDeniedBoarding || hours >= 3;
    const compensation = calculator.calculateCompensation(distance, hours, isEligible);
    const exceptions = calculator.checkExceptions(delayReason);
    const rights = calculator.getPassengerRights();
    const checklist = calculator.getEligibilityChecklist();

    setResult({
      distance,
      compensation,
      exceptions,
      rights,
      checklist,
      departure: departureInfo,
      arrival: arrivalInfo,
      isCancelled,
      isDeniedBoarding,
      delayHours: hours,
      flightDate,
      airlineName,
    });
  };

  const shareToSocial = (platform) => {
    const url = window.location.href;
    const text = encodeURIComponent(`Vezi compensația pentru zbor întârziat pe eCalc.ro! #zbor #compensatie #drepturi`);

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
      dep: departureAirport || departureCity,
      arr: arrivalAirport || arrivalCity,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Link calcul copiat în clipboard!');
  };

  const downloadPDF = () => {
    if (!result) {
      toast.error('Calculați mai întâi compensația');
      return;
    }

    try {
      generateFlightCompensationPDF(result, year);
      toast.success('PDF descărcat cu succes');
    } catch (error) {
      toast.error('Eroare la generarea PDF-ului');
      console.error(error);
    }
  };

  const resetForm = () => {
    setDepartureCity('');
    setArrivalCity('');
    setManualDistance('');
    setDelayHours('');
    setResult(null);
    toast.success('Formular resetat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Plane className="h-12 w-12 animate-bounce mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  const airports = Object.values(AIRPORTS_DATABASE).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-left">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Calculator Compensații Zboruri</h1>
              <p className="text-slate-600">Conform Regulamentului UE 261/2004</p>
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

          {/* Input Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalii Zbor</CardTitle>
              <CardDescription>Completează datele zborului pentru a calcula compensația</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mod de introducere */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                <Button
                  variant={inputMode === 'manual' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMode('manual')}
                >
                  Introducere Manuală
                </Button>
                <Button
                  variant={inputMode === 'select' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMode('select')}
                >
                  Selectare Aeroporturi
                </Button>
              </div>

              {inputMode === 'manual' ? (
                <>
                  {/* Mod manual - introducere directă */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Oraș/Aeroport Plecare</Label>
                      <Input
                        value={departureCity}
                        onChange={(e) => setDepartureCity(e.target.value)}
                        placeholder="Ex: București, OTP"
                      />
                    </div>
                    <div>
                      <Label>Oraș/Aeroport Sosire</Label>
                      <Input
                        value={arrivalCity}
                        onChange={(e) => setArrivalCity(e.target.value)}
                        placeholder="Ex: Londra, LHR"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Distanța Zborului (km)</Label>
                    <Input
                      type="number"
                      value={manualDistance}
                      onChange={(e) => setManualDistance(e.target.value)}
                      placeholder="Introduceți distanța în kilometri"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Puteți găsi distanța pe Google Maps sau pe biletul de avion
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Mod selectare din listă */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Aeroport Plecare</Label>
                      <Select value={departureAirport} onValueChange={setDepartureAirport}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează aeroport" />
                        </SelectTrigger>
                        <SelectContent>
                          {airports.map(airport => (
                            <SelectItem key={airport.code} value={airport.code}>
                              {airport.code} - {airport.name}, {airport.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Aeroport Sosire</Label>
                      <Select value={arrivalAirport} onValueChange={setArrivalAirport}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează aeroport" />
                        </SelectTrigger>
                        <SelectContent>
                          {airports.map(airport => (
                            <SelectItem key={airport.code} value={airport.code}>
                              {airport.code} - {airport.name}, {airport.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Informații suplimentare */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Companie Aeriană</Label>
                  <Input
                    value={airlineName}
                    onChange={(e) => setAirlineName(e.target.value)}
                    placeholder="Ex: Wizz Air, Tarom, Blue Air"
                  />
                </div>
                <div>
                  <Label>Data Zborului</Label>
                  <Input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Tipul problemei */}
              <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <Label className="text-base font-semibold">Ce s-a întâmplat?</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCancelled}
                      onChange={(e) => setIsCancelled(e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    <span>Zbor anulat</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDeniedBoarding}
                      onChange={(e) => setIsDeniedBoarding(e.target.checked)}
                      className="h-4 w-4 rounded"
                    />
                    <span>Refuz îmbarcare (overbooking)</span>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Întârziere la Destinație (ore)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={delayHours}
                    onChange={(e) => setDelayHours(e.target.value)}
                    placeholder="Ex: 3.5"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Compensația se acordă pentru întârzieri de minim 3 ore
                  </p>
                </div>

                <div>
                  <Label>Motiv Întârziere (opțional)</Label>
                  <Input
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Ex: problemă tehnică, vreme"
                  />
                </div>
              </div>

              <Button onClick={calculate} className="w-full" size="lg">
                <Euro className="h-4 w-4 mr-2" />
                Calculează Compensație
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Distance Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Distanța Zborului
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">De la: {result.departure.name}</p>
                      <p className="text-sm text-slate-600">La: {result.arrival.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{result.distance} km</p>
                      <p className="text-xs text-slate-500">Categorie: {result.compensation.distanceCategory}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compensation Card */}
              <Card className={result.compensation.eligible ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.compensation.eligible ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                    Compensație Eligibilă
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.compensation.eligible ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-slate-600 mb-2">Aveți dreptul la o compensație de:</p>
                      <p className="text-5xl font-bold text-green-600 mb-4">
                        {result.compensation.amount} {result.compensation.currency}
                      </p>
                      {result.compensation.reduction !== 'Nicio reducere' && (
                        <p className="text-sm text-slate-600">
                          (Reducere {result.compensation.reduction} aplicată)
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-4">{result.compensation.reason}</p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-red-600 font-semibold">{result.compensation.reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exceptions Card */}
              {delayReason && (
                <Card>
                  <CardHeader>
                    <CardTitle>Verificare Circumstanțe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      {result.exceptions.compensationDue ? (
                        <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{result.exceptions.reason}</p>
                        {result.exceptions.assistanceDue && (
                          <p className="text-sm text-slate-600 mt-2">
                            Compania este obligată să ofere asistență (masă, cazare, transport) chiar dacă nu se datorează compensație monetară.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rights Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Drepturile Dumneavoastră</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Asistență:</h4>
                    <ul className="space-y-1 text-sm text-slate-600">
                      <li>• {result.rights.assistance.meals}</li>
                      <li>• {result.rights.assistance.accommodation}</li>
                      <li>• {result.rights.assistance.transport}</li>
                      <li>• {result.rights.assistance.communication}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Cum să reclamați:</h4>
                    <ol className="space-y-1 text-sm text-slate-600">
                      {result.rights.howToClaim.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-semibold text-blue-900 mb-2">Contact {result.rights.contact.AACR}:</h4>
                    <p className="text-sm text-blue-800">Website: {result.rights.contact.website}</p>
                    <p className="text-sm text-blue-800">Email: {result.rights.contact.email}</p>
                    <p className="text-sm text-blue-800">Telefon: {result.rights.contact.phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Checklist Eligibilitate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.checklist.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {item.mandatory ? (
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        )}
                        <p className="text-sm text-slate-600">{item.requirement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Info Card */}
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">Despre Regulamentul EU 261/2004:</p>
                  <p>Acest regulament european protejează drepturile pasagerilor în cazul întârzierilor, anulărilor sau refuzului la îmbarcare. Compensațiile sunt calculate automat pe baza distanței zborului și duratei întârzierii.</p>
                  <p className="mt-2">Pentru situații de forță majoră (vreme extremă, greve, etc.), compania poate să nu datoreze compensație monetară, dar trebuie să ofere asistență.</p>
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
