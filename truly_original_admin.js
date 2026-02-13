'use client';

import { useState, useEffect } from 'react';
import { Settings, Users, DollarSign, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [settings, setSettings] = useState({});
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('settings');

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
      const [settingsRes, leadsRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/leads'),
      ]);

      const settingsData = await settingsRes.json();
      const leadsData = await leadsRes.json();

      setSettings(settingsData);
      setLeads(leadsData);
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
    }
  };

  const updateSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      toast.success('Setări actualizate cu succes!');
    } catch (error) {
      toast.error('Eroare la actualizarea setărilor');
    }
  };

  const exportLeads = () => {
    window.open('/api/leads/export', '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-6 w-6" />
              Admin Login
            </CardTitle>
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
            <Button onClick={handleLogin} className="w-full">
              Autentificare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">eCalc RO - Admin Dashboard</h1>
            <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'settings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Setări
          </Button>
          <Button
            variant={activeTab === 'leads' ? 'default' : 'outline'}
            onClick={() => setActiveTab('leads')}
          >
            <Users className="h-4 w-4 mr-2" />
            Lead-uri ({leads.length})
          </Button>
          <Button
            variant={activeTab === 'affiliate' ? 'default' : 'outline'}
            onClick={() => setActiveTab('affiliate')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Affiliate Links
          </Button>
        </div>

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Setări Generale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ad Header HTML</Label>
                <Input
                  value={settings.ad_header || ''}
                  onChange={(e) => setSettings({ ...settings, ad_header: e.target.value })}
                  placeholder="<div><!-- AdSense Code --></div>"
                />
              </div>
              <div>
                <Label>Ad Sidebar HTML</Label>
                <Input
                  value={settings.ad_sidebar || ''}
                  onChange={(e) => setSettings({ ...settings, ad_sidebar: e.target.value })}
                  placeholder="<div><!-- AdSense Code --></div>"
                />
              </div>

              <h3 className="text-lg font-semibold mt-6">Valori Fiscale 2026</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>CAS (%)</Label>
                  <Input
                    type="number"
                    value={settings.cas_rate || 25}
                    onChange={(e) => setSettings({ ...settings, cas_rate: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>CASS (%)</Label>
                  <Input
                    type="number"
                    value={settings.cass_rate || 10}
                    onChange={(e) => setSettings({ ...settings, cass_rate: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Impozit Venit (%)</Label>
                  <Input
                    type="number"
                    value={settings.income_tax_rate || 10}
                    onChange={(e) => setSettings({ ...settings, income_tax_rate: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Deducere Personală (RON)</Label>
                  <Input
                    type="number"
                    value={settings.deduction_personal || 510}
                    onChange={(e) => setSettings({ ...settings, deduction_personal: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={updateSettings} className="w-full mt-4">
                Salvează Setări
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'affiliate' && (
          <div className="space-y-4">
            {['salarii', 'concediu', 'efactura', 'impozit', 'zboruri', 'imobiliare'].map((calc) => (
              <Card key={calc}>
                <CardHeader>
                  <CardTitle className="capitalize">{calc}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Text Buton</Label>
                    <Input
                      value={settings[`affiliate_${calc}_text`] || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, [`affiliate_${calc}_text`]: e.target.value })
                      }
                      placeholder="ex: Obține ofertă"
                    />
                  </div>
                  <div>
                    <Label>Link Affiliate</Label>
                    <Input
                      value={settings[`affiliate_${calc}_link`] || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, [`affiliate_${calc}_link`]: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button onClick={updateSettings} className="w-full">
              Salvează Toate Link-urile
            </Button>
          </div>
        )}

        {activeTab === 'leads' && (
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
        )}
      </div>
    </div>
  );
}
