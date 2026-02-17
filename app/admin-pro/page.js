'use client';

import { useState, useEffect } from 'react';
import { Settings, Users, DollarSign, Lock, Megaphone, Calculator, Save, RefreshCw, ExternalLink, Info, Calendar, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [fiscalRules, setFiscalRules] = useState(null);
  const [settings, setSettings] = useState({});
  const [leads, setLeads] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '', description: '', type: 'legal' });
  const [activeTab, setActiveTab] = useState('fiscal');
  const [activeModule, setActiveModule] = useState('salary');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        toast.success('Autentificare reușită!');
        loadData();
      } else {
        toast.error('Credențiale invalide');
      }
    } catch (error) {
      toast.error('Eroare la autentificare');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [fiscalRes, settingsRes, leadsRes, holidaysRes] = await Promise.all([
        fetch(`/api/fiscal-rules/${selectedYear}`),
        fetch('/api/settings'),
        fetch('/api/leads'),
        fetch(`/api/holidays/${selectedYear}`),
      ]);

      const fiscalData = await fiscalRes.json();
      const settingsData = await settingsRes.json();
      const leadsData = await leadsRes.json();
      const holidaysData = await holidaysRes.json();

      setFiscalRules(fiscalData);
      setSettings(settingsData);
      setLeads(leadsData);
      setHolidays(holidaysData.holidays || []);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [selectedYear, isAuthenticated]);

  const updateFiscalRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fiscal-rules/${selectedYear}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fiscalRules),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Reguli fiscale ${selectedYear} actualizate cu succes!`);
        // Reload data to confirm persistence
        await loadData();
      } else {
        toast.error(result.error || 'Eroare la actualizarea regulilor fiscale');
      }
    } catch (error) {
      console.error('Error updating fiscal rules:', error);
      toast.error('Eroare la actualizarea regulilor fiscale');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async () => {
    try {
      setLoading(true);
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      toast.success('Setări actualizate cu succes!');
    } catch (error) {
      toast.error('Eroare la actualizarea setărilor');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCȚII PENTRU ADMINISTRARE SĂRBĂTORI
  // ============================================
  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.name) {
      toast.error('Completați data și numele sărbătorii');
      return;
    }

    // Verifică dacă data există deja
    if (holidays.some(h => h.date === newHoliday.date)) {
      toast.error('Această dată există deja în listă');
      return;
    }

    const updatedHolidays = [...holidays, { ...newHoliday }].sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    setHolidays(updatedHolidays);
    setNewHoliday({ date: '', name: '', description: '', type: 'legal' });
    toast.success('Sărbătoare adăugată (nu uitați să salvați!)');
  };

  const removeHoliday = (dateToRemove) => {
    setHolidays(holidays.filter(h => h.date !== dateToRemove));
    toast.success('Sărbătoare ștearsă (nu uitați să salvați!)');
  };

  const saveHolidays = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/holidays/${selectedYear}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holidays }),
      });

      if (response.ok) {
        toast.success(`Sărbătorile pentru ${selectedYear} au fost salvate!`);
      } else {
        toast.error('Eroare la salvarea sărbătorilor');
      }
    } catch (error) {
      toast.error('Eroare la salvarea sărbătorilor');
    } finally {
      setLoading(false);
    }
  };

  const exportLeads = () => {
    window.open('/api/leads/export', '_blank');
  };

  const updateFiscalField = (module, field, value) => {
    setFiscalRules({
      ...fiscalRules,
      [module]: {
        ...fiscalRules[module],
        [field]: value,
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-6 w-6" />
              Admin Login - eCalc RO
            </CardTitle>
            <CardDescription>Conectați-vă pentru a administra platforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="admin@ecalc.ro"
              />
            </div>
            <div>
              <Label htmlFor="password">Parolă</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full" size="lg">
              <Lock className="h-4 w-4 mr-2" />
              Autentificare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!fiscalRules || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Se încarcă datele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">eCalc RO - Admin Dashboard PRO</h1>
              <p className="text-sm text-slate-600">Management complet reguli fiscale & conținut</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Dată Vigoare:
                  </Label>
                  {/* ADMIN SNAPSHOT SELECTOR */}
                  <Input
                    type="date"
                    className="w-40 bg-white"
                    value={fiscalRules?.effectiveDate || `${selectedYear}-01-01`}
                    onChange={(e) => {
                      const date = e.target.value;
                      const year = parseInt(date.split('-')[0]);
                      setSelectedYear(year);
                      // Update local state immediately for UI responsiveness
                      setFiscalRules(prev => ({ ...prev, effectiveDate: date, year: year }));
                    }}
                  />
                  <div className="text-xs text-slate-500 flex flex-col">
                    <span className="font-bold text-blue-700">Mod: SNAPSHOT</span>
                    <span>Salvarea creează o nouă versiune.</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="fiscal">
              <Calculator className="h-4 w-4 mr-2" />
              Reguli Fiscale
            </TabsTrigger>
            <TabsTrigger value="holidays">
              <Calendar className="h-4 w-4 mr-2" />
              Sărbători
            </TabsTrigger>
            <TabsTrigger value="ads">
              <Megaphone className="h-4 w-4 mr-2" />
              Ad Slots
            </TabsTrigger>
            <TabsTrigger value="affiliate">
              <DollarSign className="h-4 w-4 mr-2" />
              Affiliate
            </TabsTrigger>
            <TabsTrigger value="leads">
              <Users className="h-4 w-4 mr-2" />
              Leads ({leads.length})
            </TabsTrigger>
          </TabsList>

          {/* FISCAL RULES TAB */}
          <TabsContent value="fiscal" className="space-y-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">Atenție: Modificările se aplică pentru anul {selectedYear}</p>
                    <p>Toate modificările vor fi salvate în baza de date și se vor reflecta automat în calculatoarele pentru anul selectat. Istoricul pentru alți ani rămâne neafectat.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Module Selector - Compact Horizontal */}
              <div className="bg-white p-2 rounded-lg border shadow-sm flex flex-wrap gap-2">
                {[
                  { id: 'salary', label: 'Salarii', icon: '💼' },
                  { id: 'pfa', label: 'PFA', icon: '👤' },
                  { id: 'medical_leave', label: 'Concediu Medical', icon: '🏥' },
                  { id: 'car_tax', label: 'Impozit Auto', icon: '🚗' },
                  { id: 'real_estate', label: 'Imobiliare', icon: '🏠' },
                  { id: 'efactura', label: 'e-Factura', icon: '📄' },
                  { id: 'flight', label: 'Zboruri EU261', icon: '✈️' },
                ].map((module) => (
                  <Button
                    key={module.id}
                    variant={activeModule === module.id ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex items-center gap-2 ${activeModule === module.id ? 'shadow-sm' : 'text-slate-600'}`}
                    onClick={() => setActiveModule(module.id)}
                  >
                    <span>{module.icon}</span>
                    {module.label}
                  </Button>
                ))}
              </div>

              {/* Module Settings */}
              {activeModule === 'salary' && fiscalRules.salary && (
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* MAIN CONTENT - LEFT COLUMN */}
                  <div className="flex-1 space-y-6">

                    {/* CARD 1: Rates & Deductions (Compact Grid) */}
                    <Card>
                      <CardHeader className="py-3 bg-slate-50 border-b">
                        <CardTitle className="text-sm font-bold uppercase text-slate-700">Taxe & Deduceri Personale</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {/* Rates */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-xs uppercase text-slate-500 border-b pb-1">Cote Contribuții</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">CAS (%)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.cas_rate || 25}
                                onChange={(e) => updateFiscalField('salary', 'cas_rate', parseFloat(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">CASS (%)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.cass_rate || 10}
                                onChange={(e) => updateFiscalField('salary', 'cass_rate', parseFloat(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">IV (%)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.income_tax_rate || 10}
                                onChange={(e) => updateFiscalField('salary', 'income_tax_rate', parseFloat(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">CAM (%)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.cam_rate || 2.25}
                                onChange={(e) => updateFiscalField('salary', 'cam_rate', parseFloat(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={fiscalRules.salary.pilon2_rate > 0}
                              onChange={(e) => updateFiscalField('salary', 'pilon2_percentage', e.target.checked ? 4.75 : 0)}
                            />
                            <Label className="text-xs">Pilon 2 ({fiscalRules.salary.pilon2_rate || 4.75}%)</Label>
                          </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-xs uppercase text-slate-500 border-b pb-1">Deduceri Personale</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Deducere (%)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.personal_deduction_percent || 20}
                                onChange={(e) => updateFiscalField('salary', 'personal_deduction_percent', parseFloat(e.target.value))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Copil (RON)</Label>
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.child_deduction || 100}
                                onChange={(e) => updateFiscalField('salary', 'child_deduction', parseFloat(e.target.value))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Interval Regresiv (Min - Max RON)</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.deduction_range_start || 3700}
                                onChange={(e) => updateFiscalField('salary', 'deduction_range_start', parseFloat(e.target.value))}
                              />
                              <Input
                                type="number"
                                className="h-8"
                                value={fiscalRules.salary.deduction_range_end || 8000}
                                onChange={(e) => updateFiscalField('salary', 'deduction_range_end', parseFloat(e.target.value))}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* CARD 2: Sectors & Thresholds (Compact) */}
                    <Card>
                      <CardHeader className="py-3 bg-slate-50 border-b">
                        <CardTitle className="text-sm font-bold uppercase text-slate-700">Sectoare & Plafoane</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Left: Min Salary & Construction */}
                        <div className="space-y-4">
                          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <Label className="text-xs font-bold text-yellow-800">Salariu Minim Brut (RON)</Label>
                            <Input
                              type="number"
                              className="font-bold border-yellow-400 h-9"
                              value={fiscalRules.salary.minimum_salary || 4050}
                              onChange={(e) => updateFiscalField('salary', 'minimum_salary', parseFloat(e.target.value))}
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Sector Construcții / Agro</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-slate-500">Salariu Min (Constr.)</Label>
                                <Input
                                  type="number" className="h-8"
                                  value={fiscalRules.salary.minimum_gross_construction || 4582}
                                  onChange={(e) => updateFiscalField('salary', 'minimum_gross_construction', parseFloat(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">Prag Scutire (Agro/Constr)</Label>
                                <Input
                                  type="number" className="h-8"
                                  value={fiscalRules.salary.tax_exemption_threshold || 10000}
                                  onChange={(e) => updateFiscalField('salary', 'tax_exemption_threshold', parseFloat(e.target.value))}
                                />
                              </div>
                            </div>
                            <div className="flex gap-4 mt-2">
                              <label className="flex items-center gap-1 text-xs">
                                <input type="checkbox" checked={fiscalRules.salary.construction_tax_exempt !== false} onChange={(e) => updateFiscalField('salary', 'construction_tax_exempt', e.target.checked)} />
                                IV 0%
                              </label>
                              <label className="flex items-center gap-1 text-xs">
                                <input type="checkbox" checked={fiscalRules.salary.construction_cass_exempt || false} onChange={(e) => updateFiscalField('salary', 'construction_cass_exempt', e.target.checked)} />
                                CASS 0%
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Right: IT & Netaxabile */}
                        <div className="space-y-4">
                          <div className="bg-purple-50 p-3 rounded border border-purple-200">
                            <div className="flex justify-between items-center mb-1">
                              <Label className="text-xs font-bold text-purple-800">Sector IT</Label>
                              <input type="checkbox" checked={fiscalRules.salary.it_tax_exempt || false} onChange={(e) => updateFiscalField('salary', 'it_tax_exempt', e.target.checked)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number" className="h-8 bg-white" placeholder="Prag 10000"
                                value={fiscalRules.salary.it_threshold || 10000}
                                onChange={(e) => updateFiscalField('salary', 'it_threshold', parseFloat(e.target.value))}
                              />
                              <div className="flex items-center text-[10px] text-purple-800 leading-tight">
                                Scutire impozit până la prag
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs font-semibold mb-1 block">Sume Netaxabile</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-slate-500">Sumă Fixă (RON)</Label>
                                <Input
                                  type="number" className="h-8"
                                  value={fiscalRules.salary.untaxed_amount !== undefined ? fiscalRules.salary.untaxed_amount : 300}
                                  onChange={(e) => updateFiscalField('salary', 'untaxed_amount', parseFloat(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">Tichet Masă (Max)</Label>
                                <Input
                                  type="number" className="h-8"
                                  value={fiscalRules.salary.meal_voucher_max || 40}
                                  onChange={(e) => updateFiscalField('salary', 'meal_voucher_max', parseFloat(e.target.value))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button onClick={updateFiscalRules} className="w-full bg-blue-700 hover:bg-blue-800 text-white shadow-lg" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Configurația {selectedYear}
                    </Button>

                  </div>

                  {/* SIDEBAR - HISTORY & SNAPSHOTS */}
                  <div className="w-full lg:w-80 space-y-6">
                    <Card className="bg-slate-50 border-slate-200">
                      <CardHeader className="py-3 border-b">
                        <CardTitle className="text-sm font-bold text-slate-700">Istoric Modificări</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto">
                          {/* Imagine we map history here if available, currently just showing current context */}
                          <div className="p-3 border-b bg-white">
                            <p className="text-xs font-bold text-slate-800">Versiune Curentă (Draft)</p>
                            <p className="text-[10px] text-slate-500">Editare în curs pentru anul {selectedYear}</p>
                          </div>
                          <div className="p-3 bg-slate-100 text-center text-xs text-slate-500">
                            Istoricul detaliat este accesibil în baza de date.
                          </div>
                        </div>
                      </CardContent>
                      <div className="p-3 border-t bg-white">
                        <Label className="text-xs font-semibold mb-2 block">Curs Euro (Referință)</Label>
                        <Input
                          type="number"
                          className="h-8"
                          value={fiscalRules.exchange_rate?.eur || 5.09}
                          onChange={(e) => {
                            setFiscalRules({
                              ...fiscalRules,
                              exchange_rate: { ...fiscalRules.exchange_rate, eur: parseFloat(e.target.value) }
                            })
                          }}
                        />
                      </div>
                    </Card>

                    <Card className="bg-blue-50 border-blue-100">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-blue-900 text-sm mb-2">ℹ️ Notă Administrator</h4>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Modificările salvate aici se aplică global pentru toți utilizatorii calculatorului.
                          Asigurați-vă că datele sunt conforme cu legislația curentă.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* PFA MODULE */}
              {activeModule === 'pfa' && fiscalRules.pfa && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reguli Fiscale - PFA {selectedYear}</CardTitle>
                    <CardDescription>
                      Rate, plafoane CAS/CASS, și praguri TVA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Rate Standard PFA
                        <a href="https://www.anaf.ro" target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Verifică pe ANAF
                        </a>
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>CAS - Pensii (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fiscalRules.pfa.cas_rate || 25}
                            onChange={(e) => updateFiscalField('pfa', 'cas_rate', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>CASS - Sănătate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fiscalRules.pfa.cass_rate || 10}
                            onChange={(e) => updateFiscalField('pfa', 'cass_rate', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Impozit pe Venit (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fiscalRules.pfa.income_tax_rate || 10}
                            onChange={(e) => updateFiscalField('pfa', 'income_tax_rate', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Plafoane CASS (în salarii minime)</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Prag Minim CASS</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.cass_min_threshold || 6}
                            onChange={(e) => updateFiscalField('pfa', 'cass_min_threshold', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Sub această valoare, CASS opțional (6 salarii)</p>
                        </div>
                        <div>
                          <Label>Plafon Maxim CASS</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.cass_max_threshold || 60}
                            onChange={(e) => updateFiscalField('pfa', 'cass_max_threshold', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Plafon maxim pentru calcul CASS (60 salarii)</p>
                        </div>
                        <div>
                          <Label>Salariu Minim (RON)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.minimum_salary || 4050}
                            onChange={(e) => updateFiscalField('pfa', 'minimum_salary', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Pentru calcul praguri</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Plafoane CAS (în salarii minime)</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Prag Opțional CAS</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.cas_optional_threshold || 12}
                            onChange={(e) => updateFiscalField('pfa', 'cas_optional_threshold', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Sub 12 salarii, CAS opțional</p>
                        </div>
                        <div>
                          <Label>Bază CAS 12-24 salarii</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.cas_base_12 || 12}
                            onChange={(e) => updateFiscalField('pfa', 'cas_base_12', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">CAS la baza de 12 salarii</p>
                        </div>
                        <div>
                          <Label>Bază CAS peste 24 salarii</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.cas_base_24 || 24}
                            onChange={(e) => updateFiscalField('pfa', 'cas_base_24', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">CAS la baza de 24 salarii</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Praguri și Limite</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Limită TVA (EUR)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.vat_threshold_eur || 88500}
                            onChange={(e) => updateFiscalField('pfa', 'vat_threshold_eur', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Prag obligativitate TVA (88.500 EUR în 2026)</p>
                        </div>
                        <div>
                          <Label>Limită Normă de Venit (EUR)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.norm_limit_eur || 25000}
                            onChange={(e) => updateFiscalField('pfa', 'norm_limit_eur', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Venit maxim pentru normă (25.000 EUR)</p>
                        </div>
                        <div>
                          <Label>Impozit Dividende (%)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.pfa.dividend_tax_rate || 8}
                            onChange={(e) => updateFiscalField('pfa', 'dividend_tax_rate', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Taxa pe dividende SRL (Standard 8%)</p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={updateFiscalRules} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Reguli PFA {selectedYear}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* MEDICAL LEAVE MODULE */}
              {activeModule === 'medical_leave' && fiscalRules.medical_leave && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reguli Fiscale - Concediu Medical {selectedYear}</CardTitle>
                    <CardDescription>
                      Configurare coduri de boală, procente și plafoane conform OUG 158/2005
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Plafoane și Bază de Calcul
                        <a href="https://www.anaf.ro" target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Verifică pe ANAF
                        </a>
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Plafon Maxim (în salarii minime)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.medical_leave.max_salary_cap || 12}
                            onChange={(e) => updateFiscalField('medical_leave', 'max_salary_cap', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Baza de calcul plafonată la X salarii minime (12 în 2026)</p>
                        </div>
                        <div>
                          <Label>Stagiu Minim Cotizare (luni)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.medical_leave.min_contribution_months || 6}
                            onChange={(e) => updateFiscalField('medical_leave', 'min_contribution_months', parseInt(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Stagiu necesar în ultimele 12 luni (6 luni)</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Coduri de Boală și Procente Indemnizație</h3>
                      <div className="space-y-3">
                        <div className="grid md:grid-cols-3 gap-4 p-3 bg-slate-50 rounded">
                          <div>
                            <Label>Cod 01 - Boală Obișnuită (%)</Label>
                            <Input
                              type="number"
                              value={fiscalRules.medical_leave.code_01_percent || 75}
                              onChange={(e) => updateFiscalField('medical_leave', 'code_01_percent', parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Cod 06 - Urgență Medico-Chirurgicală (%)</Label>
                            <Input
                              type="number"
                              value={fiscalRules.medical_leave.code_06_percent || 100}
                              onChange={(e) => updateFiscalField('medical_leave', 'code_06_percent', parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Cod 08,09,15 - Maternitate/Copil (%)</Label>
                            <Input
                              type="number"
                              value={fiscalRules.medical_leave.code_maternity_percent || 85}
                              onChange={(e) => updateFiscalField('medical_leave', 'code_maternity_percent', parseFloat(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Surse de Plată</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Zile Plătite de Angajator</Label>
                          <Input
                            type="number"
                            value={fiscalRules.medical_leave.employer_paid_days || 5}
                            onChange={(e) => updateFiscalField('medical_leave', 'employer_paid_days', parseInt(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Primele zile calendaristice (5 în 2026)</p>
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={fiscalRules.medical_leave.cass_applies || true}
                              onChange={(e) => updateFiscalField('medical_leave', 'cass_applies', e.target.checked)}
                              className="h-4 w-4"
                            />
                            CASS Aplicabil pe Indemnizații
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">10% CASS se aplică pe indemnizații</p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={updateFiscalRules} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Reguli Concediu Medical {selectedYear}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* CAR TAX MODULE */}
              {activeModule === 'car_tax' && fiscalRules.car_tax && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reguli Fiscale - Impozit Auto {selectedYear}</CardTitle>
                    <CardDescription>
                      Coeficienți pe grupe de cilindree și facilitați fiscale
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Coeficienți per Grupă Cilindree
                        <a href="https://www.anaf.ro" target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Tabel ANAF
                        </a>
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Sub 1.600 cmc (RON/200 cmc)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.coeff_under_1600 || 18}
                            onChange={(e) => updateFiscalField('car_tax', 'coeff_under_1600', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>1.601 - 2.000 cmc (RON/200 cmc)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.coeff_1601_2000 || 72}
                            onChange={(e) => updateFiscalField('car_tax', 'coeff_1601_2000', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>2.001 - 2.600 cmc (RON/200 cmc)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.coeff_2001_2600 || 144}
                            onChange={(e) => updateFiscalField('car_tax', 'coeff_2001_2600', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>2.601 - 3.000 cmc (RON/200 cmc)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.coeff_2601_3000 || 290}
                            onChange={(e) => updateFiscalField('car_tax', 'coeff_2601_3000', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Peste 3.000 cmc (RON/200 cmc)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.coeff_over_3000 || 580}
                            onChange={(e) => updateFiscalField('car_tax', 'coeff_over_3000', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Facilitați Fiscale</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={fiscalRules.car_tax.electric_exempt || true}
                              onChange={(e) => updateFiscalField('car_tax', 'electric_exempt', e.target.checked)}
                              className="h-4 w-4"
                            />
                            Scutire 100% Electrice
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">Mașini 100% electrice - impozit 0</p>
                        </div>
                        <div>
                          <Label>Reducere Hibride (%)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.hybrid_reduction || 50}
                            onChange={(e) => updateFiscalField('car_tax', 'hybrid_reduction', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Reducere pentru hibride (50% standard)</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Alte Categorii Vehicule</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Autoutilitare / Camioane (RON fix)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.utility_vehicle_rate || 150}
                            onChange={(e) => updateFiscalField('car_tax', 'utility_vehicle_rate', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Motociclete peste 1600 cmc (RON)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.car_tax.motorcycle_over_1600 || 72}
                            onChange={(e) => updateFiscalField('car_tax', 'motorcycle_over_1600', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={updateFiscalRules} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Reguli Impozit Auto {selectedYear}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* REAL ESTATE MODULE */}
              {activeModule === 'real_estate' && fiscalRules.real_estate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reguli Fiscale - Imobiliare {selectedYear}</CardTitle>
                    <CardDescription>
                      Configurare impozit chirii, CASS, vacancy rate și fond de rezervă
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Taxare Venituri din Chirii</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Impozit pe Chirii (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fiscalRules.real_estate.rental_income_tax || 10}
                            onChange={(e) => updateFiscalField('real_estate', 'rental_income_tax', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Standard 10% din chiria brută</p>
                        </div>
                        <div>
                          <Label>Deducere Cheltuieli (%)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.real_estate.expense_deduction || 20}
                            onChange={(e) => updateFiscalField('real_estate', 'expense_deduction', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Deducere forfetară 20%</p>
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={fiscalRules.real_estate.cass_on_rent || true}
                              onChange={(e) => updateFiscalField('real_estate', 'cass_on_rent', e.target.checked)}
                              className="h-4 w-4"
                            />
                            CASS Aplicabil
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">CASS 10% peste praguri</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Parametri Calculator Randament</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Vacancy Rate Default (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fiscalRules.real_estate.vacancy_rate || 8.33}
                            onChange={(e) => updateFiscalField('real_estate', 'vacancy_rate', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Estimare lună vacantă/an (8.33% = 1 lună)</p>
                        </div>
                        <div>
                          <Label>Fond de Rezervă (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fiscalRules.real_estate.reserve_fund || 10}
                            onChange={(e) => updateFiscalField('real_estate', 'reserve_fund', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Fond pentru neprevăzute (10% standard)</p>
                        </div>
                        <div>
                          <Label>Mentenanță Anuală (% din chirie)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={fiscalRules.real_estate.maintenance_rate || 5}
                            onChange={(e) => updateFiscalField('real_estate', 'maintenance_rate', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Cost mentenanță estimat</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Surse Date Piață
                        <a href="https://www.imobiliare.ro" target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          imobiliare.ro
                        </a>
                      </h3>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-900">
                          <strong>Verifică prețuri actualizate:</strong>
                        </p>
                        <ul className="text-xs text-blue-800 mt-2 space-y-1">
                          <li>• Prețuri medii: www.imobiliare.ro, www.storia.ro</li>
                          <li>• Rapoarte piață: www.insse.ro (INS)</li>
                          <li>• Randamente: Analize trimestriale imobiliare</li>
                        </ul>
                      </div>
                    </div>

                    <Button onClick={updateFiscalRules} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Reguli Imobiliare {selectedYear}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* E-FACTURA MODULE */}
              {activeModule === 'efactura' && fiscalRules.efactura && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reguli Fiscale - e-Factura {selectedYear}</CardTitle>
                    <CardDescription>
                      Configurare termene și obligativitate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Termene de Transmitere
                        <a href="https://e-factura.anaf.ro" target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Portal ANAF
                        </a>
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Zile Lucrătoare pentru Transmitere</Label>
                          <Input
                            type="number"
                            value={fiscalRules.efactura.working_days_deadline || 5}
                            onChange={(e) => updateFiscalField('efactura', 'working_days_deadline', parseInt(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Standard: 5 zile lucrătoare de la emitere</p>
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={fiscalRules.efactura.b2b_mandatory || true}
                              onChange={(e) => updateFiscalField('efactura', 'b2b_mandatory', e.target.checked)}
                              className="h-4 w-4"
                            />
                            B2B Obligatoriu
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">Obligatoriu pentru tranzacții B2B din 2024</p>
                        </div>
                        <div>
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={fiscalRules.efactura.b2c_mandatory || (selectedYear >= 2025)}
                              onChange={(e) => updateFiscalField('efactura', 'b2c_mandatory', e.target.checked)}
                              className="h-4 w-4"
                            />
                            B2C Obligatoriu
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">Obligatoriu pentru B2C din 2025</p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={updateFiscalRules} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Reguli e-Factura {selectedYear}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* FLIGHT MODULE */}
              {activeModule === 'flight' && fiscalRules.flight && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reguli Fiscale - Compensații Zboruri {selectedYear}</CardTitle>
                    <CardDescription>
                      Sume compensații conform Regulamentul EU 261/2004
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        Sume Compensații (EUR)
                        <a href="https://eur-lex.europa.eu" target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Reg. EU 261/2004
                        </a>
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label>Sub 1.500 km (EUR)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.flight.compensation_under_1500 || 250}
                            onChange={(e) => updateFiscalField('flight', 'compensation_under_1500', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Zboruri scurte (250 EUR standard)</p>
                        </div>
                        <div>
                          <Label>1.500 - 3.500 km (EUR)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.flight.compensation_1500_3500 || 400}
                            onChange={(e) => updateFiscalField('flight', 'compensation_1500_3500', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Zboruri medii (400 EUR standard)</p>
                        </div>
                        <div>
                          <Label>Peste 3.500 km (EUR)</Label>
                          <Input
                            type="number"
                            value={fiscalRules.flight.compensation_over_3500 || 600}
                            onChange={(e) => updateFiscalField('flight', 'compensation_over_3500', parseFloat(e.target.value))}
                          />
                          <p className="text-xs text-slate-500 mt-1">Zboruri lungi (600 EUR standard)</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Condiții Eligibilitate</h3>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-yellow-900">
                          <strong>Întârziere minimă:</strong> 3 ore la destinație
                        </p>
                        <p className="text-xs text-yellow-800 mt-2">
                          Compensația poate fi redusă cu 50% dacă pasagerul ajunge la destinație într-un interval de timp rezonabil.
                        </p>
                      </div>
                    </div>

                    <Button onClick={updateFiscalRules} className="w-full" size="lg">
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Reguli Compensații Zboruri {selectedYear}
                    </Button>
                  </CardContent>
                </Card>
              )}

            </div>
          </TabsContent>

          {/* HOLIDAYS TAB - Administrare Sărbători */}
          <TabsContent value="holidays" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                  Administrare Sărbători Legale {selectedYear}
                </CardTitle>
                <CardDescription>
                  Adaugă, editează sau șterge zilele libere pentru anul {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formular adăugare */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newHoliday.date}
                      onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Nume Sărbătoare</Label>
                    <Input
                      value={newHoliday.name}
                      onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                      placeholder="Ex: Ziua Națională"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descriere (Opțional)</Label>
                    <Input
                      value={newHoliday.description || ''}
                      onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                      placeholder="Detalii suplimentare..."
                    />
                  </div>
                  <div>
                    <Label>Tip</Label>
                    <Select value={newHoliday.type} onValueChange={(v) => setNewHoliday({ ...newHoliday, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="legal">Sărbătoare Legală</SelectItem>
                        <SelectItem value="company">Zi Liberă Companie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addHoliday} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adaugă
                    </Button>
                  </div>
                </div>

                {/* Lista sărbătorilor */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Sărbători {selectedYear} ({holidays.length} zile)</h3>
                    <Button onClick={saveHolidays} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvează Toate
                    </Button>
                  </div>

                  {holidays.length > 0 ? (
                    <div className="divide-y">
                      {holidays.map((holiday, index) => {
                        const date = new Date(holiday.date);
                        const formattedDate = date.toLocaleDateString('ro-RO', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        });

                        return (
                          <div key={index} className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded">
                            <div className="flex items-center gap-4">
                              <div className="bg-red-500 text-white rounded p-2 min-w-[50px] text-center">
                                <div className="text-lg font-bold">{date.getDate()}</div>
                                <div className="text-xs uppercase">{date.toLocaleDateString('ro-RO', { month: 'short' })}</div>
                              </div>
                              <div>
                                <div className="font-medium">{holiday.name}</div>
                                {holiday.description && (
                                  <div className="text-xs text-slate-500 italic truncate max-w-[200px]">{holiday.description}</div>
                                )}
                                <div className="text-sm text-slate-400">{formattedDate}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs ${holiday.type === 'legal' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                }`}>
                                {holiday.type === 'legal' ? 'Legal' : 'Companie'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeHoliday(holiday.date)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nu sunt configurate sărbători pentru {selectedYear}</p>
                      <p className="text-sm">Adăugați prima sărbătoare folosind formularul de mai sus</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADS TAB - Keep existing functionality */}
          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <CardTitle>Google AdSense Slots (4 Poziții)</CardTitle>
                <CardDescription>
                  Lipește codul HTML AdSense în câmpurile de mai jos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>1. Ad Header (Top de pagină)</Label>
                  <Input
                    value={settings.ad_header || ''}
                    onChange={(e) => setSettings({ ...settings, ad_header: e.target.value })}
                    placeholder="<div><!-- AdSense Code --></div>"
                  />
                </div>
                <div>
                  <Label>2. Ad Sidebar (Lateral pe desktop)</Label>
                  <Input
                    value={settings.ad_sidebar || ''}
                    onChange={(e) => setSettings({ ...settings, ad_sidebar: e.target.value })}
                    placeholder="<div><!-- AdSense Code --></div>"
                  />
                </div>
                <div>
                  <Label>3. Above Results Ad (Deasupra rezultatelor)</Label>
                  <Input
                    value={settings.ad_above_results || ''}
                    onChange={(e) => setSettings({ ...settings, ad_above_results: e.target.value })}
                    placeholder="<div><!-- AdSense Code --></div>"
                  />
                </div>
                <div>
                  <Label>4. Below Results Ad (Sub rezultate)</Label>
                  <Input
                    value={settings.ad_below_results || ''}
                    onChange={(e) => setSettings({ ...settings, ad_below_results: e.target.value })}
                    placeholder="<div><!-- AdSense Code --></div>"
                  />
                </div>
                <Button onClick={updateSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvează Ad Slots
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AFFILIATE TAB - Keep existing */}
          <TabsContent value="affiliate">
            <div className="space-y-4">
              {['salarii', 'concediu', 'efactura', 'impozit', 'zboruri', 'imobiliare'].map((calc) => (
                <Card key={calc}>
                  <CardHeader>
                    <CardTitle className="capitalize">{calc} - Affiliate Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map((slot) => (
                      <div key={slot} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
                        <h4 className="font-semibold mb-3">Slot {slot}</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label>Text Buton</Label>
                            <Input
                              value={settings[`affiliate_${calc}_text_${slot}`] || ''}
                              onChange={(e) =>
                                setSettings({ ...settings, [`affiliate_${calc}_text_${slot}`]: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Link</Label>
                            <Input
                              value={settings[`affiliate_${calc}_link_${slot}`] || ''}
                              onChange={(e) =>
                                setSettings({ ...settings, [`affiliate_${calc}_link_${slot}`]: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              <Button onClick={updateSettings} className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Salvează Toate Link-urile
              </Button>
            </div>
          </TabsContent>

          {/* LEADS TAB - Keep existing */}
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Lead-uri Colectate</CardTitle>
                  <Button onClick={exportLeads} variant="outline">
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nume</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Telefon</th>
                        <th className="text-left p-2">Calculator</th>
                        <th className="text-left p-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, idx) => (
                        <tr key={lead.id || idx} className="border-b">
                          <td className="p-2">{lead.name}</td>
                          <td className="p-2">{lead.email}</td>
                          <td className="p-2">{lead.phone}</td>
                          <td className="p-2">{lead.calculatorType}</td>
                          <td className="p-2">{new Date(lead.createdAt).toLocaleDateString('ro-RO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  );
}
